import api from './api.js';

export const volunteersService = {
  getNeedsByEvent: (eventId) =>
    api.get(`/volunteers/events/${eventId}/needs`).then((r) => r.data),

  createNeed: (eventId, payload) =>
    api.post(`/volunteers/events/${eventId}/needs`, payload).then((r) => r.data),

  updateNeed: (needId, payload) =>
    api.put(`/volunteers/needs/${needId}`, payload).then((r) => r.data),

  deleteNeed: (needId) =>
    api.delete(`/volunteers/needs/${needId}`).then((r) => r.data),

  applyToEvent: (eventId, payload) =>
    api.post(`/volunteers/events/${eventId}/apply`, payload).then((r) => r.data),

  getMyApplications: () =>
    api.get('/volunteers/my-applications').then((r) => r.data),

  getApplications: (eventId) =>
    api.get(`/volunteers/events/${eventId}/applications`).then((r) => r.data),

  reviewApplication: (appId, payload) =>
    api.patch(`/volunteers/applications/${appId}/review`, payload).then((r) => r.data),

  bulkReview: (payload) =>
    api.post('/volunteers/applications/bulk-review', payload).then((r) => r.data),

  getResponsibilities: (eventId) =>
    api.get(`/volunteers/events/${eventId}/responsibilities`).then((r) => r.data),
};
