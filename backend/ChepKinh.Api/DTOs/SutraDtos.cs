using System;
using System.Collections.Generic;

namespace ChepKinh.Api.DTOs
{
    public class SutraListDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string ScriptType { get; set; } = string.Empty;
        public string? OriginalSource { get; set; }
        public int TotalWords { get; set; }
        public int TotalPages { get; set; }
        public bool IsPublished { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class SutraDetailDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string ScriptType { get; set; } = string.Empty;
        public string? OriginalSource { get; set; }
        public int TotalWords { get; set; }
        public int TotalPages { get; set; }
        public List<SutraPageDto> Pages { get; set; } = new();
    }

    public class SutraPageDto
    {
        public long Id { get; set; }
        public int SutraId { get; set; }
        public int PageNumber { get; set; }
        public string ContentText { get; set; } = string.Empty;
        public int TotalWordsOnPage { get; set; }
        public int LineCount { get; set; }
        public int DefaultFontSize { get; set; }
        public string DefaultGridType { get; set; } = string.Empty;
    }

    public class CreateSutraDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string ScriptType { get; set; } = "QUOC_NGU";
        public string? OriginalSource { get; set; }
        public List<CreateSutraPageDto> Pages { get; set; } = new();
    }

    public class CreateSutraPageDto
    {
        public int PageNumber { get; set; }
        public string ContentText { get; set; } = string.Empty;
        public int LineCount { get; set; } = 8;
        public int DefaultFontSize { get; set; } = 28;
        public string DefaultGridType { get; set; } = "GRID_OLY";
    }
}
