package com.sparkmatch.icebreaker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AnswerPromptRequest {
    @NotNull(message = "Prompt ID is required")
    private Long promptId;

    @NotBlank(message = "Answer is required")
    @Size(min = 3, max = 500, message = "Answer must be between 3 and 500 characters")
    private String answer;
}
