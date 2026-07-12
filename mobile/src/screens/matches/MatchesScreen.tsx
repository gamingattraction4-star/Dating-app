// SparkMatch — Matches Screen (new matches + active conversations)
import React, { useMemo, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity, StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { formatDistanceToNowStrict } from 'date-fns';
import { Colors, Typography, Spacing, BorderRadius, Shadow, useTheme, ActiveTheme } from '../../theme';
import { useAppStore } from '../../store/appStore';
import { swipeService } from '../../services/swipeService';
import { chatService } from '../../services/chatService';
import { MatchInfo, Conversation } from '../../types';

export default function MatchesScreen({ navigation }: any) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const { matches, setMatches, conversations, setConversations } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [m, c] = await Promise.all([
        swipeService.getMatches().catch(() => []),
        chatService.getConversations().catch(() => []),
      ]);
      setMatches(m);
      setConversations(c);
    } finally {
      setLoading(false);
    }
  }, [setMatches, setConversations]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Matches that don't yet have a message form the "new matches" row.
  const convByOtherId = useMemo(() => {
    const map: Record<number, Conversation> = {};
    conversations.forEach((c) => { map[c.otherUserId] = c; });
    return map;
  }, [conversations]);

  const openChat = (conversationId: number, name: string, photo?: string) => {
    navigation.navigate('ChatConversation', { conversationId, otherUserName: name, otherUserPhoto: photo });
  };

  const renderNewMatch = ({ item }: { item: MatchInfo }) => {
    const convo = convByOtherId[item.userId];
    return (
      <TouchableOpacity
        style={styles.matchCard}
        activeOpacity={0.85}
        onPress={() => convo && openChat(convo.id, item.displayName, item.photoUrl)}
      >
        <LinearGradient colors={[Colors.primary, Colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.matchRing}>
          <Image source={item.photoUrl ? { uri: item.photoUrl } : require('../../../assets/icon.png')} style={styles.matchPhoto} />
        </LinearGradient>
        <View style={styles.matchNameRow}>
          <Text style={styles.matchName} numberOfLines={1}>{item.displayName}</Text>
          {item.verified && <Ionicons name="checkmark-circle" size={12} color={Colors.verified} />}
        </View>
      </TouchableOpacity>
    );
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity style={styles.messageRow} activeOpacity={0.7} onPress={() => openChat(item.id, item.otherUserName, item.otherUserPhoto)}>
      <Image source={item.otherUserPhoto ? { uri: item.otherUserPhoto } : require('../../../assets/icon.png')} style={styles.messageAvatar} />
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={styles.messageName}>{item.otherUserName}</Text>
          <Text style={styles.messageTime}>{item.lastMessageAt ? formatDistanceToNowStrict(new Date(item.lastMessageAt)) : ''}</Text>
        </View>
        <View style={styles.messagePreviewRow}>
          <Text style={[styles.messagePreview, item.unreadCount > 0 && styles.messageUnread]} numberOfLines={1}>
            {item.lastMessage || 'Say something to start the conversation! 👋'}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}><Text style={styles.unreadText}>{item.unreadCount}</Text></View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const hasMatches = matches.length > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Matches</Text>
        {hasMatches && <View style={styles.matchCount}><Text style={styles.matchCountText}>{matches.length}</Text></View>}
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => `conv-${item.id}`}
        renderItem={renderConversation}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListHeaderComponent={
          hasMatches ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>New Matches ✨</Text>
              <FlatList
                data={matches}
                renderItem={renderNewMatch}
                keyExtractor={(item) => `match-${item.matchId}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.matchesList}
              />
              <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Messages</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={56} color={t.textMuted} />
            <Text style={styles.emptyText}>{hasMatches ? 'Start a conversation with your matches!' : 'Start swiping to get matches!'}</Text>
          </View>
        }
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
      />
    </View>
  );
}

const makeStyles = (t: ActiveTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: Spacing.md },
  headerTitle: { ...Typography.h2, color: t.text, flex: 1 },
  matchCount: { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, paddingHorizontal: 12, paddingVertical: 4 },
  matchCountText: { ...Typography.labelSmall, color: Colors.white },
  section: { paddingTop: Spacing.sm },
  sectionTitle: { ...Typography.label, color: t.textSecondary, paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  matchesList: { paddingHorizontal: Spacing.xl, gap: Spacing.lg },
  matchCard: { width: 74, alignItems: 'center' },
  matchRing: { width: 74, height: 74, borderRadius: 37, alignItems: 'center', justifyContent: 'center', ...Shadow.md },
  matchPhoto: { width: 66, height: 66, borderRadius: 33, borderWidth: 2, borderColor: t.bg },
  matchNameRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 6, maxWidth: 74 },
  matchName: { ...Typography.captionBold, color: t.text },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: Spacing['4xl'] },
  emptyText: { ...Typography.body, color: t.textMuted, marginTop: Spacing.md, textAlign: 'center', paddingHorizontal: Spacing.xl },
  messageRow: { flexDirection: 'row', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, alignItems: 'center' },
  messageAvatar: { width: 56, height: 56, borderRadius: 28, marginRight: Spacing.md, backgroundColor: t.surface },
  messageContent: { flex: 1 },
  messageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  messageName: { ...Typography.label, color: t.text },
  messageTime: { ...Typography.caption, color: t.textMuted },
  messagePreviewRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  messagePreview: { ...Typography.bodySmall, color: t.textSecondary, flex: 1 },
  messageUnread: { color: t.text, fontWeight: '600' },
  unreadBadge: { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6, marginLeft: Spacing.sm },
  unreadText: { ...Typography.captionBold, color: Colors.white, fontSize: 11 },
});
