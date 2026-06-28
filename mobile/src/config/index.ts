// SparkMatch — Runtime configuration
// Resolves the backend host correctly for every environment:
//   • iOS simulator        -> localhost
//   • Android emulator     -> 10.0.2.2 (host loopback)
//   • Physical device      -> your machine's LAN IP (from Expo)
//   • Production            -> EXPO_PUBLIC_API_URL
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const DEV_PORT = 8080;

/**
 * Best-effort detection of the development machine's host so a physical phone
 * running Expo Go can reach the local backend over the LAN.
 */
function resolveDevHost(): string {
  // 1. Explicit override always wins.
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');

  // 2. Derive the LAN IP from the Expo dev server URL (e.g. 192.168.1.5:8081).
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants.expoGoConfig as any)?.debuggerHost ||
    (Constants.manifest2 as any)?.extra?.expoGo?.debuggerHost;

  const lanIp = hostUri ? hostUri.split(':')[0] : undefined;

  if (lanIp && lanIp !== 'localhost' && lanIp !== '127.0.0.1') {
    return `http://${lanIp}:${DEV_PORT}`;
  }

  // 3. Emulator fallbacks.
  if (Platform.OS === 'android') return `http://10.0.2.2:${DEV_PORT}`;
  return `http://localhost:${DEV_PORT}`;
}

// Production backend. EXPO_PUBLIC_API_URL (set in eas.json / build env) wins;
// otherwise fall back to the live Railway deployment so release APKs always
// connect even when built locally without that env var.
const PROD_API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ||
  'https://dating-app-production-0327.up.railway.app';

export const HOST = __DEV__ ? resolveDevHost() : PROD_API_URL;

/** REST base, e.g. http://192.168.1.5:8080/api */
export const API_BASE_URL = `${HOST}/api`;

/** WebSocket (STOMP) endpoint, e.g. ws://192.168.1.5:8080/ws/chat */
export const WS_URL = `${HOST.replace(/^http/, 'ws')}/ws/chat`;

export const Config = {
  HOST,
  API_BASE_URL,
  WS_URL,
  /** Demo credentials surfaced on the login screen for easy testing. */
  demo: {
    email: 'arjun@demo.com',
    password: 'Password123',
  },
};

export default Config;
