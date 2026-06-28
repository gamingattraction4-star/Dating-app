package com.sparkmatch.icebreaker.model;

import com.sparkmatch.user.model.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_prompts", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "prompt_id"})
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class UserPrompt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "prompt_id", nullable = false)
    private IceBreakerPrompt prompt;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String answer;

    @Column(name = "order_index")
    @Builder.Default
    private Integer orderIndex = 0;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
