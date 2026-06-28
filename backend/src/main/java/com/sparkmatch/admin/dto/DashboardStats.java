package com.sparkmatch.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStats {
    private long totalUsers;
    private long activeUsers;
    private long premiumUsers;
    private long totalMatches;
    private long totalMessages;
    private long pendingReports;
    private long newUsersToday;
    private long matchesToday;
}
