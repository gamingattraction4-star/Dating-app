package com.sparkmatch.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationDto {

    private Long id;
    private Long matchId;
    private Long otherUserId;
    private String otherUserName;
    private String otherUserPhoto;
    private boolean otherUserVerified;
    private String lastMessage;
    private LocalDateTime lastMessageAt;
    private long unreadCount;
    private boolean active;
}
