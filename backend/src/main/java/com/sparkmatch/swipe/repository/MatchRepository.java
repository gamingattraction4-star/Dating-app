package com.sparkmatch.swipe.repository;

import com.sparkmatch.swipe.model.Match;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MatchRepository extends JpaRepository<Match, Long> {

    @Query("""
        SELECT m FROM Match m
        WHERE (m.userOne.id = :userId OR m.userTwo.id = :userId)
        AND m.isActive = true
        ORDER BY m.matchedAt DESC
    """)
    List<Match> findActiveMatchesForUser(@Param("userId") Long userId);

    @Query("""
        SELECT m FROM Match m
        WHERE ((m.userOne.id = :userId1 AND m.userTwo.id = :userId2)
           OR (m.userOne.id = :userId2 AND m.userTwo.id = :userId1))
        AND m.isActive = true
    """)
    Optional<Match> findActiveMatchBetween(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    @Query("SELECT COUNT(m) FROM Match m WHERE (m.userOne.id = :userId OR m.userTwo.id = :userId) AND m.isActive = true")
    long countActiveMatches(@Param("userId") Long userId);
}
