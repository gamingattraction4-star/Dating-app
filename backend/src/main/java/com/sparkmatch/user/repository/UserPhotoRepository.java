package com.sparkmatch.user.repository;

import com.sparkmatch.user.model.UserPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserPhotoRepository extends JpaRepository<UserPhoto, Long> {

    List<UserPhoto> findByUserIdOrderByOrderIndexAsc(Long userId);

    int countByUserId(Long userId);

    void deleteByIdAndUserId(Long id, Long userId);
}
