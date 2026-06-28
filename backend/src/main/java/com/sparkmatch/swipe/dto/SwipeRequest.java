package com.sparkmatch.swipe.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SwipeRequest {

    @NotNull(message = "Target user ID is required")
    private Long targetUserId;

    @NotNull(message = "Swipe type is required")
    private String swipeType; // LIKE, DISLIKE, SUPER_LIKE
}
