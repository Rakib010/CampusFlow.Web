import api from './api.js';

export const certificatesService = {
  getMyCertificates: () =>
    api.get('/certificates/my').then((r) => r.data),

  getMyHours: () =>
    api.get('/certificates/my/hours').then((r) => r.data),

  getAdminStats: () =>
    api.get('/certificates/admin/stats').then((r) => r.data),

  getCertificate: (id) =>
    api.get(`/certificates/${id}`).then((r) => r.data),

  generateForVolunteer: (eventId, volunteerId) =>
    api.post(`/certificates/events/${eventId}/volunteers/${volunteerId}/generate`).then((r) => r.data),

  generateBulk: (eventId) =>
    api.post(`/certificates/events/${eventId}/bulk-generate`).then((r) => r.data),
};
