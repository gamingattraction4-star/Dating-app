package com.sparkmatch.admin.controller;

import com.sparkmatch.admin.dto.AdminActionRequest;
import com.sparkmatch.admin.dto.DashboardStats;
import com.sparkmatch.admin.service.AdminService;
import com.sparkmatch.common.response.ApiResponse;
import com.sparkmatch.report.model.UserReport;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardStats>> getDashboard() {
        DashboardStats stats = adminService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<Page<UserReport>>> getPendingReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<UserReport> reports = adminService.getPendingReports(page, size);
        return ResponseEntity.ok(ApiResponse.success(reports));
    }

    @PostMapping("/actions")
    public ResponseEntity<ApiResponse<Void>> performAction(
            Authentication auth,
            @Valid @RequestBody AdminActionRequest request) {
        Long adminId = (Long) auth.getPrincipal();
        adminService.performAction(adminId, request);
        return ResponseEntity.ok(ApiResponse.success("Action performed: " + request.getAction()));
    }

    @PutMapping("/reports/{reportId}")
    public ResponseEntity<ApiResponse<Void>> resolveReport(
            Authentication auth,
            @PathVariable Long reportId,
            @RequestBody Map<String, String> body) {
        Long adminId = (Long) auth.getPrincipal();
        adminService.resolveReport(adminId, reportId,
                body.getOrDefault("status", "RESOLVED"),
                body.get("notes"));
        return ResponseEntity.ok(ApiResponse.success("Report resolved"));
    }
}
