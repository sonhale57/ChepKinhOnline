import React, { useState } from 'react';
import { FileDown, CheckCircle2, Loader2, X, BookOpen } from 'lucide-react';
import { exportSutraNotebookPdf } from '../services/pdfExportService';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  sutraId: number;
  attemptId: number;
  userId: number;
  sutraTitle: string;
  scriptType: string;
  totalNotebookPages: number;
  userName: string;
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  onClose,
  sutraId,
  attemptId,
  userId,
  sutraTitle,
  scriptType,
  totalNotebookPages,
  userName,
}) => {
  const [includeCover, setIncludeCover] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    setIsSuccess(false);
    setProgressPercent(0);
    setProgressMsg('Đang khởi tạo tệp PDF A4...');

    try {
      await exportSutraNotebookPdf({
        sutraId,
        attemptId,
        userId,
        sutraTitle,
        scriptType,
        totalNotebookPages,
        userName,
        includeCover,
        onProgress: (current, total, msg) => {
          setProgressMsg(msg);
          setProgressPercent(Math.round((current / total) * 100));
        },
      });
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Export PDF error', err);
      alert('Không thể xuất file PDF. Vui lòng thử lại!');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-amber-900/20 overflow-hidden relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-800 to-amber-950 px-5 py-3.5 text-amber-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileDown className="w-5 h-5 text-amber-300" />
            <h3 className="text-sm sm:text-base font-bold tracking-wide">
              Xuất Bản Sổ Tay A4 (PDF)
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1 rounded-md text-amber-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 bg-amber-50/20 space-y-4 text-left">
          <div className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-amber-900/15 shadow-xs">
            <BookOpen className="w-8 h-8 text-amber-800 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-950">{sutraTitle}</h4>
              <p className="text-[11px] text-amber-900/70 mt-0.5">
                Sổ tay gồm <strong>{totalNotebookPages} trang A4</strong> chứa toàn bộ nét chữ chép tay thật.
              </p>
            </div>
          </div>

          {/* Tuỳ chọn xuất */}
          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2.5 text-xs font-semibold text-amber-950 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCover}
                onChange={(e) => setIncludeCover(e.target.checked)}
                disabled={isExporting}
                className="w-4 h-4 rounded text-amber-800 focus:ring-amber-800 border-amber-900/30 accent-amber-900"
              />
              <span>Kèm Trang Bìa Trang Trọng (Tên kinh, Tên Phật tử, Lời hồi hướng)</span>
            </label>
          </div>

          {/* Tiến trình xuất */}
          {isExporting && (
            <div className="space-y-2 py-2">
              <div className="flex justify-between text-xs font-bold text-amber-950">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-800" />
                  <span>{progressMsg}</span>
                </span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-amber-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-800 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {isSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Đã xuất và tải tệp PDF Sổ tay A4 thành công!</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="flex-1 py-2 px-3 rounded-lg text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer disabled:opacity-50"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleStartExport}
              disabled={isExporting}
              className="flex-1 py-2 px-3 rounded-lg text-xs font-bold text-white bg-amber-900 hover:bg-amber-950 flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang Tạo PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Tải File PDF A4</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
