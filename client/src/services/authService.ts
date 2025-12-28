import axios from 'axios';
import { api } from './api';

export type LoginResponse = {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: number;
    full_name: string;
    email: string;
    user_type: string;
  };
};

export type RegisterResponse = {
  success: boolean;
  message: string;
  user?: {
    id: number;
    full_name: string;
    email: string;
  };
};

export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data as LoginResponse;
  } catch (error) {
    console.error('Giriş hatası:', error);
    if (axios.isAxiosError(error)) {
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Giriş bilgileri hatalı',
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'Sunucuya bağlanılamadı, bağlantıyı kontrol edin veya sunucuyu başlatın',
        };
      }
    }
    return {
      success: false,
      message: 'Beklenmeyen bir hata oluştu, lütfen tekrar deneyin',
    };
  }
}

export async function register(fullName: string, email: string, password: string, userType: string): Promise<RegisterResponse> {
  try {
    const response = await api.post('/auth/register', { 
      full_name: fullName,
      email, 
      password,
      user_type: userType
    });
    return response.data as RegisterResponse;
  } catch (error) {
    console.error('Kayıt hatası:', error);
    if (axios.isAxiosError(error)) {
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Kayıt başarısız, e-posta zaten kullanılıyor olabilir',
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'Sunucuya bağlanılamadı, bağlantıyı kontrol edin veya sunucuyu başlatın',
        };
      }
    }
    return {
      success: false,
      message: 'Beklenmeyen bir hata oluştu, lütfen tekrar deneyin',
    };
  }
}