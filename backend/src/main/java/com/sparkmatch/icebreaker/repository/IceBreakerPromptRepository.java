package com.sparkmatch.icebreaker.repository;

import com.sparkmatch.icebreaker.model.IceBreakerPrompt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IceBreakerPromptRepository extends JpaRepository<IceBreakerPrompt, Long> {

    List<IceBreakerPrompt> findByIsSystemTrue();

    List<IceBreakerPrompt> findByCategory(String category);
}
