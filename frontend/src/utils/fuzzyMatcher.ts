/**
 * Tiện ích Chuẩn hóa và So Khớp Mờ Văn Bản (Fuzzy Text Matcher)
 * Dành cho đối chiếu chữ viết tay người dùng với nội dung đoạn kinh nhắc chữ
 */

/**
 * Chuẩn hóa chuỗi: chuyển chữ thường, loại bỏ dấu câu đặc biệt, gom khoảng trắng
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'“”…]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tách chuỗi thành danh sách các từ/ký tự có nghĩa
 */
export function extractWords(text: string, isHanScript: boolean = false): string[] {
  const norm = normalizeText(text);
  if (!norm) return [];

  // Đối với chữ Hán, mỗi ký tự là một từ đơn
  if (isHanScript) {
    return Array.from(norm.replace(/\s+/g, ''));
  }

  // Tiếng Việt / Pali: tách theo khoảng trắng
  return norm.split(' ').filter((w) => w.length > 0);
}

/**
 * Tính khoảng cách Levenshtein giữa 2 chuỗi
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

export interface MatchResult {
  similarityPercent: number;
  isMatched: boolean;
  matchedWords: Set<string>;
  totalTargetWords: number;
  matchedWordsCount: number;
}

/**
 * So khớp văn bản nhận diện từ nét viết với đoạn văn bản kinh mục tiêu
 * @param recognizedText Văn bản AI nhận diện từ nét viết tay
 * @param targetLines Danh sách các dòng trong đoạn kinh đang nhắc
 * @param isHanScript Cờ xác định có phải chữ Hán không
 */
export function matchHandwritingWithTarget(
  recognizedText: string,
  targetLines: string[],
  isHanScript: boolean = false
): MatchResult {
  const targetCombined = targetLines.join(' ');
  const targetWords = extractWords(targetCombined, isHanScript);
  const recWords = extractWords(recognizedText, isHanScript);

  if (targetWords.length === 0 || recWords.length === 0) {
    return {
      similarityPercent: 0,
      isMatched: false,
      matchedWords: new Set<string>(),
      totalTargetWords: targetWords.length,
      matchedWordsCount: 0,
    };
  }

  const matchedWords = new Set<string>();
  let matchedCount = 0;

  // 1. So khớp từ vựng (Word Token & Substring Matching)
  const recWordsSet = new Set(recWords);

  for (const tWord of targetWords) {
    if (recWordsSet.has(tWord)) {
      matchedWords.add(tWord);
      matchedCount++;
    } else {
      // Fuzzy check với các từ có độ dài >= 3 cho phép sai lệch 1 ký tự dấu/gõ nhầm
      let foundFuzzy = false;
      if (tWord.length >= 3 && !isHanScript) {
        for (const rWord of recWords) {
          if (Math.abs(tWord.length - rWord.length) <= 1) {
            const dist = levenshteinDistance(tWord, rWord);
            if (dist <= 1) {
              matchedWords.add(tWord);
              matchedCount++;
              foundFuzzy = true;
              break;
            }
          }
        }
      }
      if (foundFuzzy) continue;
    }
  }

  // 2. Tính % trùng khớp dựa trên số lượng từ mục tiêu đã được viết
  const wordMatchRatio = matchedCount / targetWords.length;

  // 3. Tính độ tương đồng toàn chuỗi (String Similarity)
  const normTarget = normalizeText(targetCombined);
  const normRec = normalizeText(recognizedText);
  const maxLen = Math.max(normTarget.length, normRec.length);
  const stringDist = levenshteinDistance(normTarget, normRec);
  const stringSimilarity = maxLen > 0 ? Math.max(0, 1 - stringDist / maxLen) : 0;

  // Tổng hợp điểm: 70% trọng số từ khớp + 30% trọng số chuỗi
  const combinedPercent = Math.min(
    100,
    Math.round((wordMatchRatio * 0.75 + stringSimilarity * 0.25) * 100)
  );

  // Ngưỡng tự động đánh dấu đã khớp là >= 70% số từ của đoạn 5 dòng
  const isMatched = wordMatchRatio >= 0.70 || combinedPercent >= 70;

  return {
    similarityPercent: combinedPercent,
    isMatched,
    matchedWords,
    totalTargetWords: targetWords.length,
    matchedWordsCount: matchedCount,
  };
}
