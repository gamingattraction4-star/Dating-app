// SparkMatch — User & Profile Service
import { Platform } from 'react-native';
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

    if (Platform.OS === 'web') {
      // On web, ImagePicker gives a blob:/data: URL. Fetch it into a real Blob
      // so the browser sends proper multipart bytes (the {uri,name,type} shim
      // only works on native). Use the blob's own MIME type for a valid filename.
      const blob = await (await fetch(uri)).blob();
      const ext = (blob.type && blob.type.split('/')[1]) || 'jpg';
      formData.append('file', blob, `photo_${Date.now()}.${ext}`);
    } else {
      const clean = uri.split('/').pop()?.split('?')[0] || `photo_${Date.now()}.jpg`;
      const extMatch = /\.(\w+)$/.exec(clean);
      const type = extMatch ? `image/${extMatch[1].toLowerCase()}` : 'image/jpeg';
      formData.append('file', { uri, name: clean, type } as any);
    }
    formData.append('orderIndex', orderIndex.toString());

    // Web: delete Content-Type so the browser sets "multipart/form-data; boundary=…".
    // Native: an explicit multipart header is required.
    const headers = Platform.OS === 'web'
      ? { 'Content-Type': undefined as any }
      : { 'Content-Type': 'multipart/form-data' };

    const response = await api.post('/users/me/photos', formData, {
      headers,
      transformRequest: (d) => d,
    });
    return response.data.data;
  },

  deletePhoto: async (photoId: number): Promise<void> => {
    await api.delete(`/users/me/photos/${photoId}`);
  },
};
