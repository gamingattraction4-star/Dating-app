package com.sparkmatch.notification.service;

import com.sparkmatch.common.exception.ResourceNotFoundException;
import com.sparkmatch.notification.dto.NotificationPreferencesDto;
import com.sparkmatch.notification.model.NotificationPreference;
import com.sparkmatch.notification.repository.NotificationPreferenceRepository;
import com.sparkmatch.user.model.User;
import com.sparkmatch.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationPreferencesService {

    private final NotificationPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;

    /**
     * Get notification preferences for a user (creates defaults if not exist).
     */
    @Transactional
    public NotificationPreferencesDto getPreferences(Long userId) {
        NotificationPreference pref = getOrCreatePreferences(userId);
        return mapToDto(pref);
    }

    /**
     * Update notification preferences.
     */
    @Transactional
    public NotificationPreferencesDto updatePreferences(Long userId, NotificationPreferencesDto dto) {
        NotificationPreference pref = getOrCreatePreferences(userId);

        if (dto.getPushMatches() != null) pref.setPushMatches(dto.getPushMatches());
        if (dto.getPushMessages() != null) pref.setPushMessages(dto.getPushMessages());
        if (dto.getPushLikes() != null) pref.setPushLikes(dto.getPushLikes());
        if (dto.getEmailMatches() != null) pref.setEmailMatches(dto.getEmailMatches());
        if (dto.getEmailPromotions() != null) pref.setEmailPromotions(dto.getEmailPromotions());

        preferenceRepository.save(pref);
        log.debug("Notification preferences updated for userId={}", userId);

        return mapToDto(pref);
    }

    private NotificationPreference getOrCreatePreferences(Long userId) {
        return preferenceRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
                    NotificationPreference pref = NotificationPreference.builder()
                            .user(user)
                            .build();
                    return preferenceRepository.save(pref);
                });
    }

    private NotificationPreferencesDto mapToDto(NotificationPreference pref) {
        return NotificationPreferencesDto.builder()
                .pushMatches(pref.getPushMatches())
                .pushMessages(pref.getPushMessages())
                .pushLikes(pref.getPushLikes())
                .emailMatches(pref.getEmailMatches())
                .emailPromotions(pref.getEmailPromotions())
                .build();
    }
}
