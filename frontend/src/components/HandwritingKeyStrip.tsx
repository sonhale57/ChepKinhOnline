import React from 'react';
import {
  CornerDownLeft,
  Space,
  Delete,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface HandwritingKeyStripProps {
  onInsertSpace: () => void;
  onInsertNewline: () => void;
  onDeleteLastWord: () => void;
  onClearText: () => void;
  onRecognizeNow: () => void;
  isRecognizing?: boolean;
}

export const HandwritingKeyStrip: React.FC<HandwritingKeyStripProps> = ({
  onInsertSpace,
  onInsertNewline,
  onDeleteLastWord,
  onClearText,
  onRecognizeNow,
  isRecognizing = false,
}) => {
  return (
    <aside
      className="w-10 sm:w-11.5 h-full flex flex-col justify-between items-center gap-1.5 py-2 px-1 bg-white/95 backdrop-blur-md rounded-xl border border-amber-900/15 shadow-paper shrink-0 transition-all select-none"
      title="Bàn phím ảo hỗ trợ viết chữ liên tục"
    >
      {/* Nhóm 1: Phím Cách Chữ & Xuống Hàng */}
      <div className="flex flex-col items-center gap-1.5 p-1 bg-amber-50/80 rounded-lg border border-amber-900/10 w-full">
        {/* Nút Cách Chữ (Space) */}
        <button
          type="button"
          onClick={onInsertSpace}
          className="w-full h-11 rounded-md bg-amber-900 hover:bg-amber-950 text-white flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all shadow-xs cursor-pointer"
          title="Chèn dấu cách (Space) & Chốt từ vừa viết"
        >
          <Space className="w-4 h-4 text-amber-200" />
          <span className="text-[9px] font-bold tracking-tight">CÁCH</span>
        </button>

        {/* Nút Xuống Hàng (Enter / Newline) */}
        <button
          type="button"
          onClick={onInsertNewline}
          className="w-full h-11 rounded-md bg-amber-800 hover:bg-amber-900 text-white flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all shadow-xs cursor-pointer"
          title="Xuống dòng mới (Enter / Newline)"
        >
          <CornerDownLeft className="w-4 h-4 text-amber-200" />
          <span className="text-[9px] font-bold tracking-tight">DÒNG</span>
        </button>
      </div>

      {/* Nhóm 2: Nút Nhận Diện Ngay */}
      <div className="flex flex-col items-center gap-1 p-1 bg-amber-100/60 rounded-lg border border-amber-900/10 w-full">
        <button
          type="button"
          onClick={onRecognizeNow}
          disabled={isRecognizing}
          className="w-full h-10 rounded-md bg-amber-700/90 hover:bg-amber-800 text-amber-100 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          title="Nhận diện ngay lập tức nét chữ vừa viết"
        >
          <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isRecognizing ? 'animate-spin' : ''}`} />
          <span className="text-[8.5px] font-bold">NHẬN DIỆN</span>
        </button>
      </div>

      {/* Nhóm 3: Xóa Chữ Cuối & Xóa Toàn Bộ Văn Bản */}
      <div className="flex flex-col items-center gap-1.5 p-1 bg-amber-50/80 rounded-lg border border-amber-900/10 w-full">
        {/* Nút Xóa Từ Cuối (Backspace) */}
        <button
          type="button"
          onClick={onDeleteLastWord}
          className="w-full h-9 rounded-md bg-amber-200/80 hover:bg-amber-300 text-amber-950 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all shadow-xs cursor-pointer"
          title="Xóa từ cuối cùng vừa nhận diện (Backspace)"
        >
          <Delete className="w-3.5 h-3.5 text-amber-900" />
          <span className="text-[8.5px] font-bold">XÓA TỪ</span>
        </button>

        {/* Nút Reset Văn Bản Đã Nhận Diện */}
        <button
          type="button"
          onClick={onClearText}
          className="w-full h-9 rounded-md bg-red-100/80 hover:bg-red-200 text-red-800 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all shadow-xs cursor-pointer"
          title="Xóa toàn bộ văn bản đã nhận diện để viết lại"
        >
          <RotateCcw className="w-3.5 h-3.5 text-red-700" />
          <span className="text-[8.5px] font-bold">LÀM LẠI</span>
        </button>
      </div>
    </aside>
  );
};
