package com.sparkmatch.chat.controller;

import com.sparkmatch.auth.util.JwtUtil;
import com.sparkmatch.chat.dto.SendMessageRequest;
import com.sparkmatch.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Slf4j
@Controller
@RequiredArgsConstructor
public class WebSocketChatController {

    private final ChatService chatService;
    private final JwtUtil jwtUtil;

    /**
     * Handle incoming WebSocket chat messages
     * Client sends to: /app/chat.send
     */
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload SendMessageRequest message,
                            SimpMessageHeaderAccessor headerAccessor) {
        Long userId = extractUserId(headerAccessor);
        if (userId != null) {
            chatService.handleWebSocketMessage(userId, message);
        }
    }

    /**
     * Handle typing indicators
     * Client sends to: /app/chat.typing
     */
    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload Map<String, Object> payload,
                             SimpMessageHeaderAccessor headerAccessor) {
        Long userId = extractUserId(headerAccessor);
        if (userId != null) {
            Long conversationId = Long.valueOf(payload.get("conversationId").toString());
            boolean typing = Boolean.parseBoolean(payload.get("typing").toString());
            chatService.sendTypingIndicator(userId, conversationId, typing);
        }
    }

    /**
     * Handle read receipts
     * Client sends to: /app/chat.read
     */
    @MessageMapping("/chat.read")
    public void handleReadReceipt(@Payload Map<String, Object> payload,
                                   SimpMessageHeaderAccessor headerAccessor) {
        Long userId = extractUserId(headerAccessor);
        if (userId != null) {
            Long conversationId = Long.valueOf(payload.get("conversationId").toString());
            // Mark as read logic is handled when messages are fetched
            log.debug("User {} read conversation {}", userId, conversationId);
        }
    }

    private Long extractUserId(SimpMessageHeaderAccessor headerAccessor) {
        try {
            // Extract from session attributes (set during handshake)
            Map<String, Object> attrs = headerAccessor.getSessionAttributes();
            if (attrs != null && attrs.containsKey("userId")) {
                return (Long) attrs.get("userId");
            }

            // Fallback: extract from native headers (token)
            String token = headerAccessor.getFirstNativeHeader("Authorization");
            if (token != null && token.startsWith("Bearer ")) {
                return jwtUtil.getUserIdFromToken(token.substring(7));
            }
        } catch (Exception e) {
            log.error("Failed to extract user ID from WebSocket message: {}", e.getMessage());
        }
        return null;
    }
}
