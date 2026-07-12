package com.sparkmatch.notification.controller;

import com.sparkmatch.common.response.ApiResponse;
import com.sparkmatch.notification.dto.NotificationDto;
import com.sparkmatch.notification.dto.NotificationPreferencesDto;
import com.sparkmatch.notification.service.NotificationService;
import com.sparkmatch.notification.service.NotificationPreferencesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationPreferencesService preferencesService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getNotifications(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = (Long) auth.getPrincipal();
        List<NotificationDto> notifications = notificationService.getNotifications(userId, page, size);
        return ResponseEntity.ok(ApiResponse.success(notifications));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", count)));
    }

    /** Register (or clear) this device's Expo push token for the signed-in user. */
    @PostMapping("/push-token")
    public ResponseEntity<ApiResponse<Void>> registerPushToken(
            Authentication auth,
            @RequestBody Map<String, String> body) {
        Long userId = (Long) auth.getPrincipal();
        notificationService.savePushToken(userId, body.get("token"));
        return ResponseEntity.ok(ApiResponse.success("Push token saved"));
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            Authentication auth,
            @PathVariable Long notificationId) {
        Long userId = (Long) auth.getPrincipal();
        notificationService.markAsRead(userId, notificationId);
        return ResponseEntity.ok(ApiResponse.success("Marked as read"));
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read"));
    }

    // ==================== Notification Preferences ====================

    @GetMapping("/preferences")
    public ResponseEntity<ApiResponse<NotificationPreferencesDto>> getPreferences(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        NotificationPreferencesDto prefs = preferencesService.getPreferences(userId);
        return ResponseEntity.ok(ApiResponse.success(prefs));
    }

    @PutMapping("/preferences")
    public ResponseEntity<ApiResponse<NotificationPreferencesDto>> updatePreferences(
            Authentication auth,
            @RequestBody NotificationPreferencesDto request) {
        Long userId = (Long) auth.getPrincipal();
        NotificationPreferencesDto prefs = preferencesService.updatePreferences(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Notification preferences updated", prefs));
    }
}

