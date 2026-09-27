import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Check,
  Plus,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2
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
  className?: string;
  recognizedText?: string;
  isRecognizing?: boolean;
  similarityPercent?: number;
  matchedWords?: Set<string>;
  onRecognizeNow?: () => void;
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
  className = '',
  recognizedText = '',
  isRecognizing = false,
  similarityPercent = 0,
  matchedWords,
  onRecognizeNow,
}) => {
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(initialChunkIndex);
  const [completedChunks, setCompletedChunks] = useState<Record<number, boolean>>(initialCompletedChunks || {});
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

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
    <div className={`w-full mx-auto mb-2.5 sticky top-[44px] sm:top-[48px] z-20 transition-all ${className}`}>
      <div className="bg-amber-950/95 backdrop-blur-md text-amber-50 rounded-xl p-2.5 sm:p-3.5 border border-amber-800/50 shadow-paper-lg transition-all">
        {/* Header Bảng Nhắc Chữ */}
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-amber-800/40 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="p-1 bg-amber-800/60 rounded-md text-amber-300">
              <BookOpen className="w-3.5 h-3.5" />
            </span>
            <div>
              <span className="font-bold text-amber-200 tracking-wide text-xs sm:text-sm">
                BẢNG NHẮC CHỮ KINH
              </span>
              <span className="text-amber-400/80 ml-2 text-[11px]">
                Dòng {startLineNumber} → {endLineNumber}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isChunkDone && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-700/60 px-1.5 py-0.5 rounded">
                <CheckCircle2 className="w-3 h-3" />
                <span className="hidden sm:inline">Đã Khớp</span>
              </span>
            )}
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-900/80 text-amber-200 border border-amber-800">
              Đoạn {currentChunkIndex + 1}/{chunks.length}
            </span>

            {/* Nút Thu gọn / Mở rộng bảng nhắc chữ */}
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-6 px-1.5 rounded bg-amber-900/60 hover:bg-amber-800 text-amber-300 flex items-center gap-0.5 transition-all text-[11px] font-semibold border border-amber-800/60 cursor-pointer"
              title={isCollapsed ? 'Mở rộng 5 dòng nhắc' : 'Thu gọn bảng nhắc'}
            >
              {isCollapsed ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mở rộng</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Thu gọn</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Nội Dung Text Nhắc: Đầy đủ 5 dòng hoặc Thu gọn 1 dòng */}
        {!isCollapsed ? (
          <div className="my-2 min-h-[100px] sm:min-h-[120px] flex flex-col justify-center bg-black/30 rounded-lg p-2.5 sm:p-3.5 border border-amber-900/50">
            <div
              className={`tracking-wide transition-all duration-300 ${scriptType === 'HAN' ? 'text-lg sm:text-xl leading-loose font-medium' : 'text-xs sm:text-sm leading-relaxed'
                } text-amber-100`}
            >
              {currentLines.map((line, idx) => {
                // Tách từ để highlight nếu khớp
                const isHan = scriptType === 'HAN';
                const tokens = isHan ? Array.from(line) : line.split(' ');

                return (
                  <div
                    key={idx}
                    className="flex items-baseline gap-2 py-0.5 hover:bg-white/5 rounded px-1.5 transition-colors"
                  >
                    <span className="text-[11px] text-amber-500/70 select-none w-5 text-right shrink-0">
                      {startLineNumber + idx}.
                    </span>
                    <span className="flex-1 select-text selection:bg-amber-700 selection:text-white">
                      {tokens.map((token, tIdx) => {
                        const cleanToken = token.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?"'“”…]/g, '');
                        const isWordMatched = matchedWords && cleanToken && matchedWords.has(cleanToken);

                        return (
                          <span
                            key={tIdx}
                            className={`transition-colors ${isWordMatched
                              ? 'text-emerald-300 font-bold bg-emerald-950/60 px-1 py-0.5 rounded shadow-xs'
                              : 'text-amber-100'
                              } ${!isHan ? 'mr-1' : ''}`}
                          >
                            {token}
                          </span>
                        );
                      })}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Dải HUD AI Nhận Diện Chữ Viết Tay Thời Gian Thực & Văn Bản Hoàn Chỉnh */}
            {(isRecognizing || recognizedText || onRecognizeNow) && (
              <div className="mt-2.5 pt-2 border-t border-amber-900/60 flex flex-col gap-1.5 text-[11px]">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="p-1 rounded bg-amber-900/60 text-amber-300 shrink-0">
                      <Sparkles className={`w-3 h-3 ${isRecognizing ? 'animate-spin text-amber-300' : ''}`} />
                    </span>
                    <span className="text-amber-300 font-bold tracking-wide">
                      VĂN BẢN ĐÃ NHẬN DIỆN (LIÊN TỤC):
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {similarityPercent > 0 && (
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10.5px] border ${similarityPercent >= 70
                        ? 'bg-emerald-950/90 text-emerald-300 border-emerald-600 shadow-xs'
                        : 'bg-amber-900/90 text-amber-200 border-amber-700'
                        }`}>
                        Độ khớp: {similarityPercent}%
                      </span>
                    )}
                    {onRecognizeNow && !isRecognizing && (
                      <button
                        type="button"
                        onClick={onRecognizeNow}
                        className="px-2 py-0.5 rounded bg-amber-900 hover:bg-amber-800 text-amber-200 text-[10.5px] font-bold transition-all border border-amber-700/50 cursor-pointer active:scale-95"
                        title="Nhận diện lại nét chữ trên trang ngay lập tức"
                      >
                        Nhận diện ngay
                      </button>
                    )}
                  </div>
                </div>

                {/* Khung Hiển Thị Văn Bản Hoàn Chỉnh */}
                <div className="bg-black/40 rounded-md p-2 border border-amber-900/60 min-h-[32px] flex items-center">
                  {isRecognizing ? (
                    <span className="text-amber-300/90 italic flex items-center gap-1.5 animate-pulse text-xs">
                      <Loader2 className="w-3.5 h-3.5 animate-spin inline" />
                      AI đang nhận diện nét chữ liên tục và thêm dấu cách...
                    </span>
                  ) : recognizedText ? (
                    <p className="text-amber-100 font-serif leading-relaxed text-xs sm:text-[13px] whitespace-pre-wrap select-text selection:bg-amber-700">
                      {recognizedText}
                    </p>
                  ) : (
                    <span className="text-amber-400/50 italic text-[11px]">
                      Viết chữ liên tục trên giấy (dừng 3s AI sẽ tự nhận diện & ghép chữ có dấu cách)...
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="my-1.5 py-1 px-2.5 bg-black/30 rounded-lg border border-amber-900/50 flex items-center justify-between text-xs text-amber-200">
            <span className="truncate flex-1 italic text-amber-100/90 pr-2 text-[11.5px]">
              <strong className="text-amber-400 not-italic mr-1">{startLineNumber}.</strong>
              {currentLines[0] || '...'} {currentLines.length > 1 && '...'}
            </span>
            {similarityPercent > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 border ${similarityPercent >= 70 ? 'bg-emerald-900/80 text-emerald-200 border-emerald-700' : 'bg-amber-900/80 text-amber-200 border-amber-700'}`}>
                {similarityPercent}%
              </span>
            )}
          </div>
        )}

        {/* Footer: Trái (Đoạn Trước, Đoạn Tiếp, Nút Đánh Dấu Khớp) - Phải (Trang Trước, Trang Sau, Thêm Trang) */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 text-xs">
          {/* Vị trí bên trái: Nút Đoạn Trước, Đoạn Tiếp & NÚT ĐÁNH DẤU KHỚP */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handlePrevChunk}
              disabled={currentChunkIndex === 0}
              className="h-7 px-2 sm:px-2.5 rounded-lg bg-amber-900/70 hover:bg-amber-800 disabled:opacity-30 active:scale-95 transition-all text-amber-100 text-xs font-bold flex items-center gap-1 border border-amber-700/50 cursor-pointer"
              title="5 dòng trước"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Đoạn Trước</span>
            </button>

            <button
              type="button"
              onClick={handleNextChunk}
              disabled={currentChunkIndex >= chunks.length - 1}
              className="h-7 px-2 sm:px-2.5 rounded-lg bg-amber-900/70 hover:bg-amber-800 disabled:opacity-30 active:scale-95 transition-all text-amber-100 text-xs font-bold flex items-center gap-1 border border-amber-700/50 cursor-pointer"
              title="5 dòng tiếp theo"
            >
              <span>Đoạn Tiếp</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Nút Đánh Dấu (Khớp Đoạn) Độc Lập */}
            <button
              type="button"
              onClick={handleToggleMatch}
              className={`h-7 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs border cursor-pointer ${isChunkDone
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
              className="h-7 px-2.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 disabled:opacity-30 active:scale-95 transition-all text-amber-200 text-xs font-bold flex items-center gap-1 border border-amber-800 cursor-pointer"
              title="Trang sổ A4 trước"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Trang {pageNumber > 1 ? pageNumber - 1 : 1}</span>
            </button>
            <button
              type="button"
              onClick={onNextPage}
              className="h-7 px-2.5 rounded-lg bg-amber-900 hover:bg-amber-800 active:scale-95 transition-all text-amber-200 text-xs font-bold flex items-center gap-1 border border-amber-800 cursor-pointer"
              title="Trang sổ A4 sau (Tự mở trang mới nếu ở cuối)"
            >
              <span>Trang {pageNumber + 1}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {onAddNewPage && (
              <button
                type="button"
                onClick={onAddNewPage}
                className="w-7 h-7 rounded-lg bg-amber-900 hover:bg-amber-800 active:scale-95 transition-all text-amber-200 border border-amber-700/60 flex items-center justify-center shadow-xs cursor-pointer p-0"
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

