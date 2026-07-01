package com.blog01.dto.response;

import com.blog01.entity.ReportStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class ReportResponse {
    private Long id;
    private UserSummary reporter;
    private UserSummary reportedUser;
    private Long reportedPostId;
    private String reason;
    private ReportStatus status;
    private Instant createdAt;
}
