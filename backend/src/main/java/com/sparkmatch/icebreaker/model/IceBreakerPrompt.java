package com.sparkmatch.icebreaker.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ice_breaker_prompts")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class IceBreakerPrompt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "prompt_text", nullable = false, length = 500)
    private String promptText;

    @Column(length = 50)
    private String category;

    @Column(name = "is_system")
    @Builder.Default
    private Boolean isSystem = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
