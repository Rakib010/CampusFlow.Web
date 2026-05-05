import api from './api.js';

export const attendanceService = {
  getEventAttendance: (eventId) =>
    api.get(`/attendance/events/${eventId}`).then((r) => r.data),

  checkInManual: (eventId, userId, userType = 'attendee') =>
    api.post('/attendance/check-in/manual', { eventId, userId, userType }).then((r) => r.data),

  checkOut: (eventId, userId) =>
    api.post('/attendance/check-out', { eventId, userId }).then((r) => r.data),

  checkInByQR: (qrData) =>
    api.post('/attendance/check-in/qr', { qrData }).then((r) => r.data),

  validateQR: (qrData) =>
    api.post('/attendance/validate-qr', { qrData }).then((r) => r.data),
};
