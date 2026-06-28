package com.sparkmatch.user.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class ProfileUpdateRequest {

    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String displayName;

    private LocalDate birthdate;

    private String gender; // MALE, FEMALE, NON_BINARY, OTHER

    @Size(max = 500, message = "Bio must not exceed 500 characters")
    private String bio;

    @Size(max = 150)
    private String jobTitle;

    @Size(max = 150)
    private String company;

    @Size(max = 150)
    private String school;

    @Size(max = 100)
    private String city;

    private Integer heightCm;

    private String drinking; // NEVER, SOMETIMES, OFTEN

    private String smoking;

    private String lookingFor; // RELATIONSHIP, CASUAL, FRIENDSHIP, NOT_SURE

    private List<Long> interestIds;
}
