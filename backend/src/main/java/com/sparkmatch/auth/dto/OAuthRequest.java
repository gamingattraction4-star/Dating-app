package com.sparkmatch.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OAuthRequest {

    @NotBlank(message = "ID token is required")
    private String idToken;

    private String provider; // GOOGLE, APPLE
}
