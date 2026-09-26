import React, { useRef, useEffect, useCallback } from 'react';
import type { Stroke, Point, BrushType, GridType, PaperType } from '../types';

interface A4InkCanvasProps {
  pageNumber: number;
  gridType: GridType;
  paperType: PaperType;
  brushType: BrushType;
  brushColor: string;
  brushSize: number;
  penOnlyMode: boolean;
  strokes: Stroke[];
  onStrokesChange: (strokes: Stroke[]) => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

// Chuẩn độ phân giải nội bộ khổ A4 (tỷ lệ 1 : 1.414 ở 150 DPI)
const A4_INTERNAL_WIDTH = 1240;
const A4_INTERNAL_HEIGHT = 1754;

// Trọng số làm mượt chống rung ngón tay / bút (Exponential Smoothing Alpha)
const SMOOTHING_FACTOR = 0.65;
// Khoảng cách tối thiểu giữa 2 điểm liên tiếp (tránh giật góc và điểm trùng)
const MIN_DISTANCE_SQ = 6.25; // 2.5px squared

// Thuật toán Chaikin Corner Cutting làm mượt các vòng cua (như bụng chữ a, o, g, d)
function chaikinSmooth(points: Point[], iterations: number = 2): Point[] {
  if (points.length <= 2) return points;

  let current = points;
  for (let iter = 0; iter < iterations; iter++) {
    const smoothed: Point[] = [];
    smoothed.push(current[0]);

    for (let i = 0; i < current.length - 1; i++) {
      const p0 = current[i];
      const p1 = current[i + 1];

      const q: Point = {
        x: 0.75 * p0.x + 0.25 * p1.x,
        y: 0.75 * p0.y + 0.25 * p1.y,
        pressure: 0.75 * (p0.pressure || 0.5) + 0.25 * (p1.pressure || 0.5),
        time: p0.time,
      };

      const r: Point = {
        x: 0.25 * p0.x + 0.75 * p1.x,
        y: 0.25 * p0.y + 0.75 * p1.y,
        pressure: 0.25 * (p0.pressure || 0.5) + 0.75 * (p1.pressure || 0.5),
        time: p1.time,
      };

      smoothed.push(q);
      smoothed.push(r);
    }

    smoothed.push(current[current.length - 1]);
    current = smoothed;
  }

  return current;
}

// Lọc bỏ móc câu dư thừa ở đuôi nét khi nhấc bút (Lift-off Hook Filter)
function filterHookTails(points: Point[]): Point[] {
  if (points.length <= 3) return points;

  const len = points.length;
  const pLast = points[len - 1];
  const pPrev = points[len - 2];
  const pPrev2 = points[len - 3];

  const dx1 = pPrev.x - pPrev2.x;
  const dy1 = pPrev.y - pPrev2.y;
  const dx2 = pLast.x - pPrev.x;
  const dy2 = pLast.y - pPrev.y;

  const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
  const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

  // Nếu điểm cuối quá ngắn hoặc bẻ góc đột ngột > 100 độ so với hướng viết trước đó -> Loại bỏ điểm nhấc bút giật tay
  if (len1 > 0 && len2 > 0) {
    const dot = (dx1 * dx2 + dy1 * dy2) / (len1 * len2);
    if (dot < -0.2 && len2 < 12) {
      return points.slice(0, len - 1);
    }
  }

  return points;
}

export const A4InkCanvas: React.FC<A4InkCanvasProps> = ({
  pageNumber,
  gridType,
  paperType,
  brushType,
  brushColor,
  brushSize,
  penOnlyMode,
  strokes,
  onStrokesChange,
  onUndo,
  onRedo,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef<boolean>(false);
  const rawPointsRef = useRef<Point[]>([]);
  const smoothedPointsRef = useRef<Point[]>([]);
  const lastMidPointRef = useRef<{ x: number; y: number } | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const touchStartCountRef = useRef<number>(0);

  // Lắng nghe cử chỉ 2 ngón (Undo) và 3 ngón (Redo) chuẩn iPad
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartTimeRef.current = Date.now();
      touchStartCountRef.current = e.touches.length;

      // Nếu là cử chỉ 2 hoặc 3 ngón tay, hủy vẽ ngay lập tức
      if (e.touches.length >= 2) {
        isDrawingRef.current = false;
        rawPointsRef.current = [];
        smoothedPointsRef.current = [];
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const duration = Date.now() - touchStartTimeRef.current;
      const fingerCount = touchStartCountRef.current;

      // Chạm nhanh trong vòng 350ms
      if (duration < 350) {
        if (fingerCount === 2) {
          onUndo?.();
          e.preventDefault();
        } else if (fingerCount === 3) {
          onRedo?.();
          e.preventDefault();
        }
      }
      touchStartCountRef.current = 0;
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onUndo, onRedo]);

  // Tính độ dày nét vẽ mượt mà dựa trên loại bút và lực nhấn
  const getStrokeWidth = useCallback((baseSize: number, bType: BrushType, pressure: number) => {
    const p = Math.max(0.1, Math.min(1.0, pressure));
    switch (bType) {
      case 'CALLIGRAPHY':
        // Nét thanh đậm thư pháp rõ rệt, ngòi nở khi nhấn mạnh
        return baseSize * (0.2 + p * 1.5);
      case 'PENCIL':
        // Nét chì thanh mảnh, độ biến thiên nhẹ
        return baseSize * (0.6 + p * 0.5);
      case 'PEN':
      default:
        // Nét mực bút kim / bút bi đều và tròn trịa
        return baseSize * (0.75 + p * 0.35);
    }
  }, []);

  // Vẽ 1 nét trọn vẹn bằng thuật toán Continuous Midpoint Quadratic Spline
  const drawCompleteStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    const pts = stroke.points;
    if (!pts || pts.length === 0) return;

    ctx.save();
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (pts.length === 1) {
      const w = getStrokeWidth(stroke.size, stroke.brushType, pts[0].pressure || 0.5);
      ctx.beginPath();
      ctx.arc(pts[0].x, pts[0].y, w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    if (pts.length === 2) {
      const w = getStrokeWidth(stroke.size, stroke.brushType, pts[1].pressure || 0.5);
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.lineTo(pts[1].x, pts[1].y);
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Vẽ chuỗi đường cong liên tục từ midPoint(i-1) -> p(i) -> midPoint(i)
    let prevMidX = (pts[0].x + pts[1].x) / 2;
    let prevMidY = (pts[0].y + pts[1].y) / 2;

    // Đoạn đầu tiên từ điểm 0 đến mid 0-1
    const w0 = getStrokeWidth(stroke.size, stroke.brushType, pts[0].pressure || 0.5);
    ctx.lineWidth = w0;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(prevMidX, prevMidY);
    ctx.stroke();

    const totalPts = pts.length;
    const taperCount = Math.min(8, Math.floor(totalPts * 0.2)); // 20% cuối nét vuốt nhọn tự nhiên

    for (let i = 1; i < totalPts - 1; i++) {
      const pCurrent = pts[i];
      const pNext = pts[i + 1];
      const midX = (pCurrent.x + pNext.x) / 2;
      const midY = (pCurrent.y + pNext.y) / 2;

      let currentWidth = getStrokeWidth(stroke.size, stroke.brushType, pCurrent.pressure || 0.5);

      // Tapering: Vuốt nhọn mềm mại ở đuôi nét chữ
      if (i >= totalPts - 1 - taperCount && taperCount > 0) {
        const factor = Math.max(0.3, (totalPts - 1 - i) / taperCount);
        currentWidth *= factor;
      }

      ctx.lineWidth = currentWidth;
      ctx.beginPath();
      ctx.moveTo(prevMidX, prevMidY);
      ctx.quadraticCurveTo(pCurrent.x, pCurrent.y, midX, midY);
      ctx.stroke();

      prevMidX = midX;
      prevMidY = midY;
    }

    // Đoạn cuối cùng nối từ mid cuối tới điểm chót (vuốt nhọn ngòi bút)
    const lastP = pts[totalPts - 1];
    const wLast = getStrokeWidth(stroke.size, stroke.brushType, lastP.pressure || 0.5) * 0.3;
    ctx.lineWidth = wLast;
    ctx.beginPath();
    ctx.moveTo(prevMidX, prevMidY);
    ctx.lineTo(lastP.x, lastP.y);
    ctx.stroke();

    ctx.restore();
  }, [getStrokeWidth]);

  // Render lại toàn bộ canvas khi undo/redo hoặc chuyển trang
  const redrawCanvas = useCallback((strokeList: Stroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, A4_INTERNAL_WIDTH, A4_INTERNAL_HEIGHT);

    for (const stroke of strokeList) {
      drawCompleteStroke(ctx, stroke);
    }
  }, [drawCompleteStroke]);

  // Vẽ lại khi danh sách strokes thay đổi
  useEffect(() => {
    redrawCanvas(strokes);
  }, [strokes, redrawCanvas]);

  // Lấy toạ độ chính xác 100% không bị lệch ngòi bút (Zero-Parallax Mapping)
  const getCanvasCoordinates = (e: React.PointerEvent<HTMLCanvasElement> | PointerEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5, time: Date.now() };

    const rect = canvas.getBoundingClientRect();
    const scaleX = A4_INTERNAL_WIDTH / rect.width;
    const scaleY = A4_INTERNAL_HEIGHT / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const pressure = e.pressure !== undefined && e.pressure > 0 ? e.pressure : 0.5;

    return { x, y, pressure, time: Date.now() };
  };

  // Áp dụng bộ lọc khử rung (Exponential Moving Average Filter)
  const smoothNewPoint = (rawPoint: Point, prevSmoothed: Point | null): Point => {
    if (!prevSmoothed) return { ...rawPoint };

    // Khử vi rung tay nhưng giữ phản hồi thời gian thực tức thì
    const smoothedX = prevSmoothed.x + SMOOTHING_FACTOR * (rawPoint.x - prevSmoothed.x);
    const smoothedY = prevSmoothed.y + SMOOTHING_FACTOR * (rawPoint.y - prevSmoothed.y);
    const smoothedPressure = prevSmoothed.pressure + SMOOTHING_FACTOR * (rawPoint.pressure - prevSmoothed.pressure);

    return {
      x: smoothedX,
      y: smoothedY,
      pressure: smoothedPressure,
      time: rawPoint.time || Date.now(),
    };
  };

  // Pointer Down (Bắt đầu hạ bút)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Chống tì tay (Palm Rejection): Nếu bật penOnlyMode, chỉ nhận sự kiện từ ngòi bút 'pen'
    if (penOnlyMode && e.pointerType === 'touch') {
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;

    const rawPt = getCanvasCoordinates(e);
    rawPointsRef.current = [rawPt];
    smoothedPointsRef.current = [rawPt];
    lastMidPointRef.current = null;

    // Vẽ chấm tròn ngòi bút ban đầu
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.fillStyle = brushColor;
        const initialWidth = getStrokeWidth(brushSize, brushType, rawPt.pressure);
        ctx.beginPath();
        ctx.arc(rawPt.x, rawPt.y, initialWidth / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  };

  // Xử lý vẽ nối tiếp theo thời gian thực (Incremental Bézier Drawing)
  const processNewPoint = (pt: Point) => {
    const rawPts = rawPointsRef.current;
    const smoothedPts = smoothedPointsRef.current;
    if (rawPts.length === 0) return;

    const lastRaw = rawPts[rawPts.length - 1];
    const dx = pt.x - lastRaw.x;
    const dy = pt.y - lastRaw.y;
    if (dx * dx + dy * dy < MIN_DISTANCE_SQ) {
      return; // Bỏ qua vi điểm trùng lặp
    }

    rawPts.push(pt);
    const prevSmoothed = smoothedPts[smoothedPts.length - 1];
    const smoothed = smoothNewPoint(pt, prevSmoothed);
    smoothedPts.push(smoothed);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.strokeStyle = brushColor;
    ctx.fillStyle = brushColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const sLen = smoothedPts.length;
    if (sLen === 2) {
      // Nối từ điểm 0 tới trung điểm 0-1
      const p0 = smoothedPts[0];
      const p1 = smoothedPts[1];
      const midX = (p0.x + p1.x) / 2;
      const midY = (p0.y + p1.y) / 2;

      ctx.lineWidth = getStrokeWidth(brushSize, brushType, p0.pressure);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(midX, midY);
      ctx.stroke();

      lastMidPointRef.current = { x: midX, y: midY };
    } else if (sLen > 2) {
      // Nối đường cong liên tục từ lastMidPoint -> p(len-2) -> midPoint(len-2, len-1)
      const pControl = smoothedPts[sLen - 2];
      const pNext = smoothedPts[sLen - 1];
      const nextMidX = (pControl.x + pNext.x) / 2;
      const nextMidY = (pControl.y + pNext.y) / 2;
      const start = lastMidPointRef.current || {
        x: (smoothedPts[sLen - 3].x + pControl.x) / 2,
        y: (smoothedPts[sLen - 3].y + pControl.y) / 2,
      };

      ctx.lineWidth = getStrokeWidth(brushSize, brushType, pControl.pressure);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.quadraticCurveTo(pControl.x, pControl.y, nextMidX, nextMidY);
      ctx.stroke();

      lastMidPointRef.current = { x: nextMidX, y: nextMidY };
    }

    ctx.restore();
  };

  // Pointer Move (Di chuyển ngòi bút)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    if (penOnlyMode && e.pointerType === 'touch') return;

    // Tận dụng toàn bộ các điểm cảm ứng phần cứng 120-240Hz (Coalesced Events)
    const nativeEvent = e.nativeEvent as PointerEvent;
    if (nativeEvent.getCoalescedEvents && typeof nativeEvent.getCoalescedEvents === 'function') {
      const coalesced = nativeEvent.getCoalescedEvents();
      if (coalesced && coalesced.length > 0) {
        for (let i = 0; i < coalesced.length; i++) {
          const pt = getCanvasCoordinates(coalesced[i]);
          processNewPoint(pt);
        }
        return;
      }
    }

    // Fallback nếu trình duyệt không hỗ trợ Coalesced Events
    const pt = getCanvasCoordinates(e);
    processNewPoint(pt);
  };

  // Pointer Up (Nhấc bút: Lọc móc câu dư thừa & làm mượt hoàn hảo qua Chaikin Spline)
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Bỏ qua nếu pointer capture đã giải phóng
    }

    let finalPoints = smoothedPointsRef.current;
    if (finalPoints.length > 0) {
      // 1. Loại bỏ móc câu giật tay ở đuôi nét
      finalPoints = filterHookTails(finalPoints);

      // 2. Làm mượt toàn diện các góc cua (như chữ a, o, g) qua Chaikin Smoothing Pass
      if (finalPoints.length > 2) {
        finalPoints = chaikinSmooth(finalPoints, 2);
      }

      const newStroke: Stroke = {
        id: `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        points: finalPoints,
        color: brushColor,
        size: brushSize,
        brushType,
      };

      const updated = [...strokes, newStroke];
      onStrokesChange(updated);
    }

    rawPointsRef.current = [];
    smoothedPointsRef.current = [];
    lastMidPointRef.current = null;
  };

  // Kiểu nền giấy
  const getPaperBgClass = () => {
    switch (paperType) {
      case 'DO':
        return 'bg-[#FBF8F1]';
      case 'OLD_GOLD':
        return 'bg-[#F4EBD9]';
      case 'WHITE':
      default:
        return 'bg-white';
    }
  };

  // Kiểu lưới ô
  const getGridPatternClass = () => {
    switch (gridType) {
      case 'GRID_OLY':
        return 'paper-pattern-oly';
      case 'GRID_HAN':
        return 'paper-pattern-han';
      case 'LINE':
        return 'paper-pattern-line';
      case 'BLANK':
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto">
      {/* Khung Khổ Giấy A4 Chuẩn (Tỷ lệ 1 : 1.414) - Mặt Giấy Sạch */}
      <div
        ref={containerRef}
        className={`relative w-full aspect-[1/1.414] rounded-lg shadow-paper border border-amber-900/15 overflow-hidden ${getPaperBgClass()} ${getGridPatternClass()}`}
        style={{
          touchAction: 'none', // Chặn cuộn màn hình khi đang vẽ trên Canvas
        }}
      >
        {/* Khung viền & Tiêu đề trang giấy A4 */}
        <div className="absolute inset-0 p-5 sm:p-8 pointer-events-none select-none flex flex-col justify-between">
          {/* Header trang giấy */}
          <div className="flex justify-between items-center text-[10px] sm:text-xs text-amber-900/40 border-b border-amber-900/10 pb-1.5 font-medium">
            <span>CHÉP KINH ONLINE</span>
            <span className="font-bold tracking-widest uppercase">TRANG {pageNumber}</span>
          </div>
        </div>

        {/* Canvas Thu Nhận Nét Chữ Thật (Digital Ink Layer) */}
        <canvas
          ref={canvasRef}
          width={A4_INTERNAL_WIDTH}
          height={A4_INTERNAL_HEIGHT}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>
    </div>
  );
};
