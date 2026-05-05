import { create } from 'zustand';
import { notificationsService } from '../services/notifications.service.js';

const useNotifStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetch: async () => {
    set({ isLoading: true });
    try {
      const res = await notificationsService.getMyNotifications({ limit: 20, page: 1 });
      const items = res.data || [];
      set({
        notifications: items,
        unreadCount: items.filter((n) => !n.is_read).length,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  markRead: async (id) => {
    await notificationsService.markRead(id);
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }));
  },

  markAllRead: async () => {
    await notificationsService.markAllRead();
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0,
    }));
  },

  remove: async (id) => {
    await notificationsService.deleteNotification(id);
    set((s) => {
      const target = s.notifications.find((n) => n.id === id);
      return {
        notifications: s.notifications.filter((n) => n.id !== id),
        unreadCount: target && !target.is_read
          ? Math.max(0, s.unreadCount - 1)
          : s.unreadCount,
      };
    });
  },
}));

export default useNotifStore;
