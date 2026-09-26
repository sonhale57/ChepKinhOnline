import React from 'react';
import { Award, RotateCcw, Sparkles, Heart } from 'lucide-react';

interface CompletionCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sutraTitle: string;
  attemptNumber: number;
  totalWords: number;
  onOpenCertificate: () => void;
  onStartNewAttempt: () => void;
}

export const CompletionCelebrationModal: React.FC<CompletionCelebrationModalProps> = ({
  isOpen,
  onClose,
  sutraTitle,
  attemptNumber,
  totalWords,
  onOpenCertificate,
  onStartNewAttempt
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-amber-900/20 overflow-hidden text-center relative">
        {/* Top Auspicious Banner */}
        <div className="bg-gradient-to-r from-amber-800 via-amber-900 to-amber-950 px-6 py-6 text-amber-50 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 opacity-10 text-9xl select-none">
            ☸
          </div>

          <div className="w-16 h-16 rounded-full bg-amber-100/20 border-2 border-amber-300/40 mx-auto flex items-center justify-center text-amber-300 shadow-inner mb-3">
            <Award className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-200 text-xs font-bold uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Công Đức Viên Mãn</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-serif tracking-tight">
            Chúc Mừng Hoàn Thành Sổ Kinh!
          </h2>
          <p className="text-xs text-amber-200/90 mt-1">
            Bạn đã hoàn thành viên mãn 100% Lượt chép thứ #{attemptNumber}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 bg-amber-50/30">
          <div className="bg-white rounded-xl border border-amber-900/10 p-4 shadow-xs text-left mb-4">
            <div className="flex items-center justify-between text-xs text-amber-900 font-semibold mb-1">
              <span>Bộ kinh:</span>
              <span className="font-bold text-amber-950 text-sm">{sutraTitle}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-amber-900 font-semibold mb-1">
              <span>Lượt chép:</span>
              <span className="font-bold text-amber-950">Lượt #{attemptNumber}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-amber-900 font-semibold">
              <span>Tổng số chữ kinh văn:</span>
              <span className="font-bold text-amber-950">{totalWords.toLocaleString('vi-VN')} chữ</span>
            </div>
          </div>

          {/* Merit Dedication Verse (Lời Hồi Hướng) */}
          <div className="bg-amber-100/40 border border-amber-800/15 rounded-xl p-4 text-xs font-serif text-amber-950 leading-relaxed italic mb-5">
            <div className="flex items-center justify-center gap-1 text-[11px] font-sans font-bold text-amber-900 not-italic uppercase tracking-wider mb-1.5">
              <Heart className="w-3 h-3 text-red-700 fill-red-700" />
              <span>Lời Hồi Hướng Công Đức</span>
            </div>
            "Nguyện đem công đức này,<br />
            Trang nghiêm Phật Tịnh độ,<br />
            Trên đền bốn ơn nặng,<br />
            Dưới cứu khổ tam đồ.<br />
            Nếu có ai thấy nghe,<br />
            Đều phát tâm bồ đề,<br />
            Hết một báo thân này,<br />
            Đồng sinh cõi Cực Lạc."
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={onOpenCertificate}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-800 to-amber-900 hover:from-amber-900 hover:to-amber-950 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Award className="w-4 h-4 text-amber-300" />
              <span>Xem & Tải Chứng Nhận Công Đức</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onStartNewAttempt}
                className="flex-1 py-2 px-3 bg-white hover:bg-amber-50 border border-amber-900/20 text-amber-950 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                <span>Chép Lượt Tiếp Theo</span>
              </button>

              <button
                onClick={onClose}
                className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Tiếp Tục Xem Sổ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
