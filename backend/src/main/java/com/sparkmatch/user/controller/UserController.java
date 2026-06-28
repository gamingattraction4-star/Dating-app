package com.sparkmatch.user.controller;

import com.sparkmatch.common.response.ApiResponse;
import com.sparkmatch.user.dto.*;
import com.sparkmatch.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<ProfileResponse>> getMyProfile(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        ProfileResponse profile = userService.getProfile(userId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<ProfileResponse>> updateProfile(
            Authentication auth,
            @Valid @RequestBody ProfileUpdateRequest request) {
        Long userId = (Long) auth.getPrincipal();
        ProfileResponse profile = userService.updateProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated", profile));
    }

    @PutMapping("/me/location")
    public ResponseEntity<ApiResponse<Void>> updateLocation(
            Authentication auth,
            @Valid @RequestBody LocationUpdateRequest request) {
        Long userId = (Long) auth.getPrincipal();
        userService.updateLocation(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Location updated"));
    }

    @GetMapping("/me/preferences")
    public ResponseEntity<ApiResponse<PreferencesResponse>> getMyPreferences(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        PreferencesResponse prefs = userService.getPreferences(userId);
        return ResponseEntity.ok(ApiResponse.success(prefs));
    }

    @PutMapping("/me/preferences")
    public ResponseEntity<ApiResponse<PreferencesResponse>> updatePreferences(
            Authentication auth,
            @Valid @RequestBody PreferencesUpdateRequest request) {
        Long userId = (Long) auth.getPrincipal();
        PreferencesResponse prefs = userService.updatePreferences(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Preferences updated", prefs));
    }

    @PostMapping("/me/boost")
    public ResponseEntity<ApiResponse<ProfileResponse>> boostProfile(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        ProfileResponse profile = userService.activateBoost(userId);
        return ResponseEntity.ok(ApiResponse.success("Profile boosted for 30 minutes!", profile));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<ProfileResponse>> getUserProfile(
            Authentication auth,
            @PathVariable Long userId) {
        Long myUserId = (Long) auth.getPrincipal();
        ProfileResponse profile = userService.getProfileById(myUserId, userId);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @GetMapping("/interests")
    public ResponseEntity<ApiResponse<List<ProfileResponse.InterestDto>>> getInterests() {
        return ResponseEntity.ok(ApiResponse.success(userService.getAllInterests()));
    }
}
