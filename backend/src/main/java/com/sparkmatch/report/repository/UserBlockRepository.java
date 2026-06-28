package com.sparkmatch.report.repository;

import com.sparkmatch.report.model.UserBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserBlockRepository extends JpaRepository<UserBlock, Long> {

    boolean existsByBlockerIdAndBlockedId(Long blockerId, Long blockedId);

    Optional<UserBlock> findByBlockerIdAndBlockedId(Long blockerId, Long blockedId);

    @Query("SELECT b.blocked.id FROM UserBlock b WHERE b.blocker.id = :userId")
    List<Long> findBlockedUserIds(@Param("userId") Long userId);

    List<UserBlock> findByBlockerId(Long blockerId);
}
