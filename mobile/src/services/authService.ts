// SparkMatch — Auth Service
import api from './api';
import { AuthResponse, ApiResponse } from '../types';

export const authService = {
  // Step 1: creates the account and emails a verification OTP (otpRequired=true).
  register: async (data: {
    email: string;
    password: string;
    displayName: string;
    phone?: string;
  }): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data.data;
  },

  // Step 2 of signup: verify the emailed OTP -> returns tokens.
  verifyRegistration: async (identifier: string, otp: string): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/verify-registration', { identifier, otp });
    return response.data.data;
  },

  // Step 1 of login: verify password, emails an OTP (otpRequired=true).
  login: async (data: { emailOrPhone: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data.data;
  },

  // Step 2 of login: verify the emailed OTP -> returns tokens.
  verifyLogin: async (emailOrPhone: string, otp: string, device?: string): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/verify-login', { emailOrPhone, otp, device });
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
