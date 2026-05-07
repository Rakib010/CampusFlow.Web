import api from './api.js';

export const paymentMethodsService = {
  list: (eventId) =>
    api.get(`/events/${eventId}/payment-methods`).then((r) => r.data),

  create: (eventId, payload) =>
    api.post(`/events/${eventId}/payment-methods`, payload).then((r) => r.data),

  update: (id, payload) =>
    api.put(`/payment-methods/${id}`, payload).then((r) => r.data),

  remove: (id) =>
    api.delete(`/payment-methods/${id}`).then((r) => r.data),
};

export const PAYMENT_METHOD_TYPES = [
  { value: 'bkash',          label: 'bKash',          color: '#e2136e' },
  { value: 'nagad',          label: 'Nagad',          color: '#ec1c24' },
  { value: 'rocket',         label: 'Rocket',         color: '#8b3eb6' },
  { value: 'bank_transfer',  label: 'Bank Transfer',  color: '#0891b2' },
  { value: 'other',          label: 'Other',          color: '#64748b' },
];
