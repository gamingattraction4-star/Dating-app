package com.sparkmatch.swipe.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchResponse {

    private Long matchId;
    private Long userId;
    private String displayName;
    private String photoUrl;
    private Integer age;
    private String city;
    private boolean verified;
    private LocalDateTime matchedAt;
    private String lastMessage;
    private LocalDateTime lastMessageAt;
}
