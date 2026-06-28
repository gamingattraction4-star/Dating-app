// SparkMatch — Chat List Screen
import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, StatusBar, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { formatDistanceToNowStrict } from 'date-fns';
import { Colors, Typography, Spacing, BorderRadius, useTheme, ActiveTheme } from '../../theme';
import { useAppStore } from '../../store/appStore';
import { chatService } from '../../services/chatService';
import { chatSocket } from '../../services/chatSocket';
import { Conversation } from '../../types';

export default function ChatListScreen({ navigation }: any) {
  const t = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const { conversations, setConversations } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      const data = await chatService.getConversations();
      setConversations(data);
    } catch {
      setConversations([]);
    } finally {
      setLoaded(true);
    }
  }, [setConversations]);

  // Refresh whenever the tab gains focus, and keep the socket alive.
  useFocusEffect(
    useCallback(() => {
      loadConversations();
      chatSocket.connect();
      const off = chatSocket.onMessage(() => loadConversations());
      return () => off();
    }, [loadConversations]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const timeLabel = (iso?: string) => {
    if (!iso) return '';
    try {
      return formatDistanceToNowStrict(new Date(iso), { addSuffix: false });
    } catch {
      return '';
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.chatRow}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ChatConversation', {
        conversationId: item.id,
        otherUserName: item.otherUserName,
        otherUserPhoto: item.otherUserPhoto,
      })}
    >
      <View style={styles.avatarContainer}>
        <Image source={item.otherUserPhoto ? { uri: item.otherUserPhoto } : require('../../../assets/icon.png')} style={styles.avatar} />
        <View style={styles.onlineIndicator} />
      </View>

      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <View style={styles.nameContainer}>
            <Text style={styles.chatName}>{item.otherUserName}</Text>
            {item.otherUserVerified && (
              <Ionicons name="checkmark-circle" size={14} color={Colors.verified} style={{ marginLeft: 4 }} />
            )}
          </View>
          <Text style={styles.chatTime}>{timeLabel(item.lastMessageAt)}</Text>
        </View>
        <View style={styles.messageRow}>
          <Text style={[styles.lastMessage, item.unreadCount > 0 && styles.unreadMessage]} numberOfLines={1}>
            {item.lastMessage || 'Say hi 👋'}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          loaded ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={64} color={t.textMuted} />
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptySubtitle}>Match with someone to start chatting!</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const makeStyles = (t: ActiveTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: Spacing.md,
  },
  headerTitle: { ...Typography.h2, color: t.text },
  listContent: { flexGrow: 1 },
  chatRow: { flexDirection: 'row', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, alignItems: 'center' },
  avatarContainer: { position: 'relative', marginRight: Spacing.md },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: t.surface },
  onlineIndicator: {
    position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7,
    backgroundColor: Colors.online, borderWidth: 2, borderColor: t.bg,
  },
  chatInfo: { flex: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nameContainer: { flexDirection: 'row', alignItems: 'center' },
  chatName: { ...Typography.label, color: t.text },
  chatTime: { ...Typography.caption, color: t.textMuted },
  messageRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  lastMessage: { ...Typography.bodySmall, color: t.textSecondary, flex: 1 },
  unreadMessage: { color: t.text, fontWeight: '600' },
  unreadBadge: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.full,
    minWidth: 22, height: 22, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 6, marginLeft: Spacing.sm,
  },
  unreadCount: { ...Typography.captionBold, color: Colors.white, fontSize: 11 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: Spacing['5xl'] },
  emptyTitle: { ...Typography.h3, color: t.textSecondary, marginTop: Spacing.lg },
  emptySubtitle: { ...Typography.body, color: t.textMuted, marginTop: Spacing.sm },
});
