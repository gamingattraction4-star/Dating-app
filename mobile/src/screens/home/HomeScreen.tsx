// SparkMatch — Home Screen (Swipe Cards)
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, Dimensions, Image, TouchableOpacity,
  Animated, PanResponder, StatusBar, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../theme';
import { useAppStore } from '../../store/appStore';
import { swipeService } from '../../services/swipeService';
import { Profile } from '../../types';
import FiltersSheet from '../../components/FiltersSheet';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_OUT_DURATION = 280;

interface SwipeHistoryItem {
  profile: Profile;
  index: number;
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const {
    discoverProfiles, setDiscoverProfiles, currentCardIndex, nextCard,
    showMatchOverlay, matchOverlay, hideMatchOverlay, myProfile, setMyProfile,
  } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [boosting, setBoosting] = useState(false);
  const lastSwipe = useRef<SwipeHistoryItem | null>(null);
  const [canUndo, setCanUndo] = useState(false);

  const position = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    loadProfiles(0, true);
  }, []);

  const loadProfiles = async (pg = 0, reset = false) => {
    try {
      setLoading(true);
      const profiles = await swipeService.getDiscoverProfiles(pg, 10);
      if (reset) setDiscoverProfiles(profiles);
      else useAppStore.getState().addDiscoverProfiles(profiles);
      setPage(pg + 1);
    } catch (error) {
      console.log('Failed to load profiles');
      if (reset) setDiscoverProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const recordSwipe = async (
    profile: Profile,
    index: number,
    type: 'LIKE' | 'DISLIKE' | 'SUPER_LIKE',
  ) => {
    lastSwipe.current = { profile, index };
    setCanUndo(true);
    try {
      const result = await swipeService.swipe(profile.userId, type);
      if (result.matched && result.matchedUser) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showMatchOverlay(result.matchedUser);
      }
    } catch (e: any) {
      // Surface rate-limit / duplicate errors gently; keep the UI responsive.
      console.log('swipe error', e?.response?.data?.message);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) forceSwipe('LIKE');
        else if (gesture.dx < -SWIPE_THRESHOLD) forceSwipe('DISLIKE');
        else if (gesture.dy < -SWIPE_THRESHOLD * 1.2) forceSwipe('SUPER_LIKE');
        else resetPosition();
      },
    })
  ).current;

  const forceSwipe = useCallback((type: 'LIKE' | 'DISLIKE' | 'SUPER_LIKE') => {
    const { discoverProfiles: deck, currentCardIndex: idx } = useAppStore.getState();
    const profile = deck[idx];
    if (!profile) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const toValue =
      type === 'LIKE' ? { x: SCREEN_WIDTH + 120, y: 0 }
      : type === 'DISLIKE' ? { x: -SCREEN_WIDTH - 120, y: 0 }
      : { x: 0, y: -SCREEN_HEIGHT };

    Animated.timing(position, { toValue, duration: SWIPE_OUT_DURATION, useNativeDriver: false }).start(() => {
      position.setValue({ x: 0, y: 0 });
      nextCard();
      recordSwipe(profile, idx, type);
      // Prefetch more when running low.
      const s = useAppStore.getState();
      if (s.currentCardIndex >= s.discoverProfiles.length - 3) loadProfiles(page);
    });
  }, [page]);

  const resetPosition = () => {
    Animated.spring(position, { toValue: { x: 0, y: 0 }, friction: 6, useNativeDriver: false }).start();
  };

  const handleUndo = async () => {
    if (!myProfile?.premium) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      navigation.navigate('Settings');
      return;
    }
    if (!lastSwipe.current) return;
    try {
      await swipeService.undoSwipe();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      useAppStore.setState((s) => ({ currentCardIndex: Math.max(0, s.currentCardIndex - 1) }));
      lastSwipe.current = null;
      setCanUndo(false);
    } catch (e) {
      console.log('undo failed');
    }
  };

  const handleBoost = async () => {
    if (boosting) return;
    setBoosting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const updated = await swipeServiceBoost();
      if (updated) setMyProfile(updated);
    } finally {
      setBoosting(false);
    }
  };

  const goToMatchChat = () => {
    hideMatchOverlay();
    navigation.navigate('Chat');
  };

  const getCardStyle = () => {
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
      outputRange: ['-15deg', '0deg', '15deg'],
    });
    return { ...position.getLayout(), transform: [{ rotate }] };
  };

  const likeOpacity = position.x.interpolate({ inputRange: [0, SWIPE_THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
  const nopeOpacity = position.x.interpolate({ inputRange: [-SWIPE_THRESHOLD, 0], outputRange: [1, 0], extrapolate: 'clamp' });
  const superOpacity = position.y.interpolate({ inputRange: [-SWIPE_THRESHOLD, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  const renderCard = (profile: Profile, index: number) => {
    if (index < currentCardIndex || index > currentCardIndex + 2) return null;
    const isActive = index === currentCardIndex;
    const photo = profile.photos?.[0]?.photoUrl;

    const inner = (
      <>
        <Image source={photo ? { uri: photo } : require('../../../assets/icon.png')} style={styles.cardImage} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.cardGradient}>
          <View style={styles.cardContent}>
            <View style={styles.nameRow}>
              <Text style={styles.cardName}>{profile.displayName}{profile.age ? `, ${profile.age}` : ''}</Text>
              {profile.verified && <Ionicons name="checkmark-circle" size={22} color={Colors.verified} style={{ marginLeft: 6 }} />}
            </View>
            {!!profile.jobTitle && (
              <View style={styles.infoRow}>
                <Ionicons name="briefcase-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.infoText}>{profile.jobTitle}{profile.company ? ` at ${profile.company}` : ''}</Text>
              </View>
            )}
            {!!profile.city && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.infoText}>{profile.city}{profile.distanceKm != null ? ` • ${profile.distanceKm} km away` : ''}</Text>
              </View>
            )}
            {!!profile.bio && <Text style={styles.bio} numberOfLines={2}>{profile.bio}</Text>}
            {!!profile.interests?.length && (
              <View style={styles.interestRow}>
                {profile.interests.slice(0, 4).map((interest) => (
                  <View key={interest.id} style={styles.interestChip}>
                    <Text style={styles.interestText}>{interest.icon} {interest.name}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </LinearGradient>
      </>
    );

    if (isActive) {
      return (
        <Animated.View key={profile.userId} style={[styles.card, getCardStyle(), { zIndex: 100 }]} {...panResponder.panHandlers}>
          <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacity }]}>
            <Text style={[styles.stampText, { color: Colors.like, borderColor: Colors.like }]}>LIKE</Text>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.nopeStamp, { opacity: nopeOpacity }]}>
            <Text style={[styles.stampText, { color: Colors.dislike, borderColor: Colors.dislike }]}>NOPE</Text>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.superStamp, { opacity: superOpacity }]}>
            <Text style={[styles.stampText, { color: Colors.superLike, borderColor: Colors.superLike, fontSize: 32 }]}>SUPER LIKE</Text>
          </Animated.View>
          {inner}
        </Animated.View>
      );
    }

    return (
      <Animated.View
        key={profile.userId}
        style={[styles.card, {
          zIndex: 99 - index,
          top: 8 * (index - currentCardIndex),
          transform: [{ scale: 1 - 0.04 * (index - currentCardIndex) }],
        }]}
      >
        {inner}
      </Animated.View>
    );
  };

  if (loading && discoverProfiles.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Finding people near you...</Text>
      </View>
    );
  }

  const noMoreCards = currentCardIndex >= discoverProfiles.length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <LinearGradient colors={[Colors.primary, Colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.logoContainer}>
          <Ionicons name="flame" size={22} color={Colors.white} />
        </LinearGradient>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity style={styles.filterButton} onPress={() => setFiltersOpen(true)}>
          <Ionicons name="options-outline" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContainer}>
        {noMoreCards ? (
          <View style={styles.emptyState}>
            <Ionicons name="sparkles-outline" size={64} color={Colors.dark.textMuted} />
            <Text style={styles.emptyTitle}>You're all caught up</Text>
            <Text style={styles.emptySubtitle}>Check back later, widen your filters, or boost your profile.</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={() => loadProfiles(0, true)}>
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          discoverProfiles.map((p, i) => renderCard(p, i))
        )}
      </View>

      {!noMoreCards && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionBtn, styles.smallBtn, !canUndo && { opacity: 0.4 }]} onPress={handleUndo}>
            <Ionicons name="arrow-undo" size={22} color={Colors.neon.gold} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.largeBtn]} onPress={() => forceSwipe('DISLIKE')}>
            <Ionicons name="close" size={36} color={Colors.dislike} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.mediumBtn]} onPress={() => forceSwipe('SUPER_LIKE')}>
            <Ionicons name="star" size={26} color={Colors.superLike} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.largeBtn]} onPress={() => forceSwipe('LIKE')}>
            <Ionicons name="heart" size={36} color={Colors.like} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.smallBtn]} onPress={handleBoost}>
            {boosting ? <ActivityIndicator size="small" color={Colors.boost} /> : <Ionicons name="flash" size={22} color={Colors.boost} />}
          </TouchableOpacity>
        </View>
      )}

      {matchOverlay.visible && (
        <View style={styles.matchOverlay}>
          <LinearGradient colors={['rgba(255,77,103,0.97)', 'rgba(168,85,247,0.97)']} style={styles.matchContent}>
            <Text style={styles.matchTitle}>It's a Match! 🎉</Text>
            <Text style={styles.matchSubtitle}>You and {matchOverlay.matchedUser?.displayName} liked each other</Text>
            {!!matchOverlay.matchedUser?.photoUrl && (
              <Image source={{ uri: matchOverlay.matchedUser.photoUrl }} style={styles.matchPhoto} />
            )}
            <View style={styles.matchActions}>
              <TouchableOpacity style={styles.matchSendMessage} onPress={goToMatchChat}>
                <Text style={styles.matchButtonText}>Send a Message</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.matchKeepSwiping} onPress={hideMatchOverlay}>
                <Text style={styles.matchKeepText}>Keep Swiping</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      )}

      <FiltersSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onApply={() => { setFiltersOpen(false); loadProfiles(0, true); }}
      />
    </View>
  );
}

// Lazy import to avoid circular deps at module load.
async function swipeServiceBoost() {
  const { userService } = await import('../../services/userService');
  try {
    return await userService.boostProfile();
  } catch {
    return null;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...Typography.body, color: Colors.dark.textSecondary, marginTop: Spacing.base },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: Spacing.md,
  },
  logoContainer: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { ...Typography.h3, color: Colors.dark.text },
  filterButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: Colors.dark.bgSecondary, justifyContent: 'center', alignItems: 'center' },
  cardContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.base },
  card: {
    position: 'absolute', width: SCREEN_WIDTH - 32, height: SCREEN_HEIGHT * 0.58,
    borderRadius: BorderRadius['2xl'], overflow: 'hidden', backgroundColor: Colors.dark.bgSecondary, ...Shadow.lg,
  },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', justifyContent: 'flex-end', padding: Spacing.lg },
  cardContent: {},
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  cardName: { ...Typography.h2, color: Colors.white },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  infoText: { ...Typography.bodySmall, color: 'rgba(255,255,255,0.85)', marginLeft: 6 },
  bio: { ...Typography.bodySmall, color: 'rgba(255,255,255,0.75)', marginTop: Spacing.sm },
  interestRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: Spacing.sm, gap: 6 },
  interestChip: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 4 },
  interestText: { ...Typography.caption, color: Colors.white },
  stamp: { position: 'absolute', top: 50, zIndex: 10, padding: 10, borderWidth: 4, borderRadius: 12, transform: [{ rotate: '-20deg' }] },
  likeStamp: { left: 24 },
  nopeStamp: { right: 24, transform: [{ rotate: '20deg' }] },
  superStamp: { alignSelf: 'center', top: '42%', transform: [{ rotate: '-12deg' }] },
  stampText: { ...Typography.h1, fontSize: 42, fontWeight: '800' },
  actionButtons: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 30, paddingHorizontal: Spacing.xl, gap: 12 },
  actionBtn: { justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark.bgSecondary, borderWidth: 1, borderColor: Colors.dark.border, ...Shadow.md },
  smallBtn: { width: 48, height: 48, borderRadius: 24 },
  mediumBtn: { width: 56, height: 56, borderRadius: 28 },
  largeBtn: { width: 64, height: 64, borderRadius: 32 },
  emptyState: { alignItems: 'center', paddingHorizontal: Spacing.xl },
  emptyTitle: { ...Typography.h3, color: Colors.dark.textSecondary, marginTop: Spacing.lg },
  emptySubtitle: { ...Typography.body, color: Colors.dark.textMuted, marginTop: Spacing.sm, textAlign: 'center' },
  refreshButton: { marginTop: Spacing.xl, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.full, backgroundColor: Colors.primary },
  refreshText: { ...Typography.button, color: Colors.white },
  matchOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 1000, justifyContent: 'center', alignItems: 'center' },
  matchContent: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', padding: Spacing['2xl'] },
  matchTitle: { fontSize: 42, fontWeight: '800', color: Colors.white, marginBottom: Spacing.md },
  matchSubtitle: { ...Typography.bodyLarge, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginBottom: Spacing.xl },
  matchPhoto: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: Colors.white, marginBottom: Spacing['2xl'] },
  matchActions: { width: '100%', alignItems: 'center' },
  matchSendMessage: { width: '100%', paddingVertical: Spacing.base, borderRadius: BorderRadius.xl, backgroundColor: Colors.white, alignItems: 'center', marginBottom: Spacing.base },
  matchButtonText: { ...Typography.button, color: Colors.primary },
  matchKeepSwiping: { paddingVertical: Spacing.md },
  matchKeepText: { ...Typography.body, color: 'rgba(255,255,255,0.85)' },
});
