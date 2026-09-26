import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { apiClient } from '../api/client';
import type { SutraSummary, UserAttempt } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, PenTool, Search, Compass } from 'lucide-react';

export const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [sutras, setSutras] = useState<SutraSummary[]>([]);
  const [attempts, setAttempts] = useState<Record<number, UserAttempt>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [keyword, setKeyword] = useState<string>('');

  useEffect(() => {
    const fetchLibraryData = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/sutras');
        if (res.data?.success) {
          setSutras(res.data.data.items);
        }

        if (isAuthenticated) {
          const attemptRes = await apiClient.get('/progress/my-attempts');
          if (attemptRes.data?.success) {
            const map: Record<number, UserAttempt> = {};
            for (const att of attemptRes.data.data) {
              if (!map[att.sutraId] || att.attemptNumber > map[att.sutraId].attemptNumber) {
                map[att.sutraId] = att;
              }
            }
            setAttempts(map);
          }
        }
      } catch (err) {
        console.error('Error fetching sutras', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLibraryData();
  }, [isAuthenticated]);

  const filteredSutras = sutras.filter((s) => {
    const matchesKeyword = s.title.toLowerCase().includes(keyword.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(keyword.toLowerCase()));
    return matchesKeyword;
  });

  return (
    <div className="min-h-screen bg-sutra-paper flex flex-col font-sans">
      <Navbar />

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-amber-100/60 to-transparent py-8 px-4 text-center border-b border-amber-900/10">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-900/10 text-amber-900 text-md font-semibold mb-3">
            <Compass className="w-3.5 h-3.5" />
            <span>Tĩnh Tâm Khởi Tuệ</span>
          </div>
          <p className="text-xs sm:text-sm text-amber-900/70 max-w-xl mx-auto">
            Chép kinh tay trên sổ khổ A4 bằng bút cảm ứng. Mỗi nét chữ là một hạt mầm bình an được gieo vào tâm thức.
          </p>

          {/* Ô Tìm Kiếm & Lọc Touch-Friendly */}
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-2 max-w-lg mx-auto">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-amber-900/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm bộ kinh..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-md border border-amber-900/20 bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-800/30 text-xs font-medium text-amber-950"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Danh Sách Bộ Kinh */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-900 mb-3"></div>
            <p className="text-xs text-amber-900/60">Đang tải danh mục kinh điển...</p>
          </div>
        ) : filteredSutras.length === 0 ? (
          <div className="text-center py-16 bg-white/50 rounded-lg border border-dashed border-amber-900/20 max-w-md mx-auto p-6">
            <BookOpen className="w-10 h-10 text-amber-900/30 mx-auto mb-2" />
            <p className="text-amber-950 font-semibold text-sm mb-1">Không tìm thấy bộ kinh nào</p>
            <p className="text-xs text-amber-900/60">Hãy thử tìm kiếm với từ khóa khác</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSutras.map((sutra) => {
              const userAttempt = attempts[sutra.id];
              return (
                <div
                  key={sutra.id}
                  className="bg-white rounded-lg border border-amber-900/15 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all duration-200 relative group overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-amber-800" />

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-900/10 text-amber-900 text-[11px] font-semibold tracking-wide uppercase">
                        {sutra.scriptType === 'QUOC_NGU' ? 'Tiếng Việt' : sutra.scriptType === 'HAN' ? 'Chữ Hán' : 'Phạn / Pali'}
                      </span>
                      <span className="text-xs text-amber-900/60">
                        {sutra.totalPages} Trang A4 • {sutra.totalWords} chữ
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-amber-950 mb-1.5 leading-snug group-hover:text-amber-800 transition-colors">
                      {sutra.title}
                    </h3>

                    <p className="text-xs text-gray-600 line-clamp-3 mb-4 leading-relaxed">
                      {sutra.description || 'Bộ kinh giúp khai mở tâm từ bi và trí tuệ vô lượng.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-amber-900/10 flex flex-col gap-2.5">
                    {userAttempt && (
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-amber-900 mb-1">
                          <span>Tiến độ Lượt {userAttempt.attemptNumber}</span>
                          <span>{userAttempt.progressPercent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-amber-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-800 rounded-full transition-all duration-300"
                            style={{ width: `${userAttempt.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => navigate(isAuthenticated ? `/write/${sutra.id}` : `/login?redirect=/write/${sutra.id}`)}
                      className="w-full py-2 px-3 bg-amber-900 hover:bg-amber-950 text-white rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>{userAttempt ? 'Tiếp Tục Chép' : 'Mở Sổ Chép Kinh'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
