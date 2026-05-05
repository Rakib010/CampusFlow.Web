import api from './api.js';

export const ticketsService = {
  getTicketTypes: (eventId) =>
    api.get(`/tickets/events/${eventId}/types`).then((r) => r.data),

  createTicketType: (eventId, payload) =>
    api.post(`/tickets/events/${eventId}/types`, payload).then((r) => r.data),

  updateTicketType: (typeId, payload) =>
    api.put(`/tickets/types/${typeId}`, payload).then((r) => r.data),

  deleteTicketType: (typeId) =>
    api.delete(`/tickets/types/${typeId}`).then((r) => r.data),

  purchaseTicket: (payload) =>
    api.post('/tickets/purchase', payload).then((r) => r.data),

  getMyTickets: () =>
    api.get('/tickets/my-tickets').then((r) => r.data),

  getEventTickets: (eventId, params = {}) =>
    api.get(`/tickets/events/${eventId}/all`, { params }).then((r) => r.data),

  getTicketById: (id) =>
    api.get(`/tickets/${id}`).then((r) => r.data),

  confirmCashPayment: (id) =>
    api.patch(`/tickets/${id}/confirm-cash`).then((r) => r.data),
};
