import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { apiClient, getAssetUrl } from '../api/client';
import type { UserProfile, MySutraAttempt, ApiResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { CertificateModal } from '../components/CertificateModal';
import { ExportPdfModal } from '../components/ExportPdfModal';
import { DailyStreakCard } from '../components/DailyStreakCard';
import {
  BookOpen,
  CheckCircle2,
  FileText,
  PenTool,
  Calendar,
  ArrowRight,
  RotateCcw,
  Clock,
  Layers,
  Award,
  Camera,
  Edit2,
  Check,
  X,
  Loader2,
  FileDown
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { updateUserLocal } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [attempts, setAttempts] = useState<MySutraAttempt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [selectedCertAttempt, setSelectedCertAttempt] = useState<MySutraAttempt | null>(null);
  const [selectedExportAttempt, setSelectedExportAttempt] = useState<MySutraAttempt | null>(null);

  // Avatar Upload State
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);

  // Edit Name State
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editFullName, setEditFullName] = useState<string>('');
  const [savingName, setSavingName] = useState<boolean>(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const [profileRes, attemptsRes] = await Promise.all([
        apiClient.get<ApiResponse<UserProfile>>('/user/profile'),
        apiClient.get<ApiResponse<MySutraAttempt[]>>('/user/my-sutras')
      ]);

      if (profileRes.data?.success) {
        setProfile(profileRes.data.data);
        setEditFullName(profileRes.data.data.fullName);
      }
      if (attemptsRes.data?.success) {
        setAttempts(attemptsRes.data.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải thông tin cá nhân', err);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý tải ảnh đại diện lên và convert WebP
  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn một tệp hình ảnh (.jpg, .png, .jpeg, .webp, ...).');
      return;
    }

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiClient.post<ApiResponse<string>>('/user/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        const newAvatarUrl = res.data.data;
        setProfile((prev) => (prev ? { ...prev, avatarUrl: newAvatarUrl } : null));
        updateUserLocal({ avatarUrl: newAvatarUrl });
      } else {
        alert(res.data?.message || 'Không thể cập nhật ảnh đại diện.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi tải ảnh đại diện lên máy chủ.');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Cập nhật họ tên
  const handleSaveName = async () => {
    if (!editFullName.trim()) {
      alert('Họ tên không được để trống.');
      return;
    }

    setSavingName(true);
    try {
      const res = await apiClient.put<ApiResponse<UserProfile>>('/user/profile', {
        fullName: editFullName.trim()
      });

      if (res.data?.success) {
        setProfile(res.data.data);
        updateUserLocal({ fullName: res.data.data.fullName });
        setIsEditingName(false);
      } else {
        alert(res.data?.message || 'Không thể cập nhật họ tên.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi lưu thông tin.');
    } finally {
      setSavingName(false);
    }
  };

  const handleStartNewAttempt = async (sutraId: number) => {
    if (!window.confirm('Bạn có chắc muốn khởi tạo một lượt chép mới cho bộ kinh này?')) return;
    try {
      const res = await apiClient.post<ApiResponse<any>>(`/progress/start-new-attempt/${sutraId}`);
      if (res.data?.success) {
        navigate(`/write/${sutraId}`);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể tạo lượt chép mới.');
    }
  };

  const filteredAttempts = attempts.filter((item) => {
    if (filter === 'ALL') return true;
    return item.status === filter;
  });

  return (
    <div className="min-h-screen bg-sutra-paper flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-900"></div>
            <p className="text-xs text-amber-900/70 mt-3">Đang tải thông tin công đức chép kinh...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* User Profile Header Card */}
            <div className="bg-white rounded-xl border border-amber-900/15 p-5 sm:p-6 shadow-xs relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                {/* Avatar with WebP Upload */}
                <div className="relative group">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarFileSelect}
                    accept="image/*"
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-xl overflow-hidden border-2 border-amber-800/20 shadow-sm cursor-pointer"
                    title="Nhấp để thay đổi ảnh đại diện (Tự động nén WebP)"
                  >
                    {profile?.avatarUrl ? (
                      <img
                        src={getAssetUrl(profile.avatarUrl)}
                        alt={profile.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-amber-100 text-amber-900 font-bold text-2xl flex items-center justify-center">
                        {profile?.fullName.charAt(0) || 'P'}
                      </div>
                    )}

                    {/* Hover Camera Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                      {uploadingAvatar ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Camera className="w-5 h-5 mb-0.5" />
                          <span className="text-[9px] font-bold">Đổi Ảnh</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 bg-amber-800 hover:bg-amber-900 text-white p-1.5 rounded-full shadow-md transition-all cursor-pointer"
                    title="Tải ảnh lên (Tự động chuyển đổi sang .WebP)"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                </div>

                {/* Info & Name Edit */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      {isEditingName ? (
                        <div className="flex items-center gap-1.5 mt-1">
                          <input
                            type="text"
                            value={editFullName}
                            onChange={(e) => setEditFullName(e.target.value)}
                            className="h-8 px-2.5 rounded-md border border-amber-800 text-sm font-bold text-amber-950 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveName}
                            disabled={savingName}
                            className="h-8 px-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-md text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {savingName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            <span>Lưu</span>
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingName(false);
                              setEditFullName(profile?.fullName || '');
                            }}
                            className="h-8 px-2 text-gray-500 hover:text-gray-700 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                          <h1 className="text-xl sm:text-2xl font-bold text-amber-950 tracking-tight">
                            {profile?.fullName}
                          </h1>
                          <button
                            onClick={() => setIsEditingName(true)}
                            className="p-1 text-amber-800/60 hover:text-amber-800 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                            title="Sửa tên / Pháp danh"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-amber-900/60 font-medium mt-0.5">{profile?.email}</p>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-900/10 text-amber-900 text-xs self-center sm:self-auto">
                      <Calendar className="w-3.5 h-3.5 text-amber-700" />
                      <span>Tham gia: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('vi-VN') : '---'}</span>
                    </div>
                  </div>

                  <p className="text-xs text-amber-900/75 mt-3 leading-relaxed">
                    "Chép một câu kinh, gieo một hạt giống thiện lành. Từng nét bút là sự an tịnh và tập trung nơi tâm trí."
                  </p>
                </div>
              </div>
            </div>

            {/* 4 KPI Merit Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {/* Total Sutras */}
              <div className="bg-white rounded-lg border border-amber-900/15 p-4 shadow-xs flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-amber-100/80 text-amber-900 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-amber-900/60 uppercase tracking-wider">Bộ Kinh Đã Chép</p>
                  <p className="text-lg sm:text-xl font-black text-amber-950 mt-0.5">
                    {profile?.totalSutrasJoined || 0}
                  </p>
                </div>
              </div>

              {/* Completed */}
              <div className="bg-white rounded-lg border border-amber-900/15 p-4 shadow-xs flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-emerald-100/80 text-emerald-900 flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-amber-900/60 uppercase tracking-wider">Lượt Viên Mãn</p>
                  <p className="text-lg sm:text-xl font-black text-emerald-800 mt-0.5">
                    {profile?.totalSutrasCompleted || 0}
                  </p>
                </div>
              </div>

              {/* Pages Written */}
              <div className="bg-white rounded-lg border border-amber-900/15 p-4 shadow-xs flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-sky-100/80 text-sky-900 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-sky-700" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-amber-900/60 uppercase tracking-wider">Trang A4 Đã Viết</p>
                  <p className="text-lg sm:text-xl font-black text-amber-950 mt-0.5">
                    {profile?.totalPagesWritten || 0}
                  </p>
                </div>
              </div>

              {/* Words Written */}
              <div className="bg-white rounded-lg border border-amber-900/15 p-4 shadow-xs flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-amber-100/80 text-amber-900 flex items-center justify-center flex-shrink-0">
                  <PenTool className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-amber-900/60 uppercase tracking-wider">Tổng Từ Đã Chép</p>
                  <p className="text-lg sm:text-xl font-black text-amber-950 mt-0.5">
                    {profile?.totalWordsWritten?.toLocaleString('vi-VN') || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Daily Practice Streak & Reminders Widget */}
            <DailyStreakCard />

            {/* My Sutras Section */}
            <div className="bg-white rounded-xl border border-amber-900/15 p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-amber-950 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-800" />
                    <span>Hành Trình Chép Kinh</span>
                  </h2>
                  <p className="text-xs text-amber-900/60 mt-0.5">
                    Danh sách các bộ kinh và tiến độ chi tiết từng lượt chép
                  </p>
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-lg self-start sm:self-auto">
                  <button
                    onClick={() => setFilter('ALL')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      filter === 'ALL' ? 'bg-white text-amber-950 shadow-xs' : 'text-gray-600 hover:text-amber-950'
                    }`}
                  >
                    Tất cả ({attempts.length})
                  </button>
                  <button
                    onClick={() => setFilter('IN_PROGRESS')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      filter === 'IN_PROGRESS' ? 'bg-white text-amber-950 shadow-xs' : 'text-gray-600 hover:text-amber-950'
                    }`}
                  >
                    Đang chép ({attempts.filter((a) => a.status === 'IN_PROGRESS').length})
                  </button>
                  <button
                    onClick={() => setFilter('COMPLETED')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      filter === 'COMPLETED' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-600 hover:text-emerald-800'
                    }`}
                  >
                    Viên mãn ({attempts.filter((a) => a.status === 'COMPLETED').length})
                  </button>
                </div>
              </div>

              {/* Sutras List */}
              <div className="mt-5 space-y-3.5">
                {filteredAttempts.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-10 h-10 text-amber-900/30 mx-auto mb-2.5" />
                    <p className="text-sm font-semibold text-amber-950">Chưa có bộ kinh nào trong danh sách</p>
                    <p className="text-xs text-amber-900/60 mt-1 max-w-sm mx-auto">
                      Hãy bắt đầu gieo duyên bằng việc chọn một bộ kinh từ Thư viện kinh.
                    </p>
                    <Link
                      to="/"
                      className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-amber-900 text-white rounded-md text-xs font-bold hover:bg-amber-950 shadow-xs transition-all"
                    >
                      <span>Khám Phá Thư Viện Kinh</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  filteredAttempts.map((item) => (
                    <div
                      key={item.attemptId}
                      className="bg-amber-50/40 hover:bg-amber-50/70 transition-colors border border-amber-900/10 rounded-lg p-4 sm:p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      {/* Sutra Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-bold text-amber-950 truncate">
                            {item.title}
                          </h3>
                          {item.attemptNumber > 1 && (
                            <span className="px-2 py-0.5 rounded bg-amber-200/70 text-amber-900 text-[10px] font-bold">
                              Lượt #{item.attemptNumber}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-semibold">
                            {item.scriptType === 'QUOC_NGU' ? 'Tiếng Việt' : item.scriptType === 'HAN' ? 'Chữ Hán' : 'Pali'}
                          </span>
                          {item.status === 'COMPLETED' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Viên Mãn 100%</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold">
                              <Clock className="w-3 h-3" />
                              <span>Đang chép (Trang {item.currentPageNumber}/{item.totalPages})</span>
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p className="text-xs text-amber-900/70 mt-1 line-clamp-1">{item.description}</p>
                        )}

                        {/* Progress bar */}
                        <div className="mt-3 max-w-md">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-semibold text-amber-950">
                              Tiến độ: {item.progressPercent}%
                            </span>
                            <span className="text-amber-900/70">
                              {item.completedWords.toLocaleString('vi-VN')} / {item.totalWords.toLocaleString('vi-VN')} từ
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                item.status === 'COMPLETED' ? 'bg-emerald-600' : 'bg-amber-800'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, item.progressPercent))}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-900/10 flex-wrap sm:flex-nowrap">
                        {item.status === 'COMPLETED' && (
                          <>
                            <button
                              type="button"
                              onClick={() => setSelectedCertAttempt(item)}
                              className="h-8 px-2.5 rounded-lg border border-amber-900/20 bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                              title="Xem và tải Bằng Chứng Nhận Công Đức"
                            >
                              <Award className="w-3.5 h-3.5 text-amber-700" />
                              <span>Chứng Nhận</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStartNewAttempt(item.sutraId)}
                              className="h-8 px-2.5 rounded-lg border border-amber-900/20 bg-white hover:bg-amber-50 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                              title="Bắt đầu một lượt chép mới từ đầu"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                              <span>Chép Lượt Mới</span>
                            </button>
                          </>
                        )}

                        {/* Nút Xuất Bản Sổ Tay A4 dạng PDF */}
                        <button
                          type="button"
                          onClick={() => setSelectedExportAttempt(item)}
                          className="h-8 px-2.5 rounded-lg border border-amber-900/20 bg-amber-50/80 hover:bg-amber-100 text-amber-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                          title="Xuất toàn bộ trang sổ tay thành tệp PDF khổ A4"
                        >
                          <FileDown className="w-3.5 h-3.5 text-amber-800" />
                          <span className="hidden sm:inline">Xuất PDF</span>
                        </button>

                        <Link
                          to={`/write/${item.sutraId}?attemptId=${item.attemptId}`}
                          className={`h-8 px-3.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0 ${
                            item.status === 'COMPLETED'
                              ? 'bg-amber-800 hover:bg-amber-900 text-white'
                              : 'bg-amber-900 hover:bg-amber-950 text-white'
                          }`}
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>{item.status === 'COMPLETED' ? 'Xem Lại Sổ Kinh' : 'Tiếp Tục Chép'}</span>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal Bằng Chứng Nhận Công Đức */}
      {selectedCertAttempt && (
        <CertificateModal
          isOpen={!!selectedCertAttempt}
          onClose={() => setSelectedCertAttempt(null)}
          userName={profile?.fullName || 'Phật Tử Tinh Tấn'}
          sutraTitle={selectedCertAttempt.title}
          attemptNumber={selectedCertAttempt.attemptNumber}
          totalWords={selectedCertAttempt.totalWords}
          completedDate={selectedCertAttempt.completedAt}
        />
      )}

      {/* Modal Xuất Bản Sổ Tay PDF A4 */}
      {selectedExportAttempt && (
        <ExportPdfModal
          isOpen={!!selectedExportAttempt}
          onClose={() => setSelectedExportAttempt(null)}
          sutraId={selectedExportAttempt.sutraId}
          attemptId={selectedExportAttempt.attemptId}
          userId={profile?.id || 0}
          sutraTitle={selectedExportAttempt.title}
          scriptType={selectedExportAttempt.scriptType}
          totalNotebookPages={selectedExportAttempt.totalPages || 1}
          userName={profile?.fullName || 'Phật Tử Tinh Tấn'}
        />
      )}

      <Footer />
    </div>
  );
};
