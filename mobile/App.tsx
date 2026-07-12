// SparkMatch — Main App Entry
import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';
import { useAppStore } from './src/store/appStore';
import { Colors } from './src/theme';
import { chatSocket } from './src/services/chatSocket';

/**
 * Top-level error boundary. If anything crashes during render, show a friendly
 * screen instead of the app silently closing. This is the safety net that keeps
 * a single bad component from taking down the whole app on a device.
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  state = { hasError: false, message: '' };
  static getDerivedStateFromError(error: any) {
    return { hasError: true, message: error?.message || String(error) };
  }
  componentDidCatch(error: any) {
    console.log('App crashed:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorWrap}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorSub}>Please restart the app. If it keeps happening, reinstall.</Text>
          <ScrollView style={styles.errorBox}>
            <Text style={styles.errorText}>{this.state.message}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children as any;
  }
}

export default function App() {
  const [ready, setReady] = useState(false);
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateTheme = useAppStore((s) => s.hydrateTheme);
  const isDarkMode = useAppStore((s) => s.isDarkMode);

  useEffect(() => {
    (async () => {
      // Each step is guarded so a single failure never blocks app startup.
      try {
        await hydrateAuth();
      } catch (e) {
        console.log('hydrateAuth failed', e);
      }
      try {
        await hydrateTheme();
      } catch (e) {
        console.log('hydrateTheme failed', e);
      }
      try {
        if (useAuthStore.getState().isAuthenticated) chatSocket.connect();
      } catch (e) {
        console.log('socket connect failed', e);
      }
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={[styles.splash, { backgroundColor: Colors.dark.bg }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style={isDarkMode ? 'light' : 'dark'} />
          <AppNavigator />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorWrap: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', padding: 24 },
  errorTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  errorSub: { color: '#94A3B8', fontSize: 14, textAlign: 'center', marginBottom: 20 },
  errorBox: { maxHeight: 200, backgroundColor: '#1E293B', borderRadius: 12, padding: 12 },
  errorText: { color: '#FF6B6B', fontSize: 12, fontFamily: 'monospace' },
});
