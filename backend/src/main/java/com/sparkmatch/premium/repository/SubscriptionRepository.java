package com.sparkmatch.premium.repository;

import com.sparkmatch.premium.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    @Query("SELECT s FROM Subscription s WHERE s.user.id = :userId AND s.status = 'ACTIVE' AND s.expiresAt > :now ORDER BY s.expiresAt DESC")
    Optional<Subscription> findActiveSubscription(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    List<Subscription> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT s FROM Subscription s WHERE s.status = 'ACTIVE' AND s.expiresAt <= :now")
    List<Subscription> findExpiredSubscriptions(@Param("now") LocalDateTime now);
}
