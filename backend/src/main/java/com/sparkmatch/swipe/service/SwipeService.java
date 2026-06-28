package com.sparkmatch.swipe.service;

import com.sparkmatch.chat.service.ChatService;
import com.sparkmatch.common.exception.BadRequestException;
import com.sparkmatch.common.exception.ResourceNotFoundException;
import com.sparkmatch.notification.service.NotificationService;
import com.sparkmatch.swipe.dto.*;
import com.sparkmatch.swipe.model.Match;
import com.sparkmatch.swipe.model.Swipe;
import com.sparkmatch.swipe.repository.MatchRepository;
import com.sparkmatch.swipe.repository.SwipeRepository;
import com.sparkmatch.user.dto.ProfileResponse;
import com.sparkmatch.user.model.User;
import com.sparkmatch.user.model.UserPhoto;
import com.sparkmatch.user.model.UserProfile;
import com.sparkmatch.user.repository.UserPhotoRepository;
import com.sparkmatch.user.repository.UserProfileRepository;
import com.sparkmatch.user.repository.UserPreferencesRepository;
import com.sparkmatch.user.repository.UserRepository;
import com.sparkmatch.user.model.UserPreferences;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SwipeService {

    private final SwipeRepository swipeRepository;
    private final MatchRepository matchRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final UserPhotoRepository photoRepository;
    private final UserPreferencesRepository preferencesRepository;
    private final NotificationService notificationService;
    private final ChatService chatService;

    @Value("${app.matching.daily-swipe-limit:100}")
    private int dailySwipeLimit;

    @Value("${app.matching.daily-super-like-limit:1}")
    private int dailySuperLikeLimit;

    @Value("${app.matching.premium-super-like-limit:5}")
    private int premiumSuperLikeLimit;

    /**
     * Get discoverable profiles based on user preferences
     */
    public List<ProfileResponse> getDiscoverProfiles(Long userId, int page, int size) {
        UserPreferences prefs = preferencesRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Preferences", "userId", userId));
        UserProfile myProfile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile", "userId", userId));

        double lat = myProfile.getLatitude() != null ? myProfile.getLatitude() : 0;
        double lng = myProfile.getLongitude() != null ? myProfile.getLongitude() : 0;

        String genderFilter = null;
        if (prefs.getGenderPreference() != UserPreferences.GenderPreference.EVERYONE) {
            genderFilter = prefs.getGenderPreference().name();
        }

        List<UserProfile> profiles = profileRepository.findDiscoverableProfiles(
                userId,
                genderFilter,
                prefs.getMinAge(),
                prefs.getMaxAge(),
                lat,
                lng,
                prefs.getMaxDistanceKm(),
                prefs.getGlobalMode(),
                size,
                page * size
        );

        return profiles.stream().map(profile -> {
            User user = profile.getUser();
            List<UserPhoto> photos = photoRepository.findByUserIdOrderByOrderIndexAsc(user.getId());

            double distance = 0;
            if (myProfile.getLatitude() != null && profile.getLatitude() != null) {
                distance = calculateDistance(
                        myProfile.getLatitude(), myProfile.getLongitude(),
                        profile.getLatitude(), profile.getLongitude()
                );
            }

            return ProfileResponse.builder()
                    .userId(user.getId())
                    .displayName(profile.getDisplayName())
                    .age(Period.between(profile.getBirthdate(), LocalDate.now()).getYears())
                    .gender(profile.getGender().name())
                    .bio(profile.getBio())
                    .jobTitle(profile.getJobTitle())
                    .company(profile.getCompany())
                    .school(profile.getSchool())
                    .city(profile.getCity())
                    .verified(user.getIsVerified())
                    .premium(user.getIsPremium())
                    .distanceKm(Math.round(distance * 10.0) / 10.0)
                    .photos(photos.stream().map(p -> ProfileResponse.PhotoDto.builder()
                            .id(p.getId())
                            .photoUrl(p.getPhotoUrl())
                            .thumbnailUrl(p.getThumbnailUrl())
                            .orderIndex(p.getOrderIndex())
                            .primary(p.getIsPrimary())
                            .build()).collect(Collectors.toList()))
                    .lookingFor(profile.getLookingFor() != null ? profile.getLookingFor().name() : null)
                    .build();
        }).collect(Collectors.toList());
    }

    /**
     * Process a swipe action
     */
    @Transactional
    public SwipeResponse swipe(Long userId, SwipeRequest request) {
        if (userId.equals(request.getTargetUserId())) {
            throw new BadRequestException("You cannot swipe on yourself");
        }

        // Check if already swiped
        if (swipeRepository.existsBySwiperIdAndSwipedId(userId, request.getTargetUserId())) {
            throw new BadRequestException("You have already swiped on this user");
        }

        User swiper = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        User swiped = userRepository.findById(request.getTargetUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getTargetUserId()));

        Swipe.SwipeType type = Swipe.SwipeType.valueOf(request.getSwipeType().toUpperCase());

        // Rate limiting
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        long todaySwipes = swipeRepository.countSwipesSince(userId, todayStart);

        if (!swiper.getIsPremium() && todaySwipes >= dailySwipeLimit) {
            throw new BadRequestException("Daily swipe limit reached. Upgrade to Premium for unlimited swipes!");
        }

        if (type == Swipe.SwipeType.SUPER_LIKE) {
            long todaySuperLikes = swipeRepository.countSuperLikesSince(userId, todayStart);
            int limit = swiper.getIsPremium() ? premiumSuperLikeLimit : dailySuperLikeLimit;
            if (todaySuperLikes >= limit) {
                throw new BadRequestException("Daily super like limit reached");
            }
        }

        // Save swipe
        Swipe swipe = Swipe.builder()
                .swiper(swiper)
                .swiped(swiped)
                .swipeType(type)
                .build();
        swipeRepository.save(swipe);

        // Check for mutual match (only on LIKE or SUPER_LIKE)
        if (type == Swipe.SwipeType.LIKE || type == Swipe.SwipeType.SUPER_LIKE) {
            return checkAndCreateMatch(userId, request.getTargetUserId(), swiper, swiped);
        }

        return SwipeResponse.builder().matched(false).build();
    }

    /**
     * Undo last swipe (premium feature)
     */
    @Transactional
    public void undoSwipe(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!user.getIsPremium()) {
            throw new BadRequestException("Undo swipe is a premium feature");
        }

        Swipe lastSwipe = swipeRepository.findLastSwipeByUser(userId)
                .orElseThrow(() -> new BadRequestException("No swipe to undo"));

        // Check if it was recent (within 5 minutes)
        if (lastSwipe.getCreatedAt().isBefore(LocalDateTime.now().minusMinutes(5))) {
            throw new BadRequestException("Can only undo swipes within the last 5 minutes");
        }

        // If there was a match, remove it
        matchRepository.findActiveMatchBetween(userId, lastSwipe.getSwiped().getId())
                .ifPresent(match -> {
                    match.setIsActive(false);
                    match.setUnmatchedAt(LocalDateTime.now());
                    matchRepository.save(match);
                });

        swipeRepository.delete(lastSwipe);
        log.info("User {} undid swipe on user {}", userId, lastSwipe.getSwiped().getId());
    }

    /**
     * Get all active matches
     */
    public List<MatchResponse> getMatches(Long userId) {
        List<Match> matches = matchRepository.findActiveMatchesForUser(userId);

        return matches.stream().map(match -> {
            User otherUser = match.getUserOne().getId().equals(userId) ? match.getUserTwo() : match.getUserOne();
            UserProfile otherProfile = profileRepository.findByUserId(otherUser.getId()).orElse(null);
            List<UserPhoto> photos = photoRepository.findByUserIdOrderByOrderIndexAsc(otherUser.getId());

            String primaryPhoto = photos.stream()
                    .filter(UserPhoto::getIsPrimary)
                    .findFirst()
                    .or(() -> photos.stream().findFirst())
                    .map(UserPhoto::getPhotoUrl)
                    .orElse(null);

            return MatchResponse.builder()
                    .matchId(match.getId())
                    .userId(otherUser.getId())
                    .displayName(otherProfile != null ? otherProfile.getDisplayName() : "Unknown")
                    .photoUrl(primaryPhoto)
                    .age(otherProfile != null && otherProfile.getBirthdate() != null ?
                            Period.between(otherProfile.getBirthdate(), LocalDate.now()).getYears() : null)
                    .city(otherProfile != null ? otherProfile.getCity() : null)
                    .verified(otherUser.getIsVerified())
                    .matchedAt(match.getMatchedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    /**
     * Unmatch
     */
    @Transactional
    public void unmatch(Long userId, Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Match", "id", matchId));

        if (!match.getUserOne().getId().equals(userId) && !match.getUserTwo().getId().equals(userId)) {
            throw new BadRequestException("You are not part of this match");
        }

        match.setIsActive(false);
        match.setUnmatchedAt(LocalDateTime.now());
        matchRepository.save(match);

        log.info("User {} unmatched from match {}", userId, matchId);
    }

    /**
     * Get users who liked you (premium)
     */
    public List<ProfileResponse> getWhoLikedMe(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!user.getIsPremium()) {
            throw new BadRequestException("See who liked you is a premium feature");
        }

        List<Swipe> pendingLikes = swipeRepository.findPendingLikesForUser(userId);

        return pendingLikes.stream().map(swipe -> {
            User liker = swipe.getSwiper();
            UserProfile profile = profileRepository.findByUserId(liker.getId()).orElse(null);
            List<UserPhoto> photos = photoRepository.findByUserIdOrderByOrderIndexAsc(liker.getId());

            return ProfileResponse.builder()
                    .userId(liker.getId())
                    .displayName(profile != null ? profile.getDisplayName() : "Unknown")
                    .age(profile != null && profile.getBirthdate() != null ?
                            Period.between(profile.getBirthdate(), LocalDate.now()).getYears() : null)
                    .city(profile != null ? profile.getCity() : null)
                    .verified(liker.getIsVerified())
                    .photos(photos.stream().map(p -> ProfileResponse.PhotoDto.builder()
                            .id(p.getId())
                            .photoUrl(p.getPhotoUrl())
                            .thumbnailUrl(p.getThumbnailUrl())
                            .primary(p.getIsPrimary())
                            .build()).collect(Collectors.toList()))
                    .build();
        }).collect(Collectors.toList());
    }

    // ==================== Private Helpers ====================

    private SwipeResponse checkAndCreateMatch(Long swiperId, Long swipedId, User swiper, User swiped) {
        // Check if the swiped user has already liked the swiper
        var mutualLike = swipeRepository.findMutualLike(swipedId, swiperId);

        if (mutualLike.isPresent()) {
            // It's a match! 🎉
            Long userOneId = Math.min(swiperId, swipedId);
            Long userTwoId = Math.max(swiperId, swipedId);

            User userOne = userOneId.equals(swiperId) ? swiper : swiped;
            User userTwo = userTwoId.equals(swiperId) ? swiper : swiped;

            Match match = Match.builder()
                    .userOne(userOne)
                    .userTwo(userTwo)
                    .build();
            match = matchRepository.save(match);

            // Auto-create chat conversation for the match
            chatService.createConversationForMatch(match);

            // Get swiped user's info for the response
            UserProfile swipedProfile = profileRepository.findByUserId(swipedId).orElse(null);
            UserProfile swiperProfile = profileRepository.findByUserId(swiperId).orElse(null);
            List<UserPhoto> swipedPhotos = photoRepository.findByUserIdOrderByOrderIndexAsc(swipedId);
            String photo = swipedPhotos.stream().findFirst().map(UserPhoto::getPhotoUrl).orElse(null);

            // Send match notifications to both users
            String swiperName = swiperProfile != null ? swiperProfile.getDisplayName() : "Someone";
            String swipedName = swipedProfile != null ? swipedProfile.getDisplayName() : "Someone";
            notificationService.sendMatchNotification(swiperId, swipedName, match.getId());
            notificationService.sendMatchNotification(swipedId, swiperName, match.getId());

            log.info("🎉 Match created between users {} and {}", swiperId, swipedId);

            return SwipeResponse.builder()
                    .matched(true)
                    .matchId(match.getId())
                    .matchedUser(SwipeResponse.MatchedUserInfo.builder()
                            .userId(swipedId)
                            .displayName(swipedProfile != null ? swipedProfile.getDisplayName() : "Unknown")
                            .photoUrl(photo)
                            .age(swipedProfile != null && swipedProfile.getBirthdate() != null ?
                                    Period.between(swipedProfile.getBirthdate(), LocalDate.now()).getYears() : null)
                            .build())
                    .build();
        }

        return SwipeResponse.builder().matched(false).build();
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
