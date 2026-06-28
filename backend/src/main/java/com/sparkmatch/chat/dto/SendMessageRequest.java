package com.sparkmatch.chat.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendMessageRequest {

    // Populated from the URL path for REST calls, or from the body for WebSocket
    // messages. Not bean-validated so the REST path can be the source of truth.
    private Long conversationId;

    @NotBlank(message = "Message content is required")
    private String content;

    private String messageType; // TEXT, IMAGE, VOICE, GIF, ICE_BREAKER

    private String mediaUrl;
}
