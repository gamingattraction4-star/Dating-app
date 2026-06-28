package com.sparkmatch.user.repository;

import com.sparkmatch.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByPhone(String phone);

    Optional<User> findByEmailOrPhone(String email, String phone);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    Optional<User> findByAuthProviderAndProviderId(User.AuthProvider provider, String providerId);

    long countByStatus(User.UserStatus status);

    long countByIsPremiumTrue();

    @Modifying
    @Query("UPDATE User u SET u.lastActiveAt = :lastActive WHERE u.id = :userId")
    void updateLastActive(@Param("userId") Long userId, @Param("lastActive") LocalDateTime lastActive);

    @Modifying
    @Query("UPDATE User u SET u.isPremium = :isPremium WHERE u.id = :userId")
    void updatePremiumStatus(@Param("userId") Long userId, @Param("isPremium") boolean isPremium);
}
