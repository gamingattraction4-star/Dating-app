package com.sparkmatch.admin.service;

import com.sparkmatch.admin.dto.AdminActionRequest;
import com.sparkmatch.admin.dto.DashboardStats;
import com.sparkmatch.chat.repository.MessageRepository;
import com.sparkmatch.common.exception.BadRequestException;
import com.sparkmatch.common.exception.ResourceNotFoundException;
import com.sparkmatch.report.model.UserReport;
import com.sparkmatch.report.repository.UserReportRepository;
import com.sparkmatch.swipe.repository.MatchRepository;
import com.sparkmatch.user.model.User;
import com.sparkmatch.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final MatchRepository matchRepository;
    private final MessageRepository messageRepository;
    private final UserReportRepository reportRepository;

    /**
     * Dashboard overview statistics
     */
    public DashboardStats getDashboardStats() {
        return DashboardStats.builder()
                .totalUsers(userRepository.count())
                .activeUsers(userRepository.countByStatus(User.UserStatus.ACTIVE))
                .premiumUsers(userRepository.countByIsPremiumTrue())
                .totalMatches(matchRepository.count())
                .totalMessages(messageRepository.count())
                .pendingReports(reportRepository.findByStatus(
                        UserReport.ReportStatus.PENDING, PageRequest.of(0, 1)).getTotalElements())
                .build();
    }

    /**
     * Get pending reports for moderation
     */
    public Page<UserReport> getPendingReports(int page, int size) {
        return reportRepository.findByStatus(UserReport.ReportStatus.PENDING, PageRequest.of(page, size));
    }

    /**
     * Perform admin action on a user
     */
    @Transactional
    public void performAction(Long adminId, AdminActionRequest request) {
        User targetUser = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));

        String action = request.getAction().toUpperCase();

        switch (action) {
            case "SUSPEND" -> {
                targetUser.setStatus(User.UserStatus.SUSPENDED);
                log.info("Admin {} suspended user {}: {}", adminId, request.getUserId(), request.getReason());
            }
            case "BAN" -> {
                targetUser.setStatus(User.UserStatus.BANNED);
                log.info("Admin {} banned user {}: {}", adminId, request.getUserId(), request.getReason());
            }
            case "ACTIVATE" -> {
                targetUser.setStatus(User.UserStatus.ACTIVE);
                log.info("Admin {} activated user {}", adminId, request.getUserId());
            }
            case "VERIFY" -> {
                targetUser.setIsVerified(true);
                log.info("Admin {} verified user {}", adminId, request.getUserId());
            }
            case "GRANT_PREMIUM" -> {
                targetUser.setIsPremium(true);
                log.info("Admin {} granted premium to user {}", adminId, request.getUserId());
            }
            case "REVOKE_PREMIUM" -> {
                targetUser.setIsPremium(false);
                log.info("Admin {} revoked premium from user {}", adminId, request.getUserId());
            }
            default -> throw new BadRequestException("Unknown action: " + action);
        }

        userRepository.save(targetUser);
    }

    /**
     * Resolve a report
     */
    @Transactional
    public void resolveReport(Long adminId, Long reportId, String status, String notes) {
        UserReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report", "id", reportId));
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", adminId));

        UserReport.ReportStatus reportStatus;
        try {
            reportStatus = UserReport.ReportStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status: " + status);
        }

        report.setStatus(reportStatus);
        report.setReviewedBy(admin);
        report.setReviewedAt(LocalDateTime.now());
        reportRepository.save(report);

        log.info("Admin {} resolved report {} as {}", adminId, reportId, reportStatus);
    }
}
