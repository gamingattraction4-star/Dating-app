// SparkMatch — Main App Entry
import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';
import { useAppStore } from './src/store/appStore';
import { Colors } from './src/theme';
import { chatSocket } from './src/services/chatSocket';

export default function App() {
  const [ready, setReady] = useState(false);
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateTheme = useAppStore((s) => s.hydrateTheme);
  const isDarkMode = useAppStore((s) => s.isDarkMode);

  useEffect(() => {
    (async () => {
      await Promise.all([hydrateAuth(), hydrateTheme()]);
      // Resume realtime chat if a session was restored.
      if (useAuthStore.getState().isAuthenticated) {
        chatSocket.connect();
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
