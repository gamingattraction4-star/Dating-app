package com.sparkmatch.premium.service;

import com.sparkmatch.common.exception.BadRequestException;
import com.sparkmatch.common.exception.ResourceNotFoundException;
import com.sparkmatch.premium.dto.SubscribeRequest;
import com.sparkmatch.premium.dto.SubscriptionResponse;
import com.sparkmatch.premium.model.Subscription;
import com.sparkmatch.premium.model.SubscriptionPlan;
import com.sparkmatch.premium.repository.SubscriptionPlanRepository;
import com.sparkmatch.premium.repository.SubscriptionRepository;
import com.sparkmatch.user.model.User;
import com.sparkmatch.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PremiumService {

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;
    private final UserRepository userRepository;

    /**
     * Get all available plans
     */
    public List<SubscriptionPlan> getAvailablePlans() {
        return planRepository.findByIsActiveTrue();
    }

    /**
     * Subscribe to a plan
     */
    @Transactional
    public SubscriptionResponse subscribe(Long userId, SubscribeRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Check for existing active subscription
        if (subscriptionRepository.findActiveSubscription(userId, LocalDateTime.now()).isPresent()) {
            throw new BadRequestException("You already have an active subscription");
        }

        SubscriptionPlan plan = planRepository.findById(request.getPlanId())
                .orElseThrow(() -> new ResourceNotFoundException("Plan", "id", request.getPlanId()));

        if (!plan.getIsActive()) {
            throw new BadRequestException("This plan is no longer available");
        }

        LocalDateTime now = LocalDateTime.now();

        Subscription subscription = Subscription.builder()
                .user(user)
                .plan(plan)
                .status(Subscription.SubscriptionStatus.ACTIVE)
                .startsAt(now)
                .expiresAt(now.plusDays(plan.getDurationDays()))
                .paymentId(request.getPaymentId())
                .build();
        subscription = subscriptionRepository.save(subscription);

        // Activate premium on user
        user.setIsPremium(true);
        userRepository.save(user);

        log.info("User {} subscribed to plan '{}' (id={})", userId, plan.getName(), plan.getId());

        return mapToResponse(subscription);
    }

    @Transactional
    public void cancelSubscription(Long userId) {
        Subscription subscription = subscriptionRepository
                .findActiveSubscription(userId, LocalDateTime.now())
                .orElseThrow(() -> new BadRequestException("No active subscription found"));

        subscription.setStatus(Subscription.SubscriptionStatus.CANCELLED);
        subscription.setAutoRenew(false);
        subscriptionRepository.save(subscription);

        log.info("User {} cancelled their subscription", userId);
    }

    public SubscriptionResponse getActiveSubscription(Long userId) {
        return subscriptionRepository
                .findActiveSubscription(userId, LocalDateTime.now())
                .map(this::mapToResponse)
                .orElse(null);
    }

    public List<SubscriptionResponse> getSubscriptionHistory(Long userId) {
        return subscriptionRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Scheduled job: expire subscriptions and revoke premium.
     * Runs every hour.
     */
    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void processExpiredSubscriptions() {
        List<Subscription> expired = subscriptionRepository.findExpiredSubscriptions(LocalDateTime.now());
        for (Subscription sub : expired) {
            sub.setStatus(Subscription.SubscriptionStatus.EXPIRED);
            subscriptionRepository.save(sub);

            // Revoke premium if no other active subscription
            Long userId = sub.getUser().getId();
            if (subscriptionRepository.findActiveSubscription(userId, LocalDateTime.now()).isEmpty()) {
                userRepository.updatePremiumStatus(userId, false);
                log.info("Premium expired for user {}", userId);
            }
        }
        if (!expired.isEmpty()) {
            log.info("Processed {} expired subscriptions", expired.size());
        }
    }

    private SubscriptionResponse mapToResponse(Subscription s) {
        SubscriptionPlan plan = s.getPlan();
        return SubscriptionResponse.builder()
                .id(s.getId())
                .planName(plan.getName())
                .planDescription(plan.getDescription())
                .priceCents(plan.getPriceCents())
                .currency(plan.getCurrency())
                .durationDays(plan.getDurationDays())
                .status(s.getStatus().name())
                .startsAt(s.getStartsAt())
                .expiresAt(s.getExpiresAt())
                .autoRenew(s.getAutoRenew())
                .active(!s.isExpired() && s.getStatus() == Subscription.SubscriptionStatus.ACTIVE)
                .build();
    }
}
