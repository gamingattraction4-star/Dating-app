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
public class SwipeResponse {

    private boolean matched;
    private Long matchId;
    private MatchedUserInfo matchedUser;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MatchedUserInfo {
        private Long userId;
        private String displayName;
        private String photoUrl;
        private Integer age;
    }
}
