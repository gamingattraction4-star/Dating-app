// SparkMatch — Persistent key/value storage
// Thin typed wrapper over AsyncStorage (works in Expo Go and native builds).
import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  accessToken: '@spark/accessToken',
  refreshToken: '@spark/refreshToken',
  authUser: '@spark/authUser',
  theme: '@spark/theme',
} as const;

export const storage = {
  async getString(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setString(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      /* ignore write errors */
    }
  },
  async getObject<T>(key: string): Promise<T | null> {
    const raw = await storage.getString(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  async setObject<T>(key: string, value: T): Promise<void> {
    await storage.setString(key, JSON.stringify(value));
  },
  async remove(...keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch {
      /* ignore */
    }
  },
};
