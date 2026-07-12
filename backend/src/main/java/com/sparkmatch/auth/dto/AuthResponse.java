package com.sparkmatch.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private Long userId;
    private String email;
    private String displayName;
    private boolean profileComplete;

    // When true, the client must collect an emailed OTP and call /auth/verify-otp
    // (register) or /auth/verify-login-otp (login) before tokens are issued.
    @Builder.Default
    private boolean otpRequired = false;

    @Builder.Default
    private String tokenTypeValue = "Bearer";
}
