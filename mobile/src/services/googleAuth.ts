// SparkMatch — Google Sign-In hook
//
// Google OAuth needs a Google Cloud client ID. Creating an expo-auth-session
// request WITHOUT a client ID throws on Android ("androidClientId must be
// defined"), which crashes the Welcome screen. So this hook is a safe stub
// until a client ID is added; then wire the real expo-auth-session flow here.
import { Alert } from 'react-native';
import { isGoogleConfigured } from '../config';

export function useGoogleAuth() {
  const signInWithGoogle = async () => {
    Alert.alert(
      'Google Sign-In',
      'Google login is coming soon. For now, please sign up or log in with your email.',
    );
  };

  return { signInWithGoogle, ready: isGoogleConfigured };
}
