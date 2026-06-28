package com.sparkmatch.chat.repository;

import com.sparkmatch.chat.model.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    Page<Message> findByConversationIdAndDeletedAtIsNullOrderByCreatedAtDesc(
            Long conversationId, Pageable pageable);

    List<Message> findByConversationIdAndDeletedAtIsNullOrderByCreatedAtAsc(Long conversationId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversation.id = :convId AND m.sender.id != :userId AND m.isRead = false")
    long countUnreadMessages(@Param("convId") Long conversationId, @Param("userId") Long userId);

    @Modifying
    @Query("UPDATE Message m SET m.isRead = true, m.readAt = :now WHERE m.conversation.id = :convId AND m.sender.id != :userId AND m.isRead = false")
    void markMessagesAsRead(@Param("convId") Long conversationId, @Param("userId") Long userId, @Param("now") LocalDateTime now);
}
