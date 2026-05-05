/**
 * lib/api.ts
 *
 * Thin typed wrappers around the Axios instance for auth-specific API calls.
 * Used by authStore so that the store does not import from the services layer
 * and create circular dependencies.
 */

import axiosInstance from '@/services/api';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  RefreshRequest,
} from '@/types';

export const authApi = {
  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    const { data } = await axiosInstance.post<AuthResponse>(
      '/api/v1/auth/login',
      payload,
    );
    return data;
  },

  register: async (payload: RegisterRequest): Promise<RegisterResponse> => {
    const { data } = await axiosInstance.post<RegisterResponse>(
      '/api/v1/auth/register',
      payload,
    );
    return data;
  },

  refresh: async (payload: RefreshRequest): Promise<AuthResponse> => {
    const { data } = await axiosInstance.post<AuthResponse>(
      '/api/v1/auth/refresh',
      payload,
    );
    return data;
  },

  profile: async (): Promise<{ id: string; username: string; email: string; avatarUrl?: string; role: 'user' | 'admin'; createdAt: string; updatedAt: string }> => {
    const { data } = await axiosInstance.get('/api/v1/auth/profile');
    return data;
  },
};
