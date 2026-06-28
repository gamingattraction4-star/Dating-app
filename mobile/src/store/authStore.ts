// SparkMatch — Auth Store (Zustand) with persistence
import { create } from 'zustand';
import { AuthResponse } from '../types';
import { storage, StorageKeys } from '../utils/storage';

interface PersistedAuth {
  accessToken: string;
  refreshToken: string;
  userId: number;
  email: string | null;
  displayName: string | null;
  profileComplete: boolean;
}

interface AuthState {
  // State
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  userId: number | null;
  email: string | null;
  displayName: string | null;
  profileComplete: boolean;
  isLoading: boolean;
  hydrated: boolean;

  // Actions
  hydrate: () => Promise<void>;
  setAuth: (auth: AuthResponse) => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setProfileComplete: (complete: boolean) => Promise<void>;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
}

async function persist(state: AuthState) {
  if (state.accessToken && state.refreshToken && state.userId != null) {
    const payload: PersistedAuth = {
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      userId: state.userId,
      email: state.email,
      displayName: state.displayName,
      profileComplete: state.profileComplete,
    };
    await storage.setObject(StorageKeys.authUser, payload);
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  userId: null,
  email: null,
  displayName: null,
  profileComplete: false,
  isLoading: true,
  hydrated: false,

  hydrate: async () => {
    const saved = await storage.getObject<PersistedAuth>(StorageKeys.authUser);
    if (saved?.accessToken) {
      set({
        isAuthenticated: true,
        accessToken: saved.accessToken,
        refreshToken: saved.refreshToken,
        userId: saved.userId,
        email: saved.email,
        displayName: saved.displayName,
        profileComplete: saved.profileComplete,
        isLoading: false,
        hydrated: true,
      });
    } else {
      set({ isLoading: false, hydrated: true });
    }
  },

  setAuth: async (auth: AuthResponse) => {
    set({
      isAuthenticated: true,
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      userId: auth.userId,
      email: auth.email,
      displayName: auth.displayName || null,
      profileComplete: auth.profileComplete,
      isLoading: false,
    });
    await persist(get());
  },

  setTokens: async (accessToken: string, refreshToken: string) => {
    set({ accessToken, refreshToken });
    await persist(get());
  },

  setProfileComplete: async (complete: boolean) => {
    set({ profileComplete: complete });
    await persist(get());
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  logout: async () => {
    await storage.remove(StorageKeys.authUser, StorageKeys.accessToken, StorageKeys.refreshToken);
    set({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      userId: null,
      email: null,
      displayName: null,
      profileComplete: false,
      isLoading: false,
    });
  },
}));
