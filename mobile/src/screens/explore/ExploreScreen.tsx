// SparkMatch — People / Explore
// Browse people by interest and "looking for" category, in an attractive grid.
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList, Image, TouchableOpacity,
  StatusBar, ActivityIndicator, Dimensions, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadow, useTheme, ActiveTheme } from '../../theme';
import { swipeService } from '../../services/swipeService';
import { userService } from '../../services/userService';
import { Profile, Interest } from '../../types';

const { width } = Dimensions.get('window');
const GAP = Spacing.md;
const CARD_W = (width - Spacing.xl * 2 - GAP) / 2;

const CATEGORIES = [
  { key: '', label: 'Everyone', icon: 'people', color: Colors.primary },
  { key: 'RELATIONSHIP', label: 'Relationship', icon: 'heart', color: '#FF4D67' },
  { key: 'CASUAL', label: 'Casual', icon: 'wine', color: '#A855F7' },
  { key: 'FRIENDSHIP', label: 'Friendship', icon: 'happy', color: '#3B82F6' },
  { key: 'NOT_SURE', label: 'Not sure', icon: 'help-circle', color: '#F59E0B' },
];

export default function ExploreScreen({ navigation }: any) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [interests, setInterests] = useState<Interest[]>([]);
  const [activeInterest, setActiveInterest] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [people, setPeople] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    userService.getInterests().then(setInterests).catch(() => setInterests([]));
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await swipeService.explore({
        interest: activeInterest || undefined,
        lookingFor: activeCategory || undefined,
      });
      setPeople(data);
    } catch {
      setPeople([]);
    } finally {
      setLoading(false);
    }
  }, [activeInterest, activeCategory]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));
  useEffect(() => { setLoading(true); load(); }, [activeInterest, activeCategory]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const pickInterest = (name: string) => {
    Haptics.selectionAsync();
    setActiveInterest((prev) => (prev === name ? '' : name));
  };
  const pickCategory = (key: string) => {
    Haptics.selectionAsync();
    setActiveCategory(key);
  };

  const renderPerson = ({ item }: { item: Profile }) => {
    const photo = item.photos?.[0]?.photoUrl;
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.9}>
        <Image source={photo ? { uri: photo } : require('../../../assets/icon.png')} style={styles.cardImg} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.cardOverlay}>
          <View style={styles.nameRow}>
            <Text style={styles.cardName} numberOfLines={1}>
              {item.displayName}{item.age ? `, ${item.age}` : ''}
            </Text>
            {item.verified && <Ionicons name="checkmark-circle" size={14} color={Colors.verified} />}
          </View>
          {!!item.interests?.length && (
            <View style={styles.tagRow}>
              {item.interests.slice(0, 2).map((i) => (
                <View key={i.id} style={styles.tag}>
                  <Text style={styles.tagText} numberOfLines={1}>{i.icon} {i.name}</Text>
                </View>
              ))}
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>People</Text>
          <Text style={styles.headerSub}>Find your kind of people ✨</Text>
        </View>
        <View style={styles.headerBadge}>
          <Ionicons name="people" size={18} color={Colors.white} />
        </View>
      </View>

      {/* Category pills */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {CATEGORIES.map((c) => {
            const on = activeCategory === c.key;
            return (
              <TouchableOpacity key={c.key || 'all'} onPress={() => pickCategory(c.key)} activeOpacity={0.85}>
                {on ? (
                  <LinearGradient colors={[Colors.primary, Colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.catPillOn}>
                    <Ionicons name={c.icon as any} size={15} color={Colors.white} />
                    <Text style={styles.catTextOn}>{c.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.catPill}>
                    <Ionicons name={c.icon as any} size={15} color={c.color} />
                    <Text style={styles.catText}>{c.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Interest chips */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {interests.map((i) => {
            const on = activeInterest === i.name;
            return (
              <TouchableOpacity key={i.id} style={[styles.chip, on && styles.chipOn]} onPress={() => pickInterest(i.name)} activeOpacity={0.8}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{i.icon} {i.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Results */}
      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing['3xl'] }} />
      ) : (
        <FlatList
          data={people}
          renderItem={renderPerson}
          keyExtractor={(item) => item.userId.toString()}
          numColumns={2}
          columnWrapperStyle={{ gap: GAP, paddingHorizontal: Spacing.xl }}
          contentContainerStyle={{ paddingTop: Spacing.sm, paddingBottom: 100, gap: GAP }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search" size={52} color={t.textMuted} />
              <Text style={styles.emptyText}>No one here yet. Try another filter.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const makeStyles = (t: ActiveTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: Spacing.md },
  headerTitle: { ...Typography.h1, color: t.text },
  headerSub: { ...Typography.caption, color: t.textMuted, marginTop: 2 },
  headerBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadow.md },
  catRow: { paddingHorizontal: Spacing.xl, gap: Spacing.sm, paddingVertical: Spacing.sm },
  catPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.base, paddingVertical: 9, borderRadius: BorderRadius.full, backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
  catPillOn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.base, paddingVertical: 9, borderRadius: BorderRadius.full },
  catText: { ...Typography.caption, color: t.text, fontWeight: '600' },
  catTextOn: { ...Typography.caption, color: Colors.white, fontWeight: '700' },
  chipRow: { paddingHorizontal: Spacing.xl, gap: Spacing.sm, paddingBottom: Spacing.md },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: BorderRadius.full, backgroundColor: t.bgTertiary },
  chipOn: { backgroundColor: 'rgba(255,77,103,0.16)', borderWidth: 1, borderColor: Colors.primary },
  chipText: { ...Typography.caption, color: t.textSecondary },
  chipTextOn: { color: Colors.primary, fontWeight: '700' },
  card: { width: CARD_W, height: CARD_W * 1.35, borderRadius: BorderRadius.xl, overflow: 'hidden', backgroundColor: t.surface, ...Shadow.md },
  cardImg: { width: '100%', height: '100%' },
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.md, minHeight: 70, justifyContent: 'flex-end' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardName: { ...Typography.label, color: Colors.white, flex: 1 },
  tagRow: { flexDirection: 'row', gap: 4, marginTop: 6, flexWrap: 'wrap' },
  tag: { backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { ...Typography.caption, color: Colors.white, fontSize: 10 },
  empty: { alignItems: 'center', paddingTop: Spacing['4xl'], paddingHorizontal: Spacing.xl },
  emptyText: { ...Typography.body, color: t.textMuted, marginTop: Spacing.md, textAlign: 'center' },
});
