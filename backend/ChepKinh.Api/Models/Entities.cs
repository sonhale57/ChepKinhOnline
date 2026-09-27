using System;
using System.Collections.Generic;

namespace ChepKinh.Api.Models
{
    public class User
    {
        public long Id { get; set; }
        public string? GoogleId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public string UserType { get; set; } = "User"; // "User" | "Admin"
        public string? PasswordHash { get; set; } // Dành cho Admin
        public bool IsActive { get; set; } = true;
        public string? DailyReminderTime { get; set; } = "20:00"; // "HH:mm" in VN time
        public bool IsReminderEnabled { get; set; } = true;
        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiryTime { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
        public ICollection<UserSutraAttempt> Attempts { get; set; } = new List<UserSutraAttempt>();
    }

    public class Role
    {
        public int Id { get; set; }
        public string RoleName { get; set; } = string.Empty; // "ADMIN", "USER"
        public string? Description { get; set; }

        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
        public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
    }

    public class Permission
    {
        public int Id { get; set; }
        public string PermissionCode { get; set; } = string.Empty; // "sutras.view", "sutras.manage", "ink.sync"
        public string ModuleName { get; set; } = string.Empty;
        public string? Description { get; set; }

        public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
    }

    public class UserRole
    {
        public long UserId { get; set; }
        public User User { get; set; } = null!;

        public int RoleId { get; set; }
        public Role Role { get; set; } = null!;
    }

    public class RolePermission
    {
        public int RoleId { get; set; }
        public Role Role { get; set; } = null!;

        public int PermissionId { get; set; }
        public Permission Permission { get; set; } = null!;
    }

    public class Sutra
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string ScriptType { get; set; } = "QUOC_NGU"; // "QUOC_NGU" | "HAN" | "PALI"
        public string? OriginalSource { get; set; }
        public int TotalWords { get; set; }
        public int TotalPages { get; set; }
        public bool IsPublished { get; set; } = true;
        public long? CreatedByAdminId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<SutraPage> Pages { get; set; } = new List<SutraPage>();
        public ICollection<UserSutraAttempt> Attempts { get; set; } = new List<UserSutraAttempt>();
    }

    public class SutraPage
    {
        public long Id { get; set; }
        public int SutraId { get; set; }
        public Sutra Sutra { get; set; } = null!;

        public int PageNumber { get; set; }
        public string ContentText { get; set; } = string.Empty;
        public int TotalWordsOnPage { get; set; }
        public int LineCount { get; set; } = 10;
        public int DefaultFontSize { get; set; } = 28;
        public string DefaultGridType { get; set; } = "GRID_OLY"; // "GRID_HAN" | "GRID_OLY" | "LINE" | "BLANK"

        public ICollection<UserPageStroke> PageStrokes { get; set; } = new List<UserPageStroke>();
    }

    public class UserSutraAttempt
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public User User { get; set; } = null!;

        public int SutraId { get; set; }
        public Sutra Sutra { get; set; } = null!;

        public int AttemptNumber { get; set; } = 1;
        public int CompletedWords { get; set; }
        public int TotalWords { get; set; }
        public double ProgressPercent { get; set; }
        public string Status { get; set; } = "IN_PROGRESS"; // "IN_PROGRESS" | "COMPLETED"
        public string CompletedChunksJson { get; set; } = "[]"; // Mảng các index đoạn đã khớp: "[0,1,2]"
        public int CurrentChunkIndex { get; set; } = 0;
        public int CurrentPageNumber { get; set; } = 1;
        public int TotalNotebookPages { get; set; } = 1;
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }

        public ICollection<UserPageStroke> PageStrokes { get; set; } = new List<UserPageStroke>();
    }

    public class UserPageStroke
    {
        public long Id { get; set; }
        public long AttemptId { get; set; }
        public UserSutraAttempt Attempt { get; set; } = null!;

        public long PageId { get; set; }
        public SutraPage Page { get; set; } = null!;

        public long UserId { get; set; }
        public string StrokesDataJson { get; set; } = "[]"; // Vector JSON
        public string? RecognizedText { get; set; } // Văn bản nhận diện từ nét viết
        public bool IsPageCompleted { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
