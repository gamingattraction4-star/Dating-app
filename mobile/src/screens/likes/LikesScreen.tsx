// SparkMatch — Who Liked You (free for everyone)
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity, StatusBar, ActivityIndicator, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, useTheme, ActiveTheme } from '../../theme';
import { swipeService } from '../../services/swipeService';
import { Profile } from '../../types';

const COL_GAP = Spacing.md;
const CARD_W = (Dimensions.get('window').width - Spacing.xl * 2 - COL_GAP) / 2;

export default function LikesScreen({ navigation }: any) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [likes, setLikes] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await swipeService.getWhoLikedMe();
      setLikes(data);
    } catch {
      setLikes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const renderItem = ({ item }: { item: Profile }) => {
    const photo = item.photos?.[0]?.photoUrl;
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.85}>
        <Image source={photo ? { uri: photo } : require('../../../assets/icon.png')} style={styles.cardImg} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.cardOverlay}>
          <View style={styles.nameRow}>
            <Text style={styles.cardName} numberOfLines={1}>
              {item.displayName}{item.age ? `, ${item.age}` : ''}
            </Text>
            {item.verified && <Ionicons name="checkmark-circle" size={14} color={Colors.verified} />}
          </View>
          {!!item.city && <Text style={styles.cardCity} numberOfLines={1}>{item.city}</Text>}
        </LinearGradient>
        <View style={styles.likeBadge}>
          <Ionicons name="heart" size={14} color={Colors.white} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={t.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Likes You</Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing['3xl'] }} />
      ) : (
        <FlatList
          data={likes}
          renderItem={renderItem}
          keyExtractor={(item) => item.userId.toString()}
          numColumns={2}
          columnWrapperStyle={{ gap: COL_GAP }}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.subtitle}>
              {likes.length ? `${likes.length} ${likes.length === 1 ? 'person likes' : 'people like'} you 💕` : ''}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="heart-outline" size={56} color={t.textMuted} />
              <Text style={styles.emptyText}>No likes yet. Keep swiping and they'll show up here!</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const makeStyles = (t: ActiveTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: Spacing.md,
  },
  headerTitle: { ...Typography.h3, color: t.text },
  subtitle: { ...Typography.body, color: t.textSecondary, marginBottom: Spacing.lg },
  list: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: 40 },
  card: { width: CARD_W, height: CARD_W * 1.3, borderRadius: BorderRadius.lg, overflow: 'hidden', marginBottom: COL_GAP, backgroundColor: t.surface },
  cardImg: { width: '100%', height: '100%' },
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.md, minHeight: 56, justifyContent: 'flex-end' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardName: { ...Typography.label, color: Colors.white, flex: 1 },
  cardCity: { ...Typography.caption, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  likeBadge: {
    position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  empty: { alignItems: 'center', paddingTop: Spacing['4xl'], paddingHorizontal: Spacing.xl },
  emptyText: { ...Typography.body, color: t.textMuted, marginTop: Spacing.md, textAlign: 'center' },
});
