import api from './api.js';

export const usersService = {
  getMyProfile: () =>
    api.get('/users/profile').then((r) => r.data),

  updateMyProfile: (payload) =>
    api.put('/users/profile', payload).then((r) => r.data),

  uploadPhoto: (file) => {
    const form = new FormData();
    form.append('photo', file);
    return api.patch('/users/profile/photo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  listUsers: (params = {}) =>
    api.get('/users', { params }).then((r) => r.data),

  getUserById: (id) =>
    api.get(`/users/${id}`).then((r) => r.data),

  approveOrganizer: (id) =>
    api.patch(`/users/${id}/approve`).then((r) => r.data),

  toggleActive: (id, isActive) =>
    api.patch(`/users/${id}/toggle-active`, { isActive }).then((r) => r.data),

  deleteUser: (id) =>
    api.delete(`/users/${id}`).then((r) => r.data),
};
