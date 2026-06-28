package com.sparkmatch.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OtpRequest {

    @NotBlank(message = "Phone number or email is required")
    private String identifier;

    private String purpose; // REGISTRATION, LOGIN, PASSWORD_RESET
}
