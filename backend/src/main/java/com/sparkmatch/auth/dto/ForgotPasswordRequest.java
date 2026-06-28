package com.sparkmatch.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordRequest {
    @NotBlank(message = "Email or phone is required")
    private String emailOrPhone;
}
