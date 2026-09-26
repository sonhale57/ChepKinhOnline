import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Check,
  Plus
} from 'lucide-react';
import type { ScriptType } from '../types';

interface TextPromptCardProps {
  contentText: string;
  scriptType?: ScriptType;
  initialCompletedChunks?: Record<number, boolean>;
  initialChunkIndex?: number;
  onChunkChange?: (chunkIndex: number, totalChunks: number) => void;
  onProgressUpdate?: (matchedChunks: number, totalChunks: number, percent: number) => void;
  onCompletedChunksChange?: (completed: Record<number, boolean>, currentIndex: number) => void;
  pageNumber: number;
  totalPages?: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onAddNewPage?: () => void;
}

const LINES_PER_CHUNK = 5;

export const TextPromptCard: React.FC<TextPromptCardProps> = ({
  contentText,
  scriptType = 'QUOC_NGU',
  initialCompletedChunks,
  initialChunkIndex = 0,
  onChunkChange,
  onProgressUpdate,
  onCompletedChunksChange,
  pageNumber,
  totalPages: _totalPages,
  onPrevPage,
  onNextPage,
  onAddNewPage,
}) => {
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(initialChunkIndex);
  const [completedChunks, setCompletedChunks] = useState<Record<number, boolean>>(initialCompletedChunks || {});

  // Đồng bộ khi initial props từ DB/IndexedDB nạp xong
  useEffect(() => {
    if (initialCompletedChunks && Object.keys(initialCompletedChunks).length > 0) {
      setCompletedChunks(initialCompletedChunks);
    }
  }, [initialCompletedChunks]);

  useEffect(() => {
    if (initialChunkIndex !== undefined && initialChunkIndex >= 0) {
      setCurrentChunkIndex(initialChunkIndex);
    }
  }, [initialChunkIndex]);

  // Tách nội dung thành các dòng và chia thành từng nhóm 5 dòng liên tục
  const lines = React.useMemo(() => {
    if (!contentText) return [];
    const rawLines = contentText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const formattedLines: string[] = [];
    for (const line of rawLines) {
      if (line.length > 80 && scriptType !== 'HAN') {
        const words = line.split(' ');
        let temp = '';
        for (const w of words) {
          if ((temp + ' ' + w).length > 70) {
            formattedLines.push(temp.trim());
            temp = w;
          } else {
            temp = temp ? `${temp} ${w}` : w;
          }
        }
        if (temp.trim()) formattedLines.push(temp.trim());
      } else {
        formattedLines.push(line);
      }
    }
    return formattedLines.length > 0 ? formattedLines : ['(Trang trống)'];
  }, [contentText, scriptType]);

  // Gom thành các chunks 5 dòng
  const chunks = React.useMemo(() => {
    const res: string[][] = [];
    for (let i = 0; i < lines.length; i += LINES_PER_CHUNK) {
      res.push(lines.slice(i, i + LINES_PER_CHUNK));
    }
    return res.length > 0 ? res : [['(Trang trống)']];
  }, [lines]);

  useEffect(() => {
    onChunkChange?.(currentChunkIndex, chunks.length);
  }, [currentChunkIndex, chunks.length, onChunkChange]);

  // Cập nhật tiến độ % khớp ra ngoài component cha
  useEffect(() => {
    const matchedCount = Object.values(completedChunks).filter(Boolean).length;
    const total = chunks.length || 1;
    const pct = Math.min(100, Math.round((matchedCount / total) * 100));
    onProgressUpdate?.(matchedCount, total, pct);
  }, [completedChunks, chunks.length, onProgressUpdate]);

  const currentLines = chunks[currentChunkIndex] || [];
  const startLineNumber = currentChunkIndex * LINES_PER_CHUNK + 1;
  const endLineNumber = Math.min((currentChunkIndex + 1) * LINES_PER_CHUNK, lines.length);
  const isChunkDone = !!completedChunks[currentChunkIndex];

  // Chuyển đoạn 5 dòng trước
  const handlePrevChunk = () => {
    if (currentChunkIndex > 0) {
      const nextIdx = currentChunkIndex - 1;
      setCurrentChunkIndex(nextIdx);
      onCompletedChunksChange?.(completedChunks, nextIdx);
    }
  };

  // Chuyển đoạn 5 dòng tiếp theo
  const handleNextChunk = () => {
    if (currentChunkIndex < chunks.length - 1) {
      const nextIdx = currentChunkIndex + 1;
      setCurrentChunkIndex(nextIdx);
      onCompletedChunksChange?.(completedChunks, nextIdx);
    }
  };

  // Toggle đánh dấu (Khớp đoạn) - Tách riêng độc lập
  const handleToggleMatch = () => {
    const updated = {
      ...completedChunks,
      [currentChunkIndex]: !completedChunks[currentChunkIndex],
    };
    setCompletedChunks(updated);
    onCompletedChunksChange?.(updated, currentChunkIndex);
  };

  return (
    <div className="w-full mx-auto mb-3">
      <div className="bg-amber-950/90 backdrop-blur-md text-amber-50 rounded-lg p-3 sm:p-4 border border-amber-800/40 shadow-paper transition-all">
        {/* Header Bảng Nhắc Chữ */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-amber-800/50 mb-2.5 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="p-1 bg-amber-800/60 rounded-md text-amber-300">
              <BookOpen className="w-3.5 h-3.5" />
            </span>
            <div>
              <span className="font-bold text-amber-200 tracking-wide">
                BẢNG NHẮC CHỮ KINH (5 DÒNG)
              </span>
              <span className="text-amber-400/70 ml-2 text-[11px]">
                Dòng {startLineNumber} → {endLineNumber}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isChunkDone && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-700/60 px-1.5 py-0.5 rounded">
                <CheckCircle2 className="w-3 h-3" />
                <span>Đã Khớp Đoạn</span>
              </span>
            )}
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-900/80 text-amber-200 border border-amber-800">
              Đoạn {currentChunkIndex + 1}/{chunks.length}
            </span>
          </div>
        </div>

        {/* Nội Dung 5 Dòng Text Nhắc */}
        <div className="min-h-[120px] sm:min-h-[140px] flex flex-col justify-center bg-black/25 rounded-md p-3 sm:p-4 border border-amber-900/40">
          <div
            className={`tracking-wide transition-all duration-300 ${scriptType === 'HAN' ? 'text-lg sm:text-xl leading-loose font-medium' : 'text-sm sm:text-base leading-relaxed'
              } text-amber-100`}
          >
            {currentLines.map((line, idx) => (
              <div
                key={idx}
                className="flex items-baseline gap-2 py-0.5 hover:bg-white/5 rounded px-1.5 transition-colors"
              >
                <span className="text-[11px] text-amber-500/60 select-none w-5 text-right shrink-0">
                  {startLineNumber + idx}.
                </span>
                <span className="flex-1 select-text selection:bg-amber-700 selection:text-white">
                  {line}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer: Trái (Đoạn Trước, Đoạn Tiếp, Nút Đánh Dấu Khớp) - Phải (Trang Trước, Trang Sau, Thêm Trang) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 mt-1 text-xs">
          {/* Vị trí bên trái: Nút Đoạn Trước, Đoạn Tiếp & NÚT ĐÁNH DẤU KHỚP */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handlePrevChunk}
              disabled={currentChunkIndex === 0}
              className="h-7.5 px-2.5 rounded-lg bg-amber-900/70 hover:bg-amber-800 disabled:opacity-30 active:scale-95 transition-all text-amber-100 text-xs font-bold flex items-center gap-1 border border-amber-700/50 cursor-pointer"
              title="5 dòng trước"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Đoạn Trước</span>
            </button>

            <button
              type="button"
              onClick={handleNextChunk}
              disabled={currentChunkIndex >= chunks.length - 1}
              className="h-7.5 px-2.5 rounded-lg bg-amber-900/70 hover:bg-amber-800 disabled:opacity-30 active:scale-95 transition-all text-amber-100 text-xs font-bold flex items-center gap-1 border border-amber-700/50 cursor-pointer"
              title="5 dòng tiếp theo"
            >
              <span>Đoạn Tiếp</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Nút Đánh Dấu (Khớp Đoạn) Độc Lập */}
            <button
              type="button"
              onClick={handleToggleMatch}
              className={`h-7.5 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs border cursor-pointer ${isChunkDone
                ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500'
                : 'bg-amber-800/90 text-amber-100 border-amber-600/60 hover:bg-amber-700'
                }`}
              title="Đánh dấu đoạn này đã chép khớp"
            >
              {isChunkDone ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Đã Khớp</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-amber-300" />
                  <span>Đánh Dấu Khớp</span>
                </>
              )}
            </button>
          </div>

          {/* Vị trí bên phải: DUY NHẤT 1 KHU VỰC ĐIỀU HƯỚNG TRANG SỔ TAY A4 */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onPrevPage}
              disabled={pageNumber <= 1}
              className="h-7.5 px-2.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 disabled:opacity-30 active:scale-95 transition-all text-amber-200 text-xs font-bold flex items-center gap-1 border border-amber-800 cursor-pointer"
              title="Trang sổ A4 trước"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Trang {pageNumber > 1 ? pageNumber - 1 : 1}</span>
            </button>
            <button
              type="button"
              onClick={onNextPage}
              className="h-7.5 px-2.5 rounded-lg bg-amber-900 hover:bg-amber-800 active:scale-95 transition-all text-amber-200 text-xs font-bold flex items-center gap-1 border border-amber-800 cursor-pointer"
              title="Trang sổ A4 sau (Tự mở trang mới nếu ở cuối)"
            >
              <span>Trang {pageNumber + 1}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {onAddNewPage && (
              <button
                type="button"
                onClick={onAddNewPage}
                className="w-7.5 h-7.5 rounded-lg bg-amber-900 hover:bg-amber-800 active:scale-95 transition-all text-amber-200 border border-amber-700/60 flex items-center justify-center shadow-xs cursor-pointer p-0"
                title="Thêm 1 trang A4 mới vào sổ tay"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
