using System.Collections.Generic;

namespace ChepKinh.Api.DTOs
{
    public class ExtractedPdfResultDto
    {
        public string FileName { get; set; } = string.Empty;
        public int TotalPages { get; set; }
        public int TotalWords { get; set; }
        public List<ExtractedPageDto> Pages { get; set; } = new();
    }

    public class ExtractedPageDto
    {
        public int PageNumber { get; set; }
        public string ContentText { get; set; } = string.Empty;
        public int WordCount { get; set; }
        public int LineCount { get; set; }
        public int DefaultFontSize { get; set; } = 26;
        public string DefaultGridType { get; set; } = "GRID_OLY";
    }
}
