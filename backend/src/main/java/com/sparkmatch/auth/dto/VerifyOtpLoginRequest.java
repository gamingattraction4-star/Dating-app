package com.sparkmatch.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** Body for verifying the login/registration OTP. */
@Data
public class VerifyOtpLoginRequest {

    @NotBlank(message = "Email or phone is required")
    private String emailOrPhone;

    @NotBlank(message = "OTP is required")
    private String otp;

    // Optional human-readable device label for the login-alert email.
    private String device;
}
