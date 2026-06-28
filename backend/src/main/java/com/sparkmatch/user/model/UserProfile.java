package com.sparkmatch.user.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_profiles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Column(nullable = false)
    private LocalDate birthdate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Gender gender;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "job_title", length = 150)
    private String jobTitle;

    @Column(length = 150)
    private String company;

    @Column(length = 150)
    private String school;

    @Column(length = 100)
    private String city;

    @Column(precision = 10)
    private Double latitude;

    @Column(precision = 11)
    private Double longitude;

    @Column(name = "height_cm")
    private Integer heightCm;

    @Enumerated(EnumType.STRING)
    private LifestyleChoice drinking;

    @Enumerated(EnumType.STRING)
    private LifestyleChoice smoking;

    @Enumerated(EnumType.STRING)
    @Column(name = "looking_for")
    private LookingFor lookingFor;

    @Column(name = "profile_complete_pct")
    @Builder.Default
    private Integer profileCompletePct = 0;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "boost_end_time")
    private LocalDateTime boostEndTime;


    public enum Gender {
        MALE, FEMALE, NON_BINARY, OTHER
    }

    public enum LifestyleChoice {
        NEVER, SOMETIMES, OFTEN
    }

    public enum LookingFor {
        RELATIONSHIP, CASUAL, FRIENDSHIP, NOT_SURE
    }
}
