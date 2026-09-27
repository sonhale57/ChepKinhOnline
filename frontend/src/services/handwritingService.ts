import type { Stroke, ScriptType } from '../types';

export interface HandwritingRecognitionResult {
  text: string;
  candidates: string[];
  confidence?: number;
}

// Bảng ánh xạ loại chữ kinh sang mã ngôn ngữ Handwriting API
function mapScriptTypeToLanguage(scriptType?: ScriptType): string {
  switch (scriptType) {
    case 'HAN':
      return 'zh';
    case 'PALI':
      return 'en';
    case 'QUOC_NGU':
    default:
      return 'vi';
  }
}

/**
 * Chuyển đổi danh sách Stroke của canvas thành định dạng véc-tơ Digital Ink
 * Format: [ [ [x1, x2, ...], [y1, y2, ...], [t1, t2, ...] ], ... ]
 */
export function convertStrokesToInkData(strokes: Stroke[]): number[][][] {
  // Lọc bỏ nét tẩy (ERASER) và các nét rỗng
  const validStrokes = strokes.filter(
    (s) => s.brushType !== 'ERASER' && s.points && s.points.length > 0
  );

  const ink: number[][][] = [];
  const baseTime = validStrokes.length > 0 && validStrokes[0].points[0]?.time
    ? validStrokes[0].points[0].time
    : Date.now();

  for (const stroke of validStrokes) {
    const xList: number[] = [];
    const yList: number[] = [];
    const tList: number[] = [];

    // Tối ưu hóa: lấy mẫu điểm nét để giữ payload cực nhẹ nhưng đường nét chính xác
    const step = stroke.points.length > 60 ? 2 : 1;

    for (let i = 0; i < stroke.points.length; i += step) {
      const pt = stroke.points[i];
      xList.push(Math.round(pt.x));
      yList.push(Math.round(pt.y));
      const relativeTime = pt.time ? Math.max(0, pt.time - baseTime) : i * 15;
      tList.push(relativeTime);
    }

    // Luôn đảm bảo có điểm cuối cùng của nét
    if (step > 1 && stroke.points.length > 1) {
      const lastPt = stroke.points[stroke.points.length - 1];
      xList.push(Math.round(lastPt.x));
      yList.push(Math.round(lastPt.y));
      const lastRelTime = lastPt.time ? Math.max(0, lastPt.time - baseTime) : stroke.points.length * 15;
      tList.push(lastRelTime);
    }

    if (xList.length > 0) {
      ink.push([xList, yList, tList]);
    }
  }

  return ink;
}

/**
 * Nhận diện chữ viết tay từ mảng Stroke theo thời gian thực
 */
export async function recognizeStrokes(
  strokes: Stroke[],
  scriptType: ScriptType = 'QUOC_NGU',
  width: number = 1240,
  height: number = 1754
): Promise<HandwritingRecognitionResult | null> {
  const ink = convertStrokesToInkData(strokes);
  if (ink.length === 0) {
    return { text: '', candidates: [] };
  }

  const lang = mapScriptTypeToLanguage(scriptType);

  const payload = {
    app_version: 0.4,
    api_level: '533.0.0',
    device: 'desktop',
    input_type: '0',
    options: 'enable_pre_space',
    requests: [
      {
        writing_guide: {
          writing_area_width: width,
          writing_area_height: height,
        },
        pre_context: '',
        max_num_results: 5,
        max_completions: 0,
        language: lang,
        ink,
      },
    ],
  };

  try {
    const response = await fetch(
      'https://www.google.com/inputtools/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(`Handwriting API responded with status ${response.status}`);
    }

    const data = await response.json();

    // Data format: ["SUCCESS", [ [ "requestId", ["candidate1", "candidate2", ...] ] ]]
    if (Array.isArray(data) && data[0] === 'SUCCESS' && data[1] && data[1][0]) {
      const resultObj = data[1][0];
      const candidates: string[] = resultObj[1] || [];
      const bestMatch = candidates.length > 0 ? candidates[0] : '';

      return {
        text: bestMatch.trim(),
        candidates,
      };
    }

    return { text: '', candidates: [] };
  } catch (error) {
    console.warn('[HandwritingService] Recognition failed:', error);
    return null;
  }
}
