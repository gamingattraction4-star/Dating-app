package com.sparkmatch.swipe.repository;

import com.sparkmatch.swipe.model.Swipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SwipeRepository extends JpaRepository<Swipe, Long> {

    Optional<Swipe> findBySwiperIdAndSwipedId(Long swiperId, Long swipedId);

    boolean existsBySwiperIdAndSwipedId(Long swiperId, Long swipedId);

    // Check if target has already liked current user (for match detection)
    @Query("SELECT s FROM Swipe s WHERE s.swiper.id = :swipedId AND s.swiped.id = :swiperId AND s.swipeType IN ('LIKE', 'SUPER_LIKE')")
    Optional<Swipe> findMutualLike(@Param("swipedId") Long swipedId, @Param("swiperId") Long swiperId);

    // Count today's swipes for rate limiting
    @Query("SELECT COUNT(s) FROM Swipe s WHERE s.swiper.id = :userId AND s.createdAt >= :since")
    long countSwipesSince(@Param("userId") Long userId, @Param("since") LocalDateTime since);

    // Count today's super likes
    @Query("SELECT COUNT(s) FROM Swipe s WHERE s.swiper.id = :userId AND s.swipeType = 'SUPER_LIKE' AND s.createdAt >= :since")
    long countSuperLikesSince(@Param("userId") Long userId, @Param("since") LocalDateTime since);

    // Get users who liked me (for premium feature)
    @Query("SELECT s FROM Swipe s WHERE s.swiped.id = :userId AND s.swipeType IN ('LIKE', 'SUPER_LIKE') AND s.swiper.id NOT IN (SELECT sw.swiped.id FROM Swipe sw WHERE sw.swiper.id = :userId)")
    List<Swipe> findPendingLikesForUser(@Param("userId") Long userId);

    // Find last swipe for undo
    @Query("SELECT s FROM Swipe s WHERE s.swiper.id = :userId ORDER BY s.createdAt DESC LIMIT 1")
    Optional<Swipe> findLastSwipeByUser(@Param("userId") Long userId);
}
