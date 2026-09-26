using System;
using System.Collections.Generic;

namespace ChepKinh.Api.DTOs
{
    public class UserProfileDto
    {
        public long Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public DateTime CreatedAt { get; set; }
        public int TotalSutrasJoined { get; set; }
        public int TotalSutrasCompleted { get; set; }
        public int TotalPagesWritten { get; set; }
        public long TotalWordsWritten { get; set; }
    }

    public class UpdateProfileDto
    {
        public string FullName { get; set; } = string.Empty;
    }

    public class MySutraAttemptDto
    {
        public long AttemptId { get; set; }
        public int SutraId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string ScriptType { get; set; } = string.Empty;
        public int TotalWords { get; set; }
        public int TotalPages { get; set; }
        public int AttemptNumber { get; set; }
        public int CompletedWords { get; set; }
        public double ProgressPercent { get; set; }
        public string Status { get; set; } = string.Empty; // IN_PROGRESS | COMPLETED
        public int CurrentPageNumber { get; set; }
        public DateTime StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime? LastModifiedAt { get; set; }
    }

    public class AdminUserListDto
    {
        public long Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public string UserType { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public bool IsGoogleAccount { get; set; }
        public DateTime CreatedAt { get; set; }
        public int TotalSutrasJoined { get; set; }
        public long TotalWordsWritten { get; set; }
        public int TotalPagesWritten { get; set; }
    }

    public class UserStreakDto
    {
        public int CurrentStreakDays { get; set; }
        public int LongestStreakDays { get; set; }
        public bool PracticedToday { get; set; }
        public string? DailyReminderTime { get; set; } = "20:00"; // "HH:mm" (VN Time)
        public bool IsReminderEnabled { get; set; } = true;
        public List<string> PracticeDatesThisMonth { get; set; } = new List<string>(); // ["2026-09-21", "2026-09-22", ...]
    }

    public class UpdateReminderSettingsDto
    {
        public string? DailyReminderTime { get; set; } = "20:00";
        public bool IsReminderEnabled { get; set; } = true;
    }
}
