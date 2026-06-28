// SparkMatch — API Client
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import { API_BASE_URL } from '../config';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  // Free hosting (Railway/Render) sleeps when idle; the first request can take
  // 20-40s to wake the server. A generous timeout avoids false "failed" errors.
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — transparent token refresh on 401
let refreshPromise: Promise<string | null> | null = null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Cold-start / transient retry: if the server is waking up (timeout, network
    // error, or 502/503/504) retry up to twice with a short backoff before giving up.
    const isColdStart =
      !error.response ||
      [502, 503, 504].includes(error.response?.status);
    const isTimeoutOrNetwork =
      error.code === 'ECONNABORTED' || error.message === 'Network Error' || !error.response;

    if (originalRequest && (isColdStart || isTimeoutOrNetwork)) {
      originalRequest._coldRetries = originalRequest._coldRetries || 0;
      if (originalRequest._coldRetries < 2) {
        originalRequest._coldRetries += 1;
        await sleep(2000 * originalRequest._coldRetries);
        return api(originalRequest);
      }
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // De-duplicate concurrent refreshes into a single request.
        if (!refreshPromise) {
          refreshPromise = (async () => {
            const refreshToken = useAuthStore.getState().refreshToken;
            if (!refreshToken) return null;
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
            const { accessToken, refreshToken: newRefreshToken } = response.data.data;
            await useAuthStore.getState().setTokens(accessToken, newRefreshToken);
            return accessToken as string;
          })();
        }

        const newAccessToken = await refreshPromise;
        refreshPromise = null;

        if (newAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
        await useAuthStore.getState().logout();
      } catch (refreshError) {
        refreshPromise = null;
        await useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
