package com.sparkmatch.common.email;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Sends transactional HTML emails (OTP, welcome, new-device login alerts).
 *
 * When {@code app.mail.enabled=false} (the dev default) emails are only logged,
 * so auth flows are testable without real SMTP. In production set MAIL_ENABLED=true
 * plus the MAIL_* SMTP credentials.
 *
 * All sends are async and best-effort — an email failure never blocks auth.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.enabled:false}")
    private boolean enabled;

    @Value("${app.mail.from:business@wevsync.com}")
    private String from;

    @Value("${app.mail.from-name:SparkMatch}")
    private String fromName;

    @Async
    public void sendOtp(String to, String otp, String purpose) {
        String heading = purpose != null && purpose.contains("RESET") ? "Reset your password" : "Verify it's you";
        String html = wrap(heading,
                "<p style=\"font-size:15px;color:#475569;margin:0 0 18px\">Use this code to continue. It expires in 5 minutes.</p>"
              + "<div style=\"font-size:38px;font-weight:800;letter-spacing:10px;color:#0f172a;background:#f8fafc;"
              + "border-radius:14px;padding:18px;text-align:center;margin:8px 0\">" + otp + "</div>"
              + "<p style=\"font-size:13px;color:#94a3b8;margin:18px 0 0\">If you didn't request this, you can ignore this email.</p>");
        send(to, "Your SparkMatch code: " + otp, html);
    }

    @Async
    public void sendWelcome(String to, String name) {
        String html = wrap("Welcome to SparkMatch, " + safe(name) + "! 🎉",
                "<p style=\"font-size:15px;color:#475569;line-height:1.6;margin:0 0 16px\">Your account is ready. "
              + "Complete your profile, add a few photos, and start discovering people near you.</p>"
              + "<p style=\"font-size:15px;color:#475569;line-height:1.6;margin:0\">Here's to great connections. 💛</p>");
        send(to, "Welcome to SparkMatch 💜", html);
    }

    @Async
    public void sendNewDeviceLogin(String to, String name, String device, String when) {
        String html = wrap("New login to your account",
                "<p style=\"font-size:15px;color:#475569;line-height:1.6;margin:0 0 12px\">Hi " + safe(name) + ", "
              + "we noticed a new sign-in to your SparkMatch account:</p>"
              + "<div style=\"background:#f8fafc;border-radius:12px;padding:14px 16px;font-size:14px;color:#0f172a\">"
              + "<b>Device:</b> " + safe(device) + "<br/><b>Time:</b> " + safe(when) + "</div>"
              + "<p style=\"font-size:13px;color:#94a3b8;margin:18px 0 0\">If this was you, no action is needed. "
              + "If not, please reset your password immediately.</p>");
        send(to, "New login to your SparkMatch account", html);
    }

    // ---- internals ----

    private void send(String to, String subject, String html) {
        if (to == null || !to.contains("@")) return;
        if (!enabled) {
            log.info("✉️ [MAIL DISABLED] To: {} | Subject: {}", to, subject);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(from, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("✉️ Email sent to {}: {}", to, subject);
        } catch (Exception e) {
            log.error("❌ Email send FAILED to {} ({}): {}", to, subject, e.toString(), e);
        }
    }

    /**
     * Synchronous test send that surfaces the real error (used by the debug
     * endpoint). Returns null on success, or the error message on failure.
     */
    public String testSend(String to) {
        if (!enabled) return "MAIL_ENABLED is false — set it to true in the environment.";
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(from, fromName);
            helper.setTo(to);
            helper.setSubject("SparkMatch email test");
            helper.setText("<h2>It works! ✅</h2><p>SparkMatch email delivery is configured correctly.</p>", true);
            mailSender.send(message);
            return null;
        } catch (Exception e) {
            return e.toString();
        }
    }

    /** Branded HTML shell. */
    private String wrap(String title, String body) {
        return "<div style=\"font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f1f5f9;padding:28px\">"
             + "<div style=\"max-width:460px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;"
             + "box-shadow:0 8px 30px rgba(0,0,0,0.08)\">"
             + "<div style=\"background:linear-gradient(90deg,#FF4D67,#A855F7);padding:22px 26px\">"
             + "<span style=\"color:#fff;font-size:20px;font-weight:800\">🔥 SparkMatch</span></div>"
             + "<div style=\"padding:26px\">"
             + "<h2 style=\"font-size:20px;color:#0f172a;margin:0 0 14px\">" + title + "</h2>"
             + body
             + "</div>"
             + "<div style=\"padding:16px 26px;background:#f8fafc;color:#94a3b8;font-size:12px;text-align:center\">"
             + "© 2026 SparkMatch · Made with ♥</div>"
             + "</div></div>";
    }

    private String safe(String s) { return s == null ? "" : s.replace("<", "").replace(">", ""); }
}
