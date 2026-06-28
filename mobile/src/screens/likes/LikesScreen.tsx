// SparkMatch — Who Liked You (premium-gated)
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity, StatusBar, ActivityIndicator, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { swipeService } from '../../services/swipeService';
import { useAppStore } from '../../store/appStore';
import { Profile } from '../../types';

const COL_GAP = Spacing.md;
const CARD_W = (Dimensions.get('window').width - Spacing.xl * 2 - COL_GAP) / 2;

export default function LikesScreen({ navigation }: any) {
  const myProfile = useAppStore((s) => s.myProfile);
  const isPremium = !!myProfile?.premium;
  const [likes, setLikes] = useState<Profile[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await swipeService.getWhoLikedMe();
      setLikes(data);
      setCount(data.length);
    } catch (e: any) {
      // 403 for non-premium — backend still tells us nothing; show locked state.
      setLikes([]);
      setCount(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const renderItem = ({ item }: { item: Profile }) => {
    const photo = item.photos?.[0]?.photoUrl;
    return (
      <View style={styles.card}>
        <Image source={photo ? { uri: photo } : require('../../../assets/icon.png')} style={styles.cardImg} />
        {!isPremium && <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.cardOverlay}>
          {isPremium ? (
            <Text style={styles.cardName} numberOfLines={1}>{item.displayName}{item.age ? `, ${item.age}` : ''}</Text>
          ) : (
            <Ionicons name="heart" size={20} color={Colors.white} />
          )}
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Likes You</Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing['3xl'] }} />
      ) : (
        <FlatList
          data={likes.length ? likes : isPremium ? [] : placeholderCards()}
          renderItem={renderItem}
          keyExtractor={(item) => item.userId.toString()}
          numColumns={2}
          columnWrapperStyle={{ gap: COL_GAP }}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.subtitle}>
              {isPremium
                ? `${count ?? likes.length} people like you`
                : 'Upgrade to see everyone who already liked you 👀'}
            </Text>
          }
          ListEmptyComponent={
            isPremium ? (
              <View style={styles.empty}>
                <Ionicons name="heart-outline" size={56} color={Colors.dark.textMuted} />
                <Text style={styles.emptyText}>No likes yet — keep swiping!</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            !isPremium ? (
              <TouchableOpacity style={styles.upgradeBtn} onPress={() => navigation.navigate('Premium')} activeOpacity={0.85}>
                <LinearGradient colors={Colors.gradient.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.upgradeGradient}>
                  <Ionicons name="star" size={18} color={Colors.white} />
                  <Text style={styles.upgradeText}>Unlock with Premium</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : null
          }
        />
      )}
    </View>
  );
}

// Blurred placeholder tiles for the locked (non-premium) state.
function placeholderCards(): Profile[] {
  return Array.from({ length: 6 }).map((_, i) => ({
    userId: -(i + 1),
    displayName: '',
    age: 0,
    gender: 'OTHER',
    profileCompletePct: 0,
    verified: false,
    premium: false,
    photos: [{ id: i, photoUrl: `https://picsum.photos/seed/like${i}/400/500`, orderIndex: 0, primary: true }],
  })) as unknown as Profile[];
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: Spacing.md,
  },
  headerTitle: { ...Typography.h3, color: Colors.dark.text },
  subtitle: { ...Typography.body, color: Colors.dark.textSecondary, marginBottom: Spacing.lg },
  list: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: 40 },
  card: { width: CARD_W, height: CARD_W * 1.3, borderRadius: BorderRadius.lg, overflow: 'hidden', marginBottom: COL_GAP, backgroundColor: Colors.dark.bgSecondary },
  cardImg: { width: '100%', height: '100%' },
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.md, minHeight: 44, justifyContent: 'flex-end' },
  cardName: { ...Typography.label, color: Colors.white },
  empty: { alignItems: 'center', paddingTop: Spacing['4xl'] },
  emptyText: { ...Typography.body, color: Colors.dark.textMuted, marginTop: Spacing.md },
  upgradeBtn: { borderRadius: BorderRadius.xl, overflow: 'hidden', marginTop: Spacing.lg },
  upgradeGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: Spacing.base },
  upgradeText: { ...Typography.button, color: Colors.white },
});
