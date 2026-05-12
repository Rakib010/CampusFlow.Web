import api from './api.js';

export const feedbackService = {
  submitEventFeedback: (eventId, payload) =>
    api.post(`/feedback/events/${eventId}`, payload).then((r) => r.data),

  getEventFeedback: (eventId) =>
    api.get(`/feedback/events/${eventId}`).then((r) => r.data),

  rateVolunteer: (eventId, volunteerId, payload) =>
    api.post(`/feedback/events/${eventId}/volunteers/${volunteerId}/rate`, payload).then((r) => r.data),

  rateOrganizer: (eventId, organizerId, payload) =>
    api.post(`/feedback/events/${eventId}/organizers/${organizerId}/rate`, payload).then((r) => r.data),

  getVolunteerRatings: (volunteerId) =>
    api.get(`/feedback/volunteers/${volunteerId}/ratings`).then((r) => r.data),

  getMyVolunteerRatings: () =>
    api.get('/feedback/volunteers/my/ratings').then((r) => r.data),

  getOrganizerRatings: (organizerId) =>
    api.get(`/feedback/organizers/${organizerId}/ratings`).then((r) => r.data),

  getMyOrganizerRatings: () =>
    api.get('/feedback/organizers/my/ratings').then((r) => r.data),

  getLeaderboard: (limit = 10) =>
    api.get(`/feedback/leaderboard?limit=${limit}`).then((r) => r.data),

  listVolunteers: () =>
    api.get('/feedback/volunteers/list').then((r) => r.data),

  getVolunteerRatableEvents: (volunteerId) =>
    api.get(`/feedback/volunteers/${volunteerId}/ratable-events`).then((r) => r.data),

  getEventVolunteers: (eventId) =>
    api.get(`/feedback/events/${eventId}/volunteers`).then((r) => r.data),
};
