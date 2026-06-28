package com.sparkmatch.user.repository;

import com.sparkmatch.user.model.UserInterest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserInterestRepository extends JpaRepository<UserInterest, Long> {

    List<UserInterest> findByUserId(Long userId);

    @Modifying
    @Query("DELETE FROM UserInterest ui WHERE ui.user.id = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);
}
