package com.sparkmatch.auth.controller;

import com.sparkmatch.auth.dto.*;
import com.sparkmatch.auth.service.AuthService;
import com.sparkmatch.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Verification code sent to your email", response));
    }

    /** Step 2 of signup: verify the emailed OTP to activate the account. */
    @PostMapping("/verify-registration")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyRegistration(@Valid @RequestBody OtpVerifyRequest request) {
        AuthResponse response = authService.verifyRegistrationOtp(request.getIdentifier(), request.getOtp());
        return ResponseEntity.ok(ApiResponse.success("Account verified", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Verification code sent to your email", response));
    }

    /** Step 2 of login: verify the emailed OTP to receive tokens. */
    @PostMapping("/verify-login")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyLogin(@Valid @RequestBody VerifyOtpLoginRequest request) {
        AuthResponse response = authService.verifyLoginOtp(request.getEmailOrPhone(), request.getOtp(), request.getDevice());
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed", response));
    }

    @PostMapping("/oauth/google")
    public ResponseEntity<ApiResponse<AuthResponse>> googleOAuth(@Valid @RequestBody OAuthRequest request) {
        request.setProvider("GOOGLE");
        AuthResponse response = authService.oauthLogin(request);
        return ResponseEntity.ok(ApiResponse.success("Google login successful", response));
    }

    @PostMapping("/oauth/apple")
    public ResponseEntity<ApiResponse<AuthResponse>> appleOAuth(@Valid @RequestBody OAuthRequest request) {
        request.setProvider("APPLE");
        AuthResponse response = authService.oauthLogin(request);
        return ResponseEntity.ok(ApiResponse.success("Apple login successful", response));
    }

    @PostMapping("/otp/send")
    public ResponseEntity<ApiResponse<Void>> sendOtp(@Valid @RequestBody OtpRequest request) {
        authService.sendOtp(request);
        return ResponseEntity.ok(ApiResponse.success("OTP sent successfully"));
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<ApiResponse<Boolean>> verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        boolean verified = authService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.success("OTP verified", verified));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password reset OTP sent. Please check your email/phone."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully. Please login with your new password."));
    }
}
