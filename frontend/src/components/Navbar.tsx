import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAssetUrl } from '../api/client';
import { User, LogOut, ShieldAlert, Tablet } from 'lucide-react';
import { InstallPwaModal } from './InstallPwaModal';
import { ZenAudioPlayer } from './ZenAudioPlayer';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPwaModal, setShowPwaModal] = useState<boolean>(false);

  return (
    <>
      <header className="bg-sutra-paper border-b border-amber-900/10 px-3 sm:px-4 py-2 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 active:opacity-80 shrink-0">
            <img src="/images/logo.png" alt="logo" className="w-9 h-9 sm:w-10 sm:h-10 rounded-md border border-amber-900/20 shadow-xs" />
            <div className="flex flex-col">
              <h1 className="text-xs sm:text-base font-bold text-amber-950 tracking-wide leading-tight">
                CHÉP KINH ONLINE
              </h1>
              <p className="text-[10px] sm:text-[12px] text-amber-900/60 font-medium leading-tight">Sổ Tay Chép Kinh A4</p>
            </div>
          </Link>

          {/* Center / Right Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Zen Audio Player */}
            <ZenAudioPlayer />

            {/* Lối tắt cài đặt cho iPad / Tablet */}
            <button
              onClick={() => setShowPwaModal(true)}
              className="h-8 px-2.5 sm:px-3 rounded-lg text-xs font-semibold text-amber-950 bg-amber-100/70 hover:bg-amber-200/80 border border-amber-900/15 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              title="Cài đặt Chép Kinh Online cho iPad & Tablet"
            >
              <Tablet className="w-3.5 h-3.5 text-amber-800" />
              <span className="hidden md:inline">Cài Cho iPad</span>
            </button>

            {/* Menu Actions */}
            <nav className="flex items-center gap-1 sm:gap-1.5">
              {user?.userType === 'Admin' && (
                <Link
                  to="/admin"
                  className={`h-8 px-2.5 sm:px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${location.pathname.startsWith('/admin') ? 'bg-amber-900 text-white shadow-xs' : 'text-amber-950 hover:bg-amber-100/60'
                    }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">Quản Trị</span>
                </Link>
              )}

              {isAuthenticated ? (
                <div className="flex items-center gap-1.5 ml-1 pl-1.5 border-l border-amber-900/10">
                  <Link to="/profile" className="h-8 px-1.5 rounded-lg flex items-center gap-1.5 hover:bg-amber-100/50 transition-colors">
                    {user?.avatarUrl ? (
                      <img src={getAssetUrl(user.avatarUrl)} alt={user.fullName} className="w-6 h-6 rounded-md border border-amber-900/20 object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-md bg-amber-200 text-amber-900 font-bold flex items-center justify-center text-xs">
                        {user?.fullName.charAt(0)}
                      </div>
                    )}
                    <span className="text-xs font-semibold text-amber-950 hidden lg:inline">{user?.fullName}</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Đăng xuất"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="h-8 px-3 rounded-lg text-xs font-bold bg-amber-800 text-white hover:bg-amber-900 active:scale-95 transition-all shadow-xs flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Đăng Nhập</span>
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Modal Hướng Dẫn Cài Đặt PWA iPad */}
      <InstallPwaModal isOpen={showPwaModal} onClose={() => setShowPwaModal(false)} />
    </>
  );
};
