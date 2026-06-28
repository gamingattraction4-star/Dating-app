package com.sparkmatch.icebreaker.repository;

import com.sparkmatch.icebreaker.model.UserPrompt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserPromptRepository extends JpaRepository<UserPrompt, Long> {

    List<UserPrompt> findByUserIdOrderByOrderIndex(Long userId);

    Optional<UserPrompt> findByUserIdAndPromptId(Long userId, Long promptId);

    long countByUserId(Long userId);

    void deleteByUserIdAndPromptId(Long userId, Long promptId);
}
