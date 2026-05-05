import api from './api.js';

export const notificationsService = {
  getMyNotifications: (params = {}) =>
    api.get('/notifications', { params }).then((r) => r.data),

  markAllRead: () =>
    api.patch('/notifications/read-all').then((r) => r.data),

  markRead: (id) =>
    api.patch(`/notifications/${id}/read`).then((r) => r.data),

  deleteNotification: (id) =>
    api.delete(`/notifications/${id}`).then((r) => r.data),

  getAnnouncements: (params = {}) =>
    api.get('/notifications/announcements', { params }).then((r) => r.data),

  sendAnnouncement: (payload) =>
    api.post('/notifications/announcements', payload).then((r) => r.data),
};
