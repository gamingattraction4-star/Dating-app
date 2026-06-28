package com.sparkmatch.notification.model;

import com.sparkmatch.user.model.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "notification_preferences")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "push_matches")
    @Builder.Default
    private Boolean pushMatches = true;

    @Column(name = "push_messages")
    @Builder.Default
    private Boolean pushMessages = true;

    @Column(name = "push_likes")
    @Builder.Default
    private Boolean pushLikes = true;

    @Column(name = "email_matches")
    @Builder.Default
    private Boolean emailMatches = false;

    @Column(name = "email_promotions")
    @Builder.Default
    private Boolean emailPromotions = false;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
