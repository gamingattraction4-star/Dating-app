package com.sparkmatch.report.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BlockRequest {

    @NotNull(message = "User ID to block is required")
    private Long blockedUserId;
}
