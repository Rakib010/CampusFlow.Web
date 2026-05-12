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
  { value: 'bkash',         label: 'bKash',         color: '#e2136e', icon: 'https://res.cloudinary.com/dnpun8jzt/image/upload/v1778574394/bkash_b4ab8o.png' },
  { value: 'nagad',         label: 'Nagad',         color: '#ec1c24', icon: 'https://res.cloudinary.com/dnpun8jzt/image/upload/v1778574390/nagad_l5m6ho.jpg' },
  { value: 'rocket',        label: 'Rocket',        color: '#8b3eb6', icon: 'https://res.cloudinary.com/dnpun8jzt/image/upload/v1778574386/rocket_n7iuwc.png' },
  { value: 'bank_transfer', label: 'Bank Transfer', color: '#0891b2', icon: 'https://res.cloudinary.com/dnpun8jzt/image/upload/v1778574374/bank_transfer_lgoe9b.png' },
  { value: 'other',         label: 'Other',         color: '#64748b', icon: null },
];
