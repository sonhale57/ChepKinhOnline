import { jsPDF } from 'jspdf';
import { inkStorage } from './inkStorage';
import { apiClient } from '../api/client';
import type { Stroke, BrushType, GridType, PaperType } from '../types';

export interface ExportPdfOptions {
  sutraId: number;
  attemptId: number;
  userId: number;
  sutraTitle: string;
  scriptType: string;
  totalNotebookPages: number;
  userName: string;
  includeCover?: boolean;
  includeCertificate?: boolean;
  paperType?: PaperType;
  gridType?: GridType;
  onProgress?: (current: number, total: number, message: string) => void;
}

const A4_INTERNAL_WIDTH = 1240;
const A4_INTERNAL_HEIGHT = 1754;

function getStrokeWidth(baseSize: number, bType: BrushType, pressure: number): number {
  const p = Math.max(0.1, Math.min(1.0, pressure));
  switch (bType) {
    case 'CALLIGRAPHY':
      return baseSize * (0.2 + p * 1.5);
    case 'PENCIL':
      return baseSize * (0.6 + p * 0.5);
    case 'ERASER':
      return baseSize * 2.8;
    case 'PEN':
    default:
      return baseSize * (0.75 + p * 0.35);
  }
}

function drawCompleteStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  const pts = stroke.points;
  if (!pts || pts.length === 0) return;

  ctx.save();
  if (stroke.brushType === 'ERASER') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.fillStyle = 'rgba(0,0,0,1)';
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.color;
  }
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

  let prevMidX = (pts[0].x + pts[1].x) / 2;
  let prevMidY = (pts[0].y + pts[1].y) / 2;

  const w0 = getStrokeWidth(stroke.size, stroke.brushType, pts[0].pressure || 0.5);
  ctx.lineWidth = w0;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  ctx.lineTo(prevMidX, prevMidY);
  ctx.stroke();

  const totalPts = pts.length;
  const taperCount = Math.min(8, Math.floor(totalPts * 0.2));

  for (let i = 1; i < totalPts - 1; i++) {
    const pCurrent = pts[i];
    const pNext = pts[i + 1];
    const midX = (pCurrent.x + pNext.x) / 2;
    const midY = (pCurrent.y + pNext.y) / 2;

    let currentWidth = getStrokeWidth(stroke.size, stroke.brushType, pCurrent.pressure || 0.5);
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

  const lastP = pts[totalPts - 1];
  const wLast = getStrokeWidth(stroke.size, stroke.brushType, lastP.pressure || 0.5) * 0.3;
  ctx.lineWidth = wLast;
  ctx.beginPath();
  ctx.moveTo(prevMidX, prevMidY);
  ctx.lineTo(lastP.x, lastP.y);
  ctx.stroke();

  ctx.restore();
}

function drawBackgroundAndGrid(ctx: CanvasRenderingContext2D, pageNumber: number, totalPages: number) {
  // Nền giấy màu be ngà ấm áp truyền thống
  ctx.fillStyle = '#FBF8F1';
  ctx.fillRect(0, 0, A4_INTERNAL_WIDTH, A4_INTERNAL_HEIGHT);

  // Viền khung trang nhã A4
  ctx.strokeStyle = 'rgba(120, 53, 15, 0.25)';
  ctx.lineWidth = 3;
  ctx.strokeRect(50, 50, A4_INTERNAL_WIDTH - 100, A4_INTERNAL_HEIGHT - 100);

  ctx.strokeStyle = 'rgba(120, 53, 15, 0.12)';
  ctx.lineWidth = 1;
  ctx.strokeRect(58, 58, A4_INTERNAL_WIDTH - 116, A4_INTERNAL_HEIGHT - 116);

  // Lưới ô ly mờ chuẩn
  ctx.strokeStyle = 'rgba(180, 130, 80, 0.08)';
  ctx.lineWidth = 1;
  const cellSize = 56;
  for (let x = 70; x <= A4_INTERNAL_WIDTH - 70; x += cellSize) {
    ctx.beginPath();
    ctx.moveTo(x, 100);
    ctx.lineTo(x, A4_INTERNAL_HEIGHT - 100);
    ctx.stroke();
  }
  for (let y = 100; y <= A4_INTERNAL_HEIGHT - 100; y += cellSize) {
    ctx.beginPath();
    ctx.moveTo(70, y);
    ctx.lineTo(A4_INTERNAL_WIDTH - 70, y);
    ctx.stroke();
  }

  // Header & Footer
  ctx.fillStyle = 'rgba(120, 53, 15, 0.55)';
  ctx.font = 'bold 20px "Nunito Sans", sans-serif';
  ctx.fillText('CHÉP KINH ONLINE', 70, 82);

  ctx.textAlign = 'right';
  ctx.fillText(`TRANG ${pageNumber} / ${totalPages}`, A4_INTERNAL_WIDTH - 70, 82);

  ctx.textAlign = 'center';
  ctx.font = 'italic 16px "Nunito Sans", sans-serif';
  ctx.fillStyle = 'rgba(120, 53, 15, 0.4)';
  ctx.fillText('Mỗi nét chữ là một hạt mầm bình an • Hồi hướng công đức thập phương', A4_INTERNAL_WIDTH / 2, A4_INTERNAL_HEIGHT - 70);
  ctx.textAlign = 'left';
}

function renderCoverPage(sutraTitle: string, userName: string, scriptType: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = A4_INTERNAL_WIDTH;
  canvas.height = A4_INTERNAL_HEIGHT;
  const ctx = canvas.getContext('2d')!;

  // Nền giấy cổ
  ctx.fillStyle = '#F4EBD9';
  ctx.fillRect(0, 0, A4_INTERNAL_WIDTH, A4_INTERNAL_HEIGHT);

  // Khung viền đôi hoàng gia
  ctx.strokeStyle = '#78350F';
  ctx.lineWidth = 6;
  ctx.strokeRect(60, 60, A4_INTERNAL_WIDTH - 120, A4_INTERNAL_HEIGHT - 120);

  ctx.strokeStyle = '#B45309';
  ctx.lineWidth = 2;
  ctx.strokeRect(74, 74, A4_INTERNAL_WIDTH - 148, A4_INTERNAL_HEIGHT - 148);

  ctx.textAlign = 'center';

  // Biểu tượng Hoa Sen / Búp Sen
  ctx.font = '64px sans-serif';
  ctx.fillText('🪷', A4_INTERNAL_WIDTH / 2, 380);

  ctx.fillStyle = '#78350F';
  ctx.font = 'bold 28px "Nunito Sans", sans-serif';
  ctx.fillText('SỔ TAY CHÉP KINH A4', A4_INTERNAL_WIDTH / 2, 470);

  // Tên Bộ Kinh
  ctx.fillStyle = '#451A03';
  ctx.font = 'bold 48px "Nunito Sans", sans-serif';
  ctx.fillText(sutraTitle.toUpperCase(), A4_INTERNAL_WIDTH / 2, 600);

  // Thể loại chữ
  const scriptLabel = scriptType === 'QUOC_NGU' ? 'Tiếng Việt' : scriptType === 'HAN' ? 'Chữ Hán' : 'Phạn / Pali';
  ctx.fillStyle = '#92400E';
  ctx.font = 'bold 22px "Nunito Sans", sans-serif';
  ctx.fillText(`[ Văn bản: ${scriptLabel} ]`, A4_INTERNAL_WIDTH / 2, 660);

  // Đường phân cách
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(A4_INTERNAL_WIDTH / 2 - 180, 720);
  ctx.lineTo(A4_INTERNAL_WIDTH / 2 + 180, 720);
  ctx.stroke();

  // Thông tin Phật Tử
  ctx.fillStyle = '#78350F';
  ctx.font = '24px "Nunito Sans", sans-serif';
  ctx.fillText('Phật Tử Tinh Tấn Chép Tay:', A4_INTERNAL_WIDTH / 2, 860);

  ctx.fillStyle = '#451A03';
  ctx.font = 'bold 36px "Nunito Sans", sans-serif';
  ctx.fillText(userName, A4_INTERNAL_WIDTH / 2, 920);

  ctx.fillStyle = '#78350F';
  ctx.font = '20px "Nunito Sans", sans-serif';
  ctx.fillText(`Ngày tạo sổ: ${new Date().toLocaleDateString('vi-VN')}`, A4_INTERNAL_WIDTH / 2, 970);

  // Lời hồi hướng trang trọng
  ctx.fillStyle = '#92400E';
  ctx.font = 'italic 22px "Nunito Sans", sans-serif';
  ctx.fillText('“Nguyện đem công đức này', A4_INTERNAL_WIDTH / 2, 1260);
  ctx.fillText('Trang nghiêm Phật Tịnh Độ', A4_INTERNAL_WIDTH / 2, 1300);
  ctx.fillText('Trên đền bốn ơn nặng', A4_INTERNAL_WIDTH / 2, 1340);
  ctx.fillText('Dưới cứu khổ ba đường”', A4_INTERNAL_WIDTH / 2, 1380);

  return canvas.toDataURL('image/jpeg', 0.92);
}

export async function exportSutraNotebookPdf(options: ExportPdfOptions): Promise<void> {
  const {
    attemptId,
    userId,
    sutraTitle,
    scriptType,
    totalNotebookPages,
    userName,
    includeCover = true,
    onProgress
  } = options;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const totalSteps = totalNotebookPages + (includeCover ? 1 : 0);
  let currentStep = 0;

  // 1. Trang Bìa (Cover)
  if (includeCover) {
    currentStep++;
    onProgress?.(currentStep, totalSteps, 'Đang chuẩn bị trang bìa sổ tay...');
    const coverImgData = renderCoverPage(sutraTitle, userName, scriptType);
    pdf.addImage(coverImgData, 'JPEG', 0, 0, 210, 297);
  }

  // 2. Lần lượt render từng trang A4 với nét chữ thật
  for (let pageIdx = 0; pageIdx < totalNotebookPages; pageIdx++) {
    currentStep++;
    const pageNumber = pageIdx + 1;
    onProgress?.(currentStep, totalSteps, `Đang xử lý trang ${pageNumber} / ${totalNotebookPages}...`);

    // Lấy nét vẽ từ IndexedDB trước
    const pageId = 1000 + pageIdx;
    let strokes: Stroke[] = [];
    let recognizedText = '';

    const localData = await inkStorage.getPageStrokes(attemptId, pageId, userId);
    if (localData && localData.strokes) {
      strokes = localData.strokes;
    } else {
      // Fallback lên server nếu chưa có ở IndexedDB
      try {
        const res = await apiClient.get(`/progress/strokes/${attemptId}/${pageId}`);
        if (res.data?.success && res.data.data?.strokesDataJson) {
          strokes = JSON.parse(res.data.data.strokesDataJson);
          recognizedText = res.data.data.recognizedText || '';
        }
      } catch {
        strokes = [];
      }
    }

    // Tạo canvas offscreen cho trang
    const canvas = document.createElement('canvas');
    canvas.width = A4_INTERNAL_WIDTH;
    canvas.height = A4_INTERNAL_HEIGHT;
    const ctx = canvas.getContext('2d')!;

    // Vẽ nền, viền và lưới
    drawBackgroundAndGrid(ctx, pageNumber, totalNotebookPages);

    // Vẽ văn bản chữ in đẹp nếu có
    if (recognizedText) {
      ctx.save();
      ctx.fillStyle = '#1A1817';
      ctx.textBaseline = 'middle';
      const startX = 80;
      const endX = A4_INTERNAL_WIDTH - 80;
      const maxLineWidth = endX - startX;
      let curY = 135;
      const lineHeight = scriptType === 'HAN' ? 65 : 56;

      if (scriptType === 'HAN') {
        ctx.font = '500 36px "Noto Serif SC", "Songti SC", "SimSun", serif';
        const chars = Array.from(recognizedText.replace(/\r/g, ''));
        let curX = startX;
        for (const ch of chars) {
          if (ch === '\n') {
            curX = startX;
            curY += lineHeight;
            continue;
          }
          const charWidth = ctx.measureText(ch).width;
          if (curX + charWidth > endX) {
            curX = startX;
            curY += lineHeight;
          }
          if (curY > A4_INTERNAL_HEIGHT - 100) break;
          ctx.fillText(ch, curX, curY);
          curX += charWidth + 10;
        }
      } else {
        ctx.font = '500 30px "Nunito Sans", "Noto Serif", Georgia, serif';
        const paragraphs = recognizedText.split('\n');
        for (const paragraph of paragraphs) {
          const words = paragraph.split(' ').filter(Boolean);
          let currentLine = '';
          for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const testWidth = ctx.measureText(testLine).width;
            if (testWidth > maxLineWidth && currentLine) {
              if (curY <= A4_INTERNAL_HEIGHT - 100) {
                ctx.fillText(currentLine, startX, curY);
              }
              currentLine = word;
              curY += lineHeight;
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine && curY <= A4_INTERNAL_HEIGHT - 100) {
            ctx.fillText(currentLine, startX, curY);
            curY += lineHeight;
          }
        }
      }
      ctx.restore();
    }

    // Vẽ các nét chữ còn lại
    for (const stroke of strokes) {
      drawCompleteStroke(ctx, stroke);
    }

    const pageImgData = canvas.toDataURL('image/jpeg', 0.92);

    if (includeCover || pageIdx > 0) {
      pdf.addPage('a4', 'portrait');
    }
    pdf.addImage(pageImgData, 'JPEG', 0, 0, 210, 297);
  }

  onProgress?.(totalSteps, totalSteps, 'Đang hoàn tất tệp PDF...');

  // Lưu và tải tệp về máy
  const cleanTitle = sutraTitle.replace(/[^\p{L}\p{N}_]+/gu, '_');
  pdf.save(`So_Tay_Chep_Kinh_${cleanTitle}_A4.pdf`);
}
