package com.sparkmatch.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreferencesResponse {
    private Integer minAge;
    private Integer maxAge;
    private Integer maxDistanceKm;
    private String genderPreference;
    private Boolean showMeOnApp;
    private Boolean globalMode;
}
