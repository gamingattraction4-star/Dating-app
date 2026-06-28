package com.sparkmatch.auth.service;

import com.sparkmatch.common.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class OtpService {

    @Value("${app.otp.expiry-minutes:5}")
    private int otpExpiryMinutes;

    @Value("${app.otp.max-attempts:3}")
    private int maxAttempts;

    @Value("${app.otp.length:6}")
    private int otpLength;

    private final SecureRandom random = new SecureRandom();

    // In production, use Redis or database for OTP storage
    private final Map<String, OtpData> otpStore = new ConcurrentHashMap<>();

    public void generateAndSendOtp(String identifier, String purpose) {
        String otp = generateOtp();
        otpStore.put(identifier, new OtpData(otp, LocalDateTime.now().plusMinutes(otpExpiryMinutes), 0));

        deliverOtp(identifier, otp, purpose);
    }

    /**
     * Delivers the OTP to the user.
     *
     * <p>Dev/default: the code is written to the application log so flows are
     * testable without an SMS/email account. To enable real delivery in
     * production, plug a Twilio (SMS) or SendGrid (email) client in here —
     * branch on whether {@code identifier} is a phone or email.
     */
    private void deliverOtp(String identifier, String otp, String purpose) {
        boolean isEmail = identifier != null && identifier.contains("@");
        log.info("📩 OTP for {} ({}) via {}: {}", identifier, purpose, isEmail ? "EMAIL" : "SMS", otp);
        // Production integration point:
        //   if (isEmail) emailClient.sendOtp(identifier, otp);
        //   else smsClient.sendOtp(identifier, otp);
    }

    public boolean verifyOtp(String identifier, String otp) {
        OtpData otpData = otpStore.get(identifier);

        if (otpData == null) {
            throw new BadRequestException("No OTP found. Please request a new one.");
        }

        if (otpData.expiresAt.isBefore(LocalDateTime.now())) {
            otpStore.remove(identifier);
            throw new BadRequestException("OTP has expired. Please request a new one.");
        }

        if (otpData.attempts >= maxAttempts) {
            otpStore.remove(identifier);
            throw new BadRequestException("Too many failed attempts. Please request a new OTP.");
        }

        if (!otpData.code.equals(otp)) {
            otpData.attempts++;
            throw new BadRequestException("Invalid OTP. " + (maxAttempts - otpData.attempts) + " attempts remaining.");
        }

        // Success — remove used OTP
        otpStore.remove(identifier);
        return true;
    }

    private String generateOtp() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < otpLength; i++) {
            sb.append(random.nextInt(10));
        }
        return sb.toString();
    }

    private static class OtpData {
        String code;
        LocalDateTime expiresAt;
        int attempts;

        OtpData(String code, LocalDateTime expiresAt, int attempts) {
            this.code = code;
            this.expiresAt = expiresAt;
            this.attempts = attempts;
        }
    }
}
