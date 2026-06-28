package com.sparkmatch.report.service;

import com.sparkmatch.common.exception.BadRequestException;
import com.sparkmatch.common.exception.ResourceNotFoundException;
import com.sparkmatch.report.dto.BlockRequest;
import com.sparkmatch.report.dto.ReportRequest;
import com.sparkmatch.report.model.UserBlock;
import com.sparkmatch.report.model.UserReport;
import com.sparkmatch.report.repository.UserBlockRepository;
import com.sparkmatch.report.repository.UserReportRepository;
import com.sparkmatch.swipe.model.Match;
import com.sparkmatch.swipe.repository.MatchRepository;
import com.sparkmatch.user.model.User;
import com.sparkmatch.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportService {

    private final UserReportRepository reportRepository;
    private final UserBlockRepository blockRepository;
    private final UserRepository userRepository;
    private final MatchRepository matchRepository;

    private static final int AUTO_SUSPEND_THRESHOLD = 5;

    @Transactional
    public void reportUser(Long reporterId, ReportRequest request) {
        if (reporterId.equals(request.getReportedUserId())) {
            throw new BadRequestException("You cannot report yourself");
        }

        if (reportRepository.existsByReporterIdAndReportedId(reporterId, request.getReportedUserId())) {
            throw new BadRequestException("You have already reported this user");
        }

        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", reporterId));
        User reported = userRepository.findById(request.getReportedUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getReportedUserId()));

        UserReport.ReportReason reason;
        try {
            reason = UserReport.ReportReason.valueOf(request.getReason().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid report reason: " + request.getReason());
        }

        UserReport report = UserReport.builder()
                .reporter(reporter)
                .reported(reported)
                .reason(reason)
                .description(request.getDescription())
                .build();
        reportRepository.save(report);

        // Auto-suspend if threshold reached
        long reportCount = reportRepository.countActiveReportsAgainst(request.getReportedUserId());
        if (reportCount >= AUTO_SUSPEND_THRESHOLD) {
            reported.setStatus(User.UserStatus.SUSPENDED);
            userRepository.save(reported);
            log.warn("User {} auto-suspended after {} reports", request.getReportedUserId(), reportCount);
        }

        log.info("User {} reported user {} for {}", reporterId, request.getReportedUserId(), reason);
    }

    @Transactional
    public void blockUser(Long blockerId, BlockRequest request) {
        if (blockerId.equals(request.getBlockedUserId())) {
            throw new BadRequestException("You cannot block yourself");
        }

        if (blockRepository.existsByBlockerIdAndBlockedId(blockerId, request.getBlockedUserId())) {
            throw new BadRequestException("User is already blocked");
        }

        User blocker = userRepository.findById(blockerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", blockerId));
        User blocked = userRepository.findById(request.getBlockedUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getBlockedUserId()));

        UserBlock block = UserBlock.builder()
                .blocker(blocker)
                .blocked(blocked)
                .build();
        blockRepository.save(block);

        // Unmatch if matched
        matchRepository.findActiveMatchBetween(blockerId, request.getBlockedUserId())
                .ifPresent(match -> {
                    match.setIsActive(false);
                    match.setUnmatchedAt(LocalDateTime.now());
                    matchRepository.save(match);
                    log.info("Auto-unmatched users {} and {} due to block", blockerId, request.getBlockedUserId());
                });

        log.info("User {} blocked user {}", blockerId, request.getBlockedUserId());
    }

    @Transactional
    public void unblockUser(Long blockerId, Long blockedId) {
        UserBlock block = blockRepository.findByBlockerIdAndBlockedId(blockerId, blockedId)
                .orElseThrow(() -> new BadRequestException("User is not blocked"));
        blockRepository.delete(block);
        log.info("User {} unblocked user {}", blockerId, blockedId);
    }

    public List<Long> getBlockedUserIds(Long userId) {
        return blockRepository.findBlockedUserIds(userId);
    }
}
