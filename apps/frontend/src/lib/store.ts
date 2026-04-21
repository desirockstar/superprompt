import { create } from 'zustand';
import { api, setAuthToken, clearAuthToken } from './api';
import type { User, Subscription } from './types';

interface AuthState {
  user: User | null;
  subscription: Subscription | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  subscription: null,
  isLoading: false,
  isAuthenticated: false,
  
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await api.post<{ token: string } & User>('/auth/login', { email, password });
      setAuthToken(response.token);
      const user = { id: response.id, email: response.email, isAdmin: response.isAdmin };
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  register: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await api.post<{ token: string } & User>('/auth/register', { email, password });
      setAuthToken(response.token);
      const user = { id: response.id, email: response.email, isAdmin: response.isAdmin };
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  logout: async () => {
    clearAuthToken();
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout errors
    }
    set({ user: null, subscription: null, isAuthenticated: false, isLoading: false });
  },
  
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const user = await api.get<User>('/auth/me');
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      clearAuthToken();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ isLoading: false }),
}));