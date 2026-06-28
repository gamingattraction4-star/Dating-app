// SparkMatch — Chat Screen (Individual Conversation, realtime)
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Image, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { chatService } from '../../services/chatService';
import { chatSocket } from '../../services/chatSocket';
import { ChatMessage } from '../../types';

export default function ChatScreen({ route, navigation }: any) {
  const { conversationId, otherUserName, otherUserPhoto } = route.params;
  const userId = useAuthStore((s) => s.userId);
  const updateConversation = useAppStore((s) => s.updateConversation);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [theirTyping, setTheirTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sentTyping = useRef(false);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitle}>
          <Image source={otherUserPhoto ? { uri: otherUserPhoto } : require('../../../assets/icon.png')} style={styles.headerAvatar} />
          <View>
            <Text style={styles.headerName}>{otherUserName}</Text>
            <Text style={styles.headerStatus}>{theirTyping ? 'typing…' : 'Online'}</Text>
          </View>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity style={styles.headerAction} onPress={() => navigation.goBack()}>
          <Ionicons name="ellipsis-horizontal" size={22} color={Colors.dark.text} />
        </TouchableOpacity>
      ),
    });
  }, [theirTyping, otherUserName, otherUserPhoto]);

  // Load history + mark read.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await chatService.getMessages(conversationId);
        // Backend returns newest-first; show oldest-first.
        if (active) setMessages([...data].reverse());
        updateConversation(conversationId, { unreadCount: 0 });
      } catch {
        if (active) setMessages([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [conversationId]);

  // Realtime: connect + subscribe to this conversation's messages/typing.
  useEffect(() => {
    chatSocket.connect();

    const offMsg = chatSocket.onMessage((msg) => {
      if (msg.conversationId !== conversationId) {
        // Bump unread on other conversations.
        useAppStore.getState().updateConversation(msg.conversationId, {
          lastMessage: msg.content,
        });
        return;
      }
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    });

    const offTyping = chatSocket.onTyping((evt) => {
      if (evt.conversationId === conversationId && evt.userId !== userId) {
        setTheirTyping(evt.typing);
        if (evt.typing) {
          setTimeout(() => setTheirTyping(false), 4000);
        }
      }
    });

    return () => { offMsg(); offTyping(); };
  }, [conversationId, userId]);

  const handleInputChange = (text: string) => {
    setInputText(text);
    if (!sentTyping.current) {
      chatSocket.sendTyping(conversationId, true);
      sentTyping.current = true;
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      chatSocket.sendTyping(conversationId, false);
      sentTyping.current = false;
    }, 1500);
  };

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    sentTyping.current = false;
    chatSocket.sendTyping(conversationId, false);

    // Optimistic local echo.
    const optimistic: ChatMessage = {
      id: Date.now(),
      conversationId,
      senderId: userId || 0,
      senderName: 'You',
      content: text,
      messageType: 'TEXT',
      read: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    updateConversation(conversationId, { lastMessage: text, lastMessageAt: optimistic.createdAt });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Prefer the socket; always persist via REST so it's saved + delivered.
    chatSocket.sendMessage(conversationId, text);
    try {
      const saved = await chatService.sendMessage(conversationId, text);
      // Replace optimistic with the server message (real id).
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? saved : m)));
    } catch {
      // Keep optimistic message; it will reconcile on next open.
    }
  }, [inputText, conversationId, userId]);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === userId;
    const time = new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isMe) {
      return (
        <View style={[styles.messageContainer, styles.myMessage]}>
          <LinearGradient colors={[Colors.primary, Colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.messageBubble, styles.myBubble]}>
            <Text style={styles.myMessageText}>{item.content}</Text>
            <View style={styles.messageFooter}>
              <Text style={styles.myTimeText}>{time}</Text>
              <Ionicons name={item.read ? 'checkmark-done' : 'checkmark'} size={14} color="rgba(255,255,255,0.7)" style={{ marginLeft: 4 }} />
            </View>
          </LinearGradient>
        </View>
      );
    }
    return (
      <View style={[styles.messageContainer, styles.theirMessage]}>
        <View style={[styles.messageBubble, styles.theirBubble]}>
          <Text style={styles.theirMessageText}>{item.content}</Text>
          <Text style={styles.theirTimeText}>{time}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <StatusBar barStyle="light-content" />

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatEmoji}>👋</Text>
              <Text style={styles.emptyChatText}>You matched! Say hi to {otherUserName}.</Text>
            </View>
          ) : null
        }
      />

      {theirTyping && (
        <View style={styles.typingContainer}>
          <Text style={styles.typingText}>{otherUserName} is typing…</Text>
        </View>
      )}

      <View style={styles.inputBar}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={Colors.dark.textMuted}
            value={inputText}
            onChangeText={handleInputChange}
            multiline
            maxLength={1000}
          />
        </View>
        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendMessage}
          disabled={!inputText.trim()}
        >
          <LinearGradient
            colors={inputText.trim() ? [Colors.primary, Colors.secondary] : [Colors.dark.surfaceLight, Colors.dark.surfaceLight]}
            style={styles.sendGradient}
          >
            <Ionicons name="send" size={20} color={inputText.trim() ? Colors.white : Colors.dark.textMuted} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  headerTitle: { flexDirection: 'row', alignItems: 'center' },
  headerAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: Spacing.sm },
  headerName: { ...Typography.label, color: Colors.dark.text },
  headerStatus: { ...Typography.caption, color: Colors.online },
  headerAction: { marginRight: Spacing.md },
  messageList: { padding: Spacing.base, paddingBottom: Spacing.md, flexGrow: 1 },
  messageContainer: { marginBottom: Spacing.sm, maxWidth: '80%' },
  myMessage: { alignSelf: 'flex-end' },
  theirMessage: { alignSelf: 'flex-start' },
  messageBubble: { padding: 12, borderRadius: 20 },
  myBubble: { borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: Colors.dark.bgSecondary, borderBottomLeftRadius: 4 },
  myMessageText: { ...Typography.body, color: Colors.white },
  theirMessageText: { ...Typography.body, color: Colors.dark.text },
  messageFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 },
  myTimeText: { ...Typography.caption, color: 'rgba(255,255,255,0.6)', fontSize: 10 },
  theirTimeText: { ...Typography.caption, color: Colors.dark.textMuted, marginTop: 4, fontSize: 10 },
  typingContainer: { paddingHorizontal: Spacing.xl, paddingVertical: 4 },
  typingText: { ...Typography.caption, color: Colors.dark.textMuted, fontStyle: 'italic' },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 120 },
  emptyChatEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyChatText: { ...Typography.body, color: Colors.dark.textMuted, textAlign: 'center', paddingHorizontal: Spacing.xl },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    paddingBottom: Spacing.lg, borderTopWidth: 0.5,
    borderTopColor: Colors.dark.border, backgroundColor: Colors.dark.bg,
  },
  inputContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.dark.bgSecondary,
    borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.md,
    paddingVertical: 8, marginRight: Spacing.sm,
    minHeight: 44, maxHeight: 120,
  },
  textInput: { flex: 1, ...Typography.body, color: Colors.dark.text },
  sendButton: { borderRadius: 22 },
  sendGradient: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
});
