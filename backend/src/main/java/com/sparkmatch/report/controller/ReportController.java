package com.sparkmatch.report.controller;

import com.sparkmatch.common.response.ApiResponse;
import com.sparkmatch.report.dto.BlockRequest;
import com.sparkmatch.report.dto.ReportRequest;
import com.sparkmatch.report.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping("/report")
    public ResponseEntity<ApiResponse<Void>> reportUser(
            Authentication auth,
            @Valid @RequestBody ReportRequest request) {
        Long userId = (Long) auth.getPrincipal();
        reportService.reportUser(userId, request);
        return ResponseEntity.ok(ApiResponse.success("User reported. Our team will review this."));
    }

    @PostMapping("/block")
    public ResponseEntity<ApiResponse<Void>> blockUser(
            Authentication auth,
            @Valid @RequestBody BlockRequest request) {
        Long userId = (Long) auth.getPrincipal();
        reportService.blockUser(userId, request);
        return ResponseEntity.ok(ApiResponse.success("User blocked"));
    }

    @DeleteMapping("/block/{blockedUserId}")
    public ResponseEntity<ApiResponse<Void>> unblockUser(
            Authentication auth,
            @PathVariable Long blockedUserId) {
        Long userId = (Long) auth.getPrincipal();
        reportService.unblockUser(userId, blockedUserId);
        return ResponseEntity.ok(ApiResponse.success("User unblocked"));
    }
}
