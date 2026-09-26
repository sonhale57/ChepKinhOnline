import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginAsAdmin } = useAuth();

  const [email, setEmail] = useState<string>('admin@chepkinh.vn');
  const [password, setPassword] = useState<string>('Admin@123456');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await loginAsAdmin(email, password);
      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Sai thông tin đăng nhập quản trị');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col items-center justify-center p-4 font-sans selection:bg-amber-800 selection:text-white">
      {/* Background radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-800 via-stone-900 to-black pointer-events-none opacity-80"></div>

      <div className="w-full max-w-sm bg-stone-800/90 backdrop-blur-md rounded-xl border border-stone-700 shadow-2xl p-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-13 h-13 rounded-xl bg-amber-950/80 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-stone-100 tracking-wide uppercase">
            Hệ Thống Quản Trị
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Cổng quản lý bộ kinh & phân tích báo cáo
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleAdminSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-stone-400" />
              <span>Tài khoản Quản Trị</span>
            </label>
            <input
              type="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@chepkinh.vn"
              className="w-full h-10 px-3.5 rounded-lg bg-stone-900/90 border border-stone-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-medium text-stone-100 placeholder-stone-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-stone-400" />
              <span>Mật khẩu</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 pl-3.5 pr-10 rounded-lg bg-stone-900/90 border border-stone-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-medium text-stone-100 placeholder-stone-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-amber-700 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-md active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Đang xác thực...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Đăng Nhập Quản Trị</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-stone-700/60 text-center">
          <p className="text-[11px] text-stone-500">
            Truy cập được bảo mật & kiểm toán nhật ký theo tiêu chuẩn RBAC.
          </p>
        </div>
      </div>
    </div>
  );
};
