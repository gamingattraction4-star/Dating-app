// SparkMatch — Swipe & Match Service
import api from './api';
import { Profile, SwipeResponse, MatchInfo, ApiResponse } from '../types';

export const swipeService = {
  getDiscoverProfiles: async (page: number = 0, size: number = 10): Promise<Profile[]> => {
    const response = await api.get<ApiResponse<Profile[]>>('/discover', {
      params: { page, size },
    });
    return response.data.data;
  },

  /** People / Explore — browse by interest name and/or lookingFor category. */
  explore: async (opts: { interest?: string; lookingFor?: string; page?: number; size?: number } = {}): Promise<Profile[]> => {
    const response = await api.get<ApiResponse<Profile[]>>('/explore', {
      params: { interest: opts.interest, lookingFor: opts.lookingFor, page: opts.page ?? 0, size: opts.size ?? 30 },
    });
    return response.data.data;
  },

  swipe: async (targetUserId: number, swipeType: 'LIKE' | 'DISLIKE' | 'SUPER_LIKE'): Promise<SwipeResponse> => {
    const response = await api.post<ApiResponse<SwipeResponse>>('/swipes', {
      targetUserId,
      swipeType,
    });
    return response.data.data;
  },

  undoSwipe: async (): Promise<void> => {
    await api.post('/swipes/undo');
  },

  getMatches: async (): Promise<MatchInfo[]> => {
    const response = await api.get<ApiResponse<MatchInfo[]>>('/matches');
    return response.data.data;
  },

  unmatch: async (matchId: number): Promise<void> => {
    await api.delete(`/matches/${matchId}`);
  },

  getWhoLikedMe: async (): Promise<Profile[]> => {
    const response = await api.get<ApiResponse<Profile[]>>('/premium/likes');
    return response.data.data;
  },
};
