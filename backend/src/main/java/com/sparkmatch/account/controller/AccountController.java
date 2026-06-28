package com.sparkmatch.account.controller;

import com.sparkmatch.account.dto.ChangeEmailRequest;
import com.sparkmatch.account.dto.ChangePasswordRequest;
import com.sparkmatch.account.service.AccountService;
import com.sparkmatch.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteAccount(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        accountService.deleteAccount(userId);
        return ResponseEntity.ok(ApiResponse.success("Account deleted successfully. We're sorry to see you go."));
    }

    @PostMapping("/deactivate")
    public ResponseEntity<ApiResponse<Void>> deactivateAccount(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        accountService.deactivateAccount(userId);
        return ResponseEntity.ok(ApiResponse.success("Account deactivated. Your profile is now hidden."));
    }

    @PostMapping("/reactivate")
    public ResponseEntity<ApiResponse<Void>> reactivateAccount(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        accountService.reactivateAccount(userId);
        return ResponseEntity.ok(ApiResponse.success("Account reactivated! Welcome back 🎉"));
    }

    @PutMapping("/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            Authentication auth,
            @Valid @RequestBody ChangePasswordRequest request) {
        Long userId = (Long) auth.getPrincipal();
        accountService.changePassword(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
    }

    @PutMapping("/email")
    public ResponseEntity<ApiResponse<Void>> changeEmail(
            Authentication auth,
            @Valid @RequestBody ChangeEmailRequest request) {
        Long userId = (Long) auth.getPrincipal();
        accountService.changeEmail(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Email updated successfully"));
    }
}
