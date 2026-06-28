// SparkMatch — App Store (Zustand)
import { create } from 'zustand';
import { Profile, MatchInfo, Conversation } from '../types';
import { storage, StorageKeys } from '../utils/storage';

interface AppState {
  // Profile
  myProfile: Profile | null;
  setMyProfile: (profile: Profile | null) => void;

  // Discover
  discoverProfiles: Profile[];
  currentCardIndex: number;
  setDiscoverProfiles: (profiles: Profile[]) => void;
  addDiscoverProfiles: (profiles: Profile[]) => void;
  nextCard: () => void;

  // Matches
  matches: MatchInfo[];
  setMatches: (matches: MatchInfo[]) => void;
  addMatch: (match: MatchInfo) => void;

  // Conversations
  conversations: Conversation[];
  setConversations: (conversations: Conversation[]) => void;
  updateConversation: (id: number, updates: Partial<Conversation>) => void;

  // Match overlay
  matchOverlay: {
    visible: boolean;
    matchedUser?: {
      userId: number;
      displayName: string;
      photoUrl?: string;
      age?: number;
    };
  };
  showMatchOverlay: (matchedUser: any) => void;
  hideMatchOverlay: () => void;

  // Dark mode
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
  hydrateTheme: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Profile
  myProfile: null,
  setMyProfile: (profile) => set({ myProfile: profile }),

  // Discover
  discoverProfiles: [],
  currentCardIndex: 0,
  setDiscoverProfiles: (profiles) => set({ discoverProfiles: profiles, currentCardIndex: 0 }),
  addDiscoverProfiles: (profiles) =>
    set((state) => ({
      discoverProfiles: [...state.discoverProfiles, ...profiles],
    })),
  nextCard: () =>
    set((state) => ({
      currentCardIndex: state.currentCardIndex + 1,
    })),

  // Matches
  matches: [],
  setMatches: (matches) => set({ matches }),
  addMatch: (match) =>
    set((state) => ({
      matches: [match, ...state.matches],
    })),

  // Conversations
  conversations: [],
  setConversations: (conversations) => set({ conversations }),
  updateConversation: (id, updates) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  // Match overlay
  matchOverlay: { visible: false },
  showMatchOverlay: (matchedUser) =>
    set({ matchOverlay: { visible: true, matchedUser } }),
  hideMatchOverlay: () =>
    set({ matchOverlay: { visible: false } }),

  // Dark mode (default: dark)
  isDarkMode: true,
  toggleDarkMode: () =>
    set((state) => {
      const next = !state.isDarkMode;
      storage.setString(StorageKeys.theme, next ? 'dark' : 'light');
      return { isDarkMode: next };
    }),
  setDarkMode: (value) => {
    storage.setString(StorageKeys.theme, value ? 'dark' : 'light');
    set({ isDarkMode: value });
  },
  hydrateTheme: async () => {
    const saved = await storage.getString(StorageKeys.theme);
    if (saved === 'light' || saved === 'dark') {
      set({ isDarkMode: saved === 'dark' });
    }
  },
}));
