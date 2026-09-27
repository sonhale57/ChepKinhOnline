import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { A4InkCanvas } from '../components/A4InkCanvas';
import { TextPromptCard } from '../components/TextPromptCard';
import { SidebarTools } from '../components/SidebarTools';
import { Navbar } from '../components/Navbar';
import { apiClient } from '../api/client';
import { inkStorage } from '../services/inkStorage';
import { recognizeStrokes } from '../services/handwritingService';
import { matchHandwritingWithTarget } from '../utils/fuzzyMatcher';
import type {
  SutraDetail,
  SutraPage,
  UserAttempt,
  Stroke,
  BrushType,
  GridType,
  PaperType
} from '../types';
import { useAuth } from '../contexts/AuthContext';
import { CertificateModal } from '../components/CertificateModal';
import { CompletionCelebrationModal } from '../components/CompletionCelebrationModal';
import { ExportPdfModal } from '../components/ExportPdfModal';
import {
  ArrowLeft,
  CheckCircle2,
  Save,
  Loader2,
  FileDown
} from 'lucide-react';

export const WriterPage: React.FC = () => {
  const { sutraId } = useParams<{ sutraId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryAttemptId = searchParams.get('attemptId');
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id || 0;

  const [sutra, setSutra] = useState<SutraDetail | null>(null);
  const [attempt, setAttempt] = useState<UserAttempt | null>(null);
  const [allAttempts, setAllAttempts] = useState<UserAttempt[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [extraPages, setExtraPages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [zenMode, setZenMode] = useState<boolean>(false);

  // Brush & Page settings
  const [brushType, setBrushType] = useState<BrushType>('CALLIGRAPHY');
  const [brushColor, setBrushColor] = useState<string>('#1A1817');
  const [brushSize, setBrushSize] = useState<number>(6);
  const [gridType, setGridType] = useState<GridType>('GRID_OLY');
  const [paperType, setPaperType] = useState<PaperType>('DO');
  const [penOnlyMode, setPenOnlyMode] = useState<boolean>(true);
  const [dockPosition, setDockPosition] = useState<'left' | 'right'>('right');

  // Tiến độ Chép Kinh: Khớp đoạn và Nhắc chữ (5 dòng)
  const [completedChunks, setCompletedChunks] = useState<Record<number, boolean>>({});
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(0);
  const [matchedChunksCount, setMatchedChunksCount] = useState<number>(0);
  const [totalChunksCount, setTotalChunksCount] = useState<number>(1);
  const [matchPercent, setMatchPercent] = useState<number>(0);

  // AI Handwriting Recognition & Auto Match
  const [autoRecognize, setAutoRecognize] = useState<boolean>(true);
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [similarityPercent, setSimilarityPercent] = useState<number>(0);
  const [matchedWords, setMatchedWords] = useState<Set<string>>(new Set());

  // Modal chúc mừng, Chứng nhận & Xuất bản PDF
  const [showCelebrationModal, setShowCelebrationModal] = useState<boolean>(false);
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);
  const [showExportPdfModal, setShowExportPdfModal] = useState<boolean>(false);

  // Digital Ink Strokes & History (Undo / Redo)
  const [pageStrokes, setPageStrokes] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Lắng nghe trạng thái Online / Offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 1. Tải thông tin bộ kinh và lượt chép
  useEffect(() => {
    const loadSutraData = async () => {
      if (!sutraId) return;
      const sutraNumericId = parseInt(sutraId, 10) || 0;
      setLoading(true);
      try {
        let loadedSutra: SutraDetail | null = null;
        const res = await apiClient.get(`/sutras/${sutraId}`);
        if (res.data?.success) {
          loadedSutra = res.data.data;
          setSutra(loadedSutra);

          // Cài đặt lưới mặc định theo loại chữ
          if (loadedSutra?.scriptType === 'HAN') {
            setGridType('GRID_HAN');
          }
        }

        let loadedAttempt: UserAttempt | null = null;
        if (isAuthenticated) {
          // Tải toàn bộ các lượt chép của người dùng cho bộ kinh này
          try {
            const allRes = await apiClient.get(`/progress/my-attempts?sutraId=${sutraId}`);
            if (allRes.data?.success && Array.isArray(allRes.data.data)) {
              setAllAttempts(allRes.data.data);
            }
          } catch {
            // ignore
          }

          // Nếu có attemptId trên URL thì tải đúng lượt đó, ngược lại tải lượt đang chép
          if (queryAttemptId) {
            const attemptRes = await apiClient.get(`/progress/attempt-detail/${queryAttemptId}`);
            if (attemptRes.data?.success) {
              loadedAttempt = attemptRes.data.data;
              setAttempt(loadedAttempt);
            }
          } else {
            const attemptRes = await apiClient.get(`/progress/active-attempt/${sutraId}`);
            if (attemptRes.data?.success) {
              loadedAttempt = attemptRes.data.data;
              setAttempt(loadedAttempt);
            }
          }
        }

        // Tải tiến trình đã lưu trong IndexedDB (Local-First Offline)
        const attemptId = loadedAttempt?.id || 0;
        const localProgress = await inkStorage.getAttemptProgress(sutraNumericId, attemptId, userId);

        if (localProgress) {
          setCompletedChunks(localProgress.completedChunks || {});
          setCurrentChunkIndex(localProgress.currentChunkIndex || 0);
          if (localProgress.currentPageIndex !== undefined) {
            setCurrentPageIndex(localProgress.currentPageIndex);
          }
          if (localProgress.totalNotebookPages && loadedSutra) {
            setExtraPages(Math.max(0, localProgress.totalNotebookPages - (loadedSutra.totalPages || 1)));
          }
          if (localProgress.matchPercent !== undefined) {
            setMatchPercent(localProgress.matchPercent);
          }
          if (localProgress.matchedChunksCount !== undefined) {
            setMatchedChunksCount(localProgress.matchedChunksCount);
          }
          if (localProgress.totalChunksCount !== undefined) {
            setTotalChunksCount(localProgress.totalChunksCount);
          }
        } else if (loadedAttempt) {
          // Khôi phục từ dữ liệu backend nếu IndexedDB chưa có
          if (loadedAttempt.completedChunksJson) {
            try {
              const parsed = JSON.parse(loadedAttempt.completedChunksJson);
              if (Array.isArray(parsed)) {
                const map: Record<number, boolean> = {};
                parsed.forEach((idx: number) => {
                  map[idx] = true;
                });
                setCompletedChunks(map);
              } else if (typeof parsed === 'object') {
                setCompletedChunks(parsed);
              }
            } catch {
              // ignore json parse error
            }
          }
          if (loadedAttempt.currentChunkIndex !== undefined) {
            setCurrentChunkIndex(loadedAttempt.currentChunkIndex);
          }
          if (loadedAttempt.currentPageNumber && loadedAttempt.currentPageNumber > 0) {
            setCurrentPageIndex(loadedAttempt.currentPageNumber - 1);
          }
          if (loadedAttempt.totalNotebookPages && loadedSutra) {
            setExtraPages(Math.max(0, loadedAttempt.totalNotebookPages - (loadedSutra.totalPages || 1)));
          }
          if (loadedAttempt.progressPercent !== undefined) {
            setMatchPercent(loadedAttempt.progressPercent);
          }
        }
      } catch (err) {
        console.error('Error loading sutra and progress', err);
      } finally {
        setLoading(false);
      }
    };
    loadSutraData();
  }, [sutraId, queryAttemptId, isAuthenticated, userId]);

  // Toàn văn bộ kinh xuyên suốt để nhắc chữ liên tục
  const fullSutraContent = useMemo(() => {
    if (!sutra || !sutra.pages) return '';
    return sutra.pages.map((p) => p.contentText).join('\n\n');
  }, [sutra]);

  // Tổng số trang sổ tay A4 của người dùng
  const totalNotebookPages = (sutra?.totalPages || 1) + extraPages;
  const currentPage: SutraPage | undefined = sutra?.pages[currentPageIndex];
  const currentPageId = currentPage ? currentPage.id : 1000 + currentPageIndex;

  // 2. Tải nét viết của trang hiện tại từ IndexedDB & Server
  useEffect(() => {
    const loadStrokes = async () => {
      const attemptId = attempt?.id || 0;
      const pageId = currentPageId;

      if (currentPage?.defaultGridType) {
        setGridType(currentPage.defaultGridType);
      }

      setRedoStack([]);

      const localData = await inkStorage.getPageStrokes(attemptId, pageId, userId);
      if (localData) {
        setPageStrokes(localData.strokes);
        return;
      }

      if (isAuthenticated && attempt) {
        try {
          const res = await apiClient.get(`/progress/strokes/${attempt.id}/${pageId}`);
          if (res.data?.success && res.data.data) {
            const strokes = JSON.parse(res.data.data.strokesDataJson || '[]');
            setPageStrokes(strokes);
            await inkStorage.savePageStrokes(attempt.id, pageId, strokes, res.data.data.isPageCompleted, userId);
          } else {
            setPageStrokes([]);
          }
        } catch {
          setPageStrokes([]);
        }
      } else {
        setPageStrokes([]);
      }
    };

    loadStrokes();
  }, [currentPageIndex, currentPageId, currentPage, attempt, isAuthenticated, userId]);

  // Hàm lưu tiến trình đồng bộ xuống IndexedDB & Backend
  const persistProgress = useCallback(
    async (
      updatedCompletedChunks: Record<number, boolean>,
      chunkIdx: number,
      pageIdx: number,
      extraPg: number,
      pct: number,
      matchedCount: number,
      totalCount: number
    ) => {
      const attemptId = attempt?.id || 0;
      const sutraNumericId = sutraId ? parseInt(sutraId, 10) : 0;
      const totalPg = (sutra?.totalPages || 1) + extraPg;

      // 1. Lưu tức thì IndexedDB (Offline-First)
      await inkStorage.saveAttemptProgress({
        userId,
        attemptId,
        sutraId: sutraNumericId,
        completedChunks: updatedCompletedChunks,
        currentChunkIndex: chunkIdx,
        currentPageIndex: pageIdx,
        totalNotebookPages: totalPg,
        matchPercent: pct,
        matchedChunksCount: matchedCount,
        totalChunksCount: totalCount,
        updatedAt: Date.now(),
      });

      // 2. Đồng bộ lên Backend khi đã đăng nhập
      if (isAuthenticated && attempt) {
        try {
          const completedIndexes = Object.entries(updatedCompletedChunks)
            .filter(([_, v]) => v)
            .map(([k]) => parseInt(k, 10));

          const totalWords = sutra?.totalWords || attempt.totalWords || 0;
          const calculatedCompletedWords = totalCount > 0
            ? Math.round((matchedCount / totalCount) * totalWords)
            : 0;

          await apiClient.post('/progress/update-progress', {
            attemptId: attempt.id,
            progressPercent: pct,
            completedWords: calculatedCompletedWords,
            completedChunksJson: JSON.stringify(completedIndexes),
            currentChunkIndex: chunkIdx,
            currentPageNumber: pageIdx + 1,
            totalNotebookPages: totalPg,
          });
        } catch (err) {
          console.warn('Backend progress sync error (cached in IndexedDB)', err);
        }
      }
    },
    [attempt, sutraId, sutra, isAuthenticated, userId]
  );

  // 3. Tự động lưu nét chữ tức thời khi người dùng viết (Auto-Save Local & Cloud)
  const handleStrokesChange = useCallback(
    async (newStrokes: Stroke[]) => {
      setPageStrokes(newStrokes);
      setRedoStack([]);
      const attemptId = attempt?.id || 0;
      const pageId = currentPageId;

      // Lưu IndexedDB ngay lập tức
      await inkStorage.savePageStrokes(attemptId, pageId, newStrokes, true, userId);

      // Lưu kèm tiến trình trang hiện tại
      persistProgress(
        completedChunks,
        currentChunkIndex,
        currentPageIndex,
        extraPages,
        matchPercent,
        matchedChunksCount,
        totalChunksCount
      );
    },
    [currentPageId, attempt, completedChunks, currentChunkIndex, currentPageIndex, extraPages, matchPercent, matchedChunksCount, totalChunksCount, persistProgress, userId]
  );

  // 4. Undo / Redo / Clear
  const handleUndo = () => {
    if (pageStrokes.length === 0) return;
    const last = pageStrokes[pageStrokes.length - 1];
    const updated = pageStrokes.slice(0, -1);
    setRedoStack((prev) => [...prev, last]);
    setPageStrokes(updated);
    inkStorage.savePageStrokes(attempt?.id || 0, currentPageId, updated, true, userId);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    const updatedRedo = redoStack.slice(0, -1);
    const updatedStrokes = [...pageStrokes, next];
    setRedoStack(updatedRedo);
    setPageStrokes(updatedStrokes);
    inkStorage.savePageStrokes(attempt?.id || 0, currentPageId, updatedStrokes, true, userId);
  };

  const handleClear = () => {
    if (pageStrokes.length === 0) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ nét chữ trên trang này?')) {
      setPageStrokes([]);
      setRedoStack([]);
      inkStorage.savePageStrokes(attempt?.id || 0, currentPageId, [], false, userId);
    }
  };

  // 5. Nút Lưu Thủ Công (Dùng khi Offline & Reconnect lại hoặc khi muốn đồng bộ ngay)
  const handleManualSave = async () => {
    setIsSaving(true);
    const attemptId = attempt?.id || 0;
    const pageId = currentPageId;

    try {
      await inkStorage.savePageStrokes(attemptId, pageId, pageStrokes, true, userId);

      await persistProgress(
        completedChunks,
        currentChunkIndex,
        currentPageIndex,
        extraPages,
        matchPercent,
        matchedChunksCount,
        totalChunksCount
      );

      if (isAuthenticated && attempt) {
        const completedIndexes = Object.entries(completedChunks)
          .filter(([_, v]) => v)
          .map(([k]) => parseInt(k, 10));

        const totalWords = sutra?.totalWords || attempt.totalWords || 0;
        const calculatedCompletedWords = totalChunksCount > 0
          ? Math.round((matchedChunksCount / totalChunksCount) * totalWords)
          : 0;

        const res = await apiClient.post('/progress/save-strokes', {
          attemptId: attempt.id,
          pageId: pageId,
          strokesDataJson: JSON.stringify(pageStrokes),
          isPageCompleted: pageStrokes.length > 0,
          progressPercent: matchPercent,
          completedWords: calculatedCompletedWords,
          completedChunksJson: JSON.stringify(completedIndexes),
          currentChunkIndex: currentChunkIndex,
          currentPageNumber: currentPageIndex + 1,
          totalNotebookPages: totalNotebookPages,
        });

        if (res.data?.success && res.data.data) {
          const data = res.data.data;
          if (data.attemptProgressPercent !== undefined) {
            setAttempt((prev) =>
              prev
                ? {
                  ...prev,
                  progressPercent: data.attemptProgressPercent,
                  completedWords: data.totalCompletedWords,
                }
                : null
            );
          }
        }
      }

      showToast('Đã đồng bộ lưu nét chữ & tiến trình thành công!');
    } catch (err) {
      console.error('Save failed', err);
      showToast('Đã lưu cục bộ offline. Sẽ đồng bộ khi có kết nối mạng.');
    } finally {
      setIsSaving(false);
    }
  };

  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => {
      setSaveToast(null);
    }, 3000);
  };

  // Callback nhận % tiến trình khớp từ TextPromptCard
  const handleProgressUpdate = useCallback((matchedCount: number, total: number, pct: number) => {
    setMatchedChunksCount(matchedCount);
    setTotalChunksCount(total);
    setMatchPercent(pct);
  }, []);

  // Khởi tạo lượt chép mới
  const handleStartNewAttempt = async () => {
    if (!sutraId) return;
    if (!window.confirm('Bạn có chắc chắn muốn khởi tạo một lượt chép mới (Lượt tiếp theo) cho bộ kinh này? Sổ tay chép cũ vẫn được lưu trữ nguyên vẹn.')) return;

    try {
      const res = await apiClient.post(`/progress/start-new-attempt/${sutraId}`);
      if (res.data?.success) {
        setShowCelebrationModal(false);
        window.location.reload();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể khởi tạo lượt mới.');
    }
  };

  // Callback khi người dùng đánh dấu khớp đoạn hoặc đổi đoạn trong TextPromptCard
  const handleCompletedChunksChange = useCallback(
    (newCompleted: Record<number, boolean>, newChunkIdx: number) => {
      setCompletedChunks(newCompleted);
      setCurrentChunkIndex(newChunkIdx);

      const matchedCount = Object.values(newCompleted).filter(Boolean).length;
      const total = totalChunksCount || 1;
      const pct = Math.min(100, Math.round((matchedCount / total) * 100));
      setMatchedChunksCount(matchedCount);
      setMatchPercent(pct);

      if (pct === 100 && matchPercent < 100) {
        setShowCelebrationModal(true);
      }

      persistProgress(
        newCompleted,
        newChunkIdx,
        currentPageIndex,
        extraPages,
        pct,
        matchedCount,
        total
      );
    },
    [totalChunksCount, currentPageIndex, extraPages, persistProgress, matchPercent]
  );

  // Kích hoạt nhận diện chữ viết tay & so khớp với đoạn 5 dòng hiện tại
  const triggerRecognition = useCallback(
    async (strokesToRecognize: Stroke[]) => {
      const validStrokes = strokesToRecognize.filter((s) => s.brushType !== 'ERASER' && s.points && s.points.length > 0);
      if (validStrokes.length === 0) {
        setRecognizedText('');
        setSimilarityPercent(0);
        setMatchedWords(new Set());
        return;
      }

      setIsRecognizing(true);
      try {
        const result = await recognizeStrokes(validStrokes, sutra?.scriptType || 'QUOC_NGU');
        if (result && result.text) {
          setRecognizedText(result.text);

          // Lấy nội dung 5 dòng của đoạn hiện tại
          const rawLines = (fullSutraContent || '')
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter((l) => l.length > 0);

          const chunkLines = rawLines.slice(
            currentChunkIndex * 5,
            (currentChunkIndex + 1) * 5
          );

          const matchRes = matchHandwritingWithTarget(
            result.text,
            chunkLines,
            sutra?.scriptType === 'HAN'
          );

          setSimilarityPercent(matchRes.similarityPercent);
          setMatchedWords(matchRes.matchedWords);

          // Tự động đánh dấu hoàn thành đoạn nếu đạt ngưỡng >= 70% và chưa hoàn thành
          if (matchRes.isMatched && !completedChunks[currentChunkIndex]) {
            const updated = {
              ...completedChunks,
              [currentChunkIndex]: true,
            };
            handleCompletedChunksChange(updated, currentChunkIndex);
            showToast('✨ AI đã nhận diện khớp đoạn kinh!');
          }
        }
      } catch (err) {
        console.warn('[Handwriting] Recognition error:', err);
      } finally {
        setIsRecognizing(false);
      }
    },
    [sutra, fullSutraContent, currentChunkIndex, completedChunks, handleCompletedChunksChange]
  );

  // Debounce 1.4s tự động nhận diện chữ khi người dùng dừng nét vẽ
  useEffect(() => {
    if (!autoRecognize || pageStrokes.length === 0) return;

    const timer = setTimeout(() => {
      triggerRecognition(pageStrokes);
    }, 1400);

    return () => clearTimeout(timer);
  }, [pageStrokes, autoRecognize, triggerRecognition]);

  // Chuyển trang sổ tay A4
  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      const nextIdx = currentPageIndex - 1;
      setCurrentPageIndex(nextIdx);
      persistProgress(
        completedChunks,
        currentChunkIndex,
        nextIdx,
        extraPages,
        matchPercent,
        matchedChunksCount,
        totalChunksCount
      );
    }
  };

  const handleNextPage = () => {
    if (currentPageIndex < totalNotebookPages - 1) {
      const nextIdx = currentPageIndex + 1;
      setCurrentPageIndex(nextIdx);
      persistProgress(
        completedChunks,
        currentChunkIndex,
        nextIdx,
        extraPages,
        matchPercent,
        matchedChunksCount,
        totalChunksCount
      );
    } else {
      const nextExtra = extraPages + 1;
      const nextIdx = currentPageIndex + 1;
      setExtraPages(nextExtra);
      setCurrentPageIndex(nextIdx);
      persistProgress(
        completedChunks,
        currentChunkIndex,
        nextIdx,
        nextExtra,
        matchPercent,
        matchedChunksCount,
        totalChunksCount
      );
      showToast('Đã mở thêm 1 trang A4 mới vào sổ tay!');
    }
  };

  const handleAddNewPage = () => {
    const nextExtra = extraPages + 1;
    const nextIdx = totalNotebookPages;
    setExtraPages(nextExtra);
    setCurrentPageIndex(nextIdx);
    persistProgress(
      completedChunks,
      currentChunkIndex,
      nextIdx,
      nextExtra,
      matchPercent,
      matchedChunksCount,
      totalChunksCount
    );
    showToast('Đã thêm 1 trang A4 mới!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sutra-paper flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-900 mb-4"></div>
        <p className="font-serif text-amber-950 font-medium">Đang chuẩn bị trang kinh A4...</p>
      </div>
    );
  }

  if (!sutra) {
    return (
      <div className="min-h-screen bg-sutra-paper flex flex-col items-center justify-center p-4">
        <p className="text-base text-amber-950 font-bold mb-3">Không tìm thấy nội dung bộ kinh này.</p>
        <button
          onClick={() => navigate('/')}
          className="touch-target-44 px-3 py-1.5 bg-amber-900 text-white rounded-md text-xs font-bold shadow-xs cursor-pointer"
        >
          Quay lại Thư Viện
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-sutra-paper flex flex-col select-none ${zenMode ? 'pb-2 pt-1' : 'pb-10'}`}>
      {!zenMode && <Navbar />}

      {/* Header: Tên Kinh & Thanh Tiến Trình Đã Chép Dựa Trên % Đã Khớp (Radius nhẹ rounded-md/rounded-lg) */}
      <div className={`bg-amber-100/60 border-b border-amber-900/10 px-3 sm:px-4 py-1.5 sticky top-0 z-30 backdrop-blur-md ${zenMode ? 'shadow-sm' : ''}`}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          {/* Nút quay lại & Tiêu đề Bộ Kinh */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="w-6 h-6 flex items-center justify-center p-0 text-amber-950 hover:bg-amber-200/50 rounded-md transition-colors shrink-0 cursor-pointer"
              title="Về thư viện kinh"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <div>
              <h2 className="font-bold text-amber-950 text-xs sm:text-sm line-clamp-1">
                {sutra.title}
              </h2>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-amber-900/70 font-medium mt-0.2">
                <span>
                  {sutra.scriptType === 'QUOC_NGU'
                    ? 'Tiếng Việt'
                    : sutra.scriptType === 'HAN'
                      ? 'Kinh Chữ Hán'
                      : 'Phiên Âm Pali'}
                </span>
                <span>•</span>
                <span>Sổ tay {totalNotebookPages} trang</span>
                <span className="flex items-center gap-1">
                  {isOnline ? (
                    <span className="text-emerald-700 inline-flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Đang kết nối
                    </span>
                  ) : (
                    <span className="text-amber-800 font-semibold">Offline (Lưu máy)</span>
                  )}
                </span>
                {allAttempts.length > 1 && (
                  <>
                    <span>•</span>
                    <select
                      value={attempt?.id || ''}
                      onChange={(e) => setSearchParams({ attemptId: e.target.value })}
                      className="bg-amber-200/80 text-amber-950 font-bold px-1.5 py-0.2 rounded text-[10px] border border-amber-800/30 cursor-pointer focus:outline-none"
                      title="Chuyển đổi giữa các lượt chép"
                    >
                      {allAttempts.map((att) => (
                        <option key={att.id} value={att.id}>
                          Lượt #{att.attemptNumber} {att.status === 'COMPLETED' ? '★ Viên Mãn' : `(${Math.round(att.progressPercent)}%)`}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Tools: Zen Mode Toggle + Tiến Trình Đã Chép + Nút Lưu */}
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-xl border border-amber-900/15 shadow-xs">
            {/* Zen Focus Mode Button */}
            <button
              type="button"
              onClick={() => setZenMode(!zenMode)}
              className={`h-7.5 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${zenMode
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-amber-100/80 hover:bg-amber-200 text-amber-950 border border-amber-900/15'
                }`}
              title={zenMode ? 'Thoát chế độ tập trung' : 'Bật chế độ tập trung'}
            >
              <span>{zenMode ? 'Thoát tập trung' : '🌿 Chế độ tập trung'}</span>
            </button>

            <div className="text-left flex items-center gap-1.5">
              <span className="text-xs font-bold text-amber-950">
                Tiến độ: <span className="text-amber-900 font-bold">{matchPercent}% ({matchedChunksCount}/{totalChunksCount})</span>
              </span>
            </div>

            {/* Progress Bar Sinh Động */}
            <div className="w-14 sm:w-20 h-2 bg-amber-200/80 rounded-full overflow-hidden border border-amber-300/80 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-amber-700 to-amber-900 rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${matchPercent}%` }}
              />
            </div>

            {/* Nút Xuất Bản Sổ Tay PDF A4 */}
            <button
              type="button"
              onClick={() => setShowExportPdfModal(true)}
              className="h-7.5 px-2.5 bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-900/15 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
              title="Xuất toàn bộ sổ tay thành tệp PDF khổ A4"
            >
              <FileDown className="w-3.5 h-3.5 text-amber-800" />
              <span className="hidden sm:inline">Xuất PDF</span>
            </button>

            {/* Nút Lưu Tiến Trình & Nét Viết */}
            <button
              type="button"
              onClick={handleManualSave}
              disabled={isSaving}
              className="h-7.5 px-3 bg-amber-900 hover:bg-amber-950 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all disabled:opacity-50 cursor-pointer shrink-0"
              title="Lưu nét vẽ & Cập nhật % tiến trình"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang Lưu...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-amber-200" />
                  <span>Lưu</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Container: Bảng Nhắc Chữ 5 Dòng + Khổ Giấy A4 Kèm Thanh Công Cụ Cao Bằng Khổ Giấy */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-2 sm:px-4 py-3 sm:py-4 flex flex-col items-center">
        {/* 1. BẢNG NHẮC CHỮ (5 DÒNG) PHÍA TRÊN */}
        <TextPromptCard
          contentText={fullSutraContent}
          scriptType={sutra.scriptType}
          initialCompletedChunks={completedChunks}
          initialChunkIndex={currentChunkIndex}
          pageNumber={currentPageIndex + 1}
          totalPages={totalNotebookPages}
          onPrevPage={handlePrevPage}
          onNextPage={handleNextPage}
          onAddNewPage={handleAddNewPage}
          onProgressUpdate={handleProgressUpdate}
          onCompletedChunksChange={handleCompletedChunksChange}
          recognizedText={recognizedText}
          isRecognizing={isRecognizing}
          similarityPercent={similarityPercent}
          matchedWords={matchedWords}
          onRecognizeNow={() => triggerRecognition(pageStrokes)}
        />

        {/* 2. KHỔ GIẤY A4 + THANH CÔNG CỤ DOCK CỐ ĐỊNH KẾ BÊN (Cao bằng khổ giấy) */}
        <div className="w-full flex items-stretch justify-center gap-2 sm:gap-4 mt-2">
          {dockPosition === 'left' && (
            <SidebarTools
              brushType={brushType}
              onBrushTypeChange={setBrushType}
              brushColor={brushColor}
              onBrushColorChange={setBrushColor}
              brushSize={brushSize}
              onBrushSizeChange={setBrushSize}
              gridType={gridType}
              onGridTypeChange={setGridType}
              paperType={paperType}
              onPaperTypeChange={setPaperType}
              penOnlyMode={penOnlyMode}
              onTogglePenOnlyMode={() => setPenOnlyMode(!penOnlyMode)}
              autoRecognize={autoRecognize}
              onToggleAutoRecognize={() => setAutoRecognize(!autoRecognize)}
              isRecognizing={isRecognizing}
              canUndo={pageStrokes.length > 0}
              canRedo={redoStack.length > 0}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onClear={handleClear}
              dockPosition={dockPosition}
              onToggleDockPosition={() => setDockPosition((prev) => (prev === 'left' ? 'right' : 'left'))}
            />
          )}

          {/* Vùng Canvas A4 Sổ Tay */}
          <div className="flex-1 max-w-4xl flex items-center justify-center">
            <A4InkCanvas
              pageNumber={currentPageIndex + 1}
              gridType={gridType}
              paperType={paperType}
              brushType={brushType}
              brushColor={brushColor}
              brushSize={brushSize}
              penOnlyMode={penOnlyMode}
              strokes={pageStrokes}
              onStrokesChange={handleStrokesChange}
              onUndo={handleUndo}
              onRedo={handleRedo}
            />
          </div>

          {dockPosition === 'right' && (
            <SidebarTools
              brushType={brushType}
              onBrushTypeChange={setBrushType}
              brushColor={brushColor}
              onBrushColorChange={setBrushColor}
              brushSize={brushSize}
              onBrushSizeChange={setBrushSize}
              gridType={gridType}
              onGridTypeChange={setGridType}
              paperType={paperType}
              onPaperTypeChange={setPaperType}
              penOnlyMode={penOnlyMode}
              onTogglePenOnlyMode={() => setPenOnlyMode(!penOnlyMode)}
              autoRecognize={autoRecognize}
              onToggleAutoRecognize={() => setAutoRecognize(!autoRecognize)}
              isRecognizing={isRecognizing}
              canUndo={pageStrokes.length > 0}
              canRedo={redoStack.length > 0}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onClear={handleClear}
              dockPosition={dockPosition}
              onToggleDockPosition={() => setDockPosition((prev) => (prev === 'left' ? 'right' : 'left'))}
            />
          )}
        </div>
      </main>

      {/* Toast thông báo lưu mượt mà */}
      {saveToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-amber-950 text-amber-100 px-4 py-2 rounded-lg shadow-lg border border-amber-800 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Modal Chúc Mừng Công Đức Viên Mãn (100%) */}
      <CompletionCelebrationModal
        isOpen={showCelebrationModal}
        onClose={() => setShowCelebrationModal(false)}
        sutraTitle={sutra.title}
        attemptNumber={attempt?.attemptNumber || 1}
        totalWords={sutra.totalWords || attempt?.totalWords || 0}
        onOpenCertificate={() => {
          setShowCelebrationModal(false);
          setShowCertificateModal(true);
        }}
        onStartNewAttempt={handleStartNewAttempt}
      />

      {/* Modal Bằng Chứng Nhận Công Đức (Certificate of Merit) */}
      <CertificateModal
        isOpen={showCertificateModal}
        onClose={() => setShowCertificateModal(false)}
        userName={user?.fullName || 'Phật Tử Tinh Tấn'}
        sutraTitle={sutra.title}
        attemptNumber={attempt?.attemptNumber || 1}
        totalWords={sutra.totalWords || attempt?.totalWords || 0}
        completedDate={attempt?.completedAt}
      />

      {/* Modal Xuất Bản Sổ Tay PDF A4 */}
      <ExportPdfModal
        isOpen={showExportPdfModal}
        onClose={() => setShowExportPdfModal(false)}
        sutraId={sutra.id}
        attemptId={attempt?.id || 0}
        userId={userId}
        sutraTitle={sutra.title}
        scriptType={sutra.scriptType}
        totalNotebookPages={totalNotebookPages}
        userName={user?.fullName || 'Phật Tử Tinh Tấn'}
      />
    </div>
  );
};
