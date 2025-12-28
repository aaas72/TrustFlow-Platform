import axios from 'axios';
import { startLoading, doneLoading } from '../lib/loading';

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && (import.meta as unknown as { env: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL) ||
  'http://localhost:3000/api';

// Temel ayarlarla axios örneği oluşturma
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Makul varsayılan zaman aşımı
api.defaults.timeout = 10000; // 10s

// Global loading interceptors
api.interceptors.request.use(
  (config) => {
    startLoading();
    return config;
  },
  (error) => {
    doneLoading();
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    doneLoading();
    return response;
  },
  (error) => {
    doneLoading();
    return Promise.reject(error);
  }
);

// Helper: attach Authorization header from localStorage token
export function authHeaders() {
  try {
    const token = localStorage.getItem('token');
    if (token) return { Authorization: `Bearer ${token}` };
  } catch { void 0; }
  return {};
}

// Yardımcı: Axios/Hata nesnesinden kullanıcıya uygun hata mesajı çıkar
export function extractApiErrorMessage(error: unknown, fallback: string = 'Sunucu hatası'): string {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const data = error.response.data as { message?: string; code?: string; context?: { module?: string; path?: string }; hint?: string } | string;

      let base = '';
      if (typeof data === 'string') {
        base = data;
      } else if (data && typeof data === 'object') {
        base = data.message || `HTTP ${error.response.status}`;
      } else {
        base = `HTTP ${error.response.status}`;
      }

      const code = (typeof data === 'object' && data?.code) ? ` [${data.code}]` : '';
      const headers = error.response.headers as Record<string, string | undefined>;
      const reqId = headers['x-request-id'] ? ` (id: ${headers['x-request-id']})` : '';

      let location = '';
      if (typeof data === 'object' && data?.context) {
        location = ` | Konum: ${data.context.module ?? ''}${data.context.module && data.context.path ? ' ' : ''}${data.context.path ? `(${data.context.path})` : ''}`;
      }

      const hint = (typeof data === 'object' && data?.hint) ? ` | İpucu: ${data.hint}` : '';
      return `${base}${code}${reqId}${location}${hint}`.trim();
    }
    if (error.request) {
      return 'Sunucuya bağlanılamadı, bağlantıyı kontrol edin veya sunucuyu başlatın';
    }
  }

  const err = error as Error;
  if (err && typeof err.message === 'string' && err.message) return err.message;
  return fallback;
}
