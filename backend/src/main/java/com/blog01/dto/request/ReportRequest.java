package com.blog01.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ReportRequest {

    private Long reportedUserId;
    private Long reportedPostId;

    @NotBlank
    @Size(max = 1000)
    private String reason;
}
