using System;
using System.Collections.Generic;

namespace ChepKinh.Api.DTOs
{
    public class DashboardStatsDto
    {
        public int TotalUsers { get; set; }
        public int TotalParticipants { get; set; }
        public int TotalAttempts { get; set; }
        public int TotalCompletedAttempts { get; set; }
        public int TotalPagesWritten { get; set; }
        public long TotalWordsWritten { get; set; }
        public List<SutraReportDto> SutraStats { get; set; } = new List<SutraReportDto>();
        public List<RecentActivityDto> RecentActivities { get; set; } = new List<RecentActivityDto>();
    }

    public class SutraReportDto
    {
        public int SutraId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string ScriptType { get; set; } = string.Empty;
        public int TotalWords { get; set; }
        public int TotalPages { get; set; }
        public int ParticipantCount { get; set; }
        public int TotalAttempts { get; set; }
        public int CompletedAttempts { get; set; }
        public double AvgProgressPercent { get; set; }
    }

    public class RecentActivityDto
    {
        public long AttemptId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string? UserAvatar { get; set; }
        public string SutraTitle { get; set; } = string.Empty;
        public double ProgressPercent { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime? LastActiveAt { get; set; }
    }
}
