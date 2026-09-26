import React, { useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import {
  UserCheck,
  UserPlus,
  AlertCircle,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { loginWithGoogle, loginWithCredentials, register } = useAuth();

  // Mode: 'LOGIN' | 'REGISTER'
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Form Fields
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Lấy đường dẫn cần chuyển hướng sau khi đăng nhập thành công
  const redirectTarget = searchParams.get('redirect') || (location.state as any)?.from?.pathname || '/';

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError('Không nhận được token từ Google.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await loginWithGoogle(credentialResponse.credential);
      navigate(redirectTarget, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Đăng nhập Google thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Xác thực với tài khoản Google không thành công.');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'LOGIN') {
        await loginWithCredentials(email, password);
      } else {
        if (!fullName.trim()) {
          setError('Vui lòng nhập họ và tên.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Mật khẩu phải có ít nhất 6 ký tự.');
          setLoading(false);
          return;
        }
        await register(fullName, email, password);
      }
      navigate(redirectTarget, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Thao tác không thành công.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sutra-paper flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-xl border border-amber-900/15 shadow-sm p-5 sm:p-6 relative overflow-hidden">
          {/* Header */}
          <div className="text-center mb-5">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center mx-auto mb-2.5 shadow-inner">
              {mode === 'LOGIN' ? (
                <UserCheck className="w-6 h-6 text-amber-800" />
              ) : (
                <UserPlus className="w-6 h-6 text-amber-800" />
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-amber-950 tracking-tight">
              {mode === 'LOGIN' ? 'Đăng Nhập' : 'Đăng Ký Tài Khoản'}
            </h2>
            <p className="text-xs text-amber-900/70 mt-0.5 leading-relaxed">
              {redirectTarget !== '/'
                ? 'Vui lòng đăng nhập để bắt đầu ghi chép và lưu giữ tiến độ'
                : 'Lưu giữ nét bút, theo dõi công đức và đồng bộ tiến trình chép kinh'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="bg-amber-100/60 p-1 rounded-lg flex items-center gap-1 mb-4 border border-amber-900/10">
            <button
              type="button"
              onClick={() => {
                setMode('LOGIN');
                setError('');
              }}
              className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${mode === 'LOGIN' ? 'bg-white text-amber-950 shadow-xs' : 'text-amber-900/70 hover:text-amber-950'
                }`}
            >
              Đăng Nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('REGISTER');
                setError('');
              }}
              className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${mode === 'REGISTER' ? 'bg-white text-amber-950 shadow-xs' : 'text-amber-900/70 hover:text-amber-950'
                }`}
            >
              Đăng Ký
            </button>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-In 1-Tap */}
          <div className="space-y-3">
            <div className="w-full flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_blue"
                size="large"
                text={mode === 'LOGIN' ? 'signin_with' : 'signup_with'}
                shape="rectangular"
                width="100%"
              />
            </div>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                hoặc bằng Email
              </span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* Credentials Form */}
            <form onSubmit={handleFormSubmit} className="space-y-3">
              {mode === 'REGISTER' && (
                <div>
                  <label className="block text-[11px] font-bold text-amber-950 mb-1 flex items-center gap-1">
                    <UserIcon className="w-3 h-3 text-amber-800" />
                    <span>Họ và Tên / Pháp Danh</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full h-9 px-3 rounded-lg border border-gray-300 focus:border-amber-800 focus:outline-none focus:ring-1 focus:ring-amber-800 text-xs font-medium"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-amber-950 mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-amber-800" />
                  <span>Địa chỉ Email</span>
                </label>
                <input
                  type="email"
                  inputMode="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="phattu@gmail.com"
                  className="w-full h-9 px-3 rounded-lg border border-gray-300 focus:border-amber-800 focus:outline-none focus:ring-1 focus:ring-amber-800 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-950 mb-1 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-800" />
                  <span>Mật khẩu</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-9 pl-3 pr-9 rounded-lg border border-gray-300 focus:border-amber-800 focus:outline-none focus:ring-1 focus:ring-amber-800 text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-9 bg-amber-900 hover:bg-amber-950 text-white rounded-lg text-xs font-bold shadow-xs active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 mt-1"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'LOGIN' ? 'Đăng Nhập' : 'Tạo Tài Khoản'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
