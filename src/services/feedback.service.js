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
};
