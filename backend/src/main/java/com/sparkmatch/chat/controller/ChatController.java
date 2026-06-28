package com.sparkmatch.chat.controller;

import com.sparkmatch.chat.dto.*;
import com.sparkmatch.chat.service.ChatService;
import com.sparkmatch.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ConversationDto>>> getConversations(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        List<ConversationDto> conversations = chatService.getConversations(userId);
        return ResponseEntity.ok(ApiResponse.success(conversations));
    }

    @GetMapping("/{conversationId}/messages")
    public ResponseEntity<ApiResponse<List<ChatMessageDto>>> getMessages(
            Authentication auth,
            @PathVariable Long conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Long userId = (Long) auth.getPrincipal();
        List<ChatMessageDto> messages = chatService.getMessages(userId, conversationId, page, size);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @PostMapping("/{conversationId}/messages")
    public ResponseEntity<ApiResponse<ChatMessageDto>> sendMessage(
            Authentication auth,
            @PathVariable Long conversationId,
            @Valid @RequestBody SendMessageRequest request) {
        Long userId = (Long) auth.getPrincipal();
        request.setConversationId(conversationId);
        ChatMessageDto message = chatService.sendMessage(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Message sent", message));
    }
}
