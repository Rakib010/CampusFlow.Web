import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Read tokens out of the Zustand persist envelope: { state: {accessToken, refreshToken}, version: 0 }
const readAuth = () => {
  try {
    const raw = localStorage.getItem('cf_auth');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed?.state || {};
  } catch {
    return {};
  }
};

const writeAccessToken = (newAccess) => {
  try {
    const raw = localStorage.getItem('cf_auth');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed?.state) {
      parsed.state.accessToken = newAccess;
      localStorage.setItem('cf_auth', JSON.stringify(parsed));
    }
  } catch {
    // ignore
  }
};

// Attach access token to every request
api.interceptors.request.use((config) => {
  const { accessToken } = readAuth();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}

// Auto-refresh access token on 401
// URLs where a 401 means "wrong credentials", not "token expired" — never refresh on these
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/verify-otp', '/auth/resend-otp', '/auth/forgot-password', '/auth/reset-password', '/auth/refresh-token'];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const url = original?.url || '';
    const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => url.includes(path));

    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch(Promise.reject.bind(Promise));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { refreshToken } = readAuth();
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken }
        );
        const newAccess = data.data.accessToken;
        writeAccessToken(newAccess);

        processQueue(null, newAccess);
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('cf_auth');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
