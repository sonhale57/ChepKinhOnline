import React, { useState } from 'react';
import type { BrushType, GridType, PaperType } from '../types';
import {
  Paintbrush,
  PenTool,
  Pencil,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Settings2,
  Layers,
  Hand,
  PenLine,
  ArrowLeftRight,
  X,
  Sparkles
} from 'lucide-react';

interface SidebarToolsProps {
  brushType: BrushType;
  onBrushTypeChange: (type: BrushType) => void;
  brushColor: string;
  onBrushColorChange: (color: string) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  gridType: GridType;
  onGridTypeChange: (type: GridType) => void;
  paperType: PaperType;
  onPaperTypeChange: (type: PaperType) => void;
  penOnlyMode: boolean;
  onTogglePenOnlyMode: () => void;
  autoRecognize?: boolean;
  onToggleAutoRecognize?: () => void;
  isRecognizing?: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  dockPosition: 'left' | 'right';
  onToggleDockPosition: () => void;
}

const BRUSH_COLORS = [
  { name: 'Mực Đen Tuyền', value: '#1A1817' },
  { name: 'Chu Sa Đỏ', value: '#C93B2B' },
  { name: 'Xanh Thẫm', value: '#1E3A8A' },
  { name: 'Vàng Kim', value: '#C5A059' },
];

const BRUSH_SIZES = [
  { label: 'XS', size: 3 },
  { label: 'S', size: 6 },
  { label: 'M', size: 10 },
  { label: 'L', size: 16 },
];

export const SidebarTools: React.FC<SidebarToolsProps> = ({
  brushType,
  onBrushTypeChange,
  brushColor,
  onBrushColorChange,
  brushSize,
  onBrushSizeChange,
  gridType,
  onGridTypeChange,
  paperType,
  onPaperTypeChange,
  penOnlyMode,
  onTogglePenOnlyMode,
  autoRecognize = true,
  onToggleAutoRecognize,
  isRecognizing = false,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onToggleDockPosition,
}) => {
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  return (
    <>
      {/* Thanh Công Cụ Cao Bằng Khổ Giấy A4 (Design System: Radius nhẹ rounded-xl & Nút Compact Cân Đối) */}
      <aside
        className="w-10 sm:w-11.5 h-full flex flex-col justify-between items-center gap-1.5 py-2 px-1 bg-white/95 backdrop-blur-md rounded-xl border border-amber-900/15 shadow-paper shrink-0 transition-all select-none"
      >
        {/* Nhóm 1: Chọn Loại Bút */}
        <div className="flex flex-col items-center gap-1 p-1 bg-amber-50/70 rounded-lg border border-amber-900/10 w-full">
          <button
            type="button"
            onClick={() => onBrushTypeChange('CALLIGRAPHY')}
            className={`w-7.5 h-7.5 rounded-md flex items-center justify-center transition-all cursor-pointer ${brushType === 'CALLIGRAPHY'
              ? 'bg-amber-900 text-white shadow-xs'
              : 'text-amber-950/70 hover:bg-amber-100/60'
              }`}
            title="Bút Lông Thư Pháp"
          >
            <Paintbrush className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onBrushTypeChange('PEN')}
            className={`w-7.5 h-7.5 rounded-md flex items-center justify-center transition-all cursor-pointer ${brushType === 'PEN'
              ? 'bg-amber-900 text-white shadow-xs'
              : 'text-amber-950/70 hover:bg-amber-100/60'
              }`}
            title="Bút Mực Chuẩn"
          >
            <PenTool className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onBrushTypeChange('PENCIL')}
            className={`w-7.5 h-7.5 rounded-md flex items-center justify-center transition-all cursor-pointer ${brushType === 'PENCIL'
              ? 'bg-amber-900 text-white shadow-xs'
              : 'text-amber-950/70 hover:bg-amber-100/60'
              }`}
            title="Bút Chì Nét Mộc"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onBrushTypeChange('ERASER')}
            className={`w-7.5 h-7.5 rounded-md flex items-center justify-center transition-all cursor-pointer ${brushType === 'ERASER'
              ? 'bg-amber-900 text-white shadow-xs'
              : 'text-amber-950/70 hover:bg-amber-100/60'
              }`}
            title="Cục Tẩy (Xóa nét vẽ)"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Nhóm 2: Bảng Màu Mực */}
        <div className={`flex flex-col items-center gap-2 p-1.5 bg-amber-50/70 rounded-lg border border-amber-900/10 w-full transition-opacity ${brushType === 'ERASER' ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
          {BRUSH_COLORS.map((col) => (
            <button
              key={col.value}
              type="button"
              onClick={() => onBrushColorChange(col.value)}
              className={`w-4 h-4 rounded-full border-2 transition-transform active:scale-90 cursor-pointer ${brushColor === col.value
                ? 'scale-100 border-amber-900 shadow-xs ring-2 ring-amber-700/50'
                : 'border-transparent opacity-85 hover:opacity-100'
                }`}
              style={{ backgroundColor: col.value }}
              title={col.name}
            />
          ))}
        </div>

        {/* Nhóm 3: Kích Thước Nét (Size XS / S / M / L) */}
        <div className="flex flex-col items-center gap-0.5 p-1 bg-amber-50/70 rounded-lg border border-amber-900/10 w-full">
          {BRUSH_SIZES.map((s) => (
            <button
              key={s.size}
              type="button"
              onClick={() => onBrushSizeChange(s.size)}
              className={`w-full h-5.5 rounded-md text-[10.5px] font-bold transition-all flex items-center justify-center cursor-pointer ${brushSize === s.size
                ? 'bg-amber-900 text-white shadow-xs'
                : 'text-amber-950/70 hover:bg-amber-100/60'
                }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Nhóm 4: Undo, Redo, Clear */}
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="w-7.5 h-7.5 rounded-lg text-amber-950/75 hover:bg-amber-100/60 disabled:opacity-30 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
            title="Hoàn tác nét (Undo)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="w-7.5 h-7.5 rounded-lg text-amber-950/75 hover:bg-amber-100/60 disabled:opacity-30 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
            title="Làm lại nét (Redo)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onClear}
            className="w-7.5 h-7.5 rounded-lg text-red-600 hover:bg-red-50 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
            title="Xóa toàn bộ nét trên trang này"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Nhóm 5: Chống Tì Tay, AI Nhận Diện, Đổi Nền & Đảo Vị Trí */}
        <div className="flex flex-col items-center gap-1">
          {onToggleAutoRecognize && (
            <button
              type="button"
              onClick={onToggleAutoRecognize}
              className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center transition-all cursor-pointer relative ${autoRecognize
                ? 'bg-amber-900 text-amber-200 shadow-xs ring-1 ring-amber-700/50'
                : 'text-amber-950/40 hover:bg-amber-100/60'
                }`}
              title={
                autoRecognize
                  ? isRecognizing
                    ? 'AI đang nhận diện chữ viết tay...'
                    : 'Tự động nhận diện chữ & khớp đoạn: ĐANG BẬT'
                  : 'Tự động nhận diện chữ & khớp đoạn: ĐANG TẮT'
              }
            >
              <Sparkles className={`w-3.5 h-3.5 ${isRecognizing ? 'animate-spin text-amber-300' : ''}`} />
              {autoRecognize && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onTogglePenOnlyMode}
            className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${penOnlyMode
              ? 'bg-amber-900 text-white shadow-xs'
              : 'text-amber-950/70 hover:bg-amber-100/60'
              }`}
            title={penOnlyMode ? 'Chỉ nhận Apple Pencil (Chống tì tay BẬT)' : 'Nhận cả ngón tay (Chống tì tay TẮT)'}
          >
            {penOnlyMode ? <PenLine className="w-3.5 h-3.5" /> : <Hand className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="w-7.5 h-7.5 rounded-lg text-amber-950/75 hover:bg-amber-100/60 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
            title="Đổi nền giấy & kiểu lưới ô"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onToggleDockPosition}
            className="w-7.5 h-7.5 rounded-lg text-amber-950/50 hover:text-amber-950 hover:bg-amber-100/60 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
            title="Đảo vị trí thanh công cụ (Trái / Phải)"
          >
            <ArrowLeftRight className="w-3 h-3" />
          </button>
        </div>
      </aside>

      {/* Modal Cài Đặt Nền Giấy & Lưới Ô (Radius Nhẹ rounded-lg) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-4 sm:p-5 max-w-sm w-full border border-amber-900/15 shadow-paper-lg animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 mb-3">
              <div className="flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-amber-900" />
                <h3 className="font-bold text-amber-950 text-sm">Cấu Hình Giấy & Lưới A4</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="touch-target-44 p-1 rounded-md text-gray-400 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Kiểu Lưới */}
            <div className="mb-3">
              <label className="block text-[11px] font-bold text-amber-950 uppercase mb-1.5">Kiểu Lưới Ô</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onGridTypeChange('GRID_OLY')}
                  className={`p-1.5 rounded-md text-[11px] font-semibold border text-center transition-all ${gridType === 'GRID_OLY'
                    ? 'bg-amber-900 text-white border-amber-900 shadow-xs'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  Ô Ly Tiêu Chuẩn
                </button>
                <button
                  type="button"
                  onClick={() => onGridTypeChange('GRID_HAN')}
                  className={`p-1.5 rounded-md text-[11px] font-semibold border text-center transition-all ${gridType === 'GRID_HAN'
                    ? 'bg-amber-900 text-white border-amber-900 shadow-xs'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  Điền Tự (Chữ Hán)
                </button>
                <button
                  type="button"
                  onClick={() => onGridTypeChange('LINE')}
                  className={`p-1.5 rounded-md text-[11px] font-semibold border text-center transition-all ${gridType === 'LINE'
                    ? 'bg-amber-900 text-white border-amber-900 shadow-xs'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  Dòng Kẻ Ngang
                </button>
                <button
                  type="button"
                  onClick={() => onGridTypeChange('BLANK')}
                  className={`p-1.5 rounded-md text-[11px] font-semibold border text-center transition-all ${gridType === 'BLANK'
                    ? 'bg-amber-900 text-white border-amber-900 shadow-xs'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  Giấy Trơn (Tự Do)
                </button>
              </div>
            </div>

            {/* Nền Giấy */}
            <div>
              <label className="block text-[11px] font-bold text-amber-950 uppercase mb-1.5">Chất Liệu Giấy</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => onPaperTypeChange('DO')}
                  className={`p-1.5 rounded-md text-[11px] font-semibold border text-center transition-all ${paperType === 'DO'
                    ? 'bg-amber-900 text-white border-amber-900 shadow-xs'
                    : 'bg-[#FBF8F1] border-gray-200 text-gray-800'
                    }`}
                >
                  Giấy Dó
                </button>
                <button
                  type="button"
                  onClick={() => onPaperTypeChange('OLD_GOLD')}
                  className={`p-1.5 rounded-md text-[11px] font-semibold border text-center transition-all ${paperType === 'OLD_GOLD'
                    ? 'bg-amber-900 text-white border-amber-900 shadow-xs'
                    : 'bg-[#F4EBD9] border-gray-200 text-gray-800'
                    }`}
                >
                  Vàng Cổ
                </button>
                <button
                  type="button"
                  onClick={() => onPaperTypeChange('WHITE')}
                  className={`p-1.5 rounded-md text-[11px] font-semibold border text-center transition-all ${paperType === 'WHITE'
                    ? 'bg-amber-900 text-white border-amber-900 shadow-xs'
                    : 'bg-white border-gray-200 text-gray-800'
                    }`}
                >
                  Trắng Sạch
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSettingsModal(false)}
              className="touch-target-44 w-full mt-3.5 py-1.5 bg-amber-900 hover:bg-amber-950 text-white rounded-md text-xs font-bold shadow-xs active:scale-95 transition-all"
            >
              Áp Dụng
            </button>
          </div>
        </div>
      )}
    </>
  );
};
