package com.blog01.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminStatsResponse {
    private long totalUsers;
    private long totalPosts;
    private long pendingReports;
    private long reportedUsers;
    private long bannedUsers;
}
