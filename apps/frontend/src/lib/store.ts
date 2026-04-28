import { create } from 'zustand';
import { api } from './api';
import type { User, Subscription, PromptLevel } from './types';

interface Unlock {
  promptId: string;
  unlockedVia: 'ad' | 'subscription';
}

interface AuthState {
  user: User | null;
  subscription: Subscription | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authChecked: boolean;
  unlockedPrompts: Set<string>;
  hasSubscription: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  checkSubscription: () => Promise<void>;
  checkUnlock: (promptId: string) => Promise<boolean>;
  unlockWithAd: (promptId: string) => Promise<void>;
  loadUnlocks: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  subscription: null,
  isLoading: false,
  isAuthenticated: false,
  authChecked: false,
  unlockedPrompts: new Set<string>(),
  hasSubscription: false,
  
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await api.post<{ id: string; email: string; isAdmin: boolean }>('/auth/login', { email, password });
      const user = { id: response.id, email: response.email, isAdmin: response.isAdmin };
      set({ user, isAuthenticated: true, isLoading: false, authChecked: true });
      await get().checkSubscription();
      await get().loadUnlocks();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  register: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await api.post<{ id: string; email: string }>('/auth/register', { email, password });
      const user = { id: response.id, email: response.email, isAdmin: false };
      set({ user, isAuthenticated: true, isLoading: false, authChecked: true });
      await get().checkSubscription();
      await get().loadUnlocks();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout errors
    }
    set({ user: null, subscription: null, isAuthenticated: false, isLoading: false, unlockedPrompts: new Set<string>(), hasSubscription: false });
  },
  
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const user = await api.get<User>('/auth/me');
      set({ user, isAuthenticated: true, isLoading: false, authChecked: true });
      await get().checkSubscription();
      await get().loadUnlocks();
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false, authChecked: true });
    }
  },

  clearError: () => set({ isLoading: false }),

  checkSubscription: async () => {
    try {
      const sub = await api.get<{ status: string; expiresAt: string }>('/billing/status');
      set({ subscription: sub as Subscription, hasSubscription: sub.status === 'active' });
    } catch {
      set({ subscription: null, hasSubscription: false });
    }
  },

  checkUnlock: async (promptId: string) => {
    return get().unlockedPrompts.has(promptId);
  },

  unlockWithAd: async (promptId: string) => {
    set({ isLoading: true });
    try {
      const intent = await api.post<{ token: string }>(`/prompts/${promptId}/unlock-intent`, {});
      const unlockResult = await api.post<{ success: boolean }>(`/prompts/${promptId}/unlock`, { adToken: intent.token });
      if (unlockResult.success) {
        const newUnlocked = new Set(get().unlockedPrompts);
        newUnlocked.add(promptId);
        set({ unlockedPrompts: newUnlocked });
      }
    } catch (error) {
      console.error('Failed to unlock with ad:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  loadUnlocks: async () => {
    try {
      const unlocks = await api.get<{ promptId: string }[]>('/unlocks');
      const newUnlocked = new Set<string>();
      unlocks.forEach((u) => newUnlocked.add(u.promptId));
      set({ unlockedPrompts: newUnlocked });
    } catch {
      // Not logged in or no unlocks
    }
  },
}));