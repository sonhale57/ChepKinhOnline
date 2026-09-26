// Quản lý thông báo nhắc nhở chép kinh hàng ngày theo múi giờ Việt Nam (UTC+7)

export const reminderNotificationService = {
  // Yêu cầu cấp quyền thông báo Web Notification
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  },

  // Hiển thị thông báo tức thì
  showMindfulNotification(title: string, body: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/images/logo.png',
          badge: '/images/logo.png',
        });
      } catch (err) {
        console.warn('Notification error', err);
      }
    }
  },

  // Lấy giờ hiện tại theo múi giờ Việt Nam (UTC+7) dạng "HH:mm"
  getVietnamCurrentTime(): string {
    const vnDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const hours = String(vnDate.getHours()).padStart(2, '0');
    const minutes = String(vnDate.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  // Lấy ngày hôm nay theo giờ Việt Nam dạng "YYYY-MM-DD"
  getVietnamTodayString(): string {
    const vnDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const year = vnDate.getFullYear();
    const month = String(vnDate.getMonth() + 1).padStart(2, '0');
    const day = String(vnDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // Kiểm tra và kích hoạt nhắc nhở định kỳ
  checkAndTriggerDailyReminder(
    targetTime: string,
    isReminderEnabled: boolean,
    practicedToday: boolean
  ) {
    if (!isReminderEnabled || practicedToday) return;

    const currentVnTime = this.getVietnamCurrentTime();
    const todayStr = this.getVietnamTodayString();
    const lastNotifiedKey = `chepkinh_last_notified_date_${todayStr}`;

    if (currentVnTime === targetTime && !localStorage.getItem(lastNotifiedKey)) {
      this.showMindfulNotification(
        '🌸 Giờ Chép Kinh Tĩnh Tâm',
        'Đã đến giờ lắng tâm chép kinh. Chúc bạn một thời khắc tu tập thanh tịnh và an lạc.'
      );
      localStorage.setItem(lastNotifiedKey, 'true');
    }
  },
};
