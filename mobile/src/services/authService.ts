// SparkMatch — Auth Service
import api from './api';
import { AuthResponse, ApiResponse } from '../types';

export const authService = {
  register: async (data: {
    email: string;
    password: string;
    displayName: string;
    phone?: string;
  }): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data.data;
  },

  login: async (data: { emailOrPhone: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data.data;
  },

  googleOAuth: async (idToken: string): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/oauth/google', {
      provider: 'GOOGLE',
      idToken,
    });
    return response.data.data;
  },

  appleOAuth: async (idToken: string): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/oauth/apple', {
      provider: 'APPLE',
      idToken,
    });
    return response.data.data;
  },

  sendOtp: async (identifier: string, purpose: string = 'REGISTRATION'): Promise<void> => {
    await api.post('/auth/otp/send', { identifier, purpose });
  },

  verifyOtp: async (identifier: string, otp: string): Promise<boolean> => {
    const response = await api.post<ApiResponse<boolean>>('/auth/otp/verify', { identifier, otp });
    return response.data.data;
  },

  forgotPassword: async (emailOrPhone: string): Promise<void> => {
    await api.post('/auth/forgot-password', { emailOrPhone });
  },

  resetPassword: async (data: {
    emailOrPhone: string;
    otp: string;
    newPassword: string;
  }): Promise<void> => {
    await api.post('/auth/reset-password', data);
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/refresh', { refreshToken });
    return response.data.data;
  },
};
