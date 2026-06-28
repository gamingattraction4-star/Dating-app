package com.sparkmatch.chat.repository;

import com.sparkmatch.chat.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    Optional<Conversation> findByMatchId(Long matchId);

    @Query("""
        SELECT c FROM Conversation c
        JOIN c.match m
        WHERE (m.userOne.id = :userId OR m.userTwo.id = :userId)
        AND c.isActive = true AND m.isActive = true
        ORDER BY c.lastMessageAt DESC NULLS LAST
    """)
    List<Conversation> findActiveConversationsForUser(@Param("userId") Long userId);
}
