// SparkMatch — Google Sign-In hook
// Ready-to-use Google OAuth via expo-auth-session. Activates automatically once
// a client ID is set in Config.google (env EXPO_PUBLIC_GOOGLE_*). Until then the
// button shows a "configure to enable" message.
import { useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';
import { Config, isGoogleConfigured } from '../config';
import api from './api';
import { useAuthStore } from '../store/authStore';
import { bootstrapUser } from './bootstrap';
import { AuthResponse, ApiResponse } from '../types';

WebBrowser.maybeCompleteAuthSession();

/**
 * Returns a `signInWithGoogle` function and a `ready` flag.
 * Call the function from a button's onPress.
 */
export function useGoogleAuth() {
  const setAuth = useAuthStore((s) => s.setAuth);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: Config.google.webClientId || undefined,
    androidClientId: Config.google.androidClientId || undefined,
    iosClientId: Config.google.iosClientId || undefined,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params?.id_token;
      if (idToken) exchange(idToken);
    }
  }, [response]);

  const exchange = async (idToken: string) => {
    try {
      const res = await api.post<ApiResponse<AuthResponse>>('/auth/oauth/google', {
        provider: 'GOOGLE',
        idToken,
      });
      await setAuth(res.data.data);
      await bootstrapUser();
    } catch (e: any) {
      Alert.alert('Google Sign-In', e?.response?.data?.message || 'Could not sign in with Google.');
    }
  };

  const signInWithGoogle = async () => {
    if (!isGoogleConfigured) {
      Alert.alert(
        'Google Sign-In',
        'Google login is ready in the app but needs a Google Cloud client ID to activate. Add it in Config.google (see AUTH_SETUP guide). For now, please continue with email.',
      );
      return;
    }
    await promptAsync();
  };

  return { signInWithGoogle, ready: !!request };
}
