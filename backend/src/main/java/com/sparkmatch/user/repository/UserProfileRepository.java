package com.sparkmatch.user.repository;

import com.sparkmatch.user.model.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

    Optional<UserProfile> findByUserId(Long userId);

    @Query(value = """
        SELECT p.* FROM user_profiles p
        JOIN users u ON p.user_id = u.id
        WHERE u.status = 'ACTIVE'
          AND u.deleted_at IS NULL
          AND u.id != :userId
          AND u.id NOT IN (SELECT s.swiped_id FROM swipes s WHERE s.swiper_id = :userId)
          AND u.id NOT IN (SELECT b.blocked_id FROM user_blocks b WHERE b.blocker_id = :userId)
          AND u.id NOT IN (SELECT b.blocker_id FROM user_blocks b WHERE b.blocked_id = :userId)
          AND (:gender IS NULL OR p.gender = :gender)
          AND TIMESTAMPDIFF(YEAR, p.birthdate, CURDATE()) BETWEEN :minAge AND :maxAge
          AND (
            :globalMode = TRUE
            OR (
              p.latitude IS NOT NULL AND p.longitude IS NOT NULL
              AND (6371 * acos(
                LEAST(1.0, cos(radians(:lat)) * cos(radians(p.latitude))
                * cos(radians(p.longitude) - radians(:lng))
                + sin(radians(:lat)) * sin(radians(p.latitude)))
              )) <= :maxDistance
            )
          )
        ORDER BY 
            CASE WHEN p.boost_end_time > CURRENT_TIMESTAMP THEN 1 ELSE 0 END DESC,
            u.last_active_at DESC
        LIMIT :limit OFFSET :offset
        """, nativeQuery = true)
    List<UserProfile> findDiscoverableProfiles(
            @Param("userId") Long userId,
            @Param("gender") String gender,
            @Param("minAge") int minAge,
            @Param("maxAge") int maxAge,
            @Param("lat") double latitude,
            @Param("lng") double longitude,
            @Param("maxDistance") int maxDistanceKm,
            @Param("globalMode") boolean globalMode,
            @Param("limit") int limit,
            @Param("offset") int offset
    );
}
