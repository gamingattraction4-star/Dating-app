package com.sparkmatch.user.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class PreferencesUpdateRequest {

    @Min(value = 18, message = "Minimum age must be at least 18")
    @Max(value = 100, message = "Minimum age must not exceed 100")
    private Integer minAge;

    @Min(value = 18, message = "Maximum age must be at least 18")
    @Max(value = 100, message = "Maximum age must not exceed 100")
    private Integer maxAge;

    @Min(value = 1, message = "Distance must be at least 1 km")
    @Max(value = 160, message = "Distance must not exceed 160 km")
    private Integer maxDistanceKm;

    private String genderPreference; // MALE, FEMALE, EVERYONE

    private Boolean showMeOnApp;

    private Boolean globalMode;
}
