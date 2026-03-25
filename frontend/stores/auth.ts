import { create } from 'zustand';
import { getToken, saveToken, deleteToken } from '@/utils/auth';
import { api, ApiError } from '@/utils/api';

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface AuthState {
  isLoading: boolean;
  token: string | null;
  user: User | null;

  /** Called once on app boot — reads token from SecureStore, fetches /auth/me */
  hydrate: () => Promise<void>;
  login: (login: string, password: string) => Promise<void>;
  signup: (data: { username: string; email: string; password: string; displayName?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  isLoading: true,
  token: null,
  user: null,

  hydrate: async () => {
    try {
      const token = await getToken();
      if (!token) {
        set({ isLoading: false, token: null, user: null });
        return;
      }

      const { user } = await api<{ user: { userId: string; username: string } }>(
        '/auth/me',
        { headers: { Authorization: `Bearer ${token}` } as any },
      );

      set({
        isLoading: false,
        token,
        user: {
          id: user.userId,
          username: user.username,
          email: '',
          displayName: null,
          avatarUrl: null,
        },
      });
    } catch {
      await deleteToken();
      set({ isLoading: false, token: null, user: null });
    }
  },

  login: async (login, password) => {
    const res = await api<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: { login, password },
    });

    await saveToken(res.token);
    set({ token: res.token, user: res.user });
  },

  signup: async (data) => {
    const res = await api<{ token: string; user: User }>('/auth/signup', {
      method: 'POST',
      body: data,
    });

    await saveToken(res.token);
    set({ token: res.token, user: res.user });
  },

  logout: async () => {
    await deleteToken();
    set({ token: null, user: null });
  },
}));
