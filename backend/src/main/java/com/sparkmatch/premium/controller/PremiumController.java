package com.sparkmatch.premium.controller;

import com.sparkmatch.common.response.ApiResponse;
import com.sparkmatch.premium.dto.SubscribeRequest;
import com.sparkmatch.premium.dto.SubscriptionResponse;
import com.sparkmatch.premium.model.SubscriptionPlan;
import com.sparkmatch.premium.service.PremiumService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/premium")
@RequiredArgsConstructor
public class PremiumController {

    private final PremiumService premiumService;

    @GetMapping("/plans")
    public ResponseEntity<ApiResponse<List<SubscriptionPlan>>> getPlans() {
        List<SubscriptionPlan> plans = premiumService.getAvailablePlans();
        return ResponseEntity.ok(ApiResponse.success(plans));
    }

    @PostMapping("/subscribe")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> subscribe(
            Authentication auth,
            @Valid @RequestBody SubscribeRequest request) {
        Long userId = (Long) auth.getPrincipal();
        SubscriptionResponse response = premiumService.subscribe(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Subscribed successfully! 🎉", response));
    }

    @PostMapping("/cancel")
    public ResponseEntity<ApiResponse<Void>> cancel(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        premiumService.cancelSubscription(userId);
        return ResponseEntity.ok(ApiResponse.success("Subscription cancelled"));
    }

    @GetMapping("/subscription")
    public ResponseEntity<ApiResponse<SubscriptionResponse>> getActive(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        SubscriptionResponse response = premiumService.getActiveSubscription(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<SubscriptionResponse>>> getHistory(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        List<SubscriptionResponse> history = premiumService.getSubscriptionHistory(userId);
        return ResponseEntity.ok(ApiResponse.success(history));
    }
}
