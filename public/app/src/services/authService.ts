import { api } from './api';
import type { AuthResponseDTO, User } from '../types/auth';

export const authService = {
  signup(payload: { email: string; password: string; name?: string; organization?: string }): Promise<AuthResponseDTO> {
    return api.post<AuthResponseDTO>('/auth/signup', payload, { skipAuth: true });
  },

  login(payload: { email: string; password: string }): Promise<AuthResponseDTO> {
    return api.post<AuthResponseDTO>('/auth/login', payload, { skipAuth: true });
  },

  refresh(refreshToken: string): Promise<AuthResponseDTO> {
    return api.post<AuthResponseDTO>('/auth/refresh', { refreshToken }, { skipAuth: true });
  },

  me(): Promise<User> {
    return api.get<User>('/auth/me');
  },

  updateMe(updates: { name?: string; organization?: string }): Promise<User> {
    return api.patch<User>('/auth/me', updates);
  },
};
