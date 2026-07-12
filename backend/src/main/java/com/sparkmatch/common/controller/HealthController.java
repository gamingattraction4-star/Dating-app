package com.sparkmatch.common.controller;

import com.sparkmatch.common.email.EmailService;
import com.sparkmatch.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Health check, app info, and an email diagnostic endpoint.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class HealthController {

    private final EmailService emailService;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.port:}")
    private String mailPort;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${app.mail.brevo-key:}")
    private String brevoKey;

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> health() {
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "status", "UP",
                "application", "SparkMatch",
                "version", "1.0.0",
                "timestamp", LocalDateTime.now().toString()
        )));
    }

    /**
     * Diagnostic: shows email config and tries a real synchronous send so we can
     * see the actual SMTP error. Usage: GET /api/mail-check?to=you@example.com
     */
    @GetMapping("/mail-check")
    public ResponseEntity<ApiResponse<Map<String, Object>>> mailCheck(@RequestParam String to) {
        Map<String, Object> result = new HashMap<>();
        result.put("provider", (brevoKey != null && !brevoKey.isBlank()) ? "brevo" : "smtp");
        result.put("brevoConfigured", brevoKey != null && !brevoKey.isBlank());
        result.put("mailEnabled", mailEnabled);
        result.put("host", mailHost);
        result.put("port", mailPort);
        result.put("username", mailUsername.isEmpty() ? "(empty)" : mask(mailUsername));
        String error = emailService.testSend(to);
        result.put("sent", error == null);
        result.put("error", error == null ? "none" : error);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    private String mask(String s) {
        int at = s.indexOf('@');
        if (at <= 1) return "***";
        return s.charAt(0) + "***" + s.substring(at);
    }
}
