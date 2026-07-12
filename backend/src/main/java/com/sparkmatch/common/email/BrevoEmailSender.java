package com.sparkmatch.common.email;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Sends email via Brevo's transactional email HTTP API.
 *
 * Unlike SMTP (which many cloud hosts like Render block on ports 25/465/587),
 * this uses plain HTTPS (port 443), so it works everywhere. Free tier: 300
 * emails/day.
 *
 * Enabled when BREVO_API_KEY is set. Endpoint: https://api.brevo.com/v3/smtp/email
 */
@Slf4j
@Component
public class BrevoEmailSender {

    private static final String URL = "https://api.brevo.com/v3/smtp/email";
    private final RestClient rest = RestClient.create();

    @Value("${app.mail.brevo-key:}")
    private String apiKey;

    @Value("${app.mail.from:business@wevsync.com}")
    private String from;

    @Value("${app.mail.from-name:SparkMatch}")
    private String fromName;

    public boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    /** @return null on success, or the error message on failure. */
    public String send(String to, String subject, String html) {
        try {
            Map<String, Object> body = Map.of(
                    "sender", Map.of("name", fromName, "email", from),
                    "to", List.of(Map.of("email", to)),
                    "subject", subject,
                    "htmlContent", html
            );
            rest.post()
                    .uri(URL)
                    .header("api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
            log.info("✉️ Brevo email sent to {}: {}", to, subject);
            return null;
        } catch (Exception e) {
            log.error("❌ Brevo email failed to {}: {}", to, e.toString());
            return e.toString();
        }
    }
}
