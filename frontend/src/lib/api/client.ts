import axios, { AxiosRequestConfig } from 'axios';
import { STORAGE_KEYS, useAuthStore } from '@/store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL //|| 'http://localhost:8001/api/v1';


if (!API_BASE_URL) {
  throw new Error('VITE_API_URL is not defined in environment variables');
}

const REFRESH_LOCK_TTL = 10_000; // 10 secondes

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});


const refreshClient = axios.create({
  baseURL: API_BASE_URL,
});


type FailedQueueItem = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

/* =====================================
   Refresh queue (onglet courant)
===================================== */

let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];

const processQueue = (error?: unknown, token?: string) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error || !token) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

/* =====================================
   Refresh lock (multi-onglets)
===================================== */

const acquireRefreshLock = (): boolean => {
  const now = Date.now();
  const lock = localStorage.getItem(STORAGE_KEYS.REFRESH_LOCK);

  if (lock && now - Number(lock) < REFRESH_LOCK_TTL) {
    return false;
  }

  localStorage.setItem(STORAGE_KEYS.REFRESH_LOCK, now.toString());
  return true;
};

const releaseRefreshLock = () => {
  localStorage.removeItem(STORAGE_KEYS.REFRESH_LOCK);
};


/* =====================================
   Request interceptor
===================================== */

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

type RetryConfig = AxiosRequestConfig & { _retry?: boolean };

/* =====================================
   Response interceptor
===================================== */

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryConfig;

    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const refreshToken = useAuthStore.getState().refreshToken;

    if (!refreshToken) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    /* =====================================
       Refresh déjà en cours (même onglet)
    ===================================== */

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers = { Authorization: `Bearer ${token}` };
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    /* =====================================
       Refresh en cours dans un AUTRE onglet
    ===================================== */

    if (!acquireRefreshLock()) {
      return new Promise((resolve, reject) => {
        const onStorage = (event: StorageEvent) => {
          if (event.key === STORAGE_KEYS.ACCESS_TOKEN && event.newValue) {
            window.removeEventListener('storage', onStorage);
            originalRequest.headers = { Authorization: `Bearer ${event.newValue}` };
            resolve(apiClient(originalRequest));
          }

          if (event.key === STORAGE_KEYS.LOGOUT) {
            window.removeEventListener('storage', onStorage);
            reject(error);
          }
        };

        window.addEventListener('storage', onStorage);
      });
    }

    /* =====================================
       Lancement du refresh (cet onglet)
    ===================================== */

    isRefreshing = true;

    try {
      const response = await refreshClient.post<{
        data: { accessToken: string };
      }>('/auth/refresh', {
        refresh_token: refreshToken,
      });

      const { accessToken } = response.data.data;

      // 🔑 sync store + multi-onglets
      useAuthStore.getState().setAccessToken(accessToken);

      processQueue(undefined, accessToken);

      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${accessToken}`,
      };
      return apiClient(originalRequest);
    } catch {
      processQueue(error);

      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
      releaseRefreshLock();
    }
  },
);

export default apiClient;
