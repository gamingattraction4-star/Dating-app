package com.sparkmatch.user.repository;

import com.sparkmatch.user.model.Interest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterestRepository extends JpaRepository<Interest, Long> {

    List<Interest> findByCategory(String category);

    List<Interest> findByIdIn(List<Long> ids);
}
