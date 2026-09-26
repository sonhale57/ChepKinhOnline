import React, { useRef } from 'react';
import { Award, Download, Printer, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  sutraTitle: string;
  attemptNumber: number;
  totalWords: number;
  completedDate?: string;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  userName,
  sutraTitle,
  attemptNumber,
  totalWords,
  completedDate
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const dateStr = completedDate
    ? new Date(completedDate).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
    // Generate simple canvas snapshot of the certificate
    if (!certificateRef.current) return;
    try {
      const el = certificateRef.current;
      const canvas = document.createElement('canvas');
      const scale = 2; // High resolution
      canvas.width = el.offsetWidth * scale;
      canvas.height = el.offsetHeight * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.scale(scale, scale);
      
      // Draw background
      ctx.fillStyle = '#FFFDF8';
      ctx.fillRect(0, 0, el.offsetWidth, el.offsetHeight);

      // We can use SVG/foreignObject or HTML Canvas download trigger
      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.write(`
          <html>
            <head>
              <title>Chứng Nhận Công Đức - ${sutraTitle}</title>
              <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,wght@0,300;0,400;0,600;0,700;0,800;0,900;1,400&family=Playfair+Display:ital,wght@0,600;0,700;0,900;1,600&display=swap" rel="stylesheet">
              <style>
                body { font-family: 'Nunito Sans', sans-serif; background: #fffdf8; padding: 20px; display: flex; justify-content: center; align-items: center; }
                .cert-container { width: 800px; padding: 40px; border: 4px double #854d0e; background: #fffdf8; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border-radius: 12px; }
                h1 { color: #451a03; font-family: 'Playfair Display', serif; font-size: 28px; margin-bottom: 8px; letter-spacing: 2px; }
                h2 { color: #78350f; font-size: 20px; margin: 15px 0; }
                .name { font-size: 24px; font-weight: bold; color: #78350f; border-bottom: 2px solid #ca8a04; display: inline-block; padding: 0 20px 4px 20px; margin: 10px 0; }
                .verse { font-style: italic; color: #78350f; margin: 20px 0; font-size: 13px; line-height: 1.8; }
                .seal { display: inline-block; width: 80px; height: 80px; border: 3px solid #b91c1c; border-radius: 50%; color: #b91c1c; font-weight: bold; font-size: 11px; line-height: 1.2; padding-top: 22px; box-sizing: border-box; transform: rotate(-8deg); }
              </style>
            </head>
            <body onload="window.print()">
              <div class="cert-container">
                <div style="font-size: 13px; color: #a16207; font-weight: bold; letter-spacing: 3px; margin-bottom: 4px;">CHÉP KINH ONLINE • CÔNG ĐỨC VIÊN MÃN</div>
                <h1>CHỨNG NHẬN CÔNG ĐỨC</h1>
                <p style="font-size: 13px; color: #78350f;">Kính chứng nhận Phật tử / Đồng tu</p>
                <div class="name">${userName || 'Phật Tử Tinh Tấn'}</div>
                <p style="font-size: 14px; color: #451a03; margin-top: 10px;">
                  Đã phát tâm tinh tấn chép hoàn thành viên mãn
                </p>
                <h2>📜 ${sutraTitle}</h2>
                <p style="font-size: 13px; color: #78350f;">
                  <strong>Lượt Chép Thứ ${attemptNumber}</strong> • Tổng cộng <strong>${totalWords.toLocaleString('vi-VN')}</strong> chữ kinh điển
                </p>
                <div class="verse">
                  "Chép kinh một chữ, gieo duyên muôn đời<br/>
                  Tâm an trí sáng, phước báu vô lượng."
                </div>
                <div style="margin-top: 25px; display: flex; justify-content: space-around; align-items: center;">
                  <div style="font-size: 12px; color: #78350f;">
                    Ngày hoàn thành: <strong>${dateStr}</strong>
                  </div>
                  <div class="seal">
                    CHỨNG NHẬN<br/>CÔNG ĐỨC
                  </div>
                </div>
              </div>
            </body>
          </html>
        `);
        printWin.document.close();
      }
    } catch (err) {
      console.error('Download certificate error', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-amber-900/20 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-amber-900 to-amber-950 text-amber-50">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-300" />
            <h3 className="text-sm sm:text-base font-bold tracking-wide">
              Chứng Nhận Công Đức Chép Kinh
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-amber-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Certificate View */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-amber-50/40 flex justify-center">
          <div
            ref={certificateRef}
            className="w-full max-w-xl bg-[#FFFDF8] border-4 border-double border-amber-800/60 rounded-xl p-6 sm:p-8 text-center relative shadow-md overflow-hidden"
          >
            {/* Corner Decorative Ornaments */}
            <div className="absolute top-2 left-2 text-amber-700/40 text-xs font-serif select-none">❖</div>
            <div className="absolute top-2 right-2 text-amber-700/40 text-xs font-serif select-none">❖</div>
            <div className="absolute bottom-2 left-2 text-amber-700/40 text-xs font-serif select-none">❖</div>
            <div className="absolute bottom-2 right-2 text-amber-700/40 text-xs font-serif select-none">❖</div>

            {/* Inner Border */}
            <div className="border border-amber-800/20 rounded-lg p-5 sm:p-6 relative">
              {/* App Badge */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold tracking-widest text-amber-800 uppercase mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Chép Kinh Online • Sổ Tay A4</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-amber-950 tracking-wider font-serif uppercase mt-1 mb-3">
                Chứng Nhận Công Đức
              </h1>

              <p className="text-xs text-amber-900/80 font-medium">
                Kính chứng nhận Phật tử / Đồng tu
              </p>

              {/* Name */}
              <div className="my-2 inline-block px-4 py-1 border-b-2 border-amber-600">
                <span className="text-lg sm:text-xl font-bold text-amber-950">
                  {userName || 'Phật Tử Tinh Tấn'}
                </span>
              </div>

              <p className="text-xs text-amber-900/85 mt-2">
                Đã phát tâm tinh tấn chép hoàn thành viên mãn bộ kinh:
              </p>

              {/* Sutra Title */}
              <div className="bg-amber-100/60 border border-amber-800/20 rounded-lg py-2 px-3 my-3">
                <h2 className="text-base sm:text-lg font-bold text-amber-950 font-serif">
                  📜 {sutraTitle}
                </h2>
              </div>

              {/* Attempt & Word stats */}
              <div className="flex items-center justify-center gap-2 text-xs text-amber-900 font-semibold mb-3">
                <span className="bg-amber-200/60 px-2.5 py-0.5 rounded-full">
                  Lượt Chép Thứ {attemptNumber}
                </span>
                <span>•</span>
                <span>{totalWords.toLocaleString('vi-VN')} chữ kinh văn</span>
                <span>•</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Viên Mãn 100%
                </span>
              </div>

              {/* Verse */}
              <div className="text-[11px] sm:text-xs italic text-amber-900/70 border-t border-b border-amber-800/10 py-2 my-3 leading-relaxed">
                "Chép kinh một chữ, gieo duyên muôn đời<br />
                Tâm an trí sáng, phước báu vô lượng."
              </div>

              {/* Footer Stamp & Date */}
              <div className="flex items-center justify-between pt-3 text-left">
                <div className="text-[11px] text-amber-900/80">
                  <p>Ngày hoàn thành:</p>
                  <p className="font-bold text-amber-950 text-xs">{dateStr}</p>
                </div>

                {/* Red Seal */}
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-2 border-red-700/80 text-red-700 flex flex-col items-center justify-center text-[9px] font-black tracking-tighter transform -rotate-12 select-none shadow-xs">
                  <span>CHỨNG NHẬN</span>
                  <span className="border-t border-b border-red-700/60 py-0.2 my-0.2 text-[8px]">★ ★ ★</span>
                  <span>CÔNG ĐỨC</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-3 sm:p-4 bg-white border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-lg border border-amber-900/20 bg-white hover:bg-amber-50 text-amber-950 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-800" />
            <span>In Chứng Nhận</span>
          </button>

          <button
            onClick={handleDownloadImage}
            className="px-4 py-2 rounded-lg bg-amber-900 hover:bg-amber-950 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Tải Chứng Nhận (In / Lưu Máy)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
