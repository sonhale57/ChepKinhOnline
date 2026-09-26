using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using UglyToad.PdfPig;
using UglyToad.PdfPig.Content;
using ChepKinh.Api.DTOs;

namespace ChepKinh.Api.Services
{
    public interface IPdfExtractionService
    {
        Task<ExtractedPdfResultDto> ExtractTextFromPdfAsync(Stream pdfStream, string fileName, string scriptType = "QUOC_NGU");
    }

    public class PdfExtractionService : IPdfExtractionService
    {
        public Task<ExtractedPdfResultDto> ExtractTextFromPdfAsync(Stream pdfStream, string fileName, string scriptType = "QUOC_NGU")
        {
            var result = new ExtractedPdfResultDto
            {
                FileName = fileName,
                Pages = new List<ExtractedPageDto>()
            };

            using var document = PdfDocument.Open(pdfStream);
            result.TotalPages = document.NumberOfPages;
            int totalWords = 0;

            for (int i = 1; i <= document.NumberOfPages; i++)
            {
                var page = document.GetPage(i);
                var text = ExtractPageText(page);

                var wordCount = CountWords(text, scriptType);
                totalWords += wordCount;

                var lineCount = text.Split('\n', StringSplitOptions.RemoveEmptyEntries).Length;
                if (lineCount < 6) lineCount = 8;

                var defaultGridType = scriptType == "HAN" ? "GRID_HAN" : "GRID_OLY";

                result.Pages.Add(new ExtractedPageDto
                {
                    PageNumber = i,
                    ContentText = text,
                    WordCount = wordCount,
                    LineCount = Math.Min(12, lineCount),
                    DefaultFontSize = 26,
                    DefaultGridType = defaultGridType
                });
            }

            result.TotalWords = totalWords;
            return Task.FromResult(result);
        }

        private static string ExtractPageText(Page page)
        {
            var sb = new StringBuilder();
            
            // Lấy các từ theo thứ tự dòng đọc
            var words = page.GetWords()
                .OrderByDescending(w => Math.Round(w.BoundingBox.Bottom / 5.0) * 5.0) // Nhóm theo dòng Y (dung sai 5pt)
                .ThenBy(w => w.BoundingBox.Left)
                .ToList();

            if (words.Count == 0)
            {
                // Fallback nếu không bóc tách được bằng GetWords: lấy raw text
                return page.Text?.Trim() ?? string.Empty;
            }

            double lastBottom = -1;
            foreach (var word in words)
            {
                double currentBottom = Math.Round(word.BoundingBox.Bottom / 8.0) * 8.0;

                if (lastBottom != -1 && Math.Abs(currentBottom - lastBottom) > 4.0)
                {
                    sb.AppendLine();
                }
                else if (sb.Length > 0 && !sb.ToString().EndsWith("\n") && !sb.ToString().EndsWith(" "))
                {
                    sb.Append(' ');
                }

                sb.Append(word.Text);
                lastBottom = currentBottom;
            }

            var text = sb.ToString().Trim();
            
            // Chuẩn hóa khoảng trắng và dòng trống liên tiếp
            text = System.Text.RegularExpressions.Regex.Replace(text, @"[ \t]+", " ");
            text = System.Text.RegularExpressions.Regex.Replace(text, @"\n{3,}", "\n\n");

            return text;
        }

        private static int CountWords(string text, string scriptType)
        {
            if (string.IsNullOrWhiteSpace(text)) return 0;
            if (scriptType == "HAN")
            {
                return text.Count(c => !char.IsWhiteSpace(c) && !char.IsPunctuation(c));
            }
            var words = text.Split(new[] { ' ', '\r', '\n', '\t', ',', '.', ';', ':', '!', '?', '—', '-' }, StringSplitOptions.RemoveEmptyEntries);
            return words.Length;
        }
    }
}
