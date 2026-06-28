package com.sparkmatch.user.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_preferences")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class UserPreferences {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "min_age")
    @Builder.Default
    private Integer minAge = 18;

    @Column(name = "max_age")
    @Builder.Default
    private Integer maxAge = 50;

    @Column(name = "max_distance_km")
    @Builder.Default
    private Integer maxDistanceKm = 50;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender_preference")
    @Builder.Default
    private GenderPreference genderPreference = GenderPreference.EVERYONE;

    @Column(name = "show_me_on_app")
    @Builder.Default
    private Boolean showMeOnApp = true;

    @Column(name = "global_mode")
    @Builder.Default
    private Boolean globalMode = true;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum GenderPreference {
        MALE, FEMALE, EVERYONE
    }
}
