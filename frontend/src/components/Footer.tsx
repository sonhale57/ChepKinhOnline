import React, { useState } from 'react';
import { ShieldCheck, Mail, Globe, X, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);

  return (
    <>
      <footer className="bg-amber-100/40 border-t border-amber-900/10 mt-auto py-6 px-4 text-amber-950 font-sans select-none">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3">
            <img
              src="/images/logo.png"
              alt="Chép Kinh Online Logo"
              className="w-8 h-8 rounded-md border border-amber-900/20 shadow-xs shrink-0"
            />
            <div>
              <p className="text-xs sm:text-sm font-bold text-amber-950 leading-tight">
                CHÉP KINH ONLINE
              </p>
              <p className="text-[11px] text-amber-900/70 font-medium">
                Sổ tay chép kinh A4 trang nghiêm & thanh tịnh
              </p>
            </div>
          </div>

          {/* Privacy Note Summary & Trigger */}
          <div className="max-w-md text-xs text-amber-900/80 leading-relaxed">
            <div className="flex items-center justify-center md:justify-start gap-1.5 font-bold text-amber-950 text-[11.5px] mb-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Chính Sách Bảo Mật & Quyền Riêng Tư</span>
            </div>
            <button
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline underline-offset-2 cursor-pointer inline-block"
            >
              Xem chi tiết chính sách →
            </button>
          </div>

          {/* Copyright, Owner & Contact */}
          <div className="flex flex-col items-center md:items-end text-xs text-amber-900/75 space-y-1">
            <p className="font-semibold text-amber-950">
              © 2026 Chép Kinh Online • Chủ sở hữu: <span className="font-bold text-amber-900">Sơn Hà Lê</span>
            </p>
            <div className="flex items-center gap-3 text-[11.5px]">
              <a
                href="https://sonhale.id.vn"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-amber-950 hover:underline transition-colors"
                title="Trang thông tin tác giả"
              >
                <Globe className="w-3 h-3 text-amber-800" />
                <span>sonhale.id.vn</span>
              </a>
              <span>•</span>
              <a
                href="mailto:sonhale57@gmail.com"
                className="flex items-center gap-1 hover:text-amber-950 hover:underline transition-colors"
                title="Gửi email liên hệ"
              >
                <Mail className="w-3 h-3 text-amber-800" />
                <span>sonhale57@gmail.com</span>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal Chi Tiết Chính Sách Bảo Mật */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 sm:p-6 max-w-lg w-full border border-amber-900/20 shadow-xl animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-amber-900/10 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-amber-950 text-sm sm:text-base">
                    Chính Sách Bảo Mật Thông Tin
                  </h3>
                  <p className="text-[11px] text-amber-900/60">Chép Kinh Online (chepkinh.vn)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-[13px] text-amber-950/85 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-900/10">
                <p className="font-bold text-amber-900 mb-1">1. Mục đích thu thập dữ liệu:</p>
                <p>
                  Các thông tin cá nhân (Email, Họ tên, Ảnh đại diện) và dữ liệu nét bút sổ tay A4 do người dùng cung cấp chỉ được sử dụng duy nhất cho mục đích:
                </p>
                <ul className="list-disc list-inside mt-1.5 space-y-0.5 text-amber-900/80">
                  <li>Xác minh danh tính tài khoản đăng nhập (qua Google hoặc tài khoản hệ thống).</li>
                  <li>Lưu trữ, sao lưu và đồng bộ nét chữ chép kinh cá nhân giữa các thiết bị.</li>
                  <li>Cấp chứng nhận công đức viên mãn và nhắc nhở thời khóa tu học hàng ngày.</li>
                </ul>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-900/10">
                <p className="font-bold text-amber-900 mb-1">2. Cam kết phi thương mại & Bảo mật:</p>
                <p>
                  Hệ thống cam kết tuyệt đối <strong>KHÔNG</strong> sử dụng dữ liệu người dùng cho bất kỳ mục đích thương mại, quảng cáo, tiếp thị hay chia sẻ cho bên thứ ba nào khác dưới mọi hình thức.
                </p>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-900/10">
                <p className="font-bold text-amber-900 mb-1">3. Quyền của người dùng & Thông tin liên hệ:</p>
                <p>
                  Người dùng có toàn quyền xóa dữ liệu, đổi ảnh đại diện hoặc yêu cầu hỗ trợ bất cứ lúc nào qua thông tin quản trị:
                </p>
                <div className="mt-2 text-xs text-amber-950 space-y-0.5">
                  <p>• <strong>Chủ sở hữu</strong>: Sơn Hà Lê</p>
                  <p>• <strong>Website</strong>: <a href="https://sonhale.id.vn" target="_blank" rel="noopener noreferrer" className="text-amber-800 underline">sonhale.id.vn</a></p>
                  <p>• <strong>Email hỗ trợ</strong>: <a href="mailto:sonhale57@gmail.com" className="text-amber-800 underline">sonhale57@gmail.com</a></p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-amber-900/10 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="h-8.5 px-4 rounded-lg bg-amber-900 hover:bg-amber-950 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                Tôi Đã Hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
