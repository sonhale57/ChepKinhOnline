import React, { useState, useEffect } from 'react';
import { Flame, Bell, CheckCircle2, Calendar } from 'lucide-react';
import { apiClient } from '../api/client';
import { reminderNotificationService } from '../services/reminderNotificationService';

export interface UserStreakInfo {
  currentStreakDays: number;
  longestStreakDays: number;
  practicedToday: boolean;
  dailyReminderTime: string;
  isReminderEnabled: boolean;
  practiceDatesThisMonth: string[];
}

export const DailyStreakCard: React.FC = () => {
  const [streakInfo, setStreakInfo] = useState<UserStreakInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [reminderTime, setReminderTime] = useState<string>('20:00');
  const [isReminderEnabled, setIsReminderEnabled] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // 1. Tải thông tin streak từ API
  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const res = await apiClient.get('/user/streak-status');
        if (res.data?.success) {
          const data: UserStreakInfo = res.data.data;
          setStreakInfo(data);
          setReminderTime(data.dailyReminderTime || '20:00');
          setIsReminderEnabled(data.isReminderEnabled);
        }
      } catch (err) {
        console.warn('Streak fetch error', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStreak();
  }, []);

  // 2. Chạy timer kiểm tra giờ thông báo định kỳ mỗi 30s
  useEffect(() => {
    if (!streakInfo) return;

    const interval = setInterval(() => {
      reminderNotificationService.checkAndTriggerDailyReminder(
        reminderTime,
        isReminderEnabled,
        streakInfo.practicedToday
      );
    }, 30000);

    return () => clearInterval(interval);
  }, [reminderTime, isReminderEnabled, streakInfo]);

  // Lưu cài đặt giờ nhắc nhở
  const handleSaveReminder = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    // Yêu cầu quyền thông báo nếu bật
    if (isReminderEnabled) {
      await reminderNotificationService.requestPermission();
    }

    try {
      const res = await apiClient.post('/user/reminder-settings', {
        dailyReminderTime: reminderTime,
        isReminderEnabled,
      });

      if (res.data?.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Save reminder error', err);
      alert('Không thể lưu cài đặt nhắc nhở.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-amber-900/15 p-5 shadow-xs animate-pulse">
        <div className="h-6 bg-amber-100 rounded w-1/3 mb-3"></div>
        <div className="h-16 bg-amber-50 rounded"></div>
      </div>
    );
  }

  const currentStreak = streakInfo?.currentStreakDays || 0;
  const longestStreak = streakInfo?.longestStreakDays || 0;
  const practicedToday = streakInfo?.practicedToday || false;
  const practiceDates = streakInfo?.practiceDatesThisMonth || [];

  // Tạo mảng 14 ngày gần nhất để vẽ biểu đồ chấm tròn
  const recentDays = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayLabel = String(d.getDate());
    const isPracticed = practiceDates.includes(dateStr);
    const isToday = i === 13;

    return { dateStr, dayLabel, isPracticed, isToday };
  });

  return (
    <div className="bg-white rounded-xl border border-amber-900/15 p-5 sm:p-6 shadow-xs text-left space-y-5">
      {/* Header & Streak Counter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-900/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-800 text-white flex items-center justify-center shadow-md">
            <Flame className="w-7 h-7 text-amber-200 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-amber-950">
                Chuỗi Ngày Tinh Tấn
              </h3>
              {practicedToday && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Hôm nay đã chép</span>
                </span>
              )}
            </div>
            <p className="text-xs text-amber-900/70 mt-0.5">
              Duy trì thời khóa chép kinh mỗi ngày nuôi dưỡng tâm an lạc
            </p>
          </div>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="bg-amber-50 px-3.5 py-1.5 rounded-lg border border-amber-900/10 text-center">
            <span className="text-[10px] text-amber-900/60 uppercase font-semibold block">Hiện tại</span>
            <span className="text-base sm:text-lg font-extrabold text-amber-900">
              🔥 {currentStreak} ngày
            </span>
          </div>
          <div className="bg-amber-50 px-3.5 py-1.5 rounded-lg border border-amber-900/10 text-center">
            <span className="text-[10px] text-amber-900/60 uppercase font-semibold block">Kỷ lục</span>
            <span className="text-base sm:text-lg font-extrabold text-amber-950">
              🏆 {longestStreak} ngày
            </span>
          </div>
        </div>
      </div>

      {/* Heatmap 14 Ngày Gần Nhất */}
      <div>
        <div className="flex items-center justify-between text-xs font-bold text-amber-950 mb-2">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-800" />
            <span>Lịch Tu Tập 14 Ngày Gần Nhất</span>
          </span>
          <span className="text-[11px] text-amber-900/60 font-normal">
            {practicedToday ? 'Đã gieo mầm an vui hôm nay' : 'Chưa chép kinh hôm nay'}
          </span>
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5">
          {recentDays.map((day) => (
            <div
              key={day.dateStr}
              className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all ${day.isPracticed
                ? 'bg-amber-800 text-amber-50 border-amber-900 shadow-xs'
                : 'bg-gray-50 text-gray-400 border-gray-200'
                } ${day.isToday ? 'ring-2 ring-amber-500 ring-offset-1 font-bold' : ''}`}
              title={`${day.dateStr}: ${day.isPracticed ? 'Đã chép kinh' : 'Chưa chép'}`}
            >
              <span className="text-[11px] font-bold">{day.dayLabel}</span>
              <span className="text-[8px] mt-0.5 opacity-80">
                {day.isPracticed ? '●' : '○'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Cài Đặt Giờ Nhắc Nhở Công Phu Hàng Ngày (Giờ VN - UTC+7) */}
      <div className="bg-amber-50/60 rounded-xl p-4 border border-amber-900/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Bell className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-amber-950">
              Nhắc Giờ Công Phu
            </h4>
            <p className="text-[11px] text-amber-900/70 mt-0.5">
              Thông báo nhẹ nhàng trên màn hình thiết bị khi đến giờ chép kinh
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap">
          {/* Toggle Bật / Tắt */}
          <label className="h-8.5 px-3 flex items-center gap-1.5 text-xs font-bold text-amber-950 bg-white rounded-lg border border-amber-900/15 shadow-xs cursor-pointer select-none hover:bg-amber-50/50 transition-colors">
            <input
              type="checkbox"
              checked={isReminderEnabled}
              onChange={(e) => setIsReminderEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-amber-800 focus:ring-amber-800 border-amber-900/30 accent-amber-900 cursor-pointer"
            />
            <span>Bật</span>
          </label>

          {/* Ô chọn giờ */}
          <div className="relative">
            <input
              type="time"
              disabled={!isReminderEnabled}
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="h-8.5 px-3 rounded-lg border border-amber-900/20 bg-white text-xs font-bold text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-800 disabled:opacity-40 shadow-xs cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={handleSaveReminder}
            disabled={isSaving}
            className="h-8.5 px-3.5 rounded-lg bg-amber-900 hover:bg-amber-950 text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            {isSaving ? 'Lưu...' : saveSuccess ? '✓ Đã Lưu' : 'Lưu Giờ'}
          </button>
        </div>
      </div>
    </div>
  );
};
