package com.sparkmatch.notification.service;

import com.sparkmatch.notification.dto.NotificationDto;
import com.sparkmatch.notification.model.Notification;
import com.sparkmatch.notification.repository.NotificationRepository;
import com.sparkmatch.user.model.User;
import com.sparkmatch.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Create and send a notification (persisted + pushed via WebSocket)
     */
    @Transactional
    public void sendNotification(Long userId, Notification.NotificationType type,
                                  String title, String body,
                                  String actionType, Long actionId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .body(body)
                .actionType(actionType)
                .actionId(actionId)
                .build();
        notification = notificationRepository.save(notification);

        NotificationDto dto = mapToDto(notification);

        // Push via WebSocket
        messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/queue/notifications",
                dto
        );

        log.debug("Notification sent to userId={}: {}", userId, title);
    }

    /**
     * Convenience: send match notification
     */
    public void sendMatchNotification(Long userId, String matchedUserName, Long matchId) {
        sendNotification(userId,
                Notification.NotificationType.MATCH,
                "It's a Match! 🎉",
                "You and " + matchedUserName + " have liked each other!",
                "OPEN_MATCH", matchId);
    }

    /**
     * Convenience: send new message notification
     */
    public void sendMessageNotification(Long userId, String senderName, Long conversationId) {
        sendNotification(userId,
                Notification.NotificationType.MESSAGE,
                "New message 💬",
                senderName + " sent you a message",
                "OPEN_CHAT", conversationId);
    }

    /**
     * Convenience: send like notification (for premium users)
     */
    public void sendLikeNotification(Long userId, Long likerId) {
        sendNotification(userId,
                Notification.NotificationType.LIKE,
                "Someone likes you! 💜",
                "Check who liked your profile",
                "OPEN_PROFILE", likerId);
    }

    /**
     * Get user's notifications (paginated)
     */
    public List<NotificationDto> getNotifications(Long userId, int page, int size) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size))
                .getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countUnread(userId);
    }

    @Transactional
    public void markAsRead(Long userId, Long notificationId) {
        notificationRepository.markAsRead(notificationId, userId, LocalDateTime.now());
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId, LocalDateTime.now());
    }

    private NotificationDto mapToDto(Notification n) {
        return NotificationDto.builder()
                .id(n.getId())
                .type(n.getType().name())
                .title(n.getTitle())
                .body(n.getBody())
                .actionType(n.getActionType())
                .actionId(n.getActionId())
                .read(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
