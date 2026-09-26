import React, { useState, useEffect } from 'react';
import { Tablet, Share, PlusSquare, CheckCircle2, X, Smartphone } from 'lucide-react';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({ isOpen, onClose }) => {
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS / iPadOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIosDevice);

    // Listen for Chrome / Android beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        onClose();
      }
      setDeferredPrompt(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-amber-900/20 overflow-hidden text-center relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-800 to-amber-950 px-5 py-4 text-amber-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tablet className="w-5 h-5 text-amber-300" />
            <h3 className="text-sm sm:text-base font-bold tracking-wide">
              Cài Đặt Cho iPad & Tablet
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-amber-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 bg-amber-50/30">
          {isInstalled ? (
            <div className="py-6 flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-amber-950 mb-1">
                Ứng dụng đã được cài đặt!
              </h4>
              <p className="text-xs text-amber-900/70 max-w-xs leading-relaxed">
                Bạn đang sử dụng Chép Kinh Online ở chế độ Toàn Màn Hình tiện lợi nhất.
              </p>
              <button
                onClick={onClose}
                className="mt-5 px-5 py-2 bg-amber-900 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                Đã Hiểu
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-amber-900/80 leading-relaxed text-left">
                Thêm ứng dụng vào Màn hình chính iPad để viết chữ bằng Apple Pencil mượt mà, tràn viền và không bị thanh trình duyệt che khuất.
              </p>

              {/* iOS / iPadOS Steps */}
              {isIOS ? (
                <div className="bg-white rounded-xl border border-amber-900/15 p-4 text-left space-y-3.5 shadow-xs">
                  {/* Step 1 */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-900 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-950">
                        Nhấn nút Chia Sẻ trên Safari
                      </p>
                      <p className="text-[11px] text-amber-900/70 flex items-center gap-1 mt-0.5">
                        Nhấn vào biểu tượng <Share className="w-3.5 h-3.5 text-amber-800" /> trên thanh trên cùng của iPad.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-900 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-950">
                        Chọn "Thêm vào MH chính"
                      </p>
                      <p className="text-[11px] text-amber-900/70 flex items-center gap-1 mt-0.5">
                        Cuộn xuống tìm mục <PlusSquare className="w-3.5 h-3.5 text-amber-800" /> <strong>Add to Home Screen</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-900 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-950">
                        Nhấn "Thêm" (Add) ở góc trên
                      </p>
                      <p className="text-[11px] text-amber-900/70 mt-0.5">
                        Biểu tượng Chép Kinh Online sẽ xuất hiện trên Màn hình chính iPad!
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Android / Chrome / Desktop */
                <div className="bg-white rounded-xl border border-amber-900/15 p-4 text-left space-y-3 shadow-xs">
                  {deferredPrompt ? (
                    <div className="text-center py-2">
                      <p className="text-xs text-amber-900/80 mb-3">
                        Nhấn nút bên dưới để cài đặt ứng dụng vào thiết bị ngay lập tức:
                      </p>
                      <button
                        onClick={handleInstallClick}
                        className="w-full py-2.5 px-4 bg-amber-900 hover:bg-amber-950 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Cài Đặt Ứng Dụng Ngay</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-amber-950">Cách thêm trên trình duyệt Chrome:</p>
                      <p className="text-[11px] text-amber-900/70">
                        Nhấn vào menu <strong>⋮ (3 chấm)</strong> ở góc phải trình duyệt $\to$ Chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào Màn hình chính"</strong>.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
