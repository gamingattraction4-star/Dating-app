package com.sparkmatch.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferencesDto {
    private Boolean pushMatches;
    private Boolean pushMessages;
    private Boolean pushLikes;
    private Boolean emailMatches;
    private Boolean emailPromotions;
}
