// SparkMatch — User & Profile Service
import api from './api';
import { Profile, Interest, Preferences, ApiResponse, ProfileUpdate } from '../types';

export const userService = {
  getMyProfile: async (): Promise<Profile> => {
    const response = await api.get<ApiResponse<Profile>>('/users/me');
    return response.data.data;
  },

  updateProfile: async (data: ProfileUpdate): Promise<Profile> => {
    const response = await api.put<ApiResponse<Profile>>('/users/me', data);
    return response.data.data;
  },

  updateLocation: async (latitude: number, longitude: number, city?: string): Promise<void> => {
    await api.put('/users/me/location', { latitude, longitude, city });
  },

  boostProfile: async (): Promise<Profile> => {
    const response = await api.post<ApiResponse<Profile>>('/users/me/boost', {});
    return response.data.data;
  },

  getPreferences: async (): Promise<Preferences> => {
    const response = await api.get<ApiResponse<Preferences>>('/users/me/preferences');
    return response.data.data;
  },

  updatePreferences: async (data: Partial<Preferences>): Promise<Preferences> => {
    const response = await api.put<ApiResponse<Preferences>>('/users/me/preferences', data);
    return response.data.data;
  },

  getUserProfile: async (userId: number): Promise<Profile> => {
    const response = await api.get<ApiResponse<Profile>>(`/users/${userId}`);
    return response.data.data;
  },

  getInterests: async (): Promise<Interest[]> => {
    const response = await api.get<ApiResponse<Interest[]>>('/users/interests');
    return response.data.data;
  },

  uploadPhoto: async (uri: string, orderIndex: number): Promise<any> => {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('file', {
      uri,
      name: filename,
      type,
    } as any);
    formData.append('orderIndex', orderIndex.toString());

    const response = await api.post('/users/me/photos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  deletePhoto: async (photoId: number): Promise<void> => {
    await api.delete(`/users/me/photos/${photoId}`);
  },
};
