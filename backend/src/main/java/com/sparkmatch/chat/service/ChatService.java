package com.sparkmatch.chat.service;

import com.sparkmatch.chat.dto.*;
import com.sparkmatch.chat.model.Conversation;
import com.sparkmatch.chat.model.Message;
import com.sparkmatch.chat.repository.ConversationRepository;
import com.sparkmatch.chat.repository.MessageRepository;
import com.sparkmatch.common.exception.BadRequestException;
import com.sparkmatch.common.exception.ResourceNotFoundException;
import com.sparkmatch.swipe.model.Match;
import com.sparkmatch.swipe.repository.MatchRepository;
import com.sparkmatch.user.model.User;
import com.sparkmatch.user.model.UserPhoto;
import com.sparkmatch.user.model.UserProfile;
import com.sparkmatch.user.repository.UserPhotoRepository;
import com.sparkmatch.user.repository.UserProfileRepository;
import com.sparkmatch.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
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
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final MatchRepository matchRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final UserPhotoRepository photoRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Get all conversations for a user
     */
    public List<ConversationDto> getConversations(Long userId) {
        List<Conversation> conversations = conversationRepository.findActiveConversationsForUser(userId);

        return conversations.stream().map(conv -> {
            Match match = conv.getMatch();
            User otherUser = match.getUserOne().getId().equals(userId) ? match.getUserTwo() : match.getUserOne();
            UserProfile otherProfile = profileRepository.findByUserId(otherUser.getId()).orElse(null);
            List<UserPhoto> photos = photoRepository.findByUserIdOrderByOrderIndexAsc(otherUser.getId());
            String photo = photos.stream().findFirst().map(UserPhoto::getPhotoUrl).orElse(null);

            long unread = messageRepository.countUnreadMessages(conv.getId(), userId);

            return ConversationDto.builder()
                    .id(conv.getId())
                    .matchId(match.getId())
                    .otherUserId(otherUser.getId())
                    .otherUserName(otherProfile != null ? otherProfile.getDisplayName() : "Unknown")
                    .otherUserPhoto(photo)
                    .otherUserVerified(otherUser.getIsVerified())
                    .lastMessage(conv.getLastMessagePreview())
                    .lastMessageAt(conv.getLastMessageAt())
                    .unreadCount(unread)
                    .active(conv.getIsActive())
                    .build();
        }).collect(Collectors.toList());
    }

    /**
     * Get messages for a conversation
     */
    @Transactional
    public List<ChatMessageDto> getMessages(Long userId, Long conversationId, int page, int size) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        // Verify user is part of the conversation
        validateUserInConversation(userId, conv);

        // Mark messages as read
        messageRepository.markMessagesAsRead(conversationId, userId, LocalDateTime.now());

        Page<Message> messages = messageRepository
                .findByConversationIdAndDeletedAtIsNullOrderByCreatedAtDesc(conversationId, PageRequest.of(page, size));

        return messages.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /**
     * Send a message (via REST fallback)
     */
    @Transactional
    public ChatMessageDto sendMessage(Long userId, SendMessageRequest request) {
        Conversation conv = conversationRepository.findById(request.getConversationId())
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", request.getConversationId()));

        validateUserInConversation(userId, conv);

        User sender = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Message.MessageType type = request.getMessageType() != null ?
                Message.MessageType.valueOf(request.getMessageType()) : Message.MessageType.TEXT;

        Message message = Message.builder()
                .conversation(conv)
                .sender(sender)
                .content(request.getContent())
                .messageType(type)
                .mediaUrl(request.getMediaUrl())
                .build();
        message = messageRepository.save(message);

        // Update conversation preview
        String preview = request.getContent();
        if (preview != null && preview.length() > 100) {
            preview = preview.substring(0, 100) + "...";
        }
        conv.setLastMessageAt(LocalDateTime.now());
        conv.setLastMessagePreview(preview);
        conversationRepository.save(conv);

        ChatMessageDto dto = mapToDto(message);

        // Send via WebSocket to the other user
        Match match = conv.getMatch();
        Long otherUserId = match.getUserOne().getId().equals(userId) ?
                match.getUserTwo().getId() : match.getUserOne().getId();

        messagingTemplate.convertAndSendToUser(
                otherUserId.toString(),
                "/queue/messages",
                dto
        );

        log.debug("Message sent in conversation {} by user {}", conv.getId(), userId);

        return dto;
    }

    /**
     * Handle WebSocket message
     */
    @Transactional
    public ChatMessageDto handleWebSocketMessage(Long userId, SendMessageRequest request) {
        return sendMessage(userId, request);
    }

    /**
     * Send typing indicator
     */
    public void sendTypingIndicator(Long userId, Long conversationId, boolean typing) {
        Conversation conv = conversationRepository.findById(conversationId).orElse(null);
        if (conv == null) return;

        Match match = conv.getMatch();
        Long otherUserId = match.getUserOne().getId().equals(userId) ?
                match.getUserTwo().getId() : match.getUserOne().getId();

        var typingEvent = java.util.Map.of(
                "conversationId", conversationId,
                "userId", userId,
                "typing", typing
        );

        messagingTemplate.convertAndSendToUser(
                otherUserId.toString(),
                "/queue/typing",
                typingEvent
        );
    }

    /**
     * Create conversation for a new match
     */
    @Transactional
    public Conversation createConversationForMatch(Match match) {
        // Check if conversation already exists
        return conversationRepository.findByMatchId(match.getId())
                .orElseGet(() -> {
                    Conversation conv = Conversation.builder()
                            .match(match)
                            .build();
                    return conversationRepository.save(conv);
                });
    }

    // ==================== Helpers ====================

    private void validateUserInConversation(Long userId, Conversation conv) {
        Match match = conv.getMatch();
        if (!match.getUserOne().getId().equals(userId) && !match.getUserTwo().getId().equals(userId)) {
            throw new BadRequestException("You are not part of this conversation");
        }
        if (!match.getIsActive()) {
            throw new BadRequestException("This match is no longer active");
        }
    }

    private ChatMessageDto mapToDto(Message message) {
        UserProfile senderProfile = profileRepository.findByUserId(message.getSender().getId()).orElse(null);

        return ChatMessageDto.builder()
                .id(message.getId())
                .conversationId(message.getConversation().getId())
                .senderId(message.getSender().getId())
                .senderName(senderProfile != null ? senderProfile.getDisplayName() : "Unknown")
                .content(message.getContent())
                .messageType(message.getMessageType().name())
                .mediaUrl(message.getMediaUrl())
                .read(message.getIsRead())
                .readAt(message.getReadAt())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
