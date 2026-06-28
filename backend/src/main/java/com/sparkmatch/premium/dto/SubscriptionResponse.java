package com.sparkmatch.premium.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionResponse {
    private Long id;
    private String planName;
    private String planDescription;
    private int priceCents;
    private String currency;
    private int durationDays;
    private String status;
    private LocalDateTime startsAt;
    private LocalDateTime expiresAt;
    private boolean autoRenew;
    private boolean active;
}
