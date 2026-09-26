import React from 'react';
import type { BrushType, GridType, PaperType } from '../types';
import {
  PenTool,
  Paintbrush,
  Pencil,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Settings2,
  Hand,
  PenLine
} from 'lucide-react';

interface ToolbarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  brushType: BrushType;
  onBrushTypeChange: (type: BrushType) => void;
  brushColor: string;
  onBrushColorChange: (color: string) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  lineHeight: number;
  onLineHeightChange: (lh: number) => void;
  gridType: GridType;
  onGridTypeChange: (type: GridType) => void;
  paperType: PaperType;
  onPaperTypeChange: (type: PaperType) => void;
  penOnlyMode: boolean;
  onTogglePenOnlyMode: () => void;
  isPageCompleted: boolean;
  onCompletePage: () => void;
  onSaveStrokes: () => void;
  isSaving: boolean;
}

const BRUSH_COLORS = [
  { name: 'Mực Đen Tuyền', value: '#1A1817' },
  { name: 'Chu Sa Đỏ', value: '#C93B2B' },
  { name: 'Xanh Thẫm', value: '#1E3A8A' },
  { name: 'Vàng Kim', value: '#C5A059' },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  brushType,
  onBrushTypeChange,
  brushColor,
  onBrushColorChange,
  brushSize,
  onBrushSizeChange,
  fontSize,
  onFontSizeChange,
  lineHeight,
  onLineHeightChange,
  gridType,
  onGridTypeChange,
  paperType,
  onPaperTypeChange,
  penOnlyMode,
  onTogglePenOnlyMode,
  isPageCompleted,
  onCompletePage,
  onSaveStrokes,
  isSaving,
}) => {
  const [showSettings, setShowSettings] = React.useState(false);

  return (
    <div className="w-full bg-white/95 backdrop-blur-md border-b border-amber-900/10 shadow-sm sticky top-0 z-30 px-3 py-2">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Nhóm 1: Điều hướng lật trang Sổ tay A4 */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="touch-target-44 p-2.5 rounded-xl border border-gray-200 active:bg-amber-50 disabled:opacity-30 transition-all flex items-center justify-center shadow-sm"
            title="Trang trước"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50/80 rounded-xl border border-amber-900/10 text-xs sm:text-sm font-serif font-semibold text-amber-950">
            <BookOpen className="w-4 h-4 text-amber-700" />
            <span>Trang {currentPage} / {totalPages}</span>
          </div>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="touch-target-44 p-2.5 rounded-xl border border-gray-200 active:bg-amber-50 disabled:opacity-30 transition-all flex items-center justify-center shadow-sm"
            title="Trang sau"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Nhóm 2: Chọn Loại Bút & Màu Mực */}
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="flex bg-gray-100/80 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => onBrushTypeChange('CALLIGRAPHY')}
              className={`touch-target-44 p-2 rounded-lg flex items-center justify-center transition-all ${brushType === 'CALLIGRAPHY' ? 'bg-white text-amber-900 shadow-sm font-semibold' : 'text-gray-600'
                }`}
              title="Bút Lông Thư Pháp"
            >
              <Paintbrush className="w-5 h-5" />
            </button>
            <button
              onClick={() => onBrushTypeChange('PEN')}
              className={`touch-target-44 p-2 rounded-lg flex items-center justify-center transition-all ${brushType === 'PEN' ? 'bg-white text-amber-900 shadow-sm font-semibold' : 'text-gray-600'
                }`}
              title="Bút Mực Chuẩn"
            >
              <PenTool className="w-5 h-5" />
            </button>
            <button
              onClick={() => onBrushTypeChange('PENCIL')}
              className={`touch-target-44 p-2 rounded-lg flex items-center justify-center transition-all ${brushType === 'PENCIL' ? 'bg-white text-amber-900 shadow-sm font-semibold' : 'text-gray-600'
                }`}
              title="Bút Chì"
            >
              <Pencil className="w-5 h-5" />
            </button>
          </div>

          {/* Màu Mực */}
          <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl border border-gray-200">
            {BRUSH_COLORS.map((col) => (
              <button
                key={col.value}
                onClick={() => onBrushColorChange(col.value)}
                className={`touch-target-44 w-10 h-10 rounded-full border-2 transition-transform ${brushColor === col.value ? 'scale-110 border-amber-600 shadow-sm' : 'border-transparent'
                  }`}
                style={{ backgroundColor: col.value }}
                title={col.name}
              />
            ))}
          </div>
        </div>

        {/* Nhóm 3: Chống Tì Tay (Palm Rejection) & Nút Cài Đặt */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Chế độ chỉ dùng Bút Apple Pencil */}
          <button
            onClick={onTogglePenOnlyMode}
            className={`touch-target-44 px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${penOnlyMode
              ? 'bg-amber-900 text-white border-amber-950 shadow-sm'
              : 'bg-white text-gray-700 border-gray-200 active:bg-gray-100'
              }`}
            title="Bật/Tắt chống chạm ngón tay khi tì tay lên màn hình"
          >
            {penOnlyMode ? <PenLine className="w-4 h-4" /> : <Hand className="w-4 h-4 text-amber-700" />}
            <span className="hidden md:inline">{penOnlyMode ? 'Chỉ Nhận Bút (Chống tì)' : 'Vẽ Cả Ngón Tay'}</span>
          </button>

          {/* Nút Cài Đặt Cỡ Chữ & Lưới Ô */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`touch-target-44 p-2.5 rounded-xl border transition-all flex items-center justify-center ${showSettings ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-white border-gray-200 text-gray-700 active:bg-gray-100'
              }`}
            title="Căn chỉnh cỡ chữ và lưới ô"
          >
            <Settings2 className="w-5 h-5" />
          </button>

          {/* Nút Đánh Dấu Hoàn Thành Trang */}
          <button
            onClick={onCompletePage}
            className={`touch-target-44 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border flex items-center gap-1.5 shadow-sm active:scale-95 transition-all ${isPageCompleted
              ? 'bg-emerald-700 text-white border-emerald-800'
              : 'bg-white text-emerald-800 border-emerald-300 active:bg-emerald-50'
              }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isPageCompleted ? 'Đã Viên Mãn' : 'Xong Trang'}</span>
          </button>

          {/* Nút Lưu Nét Viết */}
          <button
            onClick={onSaveStrokes}
            disabled={isSaving}
            className="touch-target-44 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-amber-800 hover:bg-amber-900 text-white active:scale-95 transition-all shadow-sm disabled:opacity-50"
          >
            {isSaving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>

      {/* Panel Căn Chỉnh Cỡ Chữ, Dòng Kẻ & Khổ Giấy (Mở rộng) */}
      {showSettings && (
        <div className="max-w-4xl mx-auto mt-3 p-4 bg-amber-50/90 rounded-2xl border border-amber-900/15 shadow-paper grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in duration-200">
          {/* Cỡ Nét Bút */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-amber-950 flex justify-between">
              <span>Độ dày nét bút</span>
              <span className="text-amber-800 font-mono">{brushSize}px</span>
            </label>
            <input
              type="range"
              min="2"
              max="16"
              step="1"
              value={brushSize}
              onChange={(e) => onBrushSizeChange(Number(e.target.value))}
              className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-800"
            />
          </div>

          {/* Cỡ Chữ Mẫu In Mờ */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-amber-950 flex justify-between">
              <span>Cỡ chữ mẫu (Font Size)</span>
              <span className="text-amber-800 font-mono">{fontSize}px</span>
            </label>
            <input
              type="range"
              min="20"
              max="40"
              step="1"
              value={fontSize}
              onChange={(e) => onFontSizeChange(Number(e.target.value))}
              className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-800"
            />
          </div>

          {/* Khoảng Cách Dòng */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-amber-950 flex justify-between">
              <span>Khoảng cách dòng</span>
              <span className="text-amber-800 font-mono">{lineHeight}px</span>
            </label>
            <input
              type="range"
              min="40"
              max="80"
              step="2"
              value={lineHeight}
              onChange={(e) => onLineHeightChange(Number(e.target.value))}
              className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-800"
            />
          </div>

          {/* Kiểu Lưới & Nền Giấy */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-amber-950">Kiểu lưới ô & Giấy</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => onGridTypeChange('GRID_OLY')}
                className={`px-2.5 py-1.5 text-xs rounded-lg border text-center transition-all ${gridType === 'GRID_OLY' ? 'bg-amber-900 text-white font-semibold' : 'bg-white border-gray-200'
                  }`}
              >
                Ô Ly
              </button>
              <button
                onClick={() => onGridTypeChange('GRID_HAN')}
                className={`px-2.5 py-1.5 text-xs rounded-lg border text-center transition-all ${gridType === 'GRID_HAN' ? 'bg-amber-900 text-white font-semibold' : 'bg-white border-gray-200'
                  }`}
              >
                Ô Chữ Hán
              </button>
              <button
                onClick={() => onPaperTypeChange('DO')}
                className={`px-2.5 py-1.5 text-xs rounded-lg border text-center transition-all ${paperType === 'DO' ? 'bg-amber-900 text-white font-semibold' : 'bg-white border-gray-200'
                  }`}
              >
                Giấy Dó
              </button>
              <button
                onClick={() => onPaperTypeChange('OLD_GOLD')}
                className={`px-2.5 py-1.5 text-xs rounded-lg border text-center transition-all ${paperType === 'OLD_GOLD' ? 'bg-amber-900 text-white font-semibold' : 'bg-white border-gray-200'
                  }`}
              >
                Vàng Cổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
