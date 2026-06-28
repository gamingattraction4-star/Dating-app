package com.sparkmatch.admin.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdminActionRequest {

    @NotNull
    private Long userId;

    @NotNull
    private String action; // SUSPEND, BAN, ACTIVATE, VERIFY, GRANT_PREMIUM, REVOKE_PREMIUM

    private String reason;
}
