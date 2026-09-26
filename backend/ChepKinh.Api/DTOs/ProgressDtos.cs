using System;
using System.Collections.Generic;

namespace ChepKinh.Api.DTOs
{
    public class AttemptDto
    {
        public long Id { get; set; }
        public int SutraId { get; set; }
        public string SutraTitle { get; set; } = string.Empty;
        public int AttemptNumber { get; set; }
        public int CompletedWords { get; set; }
        public int TotalWords { get; set; }
        public double ProgressPercent { get; set; }
        public string Status { get; set; } = string.Empty;
        public string CompletedChunksJson { get; set; } = "[]";
        public int CurrentChunkIndex { get; set; } = 0;
        public int CurrentPageNumber { get; set; } = 1;
        public int TotalNotebookPages { get; set; } = 1;
        public DateTime StartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }

    public class SavePageStrokesDto
    {
        public long AttemptId { get; set; }
        public long PageId { get; set; }
        public string StrokesDataJson { get; set; } = "[]";
        public bool IsPageCompleted { get; set; }
        public double? ProgressPercent { get; set; }
        public int? CompletedWords { get; set; }
        public string? CompletedChunksJson { get; set; }
        public int? CurrentChunkIndex { get; set; }
        public int? CurrentPageNumber { get; set; }
        public int? TotalNotebookPages { get; set; }
    }

    public class UpdateAttemptProgressDto
    {
        public long AttemptId { get; set; }
        public double ProgressPercent { get; set; }
        public int? CompletedWords { get; set; }
        public string? CompletedChunksJson { get; set; }
        public int? CurrentChunkIndex { get; set; }
        public int? CurrentPageNumber { get; set; }
        public int? TotalNotebookPages { get; set; }
    }

    public class PageStrokesResponseDto
    {
        public long Id { get; set; }
        public long AttemptId { get; set; }
        public long PageId { get; set; }
        public string StrokesDataJson { get; set; } = "[]";
        public bool IsPageCompleted { get; set; }
        public double AttemptProgressPercent { get; set; }
        public int TotalCompletedWords { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CompletePageDto
    {
        public long AttemptId { get; set; }
        public long PageId { get; set; }
        public int WordsCompletedOnPage { get; set; }
    }
}
