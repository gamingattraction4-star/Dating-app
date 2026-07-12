package com.sparkmatch.auth.service;

import com.sparkmatch.auth.dto.*;
import com.sparkmatch.auth.util.JwtUtil;
import com.sparkmatch.common.exception.BadRequestException;
import com.sparkmatch.common.exception.DuplicateResourceException;
import com.sparkmatch.common.exception.ResourceNotFoundException;
import com.sparkmatch.user.model.User;
import com.sparkmatch.user.model.UserPreferences;
import com.sparkmatch.user.model.UserProfile;
import com.sparkmatch.user.repository.UserPreferencesRepository;
import com.sparkmatch.user.repository.UserProfileRepository;
import com.sparkmatch.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final UserPreferencesRepository preferencesRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final OtpService otpService;
    private final com.sparkmatch.common.email.EmailService emailService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Validate uniqueness
        if (request.getEmail() != null && userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered");
        }
        if (request.getPhone() != null && userRepository.existsByPhone(request.getPhone())) {
            throw new DuplicateResourceException("Phone number already registered");
        }

        // Create user
        User user = User.builder()
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .authProvider(User.AuthProvider.LOCAL)
                .status(User.UserStatus.ACTIVE)
                .lastActiveAt(LocalDateTime.now())
                .build();
        user = userRepository.save(user);

        // Create empty profile
        UserProfile profile = UserProfile.builder()
                .user(user)
                .displayName(request.getDisplayName())
                .birthdate(java.time.LocalDate.of(2000, 1, 1)) // Placeholder, updated during setup
                .gender(UserProfile.Gender.OTHER)
                .profileCompletePct(10)
                .build();
        profileRepository.save(profile);

        // Create default preferences
        UserPreferences preferences = UserPreferences.builder()
                .user(user)
                .build();
        preferencesRepository.save(preferences);

        log.info("New user registered (pending OTP): id={}, email={}", user.getId(), user.getEmail());

        // Email OTP to verify ownership; tokens are issued only after verification.
        if (user.getEmail() != null) {
            otpService.generateAndSendOtp(user.getEmail(), "REGISTRATION");
        }

        return AuthResponse.builder()
                .otpRequired(true)
                .userId(user.getId())
                .email(user.getEmail())
                .displayName(request.getDisplayName())
                .profileComplete(false)
                .build();
    }

    /** Step 2 of signup: verify the emailed OTP, then issue tokens + send welcome email. */
    @Transactional
    public AuthResponse verifyRegistrationOtp(String email, String otp) {
        otpService.verifyOtp(email, otp);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        user.setIsVerified(true);
        user.setLastActiveAt(LocalDateTime.now());
        userRepository.save(user);

        UserProfile profile = profileRepository.findByUserId(user.getId()).orElse(null);
        String name = profile != null ? profile.getDisplayName() : null;
        emailService.sendWelcome(email, name);

        return issueTokens(user, profile);
    }

    /** Step 1 of login: verify password, then email an OTP + a new-device alert. */
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailOrPhone(request.getEmailOrPhone(), request.getEmailOrPhone())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }
        if (user.getStatus() == User.UserStatus.BANNED) {
            throw new BadRequestException("Your account has been banned");
        }
        if (user.getStatus() == User.UserStatus.SUSPENDED) {
            throw new BadRequestException("Your account is suspended");
        }

        if (user.getEmail() != null) {
            otpService.generateAndSendOtp(user.getEmail(), "LOGIN");
        }

        return AuthResponse.builder()
                .otpRequired(true)
                .userId(user.getId())
                .email(user.getEmail())
                .build();
    }

    /** Step 2 of login: verify the emailed OTP, issue tokens, send a device-login alert. */
    @Transactional
    public AuthResponse verifyLoginOtp(String emailOrPhone, String otp, String device) {
        User user = userRepository.findByEmailOrPhone(emailOrPhone, emailOrPhone)
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
        // OTP was sent to the email on file.
        otpService.verifyOtp(user.getEmail(), otp);

        user.setLastActiveAt(LocalDateTime.now());
        userRepository.save(user);

        UserProfile profile = profileRepository.findByUserId(user.getId()).orElse(null);
        String name = profile != null ? profile.getDisplayName() : null;
        String when = LocalDateTime.now().toString().replace('T', ' ').substring(0, 16);
        emailService.sendNewDeviceLogin(user.getEmail(), name, device != null ? device : "a new device", when);

        return issueTokens(user, profile);
    }

    /** Builds an authenticated response with fresh JWTs. */
    private AuthResponse issueTokens(User user, UserProfile profile) {
        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());
        boolean profileComplete = profile != null && profile.getProfileCompletePct() >= 80;
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .displayName(profile != null ? profile.getDisplayName() : null)
                .profileComplete(profileComplete)
                .build();
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();

        if (!jwtUtil.validateToken(refreshToken) || !jwtUtil.isRefreshToken(refreshToken)) {
            throw new BadRequestException("Invalid or expired refresh token");
        }

        Long userId = jwtUtil.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        String newAccessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String newRefreshToken = jwtUtil.generateRefreshToken(user.getId());

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .build();
    }

    @Transactional
    public AuthResponse oauthLogin(OAuthRequest request) {
        // In production, verify the ID token with Google/Apple
        // For now, we simulate OAuth flow
        String provider = request.getProvider().toUpperCase();
        User.AuthProvider authProvider = User.AuthProvider.valueOf(provider);

        // Check if user already exists with this provider
        User user = userRepository.findByAuthProviderAndProviderId(authProvider, request.getIdToken())
                .orElse(null);

        if (user == null) {
            // Create new user via OAuth
            user = User.builder()
                    .email(provider.toLowerCase() + "_" + System.currentTimeMillis() + "@sparkmatch.com")
                    .passwordHash(passwordEncoder.encode("OAUTH_" + System.currentTimeMillis()))
                    .authProvider(authProvider)
                    .providerId(request.getIdToken())
                    .status(User.UserStatus.ACTIVE)
                    .lastActiveAt(LocalDateTime.now())
                    .build();
            user = userRepository.save(user);

            // Create profile stub
            UserProfile profile = UserProfile.builder()
                    .user(user)
                    .displayName("User")
                    .birthdate(java.time.LocalDate.of(2000, 1, 1))
                    .gender(UserProfile.Gender.OTHER)
                    .build();
            profileRepository.save(profile);

            UserPreferences prefs = UserPreferences.builder().user(user).build();
            preferencesRepository.save(prefs);
        }

        user.setLastActiveAt(LocalDateTime.now());
        userRepository.save(user);

        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .build();
    }

    public void sendOtp(OtpRequest request) {
        otpService.generateAndSendOtp(request.getIdentifier(), request.getPurpose());
    }

    public boolean verifyOtp(OtpVerifyRequest request) {
        return otpService.verifyOtp(request.getIdentifier(), request.getOtp());
    }

    /**
     * Forgot password — sends OTP to the email/phone for password reset.
     */
    public void forgotPassword(ForgotPasswordRequest request) {
        // Verify user exists
        userRepository.findByEmailOrPhone(request.getEmailOrPhone(), request.getEmailOrPhone())
                .orElseThrow(() -> new ResourceNotFoundException("User", "emailOrPhone", request.getEmailOrPhone()));

        otpService.generateAndSendOtp(request.getEmailOrPhone(), "PASSWORD_RESET");
    }

    /**
     * Reset password — verifies OTP and sets new password.
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        // Verify OTP first
        otpService.verifyOtp(request.getEmailOrPhone(), request.getOtp());

        // Find user
        User user = userRepository.findByEmailOrPhone(request.getEmailOrPhone(), request.getEmailOrPhone())
                .orElseThrow(() -> new ResourceNotFoundException("User", "emailOrPhone", request.getEmailOrPhone()));

        // Update password
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        log.info("Password reset successfully for identifier={}", request.getEmailOrPhone());
    }
}
