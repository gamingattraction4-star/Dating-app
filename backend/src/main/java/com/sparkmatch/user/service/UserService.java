package com.sparkmatch.user.service;

import com.sparkmatch.common.exception.BadRequestException;
import com.sparkmatch.common.exception.ResourceNotFoundException;
import com.sparkmatch.user.dto.*;
import com.sparkmatch.user.model.*;
import com.sparkmatch.user.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final UserPhotoRepository photoRepository;
    private final UserPreferencesRepository preferencesRepository;
    private final InterestRepository interestRepository;
    private final UserInterestRepository userInterestRepository;

    public ProfileResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        UserProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile", "userId", userId));

        return mapToProfileResponse(user, profile);
    }

    public ProfileResponse getProfileById(Long userId, Long targetUserId) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", targetUserId));
        UserProfile profile = profileRepository.findByUserId(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile", "userId", targetUserId));

        ProfileResponse response = mapToProfileResponse(user, profile);

        // Calculate distance if requesting user has location
        UserProfile myProfile = profileRepository.findByUserId(userId).orElse(null);
        if (myProfile != null && myProfile.getLatitude() != null && profile.getLatitude() != null) {
            double distance = calculateDistance(
                    myProfile.getLatitude(), myProfile.getLongitude(),
                    profile.getLatitude(), profile.getLongitude()
            );
            response.setDistanceKm(Math.round(distance * 10.0) / 10.0);
        }

        return response;
    }

    @Transactional
    public ProfileResponse updateProfile(Long userId, ProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        UserProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile", "userId", userId));

        // Update fields
        if (request.getDisplayName() != null) profile.setDisplayName(request.getDisplayName());
        if (request.getBirthdate() != null) profile.setBirthdate(request.getBirthdate());
        if (request.getGender() != null) profile.setGender(UserProfile.Gender.valueOf(request.getGender()));
        if (request.getBio() != null) profile.setBio(request.getBio());
        if (request.getJobTitle() != null) profile.setJobTitle(request.getJobTitle());
        if (request.getCompany() != null) profile.setCompany(request.getCompany());
        if (request.getSchool() != null) profile.setSchool(request.getSchool());
        if (request.getCity() != null) profile.setCity(request.getCity());
        if (request.getHeightCm() != null) profile.setHeightCm(request.getHeightCm());
        if (request.getDrinking() != null) profile.setDrinking(UserProfile.LifestyleChoice.valueOf(request.getDrinking()));
        if (request.getSmoking() != null) profile.setSmoking(UserProfile.LifestyleChoice.valueOf(request.getSmoking()));
        if (request.getLookingFor() != null) profile.setLookingFor(UserProfile.LookingFor.valueOf(request.getLookingFor()));
        if (request.getWorkout() != null) profile.setWorkout(request.getWorkout());
        if (request.getEducationLevel() != null) profile.setEducationLevel(request.getEducationLevel());
        if (request.getPets() != null) profile.setPets(request.getPets());
        if (request.getZodiac() != null) profile.setZodiac(request.getZodiac());
        if (request.getChildren() != null) profile.setChildren(request.getChildren());
        if (request.getReligion() != null) profile.setReligion(request.getReligion());
        if (request.getLanguages() != null) profile.setLanguages(request.getLanguages());
        if (request.getInstagram() != null) profile.setInstagram(request.getInstagram());

        // Calculate profile completeness
        profile.setProfileCompletePct(calculateProfileCompletion(profile));

        profileRepository.save(profile);

        // Update interests if provided
        if (request.getInterestIds() != null) {
            userInterestRepository.deleteAllByUserId(userId);
            List<Interest> interests = interestRepository.findByIdIn(request.getInterestIds());
            for (Interest interest : interests) {
                UserInterest ui = UserInterest.builder()
                        .user(user)
                        .interest(interest)
                        .build();
                userInterestRepository.save(ui);
            }
        }

        // Activate user if profile is sufficiently complete
        if (profile.getProfileCompletePct() >= 50 && user.getStatus() == User.UserStatus.PENDING_VERIFICATION) {
            user.setStatus(User.UserStatus.ACTIVE);
            userRepository.save(user);
        }

        return mapToProfileResponse(user, profile);
    }

    @Transactional
    public void updateLocation(Long userId, LocationUpdateRequest request) {
        UserProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile", "userId", userId));

        profile.setLatitude(request.getLatitude());
        profile.setLongitude(request.getLongitude());
        if (request.getCity() != null) {
            profile.setCity(request.getCity());
        }
        profileRepository.save(profile);
    }

    public PreferencesResponse getPreferences(Long userId) {
        UserPreferences prefs = preferencesRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Preferences", "userId", userId));
        return mapToPreferencesResponse(prefs);
    }

    @Transactional
    public PreferencesResponse updatePreferences(Long userId, PreferencesUpdateRequest request) {
        UserPreferences prefs = preferencesRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Preferences", "userId", userId));

        if (request.getMinAge() != null) prefs.setMinAge(request.getMinAge());
        if (request.getMaxAge() != null) prefs.setMaxAge(request.getMaxAge());
        if (request.getMaxDistanceKm() != null) prefs.setMaxDistanceKm(request.getMaxDistanceKm());
        if (request.getGenderPreference() != null) {
            prefs.setGenderPreference(UserPreferences.GenderPreference.valueOf(request.getGenderPreference()));
        }
        if (request.getShowMeOnApp() != null) prefs.setShowMeOnApp(request.getShowMeOnApp());
        if (request.getGlobalMode() != null) prefs.setGlobalMode(request.getGlobalMode());

        preferencesRepository.save(prefs);

        return mapToPreferencesResponse(prefs);
    }

    @Transactional
    public ProfileResponse activateBoost(Long userId) {
        UserProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile", "userId", userId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
                
        profile.setBoostEndTime(java.time.LocalDateTime.now().plusMinutes(30));
        profileRepository.save(profile);
        
        return mapToProfileResponse(user, profile);
    }

    public List<ProfileResponse.InterestDto> getAllInterests() {
        return interestRepository.findAll().stream()
                .map(i -> ProfileResponse.InterestDto.builder()
                        .id(i.getId())
                        .name(i.getName())
                        .category(i.getCategory())
                        .icon(i.getIcon())
                        .build())
                .collect(Collectors.toList());
    }

    // ==================== Helpers ====================

    private PreferencesResponse mapToPreferencesResponse(UserPreferences prefs) {
        return PreferencesResponse.builder()
                .minAge(prefs.getMinAge())
                .maxAge(prefs.getMaxAge())
                .maxDistanceKm(prefs.getMaxDistanceKm())
                .genderPreference(prefs.getGenderPreference() != null ? prefs.getGenderPreference().name() : null)
                .showMeOnApp(prefs.getShowMeOnApp())
                .globalMode(prefs.getGlobalMode())
                .build();
    }

    private ProfileResponse mapToProfileResponse(User user, UserProfile profile) {
        List<UserPhoto> photos = photoRepository.findByUserIdOrderByOrderIndexAsc(user.getId());
        List<UserInterest> userInterests = userInterestRepository.findByUserId(user.getId());

        return ProfileResponse.builder()
                .userId(user.getId())
                .displayName(profile.getDisplayName())
                .age(profile.getBirthdate() != null ?
                        java.time.Period.between(profile.getBirthdate(), java.time.LocalDate.now()).getYears() : null)
                .gender(profile.getGender() != null ? profile.getGender().name() : null)
                .bio(profile.getBio())
                .jobTitle(profile.getJobTitle())
                .company(profile.getCompany())
                .school(profile.getSchool())
                .city(profile.getCity())
                .latitude(profile.getLatitude())
                .longitude(profile.getLongitude())
                .heightCm(profile.getHeightCm())
                .drinking(profile.getDrinking() != null ? profile.getDrinking().name() : null)
                .smoking(profile.getSmoking() != null ? profile.getSmoking().name() : null)
                .lookingFor(profile.getLookingFor() != null ? profile.getLookingFor().name() : null)
                .workout(profile.getWorkout())
                .educationLevel(profile.getEducationLevel())
                .pets(profile.getPets())
                .zodiac(profile.getZodiac())
                .children(profile.getChildren())
                .religion(profile.getReligion())
                .languages(profile.getLanguages())
                .instagram(profile.getInstagram())
                .profileCompletePct(profile.getProfileCompletePct())
                .verified(user.getIsVerified())
                .premium(user.getIsPremium())
                .boostEndTime(profile.getBoostEndTime() != null ? profile.getBoostEndTime().toString() : null)
                .photos(photos.stream().map(p -> ProfileResponse.PhotoDto.builder()
                        .id(p.getId())
                        .photoUrl(p.getPhotoUrl())
                        .thumbnailUrl(p.getThumbnailUrl())
                        .orderIndex(p.getOrderIndex())
                        .primary(p.getIsPrimary())
                        .build()).collect(Collectors.toList()))
                .interests(userInterests.stream().map(ui -> ProfileResponse.InterestDto.builder()
                        .id(ui.getInterest().getId())
                        .name(ui.getInterest().getName())
                        .category(ui.getInterest().getCategory())
                        .icon(ui.getInterest().getIcon())
                        .build()).collect(Collectors.toList()))
                .build();
    }

    private int calculateProfileCompletion(UserProfile profile) {
        int score = 0;
        if (profile.getDisplayName() != null && !profile.getDisplayName().isEmpty()) score += 15;
        if (profile.getBirthdate() != null) score += 15;
        if (profile.getGender() != null) score += 10;
        if (profile.getBio() != null && profile.getBio().length() > 10) score += 15;
        if (profile.getCity() != null) score += 10;
        if (profile.getJobTitle() != null || profile.getCompany() != null) score += 10;
        if (profile.getLookingFor() != null) score += 10;
        List<UserPhoto> photos = photoRepository.findByUserIdOrderByOrderIndexAsc(profile.getUser().getId());
        if (!photos.isEmpty()) score += 15;
        return Math.min(100, score);
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371; // Earth's radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
