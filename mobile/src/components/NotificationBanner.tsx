// SparkMatch — In-app notification banner
// Listens to realtime notifications over the socket and shows a top toast
// while the app is open (match / new message / new like). Tapping it navigates.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { chatSocket, AppNotification } from '../services/chatSocket';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../theme';

const ICONS: Record<string, any> = {
  MATCH: 'flame',
  MESSAGE: 'chatbubble-ellipses',
  LIKE: 'heart',
  SUPER_LIKE: 'star',
  SYSTEM: 'notifications',
};

export default function NotificationBanner() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [current, setCurrent] = useState<AppNotification | null>(null);
  const translateY = useRef(new Animated.Value(-140)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const off = chatSocket.onNotification((n) => {
      // Don't interrupt the user while they're inside that same chat.
      setCurrent(n);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      show();
    });
    return () => {
      off();
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const show = () => {
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8, tension: 60 }).start();
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(hide, 4000);
  };

  const hide = () => {
    Animated.timing(translateY, { toValue: -140, duration: 250, useNativeDriver: true }).start(() => {
      setCurrent(null);
    });
  };

  const onPress = () => {
    if (!current) return;
    hide();
    try {
      if (current.actionType === 'OPEN_CHAT') {
        navigation.navigate('MainTabs', { screen: 'Chat' });
      } else if (current.actionType === 'OPEN_MATCH') {
        navigation.navigate('MainTabs', { screen: 'Matches' });
      } else if (current.actionType === 'OPEN_PROFILE') {
        navigation.navigate('Likes');
      }
    } catch {
      /* navigation not ready */
    }
  };

  if (!current) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrap, { top: insets.top + 6, transform: [{ translateY }] }]}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.touch}>
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.banner}
        >
          <View style={styles.iconCircle}>
            <Ionicons name={ICONS[current.type] || 'notifications'} size={20} color={Colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{current.title}</Text>
            <Text style={styles.body} numberOfLines={1}>{current.body}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.85)" />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 9999,
    ...(Platform.OS === 'web' ? { maxWidth: 480, alignSelf: 'center' } : null),
  },
  touch: { borderRadius: BorderRadius.xl },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.xl,
    ...Shadow.lg,
  },
  iconCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { ...Typography.label, color: Colors.white },
  body: { ...Typography.caption, color: 'rgba(255,255,255,0.9)', marginTop: 1 },
});
