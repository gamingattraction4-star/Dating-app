package com.sparkmatch.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {

    private Long userId;
    private String displayName;
    private Integer age;
    private String gender;
    private String bio;
    private String jobTitle;
    private String company;
    private String school;
    private String city;
    private Double latitude;
    private Double longitude;
    private Integer heightCm;
    private String drinking;
    private String smoking;
    private String lookingFor;
    private Integer profileCompletePct;
    private boolean verified;
    private boolean premium;
    private List<PhotoDto> photos;
    private List<InterestDto> interests;
    private List<PromptAnswerDto> prompts;
    private Double distanceKm;
    private String boostEndTime;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PhotoDto {
        private Long id;
        private String photoUrl;
        private String thumbnailUrl;
        private Integer orderIndex;
        private boolean primary;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InterestDto {
        private Long id;
        private String name;
        private String category;
        private String icon;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PromptAnswerDto {
        private Long promptId;
        private String promptText;
        private String answer;
    }
}
