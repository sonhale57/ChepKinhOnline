import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '../components/Navbar';
import { apiClient, getAssetUrl } from '../api/client';
import type { SutraSummary, ScriptType, GridType, DashboardStats, AdminUser, PagedResult, ApiResponse } from '../types';
import {
  BookPlus,
  Eye,
  EyeOff,
  CheckCircle,
  FileUp,
  FileText,
  Trash2,
  Edit3,
  Plus,
  Sparkles,
  Loader2,
  AlertCircle,
  BookOpen,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  X,
  BarChart3,
  Users,
  UserCheck,
  Award,
  PenTool,
  Clock,
  RefreshCw,
  Search,
  UserX,
  ShieldCheck,
  Key,
  Globe
} from 'lucide-react';

interface PageDraft {
  pageNumber: number;
  contentText: string;
  lineCount: number;
  defaultFontSize: number;
  defaultGridType: GridType;
}

export const AdminDashboard: React.FC = () => {
  // Admin Main Tab: 'ANALYTICS' | 'SUTRAS' | 'USERS'
  const [adminTab, setAdminTab] = useState<'ANALYTICS' | 'SUTRAS' | 'USERS'>('ANALYTICS');

  // Stats State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);

  // Users State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState<boolean>(false);
  const [usersPage, setUsersPage] = useState<number>(1);
  const [usersTotalPages, setUsersTotalPages] = useState<number>(1);
  const [usersTotalCount, setUsersTotalCount] = useState<number>(0);
  const [userKeyword, setUserKeyword] = useState<string>('');

  // Sutras List State
  const [sutras, setSutras] = useState<SutraSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingSutraId, setEditingSutraId] = useState<number | null>(null);

  // Modal Tabs: 'PDF' | 'TEXT'
  const [inputMode, setInputMode] = useState<'PDF' | 'TEXT'>('PDF');

  // Form Fields
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [scriptType, setScriptType] = useState<ScriptType>('QUOC_NGU');
  const [originalSource, setOriginalSource] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');

  // Extracted / Configured Pages
  const [pages, setPages] = useState<PageDraft[]>([]);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);

  // PDF Upload State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isExtractingPdf, setIsExtractingPdf] = useState<boolean>(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submit State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await apiClient.get('/admin/reports/dashboard-stats');
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Error loading dashboard stats', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchUsers = async (page = 1, keyword = userKeyword) => {
    setUsersLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<PagedResult<AdminUser>>>('/admin/users', {
        params: { pageIndex: page, pageSize: 10, keyword: keyword.trim() || undefined }
      });
      if (res.data?.success) {
        setUsers(res.data.data.items);
        setUsersPage(res.data.data.pageIndex);
        setUsersTotalPages(res.data.data.totalPages || 1);
        setUsersTotalCount(res.data.data.totalCount);
      }
    } catch (err) {
      console.error('Error loading users', err);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: number, currentActive: boolean) => {
    const action = currentActive ? 'khóa' : 'mở khóa';
    if (!window.confirm(`Bạn có chắc muốn ${action} tài khoản này?`)) return;

    try {
      const res = await apiClient.post<ApiResponse<boolean>>(`/admin/users/${userId}/toggle-status`);
      if (res.data?.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: res.data.data } : u))
        );
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể thay đổi trạng thái người dùng.');
    }
  };

  const fetchSutras = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/sutras');
      if (res.data?.success) {
        setSutras(res.data.data.items);
      }
    } catch (err) {
      console.error('Error loading admin sutras', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchSutras();
    fetchUsers(1);
  }, []);

  // Reset Modal
  const resetForm = () => {
    setEditingSutraId(null);
    setTitle('');
    setDescription('');
    setScriptType('QUOC_NGU');
    setOriginalSource('');
    setRawText('');
    setPages([]);
    setSelectedPageIndex(0);
    setPdfFile(null);
    setExtractError(null);
    setInputMode('PDF');
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEditModal = async (sutraSummary: SutraSummary) => {
    resetForm();
    setEditingSutraId(sutraSummary.id);
    setTitle(sutraSummary.title);
    setDescription(sutraSummary.description || '');
    setScriptType(sutraSummary.scriptType);
    setOriginalSource(sutraSummary.originalSource || '');
    setInputMode('TEXT');
    setShowModal(true);

    try {
      const res = await apiClient.get(`/sutras/${sutraSummary.id}`);
      if (res.data?.success) {
        const detail = res.data.data;
        const mappedPages: PageDraft[] = (detail.pages || []).map((p: any) => ({
          pageNumber: p.pageNumber,
          contentText: p.contentText,
          lineCount: p.lineCount || 8,
          defaultFontSize: p.defaultFontSize || 26,
          defaultGridType: p.defaultGridType || (sutraSummary.scriptType === 'HAN' ? 'GRID_HAN' : 'GRID_OLY'),
        }));
        setPages(mappedPages);
        if (mappedPages.length > 0) {
          setSelectedPageIndex(0);
        }
      }
    } catch (err) {
      console.error('Error fetching sutra details for editing', err);
      alert('Không thể tải chi tiết bộ kinh để sửa.');
    }
  };

  // Upload & Extract PDF
  const handlePdfFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setExtractError('Vui lòng chọn tệp PDF hợp lệ.');
      return;
    }

    setPdfFile(file);
    setExtractError(null);
    setIsExtractingPdf(true);

    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('scriptType', scriptType);

    try {
      const res = await apiClient.post('/admin/sutras/extract-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        const data = res.data.data;
        const extractedPages: PageDraft[] = (data.pages || []).map((p: any) => ({
          pageNumber: p.pageNumber,
          contentText: p.contentText,
          lineCount: 8,
          defaultFontSize: scriptType === 'HAN' ? 32 : 26,
          defaultGridType: scriptType === 'HAN' ? 'GRID_HAN' : 'GRID_OLY',
        }));

        setPages(extractedPages);
        setSelectedPageIndex(0);
        setOriginalSource(`PDF: ${file.name}`);
      } else {
        setExtractError(res.data?.message || 'Không thể trích xuất nội dung từ tệp PDF.');
      }
    } catch (err: any) {
      console.error('Error extracting PDF:', err);
      setExtractError(err.response?.data?.message || 'Lỗi khi trích xuất PDF từ máy chủ.');
    } finally {
      setIsExtractingPdf(false);
    }
  };

  // Tự động phân trang A4 từ Text toàn văn
  const handleAutoPaginateFromText = () => {
    if (!rawText.trim()) {
      alert('Vui lòng nhập hoặc dán nội dung kinh trước.');
      return;
    }

    const paragraphs = rawText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    const newPages: PageDraft[] = [];
    let currentPageText = '';
    let pageNum = 1;

    for (const p of paragraphs) {
      if ((currentPageText + ' ' + p).length > 550) {
        if (currentPageText.trim()) {
          newPages.push({
            pageNumber: pageNum++,
            contentText: currentPageText.trim(),
            lineCount: 8,
            defaultFontSize: scriptType === 'HAN' ? 32 : 26,
            defaultGridType: scriptType === 'HAN' ? 'GRID_HAN' : 'GRID_OLY',
          });
          currentPageText = p;
        }
      } else {
        currentPageText = currentPageText ? `${currentPageText}\n\n${p}` : p;
      }
    }

    if (currentPageText.trim()) {
      newPages.push({
        pageNumber: pageNum,
        contentText: currentPageText.trim(),
        lineCount: 8,
        defaultFontSize: scriptType === 'HAN' ? 32 : 26,
        defaultGridType: scriptType === 'HAN' ? 'GRID_HAN' : 'GRID_OLY',
      });
    }

    setPages(newPages);
    setSelectedPageIndex(0);
  };

  // Thao tác với từng trang
  const handleUpdateCurrentPage = (field: keyof PageDraft, value: any) => {
    setPages((prev) => {
      const updated = [...prev];
      if (updated[selectedPageIndex]) {
        updated[selectedPageIndex] = {
          ...updated[selectedPageIndex],
          [field]: value,
        };
      }
      return updated;
    });
  };

  const handleAddPage = () => {
    setPages((prev) => {
      const newPage: PageDraft = {
        pageNumber: prev.length + 1,
        contentText: '',
        lineCount: 8,
        defaultFontSize: scriptType === 'HAN' ? 32 : 26,
        defaultGridType: scriptType === 'HAN' ? 'GRID_HAN' : 'GRID_OLY',
      };
      return [...prev, newPage];
    });
    setSelectedPageIndex(pages.length);
  };

  const handleDeletePage = (indexToDelete: number) => {
    if (pages.length <= 1) {
      alert('Bộ kinh cần ít nhất 1 trang.');
      return;
    }
    setPages((prev) => {
      const filtered = prev.filter((_, idx) => idx !== indexToDelete);
      return filtered.map((p, idx) => ({ ...p, pageNumber: idx + 1 }));
    });
    if (selectedPageIndex >= pages.length - 1) {
      setSelectedPageIndex(Math.max(0, pages.length - 2));
    }
  };

  // Submit Save or Update
  const handleSubmitSutra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tên bộ kinh.');
      return;
    }
    if (pages.length === 0 || pages.every((p) => !p.contentText.trim())) {
      alert('Vui lòng cung cấp nội dung ít nhất 1 trang.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title,
        description,
        scriptType,
        originalSource: originalSource || (inputMode === 'PDF' ? `PDF: ${pdfFile?.name}` : 'Quản trị viên nạp'),
        pages: pages.filter((p) => p.contentText.trim().length > 0),
      };

      let res;
      if (editingSutraId) {
        res = await apiClient.put(`/admin/sutras/${editingSutraId}`, payload);
      } else {
        res = await apiClient.post('/admin/sutras', payload);
      }

      if (res.data?.success) {
        setShowModal(false);
        resetForm();
        await fetchSutras();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi khi lưu bộ kinh.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Publish
  const handleTogglePublish = async (id: number) => {
    try {
      const res = await apiClient.post(`/admin/sutras/${id}/toggle-publish`);
      if (res.data?.success) {
        setSutras((prev) =>
          prev.map((s) => (s.id === id ? { ...s, isPublished: res.data.data.isPublished } : s))
        );
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể thay đổi trạng thái xuất bản.');
    }
  };

  // Delete Sutra
  const handleDeleteSutra = async (id: number, sutraTitle: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bộ kinh "${sutraTitle}"? Toàn bộ các trang và tiến độ liên quan sẽ bị xóa.`)) {
      return;
    }
    try {
      const res = await apiClient.delete(`/admin/sutras/${id}`);
      if (res.data?.success) {
        setSutras((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa bộ kinh.');
    }
  };

  const activePage = pages[selectedPageIndex];

  return (
    <div className="min-h-screen bg-sutra-paper flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header Dashboard with Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-900/10 text-amber-900 rounded-md">
                <BarChart3 className="w-5 h-5 text-amber-900" />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-amber-950">
                Trung Tâm Quản Trị & Báo Cáo
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-amber-900/70 mt-0.5">
              Theo dõi dữ liệu người dùng, tiến độ chép kinh và quản lý thư viện kinh điển
            </p>
          </div>

          {/* Action Buttons & Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-amber-100/70 p-1 rounded-lg flex items-center gap-1 border border-amber-900/10">
              <button
                onClick={() => setAdminTab('ANALYTICS')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  adminTab === 'ANALYTICS'
                    ? 'bg-white text-amber-950 shadow-xs'
                    : 'text-amber-900/70 hover:text-amber-950'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Báo Cáo Thống Kê</span>
              </button>

              <button
                onClick={() => setAdminTab('SUTRAS')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  adminTab === 'SUTRAS'
                    ? 'bg-white text-amber-950 shadow-xs'
                    : 'text-amber-900/70 hover:text-amber-950'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Quản Lý Bộ Kinh</span>
              </button>

              <button
                onClick={() => {
                  setAdminTab('USERS');
                  fetchUsers(1);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  adminTab === 'USERS'
                    ? 'bg-white text-amber-950 shadow-xs'
                    : 'text-amber-900/70 hover:text-amber-950'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Quản Lý Người Dùng</span>
              </button>
            </div>

            {adminTab === 'ANALYTICS' ? (
              <button
                onClick={fetchStats}
                disabled={statsLoading}
                className="h-8.5 px-3 bg-white hover:bg-amber-50 text-amber-900 border border-amber-900/20 rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                title="Làm mới dữ liệu thống kê"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${statsLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Làm Mới</span>
              </button>
            ) : adminTab === 'USERS' ? (
              <button
                onClick={() => fetchUsers(usersPage)}
                disabled={usersLoading}
                className="h-8.5 px-3 bg-white hover:bg-amber-50 text-amber-900 border border-amber-900/20 rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                title="Tải lại danh sách người dùng"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${usersLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Làm Mới</span>
              </button>
            ) : (
              <button
                onClick={handleOpenCreateModal}
                className="h-8.5 px-3.5 bg-amber-900 hover:bg-amber-950 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <BookPlus className="w-3.5 h-3.5" />
                <span>Nạp Bộ Kinh Mới</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: BÁO CÁO THỐNG KÊ (ADMIN ANALYTICS) */}
        {adminTab === 'ANALYTICS' && (
          <div className="space-y-6">
            {/* 4 Top KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {/* Total Users */}
              <div className="bg-white rounded-lg p-4 border border-amber-900/15 shadow-xs flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-amber-100/80 text-amber-900 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-amber-900/60 uppercase tracking-wider">Người Dùng Đăng Ký</p>
                  <p className="text-xl sm:text-2xl font-black text-amber-950 mt-0.5">
                    {statsLoading ? '...' : stats?.totalUsers || 0}
                  </p>
                </div>
              </div>

              {/* Total Participants */}
              <div className="bg-white rounded-lg p-4 border border-amber-900/15 shadow-xs flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-amber-100/80 text-amber-900 flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-amber-900/60 uppercase tracking-wider">Đã Tham Gia Chép Kinh</p>
                  <p className="text-xl sm:text-2xl font-black text-amber-950 mt-0.5">
                    {statsLoading ? '...' : stats?.totalParticipants || 0}
                  </p>
                </div>
              </div>

              {/* Total Attempts & Completed */}
              <div className="bg-white rounded-lg p-4 border border-amber-900/15 shadow-xs flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-emerald-100/80 text-emerald-900 flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-amber-900/60 uppercase tracking-wider">Lượt Chép / Viên Mãn</p>
                  <p className="text-xl sm:text-2xl font-black text-emerald-800 mt-0.5">
                    {statsLoading ? '...' : `${stats?.totalAttempts || 0} / ${stats?.totalCompletedAttempts || 0}`}
                  </p>
                </div>
              </div>

              {/* Total Words & Pages Written */}
              <div className="bg-white rounded-lg p-4 border border-amber-900/15 shadow-xs flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-sky-100/80 text-sky-900 flex items-center justify-center flex-shrink-0">
                  <PenTool className="w-5 h-5 text-sky-700" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-amber-900/60 uppercase tracking-wider">Tổng Từ Đã Chép</p>
                  <p className="text-xl sm:text-2xl font-black text-amber-950 mt-0.5">
                    {statsLoading ? '...' : stats?.totalWordsWritten?.toLocaleString('vi-VN') || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Bảng 1: Thống Kê Theo Từng Bộ Kinh */}
            <div className="bg-white rounded-xl border border-amber-900/15 shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-amber-950 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-amber-800" />
                    <span>Thống Kê Chi Tiết Từng Bộ Kinh</span>
                  </h3>
                  <p className="text-xs text-amber-900/60 mt-0.5">
                    Số lượng người tham gia, tổng lượt chép và tiến độ trung bình của Phật tử
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-900 rounded-md border border-amber-900/10">
                  {stats?.sutraStats?.length || 0} bộ kinh
                </span>
              </div>

              <div className="overflow-x-auto touch-pan-x" style={{ WebkitOverflowScrolling: 'touch' }}>
                <table className="w-full text-left text-xs text-gray-700 min-w-[700px]">
                  <thead className="bg-amber-50/70 border-b border-amber-900/10 text-[11px] font-bold uppercase text-amber-950">
                    <tr>
                      <th className="px-4 py-3">Tên Bộ Kinh</th>
                      <th className="px-3 py-3">Loại Chữ</th>
                      <th className="px-3 py-3 text-center">Người Tham Gia</th>
                      <th className="px-3 py-3 text-center">Tổng Lượt Chép</th>
                      <th className="px-3 py-3 text-center">Lượt Viên Mãn</th>
                      <th className="px-4 py-3">Tiến Độ Trung Bình</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {statsLoading ? (
                      Array.from({ length: 3 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td colSpan={6} className="px-4 py-4">
                            <div className="h-4 bg-amber-100/50 rounded w-full"></div>
                          </td>
                        </tr>
                      ))
                    ) : !stats?.sutraStats || stats.sutraStats.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                          Chưa có dữ liệu thống kê bộ kinh
                        </td>
                      </tr>
                    ) : (
                      stats.sutraStats.map((item) => (
                        <tr key={item.sutraId} className="hover:bg-amber-50/40 transition-colors">
                          <td className="px-4 py-3 font-bold text-amber-950">
                            {item.title}
                            <span className="block text-[11px] font-normal text-amber-900/60 mt-0.5">
                              {item.totalPages} trang A4 • {item.totalWords.toLocaleString('vi-VN')} từ mẫu
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-900">
                              {item.scriptType === 'QUOC_NGU' ? 'Tiếng Việt' : item.scriptType === 'HAN' ? 'Chữ Hán' : 'Pali'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-amber-950">
                            {item.participantCount}
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-amber-950">
                            {item.totalAttempts}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {item.completedAttempts}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="w-full max-w-[140px]">
                              <div className="flex items-center justify-between text-[11px] font-semibold text-amber-950 mb-1">
                                <span>{item.avgProgressPercent}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="h-1.5 rounded-full bg-amber-800 transition-all duration-300"
                                  style={{ width: `${Math.min(100, Math.max(0, item.avgProgressPercent))}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bảng 2: Nhật Ký Chép Kinh Gần Đây */}
            <div className="bg-white rounded-xl border border-amber-900/15 shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm sm:text-base font-bold text-amber-950 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-800" />
                  <span>Nhật Ký Chép Kinh Gần Đây</span>
                </h3>
                <p className="text-xs text-amber-900/60 mt-0.5">
                  Các hoạt động chép kinh mới nhất của Phật tử trên toàn hệ thống
                </p>
              </div>

              <div className="overflow-x-auto touch-pan-x" style={{ WebkitOverflowScrolling: 'touch' }}>
                <table className="w-full text-left text-xs text-gray-700 min-w-[650px]">
                  <thead className="bg-amber-50/70 border-b border-amber-900/10 text-[11px] font-bold uppercase text-amber-950">
                    <tr>
                      <th className="px-4 py-3">Phật Tử</th>
                      <th className="px-3 py-3">Bộ Kinh</th>
                      <th className="px-3 py-3">Tiến Độ</th>
                      <th className="px-3 py-3">Trạng Thái</th>
                      <th className="px-4 py-3 text-right">Thời Gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {statsLoading ? (
                      Array.from({ length: 3 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td colSpan={5} className="px-4 py-3.5">
                            <div className="h-4 bg-amber-100/50 rounded w-full"></div>
                          </td>
                        </tr>
                      ))
                    ) : !stats?.recentActivities || stats.recentActivities.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                          Chưa có nhật ký hoạt động nào
                        </td>
                      </tr>
                    ) : (
                      stats.recentActivities.map((act) => (
                        <tr key={act.attemptId} className="hover:bg-amber-50/40 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {act.userAvatar ? (
                                <img src={act.userAvatar} alt="" className="w-6 h-6 rounded-full border border-amber-900/10 object-cover" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold flex items-center justify-center">
                                  {act.userName.charAt(0)}
                                </div>
                              )}
                              <span className="font-bold text-amber-950">{act.userName}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 font-semibold text-gray-800">
                            {act.sutraTitle}
                          </td>
                          <td className="px-3 py-3">
                            <span className="font-bold text-amber-900">{act.progressPercent}%</span>
                          </td>
                          <td className="px-3 py-3">
                            {act.status === 'COMPLETED' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                <CheckCircle className="w-3 h-3" />
                                <span>Viên Mãn</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold">
                                <Clock className="w-3 h-3" />
                                <span>Đang Chép</span>
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-[11px] text-gray-500 font-mono">
                            {new Date(act.startedAt).toLocaleString('vi-VN')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: QUẢN LÝ BỘ KINH (SUTRA MANAGEMENT) */}
        {adminTab === 'SUTRAS' && (
          <div>
            {/* Stats Summary Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-white/80 backdrop-blur rounded-lg p-3.5 border border-amber-900/15 shadow-xs">
                <p className="text-[11px] font-semibold text-amber-900/60 uppercase">Tổng Bộ Kinh</p>
                <p className="text-xl font-bold text-amber-950 mt-0.5">{sutras.length}</p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-lg p-3.5 border border-amber-900/15 shadow-xs">
                <p className="text-[11px] font-semibold text-amber-900/60 uppercase">Đã Xuất Bản</p>
                <p className="text-xl font-bold text-emerald-800 mt-0.5">
                  {sutras.filter((s) => s.isPublished).length}
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-lg p-3.5 border border-amber-900/15 shadow-xs">
                <p className="text-[11px] font-semibold text-amber-900/60 uppercase">Tổng Số Trang A4</p>
                <p className="text-xl font-bold text-amber-950 mt-0.5">
                  {sutras.reduce((acc, s) => acc + s.totalPages, 0)}
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-lg p-3.5 border border-amber-900/15 shadow-xs">
                <p className="text-[11px] font-semibold text-amber-900/60 uppercase">Tổng Số Chữ Mẫu</p>
                <p className="text-xl font-bold text-amber-950 mt-0.5">
                  {sutras.reduce((acc, s) => acc + s.totalWords, 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Bảng Danh Sách Kinh (iPad & Tablet Optimized) */}
            <div className="bg-white rounded-lg border border-amber-900/15 shadow-xs overflow-hidden">
              <div className="overflow-x-auto touch-pan-x" style={{ WebkitOverflowScrolling: 'touch' }}>
                <table className="w-full text-left text-xs text-gray-700 min-w-[720px]">
                  <thead className="bg-amber-50/90 border-b border-amber-900/10 text-[11px] font-bold uppercase text-amber-950">
                    <tr>
                      <th className="px-4 py-3">Tên Bộ Kinh</th>
                      <th className="px-3 py-3">Loại Chữ</th>
                      <th className="px-3 py-3">Tổng Chữ</th>
                      <th className="px-3 py-3">Số Trang A4</th>
                      <th className="px-3 py-3">Trạng Thái</th>
                      <th className="px-4 py-3 text-right sticky right-0 bg-amber-50/90 shadow-[-2px_0_4px_rgba(0,0,0,0.03)]">
                        Thao Tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {loading ? (
                      Array.from({ length: 3 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td colSpan={6} className="px-4 py-4">
                            <div className="h-5 bg-amber-100/50 rounded-md w-full"></div>
                          </td>
                        </tr>
                      ))
                    ) : sutras.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                          <BookOpen className="w-10 h-10 mx-auto text-amber-900/20 mb-2" />
                          <p className="text-sm font-semibold text-amber-950/70">Chưa có bộ kinh nào trong hệ thống</p>
                          <p className="text-xs text-amber-900/50 mt-0.5">
                            Hãy nhấn vào nút "Nạp Bộ Kinh Mới" để tải tệp PDF hoặc nhập văn bản.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      sutras.map((sutra) => (
                        <tr key={sutra.id} className="hover:bg-amber-50/40 active:bg-amber-50/60 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-bold text-amber-950 text-sm">{sutra.title}</span>
                              {sutra.description && (
                                <span className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{sutra.description}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                                sutra.scriptType === 'HAN'
                                  ? 'bg-red-50 text-red-800 border border-red-200'
                                  : sutra.scriptType === 'PALI'
                                  ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                                  : 'bg-amber-100/70 text-amber-900 border border-amber-200'
                              }`}
                            >
                              {sutra.scriptType === 'QUOC_NGU'
                                ? 'Tiếng Việt'
                                : sutra.scriptType === 'HAN'
                                ? 'Chữ Hán'
                                : 'Phạn / Pali'}
                            </span>
                          </td>
                          <td className="px-3 py-3 font-mono font-semibold text-amber-900">
                            {sutra.totalWords.toLocaleString()} chữ
                          </td>
                          <td className="px-3 py-3 font-mono font-semibold text-gray-700">
                            {sutra.totalPages} trang A4
                          </td>
                          <td className="px-3 py-3">
                            <button
                              onClick={() => handleTogglePublish(sutra.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                                sutra.isPublished
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                              }`}
                              title="Nhấn để Bật/Tắt xuất bản"
                            >
                              {sutra.isPublished ? (
                                <>
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  <span>Đã Xuất Bản</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3 h-3 text-gray-500" />
                                  <span>Bản Nháp (Ẩn)</span>
                                </>
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right sticky right-0 bg-white hover:bg-amber-50/40 shadow-[-2px_0_4px_rgba(0,0,0,0.03)]">
                            <div className="flex items-center justify-end gap-1">
                              <a
                                href={`/write/${sutra.id}`}
                                className="inline-flex items-center justify-center p-1.5 text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-200 active:scale-95 transition-all"
                                title="Xem trang chép A4"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </a>
                              <button
                                onClick={() => handleOpenEditModal(sutra)}
                                className="inline-flex items-center justify-center p-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 active:scale-95 transition-all cursor-pointer"
                                title="Chỉnh sửa nội dung & trang"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSutra(sutra.id, sutra.title)}
                                className="inline-flex items-center justify-center p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-md border border-red-200 active:scale-95 transition-all cursor-pointer"
                                title="Xóa bộ kinh"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: QUẢN LÝ NGƯỜI DÙNG (USER MANAGEMENT) */}
        {adminTab === 'USERS' && (
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="bg-white rounded-xl border border-amber-900/15 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-amber-900/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo tên, email..."
                  value={userKeyword}
                  onChange={(e) => {
                    setUserKeyword(e.target.value);
                    fetchUsers(1, e.target.value);
                  }}
                  className="w-full h-9 pl-9 pr-3 rounded-md border border-amber-900/20 bg-amber-50/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-800/30 text-xs font-medium text-amber-950"
                />
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-amber-900/80">
                <span>Tổng số: <strong className="text-amber-950">{usersTotalCount}</strong> người dùng</span>
              </div>
            </div>

            {/* Users Table (Tablet / iPad Optimized) */}
            <div className="bg-white rounded-xl border border-amber-900/15 shadow-xs overflow-hidden">
              <div className="overflow-x-auto touch-pan-x" style={{ WebkitOverflowScrolling: 'touch' }}>
                <table className="w-full text-left text-xs text-gray-700 min-w-[750px]">
                  <thead className="bg-amber-50/90 border-b border-amber-900/10 text-[11px] font-bold uppercase text-amber-950">
                    <tr>
                      <th className="px-4 py-3">Phật Tử / Người Dùng</th>
                      <th className="px-3 py-3">Email</th>
                      <th className="px-3 py-3">Tài Khoản</th>
                      <th className="px-3 py-3">Ngày Tham Gia</th>
                      <th className="px-3 py-3 text-center">Bộ Kinh Đã Chép</th>
                      <th className="px-3 py-3 text-center">Tổng Từ Đã Viết</th>
                      <th className="px-3 py-3 text-center">Trạng Thái</th>
                      <th className="px-4 py-3 text-right sticky right-0 bg-amber-50/90 shadow-[-2px_0_4px_rgba(0,0,0,0.03)]">
                        Thao Tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {usersLoading ? (
                      Array.from({ length: 4 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td colSpan={8} className="px-4 py-4">
                            <div className="h-5 bg-amber-100/50 rounded-md w-full"></div>
                          </td>
                        </tr>
                      ))
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                          <Users className="w-10 h-10 mx-auto text-amber-900/20 mb-2" />
                          <p className="text-sm font-semibold text-amber-950/70">Không tìm thấy người dùng nào</p>
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              {u.avatarUrl ? (
                                <img
                                  src={getAssetUrl(u.avatarUrl)}
                                  alt=""
                                  className="w-8 h-8 rounded-full border border-amber-900/10 object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-900/10 text-amber-900 text-xs font-bold flex items-center justify-center">
                                  {u.fullName.charAt(0)}
                                </div>
                              )}
                              <div>
                                <span className="font-bold text-amber-950 text-sm block">{u.fullName}</span>
                                <span className="text-[10px] text-gray-400 font-mono">ID: #{u.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 font-medium text-gray-600">
                            {u.email}
                          </td>
                          <td className="px-3 py-3">
                            {u.isGoogleAccount ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold">
                                <Globe className="w-3 h-3 text-blue-600" />
                                <span>Google</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-bold">
                                <Key className="w-3 h-3 text-amber-700" />
                                <span>Mật Khẩu</span>
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-gray-500 font-mono text-[11px]">
                            {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-amber-950">
                            {u.totalSutrasJoined}
                          </td>
                          <td className="px-3 py-3 text-center font-mono font-semibold text-amber-900">
                            {u.totalWordsWritten.toLocaleString('vi-VN')}
                          </td>
                          <td className="px-3 py-3 text-center">
                            {u.isActive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                <span>Hoạt Động</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 border border-red-200 text-red-800 text-[10px] font-bold">
                                <UserX className="w-3 h-3 text-red-600" />
                                <span>Tạm Khóa</span>
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right sticky right-0 bg-white hover:bg-amber-50/40 shadow-[-2px_0_4px_rgba(0,0,0,0.03)]">
                            <button
                              onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                              className={`h-7 px-2.5 rounded-md text-[11px] font-bold transition-all shadow-xs active:scale-95 cursor-pointer ${
                                u.isActive
                                  ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {u.isActive ? 'Khóa' : 'Mở Khóa'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {usersTotalPages > 1 && (
                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-amber-50/40">
                  <span className="text-xs text-amber-900/70">
                    Trang <strong>{usersPage}</strong> / <strong>{usersTotalPages}</strong>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={usersPage <= 1 || usersLoading}
                      onClick={() => fetchUsers(usersPage - 1)}
                      className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-gray-200 text-gray-700 disabled:opacity-40 cursor-pointer"
                    >
                      Trang Trước
                    </button>
                    <button
                      disabled={usersPage >= usersTotalPages || usersLoading}
                      onClick={() => fetchUsers(usersPage + 1)}
                      className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-gray-200 text-gray-700 disabled:opacity-40 cursor-pointer"
                    >
                      Trang Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Nạp / Chỉnh Sửa Bộ Kinh */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-lg border border-amber-900/20 shadow-xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-amber-50/60">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-900 text-white rounded-md">
                    {editingSutraId ? <Edit3 className="w-4 h-4" /> : <BookPlus className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-amber-950">
                      {editingSutraId ? 'Chỉnh Sửa Bộ Kinh & Dàn Trang A4' : 'Nạp & Dàn Trang Bộ Kinh Mới'}
                    </h3>
                    <p className="text-xs text-amber-900/60">
                      Tải lên tệp PDF hoặc nhập trực tiếp văn bản để phân trang mẫu A4
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
                {/* Thông tin chung */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-amber-950 uppercase mb-1">
                      Tên Bộ Kinh *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ví dụ: Kinh Kim Cương Bát Nhã Ba La Mật"
                      className="w-full h-9 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-800 text-xs font-semibold text-amber-950 placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-amber-950 uppercase mb-1">
                      Loại Chữ *
                    </label>
                    <select
                      value={scriptType}
                      onChange={(e) => setScriptType(e.target.value as ScriptType)}
                      className="w-full h-9 px-2.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-800 text-xs font-semibold bg-white text-amber-950"
                    >
                      <option value="QUOC_NGU">Tiếng Việt</option>
                      <option value="HAN">Chữ Hán (Kinh Hán Cổ)</option>
                      <option value="PALI">Phiên Âm Phạn / Pali</option>
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-amber-950 uppercase mb-1">
                      Mô Tả & Nguồn Gốc (Tùy Chọn)
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Người dịch, nguồn gốc bản kinh, lời tựa..."
                      className="w-full h-9 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-800 text-xs font-medium"
                    />
                  </div>
                </div>

                {/* Tabs Phương Thức Nạp */}
                {!editingSutraId && (
                  <div className="border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-1.5 p-1 bg-amber-100/50 rounded-md w-fit">
                      <button
                        type="button"
                        onClick={() => setInputMode('PDF')}
                        className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          inputMode === 'PDF'
                            ? 'bg-amber-900 text-white shadow-xs'
                            : 'text-amber-900/70 hover:text-amber-950'
                        }`}
                      >
                        <FileUp className="w-3.5 h-3.5" />
                        <span>Tải Lên Tệp PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputMode('TEXT')}
                        className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          inputMode === 'TEXT'
                            ? 'bg-amber-900 text-white shadow-xs'
                            : 'text-amber-900/70 hover:text-amber-950'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Nhập Toàn Văn Trực Tiếp</span>
                      </button>
                    </div>

                    {/* Content Phương Thức PDF */}
                    {inputMode === 'PDF' && (
                      <div className="mt-3">
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                            isExtractingPdf
                              ? 'border-amber-400 bg-amber-50/50 animate-pulse'
                              : pdfFile
                              ? 'border-emerald-500 bg-emerald-50/30'
                              : 'border-amber-900/20 hover:border-amber-900/40 bg-amber-50/20 hover:bg-amber-50/50'
                          }`}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,application/pdf"
                            className="hidden"
                            onChange={handlePdfFileSelect}
                          />

                          {isExtractingPdf ? (
                            <div className="flex flex-col items-center gap-1.5 text-amber-900">
                              <Loader2 className="w-8 h-8 animate-spin text-amber-800" />
                              <p className="font-bold text-sm">Đang đọc và phân tích tệp PDF...</p>
                              <p className="text-xs text-amber-900/60">
                                Hệ thống đang trích xuất văn bản và tự động chia trang A4
                              </p>
                            </div>
                          ) : pdfFile ? (
                            <div className="flex flex-col items-center gap-1.5 text-emerald-800">
                              <CheckCircle className="w-8 h-8 text-emerald-600" />
                              <p className="font-bold text-sm">{pdfFile.name}</p>
                              <p className="text-xs text-emerald-700">
                                Đã trích xuất thành công {pages.length} trang A4. Nhấn để tải tệp khác.
                              </p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1.5 text-amber-900/80">
                              <FileUp className="w-8 h-8 text-amber-800/60" />
                              <p className="font-bold text-sm">Chọn hoặc Kéo Thả Tệp PDF Tại Đây</p>
                              <p className="text-xs text-amber-900/60 max-w-md">
                                Hệ thống sẽ tự động bóc tách từng trang kinh, xử lý tiếng Việt, chữ Hán và đếm từ chính xác.
                              </p>
                            </div>
                          )}
                        </div>

                        {extractError && (
                          <div className="mt-2.5 p-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-center gap-2">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600" />
                            <span>{extractError}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content Phương Thức Text */}
                    {inputMode === 'TEXT' && (
                      <div className="mt-3 space-y-2.5">
                        <div>
                          <label className="block text-xs font-bold text-amber-950 uppercase mb-1">
                            Dán Toàn Văn Nội Dung Kinh
                          </label>
                          <textarea
                            rows={5}
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            placeholder="Dán toàn bộ văn bản kinh vào đây. Mỗi đoạn cách nhau bởi 1 dòng trống..."
                            className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-800 text-xs leading-relaxed text-gray-800"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAutoPaginateFromText}
                          className="px-3 py-1.5 bg-amber-100 text-amber-900 hover:bg-amber-200 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-800" />
                          <span>Tự Động Phân Trang A4 Từ Văn Bản Trên</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Khu Vực Duyệt & Chỉnh Sửa Từng Trang A4 */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4 text-amber-900" />
                      <h4 className="font-bold text-amber-950 text-sm">
                        Danh Sách Trang A4 ({pages.length} trang)
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddPage}
                      className="px-2.5 py-1 bg-amber-900 text-white rounded-md text-xs font-bold flex items-center gap-1 active:scale-95 transition-all shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm Trang Mới</span>
                    </button>
                  </div>

                  {pages.length === 0 ? (
                    <div className="p-6 text-center bg-gray-50 rounded-lg border border-gray-200 text-gray-400 text-xs">
                      Chưa có trang nào. Hãy tải tệp PDF, dán văn bản hoặc bấm "Thêm Trang Mới".
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      {/* Cột Danh Sách Thẻ Trang */}
                      <div className="lg:col-span-4 flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-y-auto lg:max-h-[420px] pb-1 lg:pb-0 pr-1 touch-pan-x">
                        {pages.map((p, idx) => (
                          <div
                            key={idx}
                            onClick={() => setSelectedPageIndex(idx)}
                            className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all shrink-0 w-44 lg:w-full flex items-start justify-between gap-2 ${
                              selectedPageIndex === idx
                                ? 'bg-amber-900 text-white border-amber-900 shadow-xs'
                                : 'bg-white hover:bg-amber-50/60 border-gray-200 text-gray-700'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                    selectedPageIndex === idx
                                      ? 'bg-white/20 text-white'
                                      : 'bg-amber-100 text-amber-900'
                                  }`}
                                >
                                  Trang {p.pageNumber}
                                </span>
                                <span
                                  className={`text-[10px] font-mono ${
                                    selectedPageIndex === idx ? 'text-amber-200' : 'text-gray-400'
                                  }`}
                                >
                                  {p.contentText.trim().split(/\s+/).filter(Boolean).length} chữ
                                </span>
                              </div>
                              <p
                                className={`text-xs line-clamp-2 mt-1 ${
                                  selectedPageIndex === idx ? 'text-amber-100' : 'text-gray-600'
                                }`}
                              >
                                {p.contentText || '(Trang trống)'}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePage(idx);
                              }}
                              className={`p-1 rounded opacity-80 hover:opacity-100 transition-opacity cursor-pointer ${
                                selectedPageIndex === idx
                                  ? 'hover:bg-white/20 text-red-200'
                                  : 'hover:bg-red-50 text-red-500'
                              }`}
                              title="Xóa trang này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Cột Soạn Thảo & Live Preview của Trang Đang Chọn */}
                      {activePage && (
                        <div className="lg:col-span-8 bg-amber-50/30 rounded-lg p-3.5 sm:p-4 border border-amber-900/10 space-y-3.5">
                          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-amber-900/10">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-amber-950 text-xs">
                                Chi Tiết Trang {activePage.pageNumber}
                              </span>
                              <span className="text-[11px] text-amber-900/60 font-mono">
                                ({activePage.contentText.trim().split(/\s+/).filter(Boolean).length} chữ)
                              </span>
                            </div>

                            <div className="flex items-center gap-2.5">
                              {/* Cỡ chữ */}
                              <div className="flex items-center gap-1">
                                <label className="text-[11px] font-bold text-amber-950">Cỡ Chữ:</label>
                                <select
                                  value={activePage.defaultFontSize}
                                  onChange={(e) =>
                                    handleUpdateCurrentPage('defaultFontSize', parseInt(e.target.value, 10))
                                  }
                                  className="px-2 py-0.5 rounded border border-gray-300 text-xs font-bold bg-white text-amber-950"
                                >
                                  <option value={20}>20px (Nhỏ)</option>
                                  <option value={26}>26px (Chuẩn)</option>
                                  <option value={32}>32px (Lớn / Chữ Hán)</option>
                                  <option value={38}>38px (Rất Lớn)</option>
                                </select>
                              </div>

                              {/* Kiểu lưới */}
                              <div className="flex items-center gap-1">
                                <label className="text-[11px] font-bold text-amber-950">Lưới:</label>
                                <select
                                  value={activePage.defaultGridType}
                                  onChange={(e) =>
                                    handleUpdateCurrentPage('defaultGridType', e.target.value as GridType)
                                  }
                                  className="px-2 py-0.5 rounded border border-gray-300 text-xs font-bold bg-white text-amber-950"
                                >
                                  <option value="GRID_OLY">Ô Ly Tiểu Học</option>
                                  <option value="GRID_HAN">Điền Tự (Chữ Hán)</option>
                                  <option value="LINE">Dòng Kẻ Ngang</option>
                                  <option value="BLANK">Giấy Trơn</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Ô Soạn Thảo Text */}
                          <div>
                            <label className="block text-xs font-bold text-amber-950 uppercase mb-1">
                              Văn Bản Chữ Mẫu Của Trang {activePage.pageNumber} *
                            </label>
                            <textarea
                              rows={4}
                              value={activePage.contentText}
                              onChange={(e) => handleUpdateCurrentPage('contentText', e.target.value)}
                              placeholder="Nhập nội dung mẫu cho trang này..."
                              className="w-full p-2.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-800 text-xs leading-relaxed text-gray-900 bg-white shadow-inner"
                            />
                          </div>

                          {/* Live Preview Khổ A4 Giả Lập */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-amber-950 uppercase flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5 text-amber-800" />
                                <span>Xem Trước Khổ Giấy A4</span>
                              </span>
                              <span className="text-[11px] text-amber-900/60">
                                Mô phỏng hiển thị trên iPad
                              </span>
                            </div>

                            <div
                              className="w-full bg-[#fcfaf2] border border-amber-900/20 rounded-lg p-4 sm:p-5 shadow-inner min-h-[180px] flex flex-col justify-between"
                              style={{
                                backgroundImage:
                                  activePage.defaultGridType === 'GRID_OLY'
                                    ? 'linear-gradient(to right, rgba(160, 110, 60, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(160, 110, 60, 0.08) 1px, transparent 1px)'
                                    : activePage.defaultGridType === 'GRID_HAN'
                                    ? 'linear-gradient(to right, rgba(180, 50, 50, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(180, 50, 50, 0.1) 1px, transparent 1px)'
                                    : activePage.defaultGridType === 'LINE'
                                    ? 'linear-gradient(to bottom, rgba(160, 110, 60, 0.15) 1px, transparent 1px)'
                                    : 'none',
                                backgroundSize:
                                  activePage.defaultGridType === 'GRID_HAN'
                                    ? '48px 48px'
                                    : activePage.defaultGridType === 'LINE'
                                    ? '100% 40px'
                                    : '32px 32px',
                              }}
                            >
                              <div
                                className="leading-relaxed select-none text-amber-950/40 tracking-wider whitespace-pre-wrap"
                                style={{
                                  fontSize: `${activePage.defaultFontSize}px`,
                                }}
                              >
                                {activePage.contentText || (
                                  <span className="italic text-gray-300">
                                    (Chưa có nội dung cho trang này)
                                  </span>
                                )}
                              </div>

                              <div className="pt-2 mt-2 border-t border-amber-900/10 text-center text-[10px] font-mono text-amber-900/40">
                                — Trang {activePage.pageNumber} / {pages.length} —
                              </div>
                            </div>
                          </div>

                          {/* Navigation Trang */}
                          <div className="flex items-center justify-between pt-1">
                            <button
                              type="button"
                              disabled={selectedPageIndex === 0}
                              onClick={() => setSelectedPageIndex((prev) => Math.max(0, prev - 1))}
                              className="px-2.5 py-1 rounded-md border border-gray-300 text-xs font-semibold text-gray-700 disabled:opacity-30 flex items-center gap-1 bg-white cursor-pointer"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                              <span>Trang Trước</span>
                            </button>

                            <button
                              type="button"
                              disabled={selectedPageIndex === pages.length - 1}
                              onClick={() => setSelectedPageIndex((prev) => Math.min(pages.length - 1, prev + 1))}
                              className="px-2.5 py-1 rounded-md border border-gray-300 text-xs font-semibold text-gray-700 disabled:opacity-30 flex items-center gap-1 bg-white cursor-pointer"
                            >
                              <span>Trang Sau</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-2.5 bg-gray-50/80">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 rounded-md text-xs font-semibold border border-gray-300 text-gray-700 hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || pages.length === 0}
                  onClick={handleSubmitSutra}
                  className="px-4 py-1.5 rounded-md text-xs font-bold bg-amber-900 text-white hover:bg-amber-950 active:scale-95 transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang Lưu...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{editingSutraId ? 'Cập Nhật Bộ Kinh' : 'Lưu & Xuất Bản Bộ Kinh'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
