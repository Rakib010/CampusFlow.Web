import api from './api.js';

export const authService = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),

  register: (payload) =>
    api.post('/auth/register', payload).then((r) => r.data),

  registerAdmin: (payload) =>
    api.post('/auth/register-admin', payload).then((r) => r.data),

  logout: () => Promise.resolve(),

  getMe: () =>
    api.get('/auth/me').then((r) => r.data),

  refreshToken: (refreshToken) =>
    api.post('/auth/refresh-token', { refreshToken }).then((r) => r.data),

  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (token, newPassword) =>
    api.post('/auth/reset-password', { token, newPassword }).then((r) => r.data),

  changePassword: (oldPassword, newPassword) =>
    api.patch('/auth/change-password', { oldPassword, newPassword }).then((r) => r.data),

  verifyOtp: (email, otp) =>
    api.post('/auth/verify-otp', { email, otp }).then((r) => r.data),

  resendOtp: (email) =>
    api.post('/auth/resend-otp', { email }).then((r) => r.data),
};
