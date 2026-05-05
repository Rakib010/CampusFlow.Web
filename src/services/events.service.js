import api from './api.js';

export const eventsService = {
  listEvents: (params = {}) =>
    api.get('/events', { params }).then((r) => r.data),

  getEvent: (id) =>
    api.get(`/events/${id}`).then((r) => r.data),

  createEvent: (payload) =>
    api.post('/events', payload).then((r) => r.data),

  updateEvent: (id, payload) =>
    api.put(`/events/${id}`, payload).then((r) => r.data),

  updateStatus: (id, status) =>
    api.patch(`/events/${id}/status`, { status }).then((r) => r.data),

  deleteEvent: (id) =>
    api.delete(`/events/${id}`).then((r) => r.data),

  uploadBanner: (id, file) => {
    const form = new FormData();
    form.append('banner', file);
    return api.patch(`/events/${id}/banner`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  addGallery: (id, files) => {
    const form = new FormData();
    files.forEach((f) => form.append('media', f));
    return api.post(`/events/${id}/gallery`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  deleteGalleryItem: (id, itemId) =>
    api.delete(`/events/${id}/gallery/${itemId}`).then((r) => r.data),

  reassignOrganizer: (id, organizerId) =>
    api.patch(`/events/${id}/organizer`, { organizerId }).then((r) => r.data),
};
