// SparkMatch — Realtime chat over STOMP/WebSocket
// Connects to the Spring backend's STOMP endpoint and exposes a tiny API for
// subscribing to incoming messages / typing events and publishing them.
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { ChatMessage } from '../types';
import { WS_URL } from '../config';
import { useAuthStore } from '../store/authStore';

// React Native lacks TextEncoder/TextDecoder which STOMP needs.
import 'text-encoding';

export interface TypingEvent {
  conversationId: number;
  userId: number;
  typing: boolean;
}

type MessageHandler = (msg: ChatMessage) => void;
type TypingHandler = (evt: TypingEvent) => void;

class ChatSocket {
  private client: Client | null = null;
  private messageSub: StompSubscription | null = null;
  private typingSub: StompSubscription | null = null;
  private messageHandlers = new Set<MessageHandler>();
  private typingHandlers = new Set<TypingHandler>();
  private connected = false;

  isConnected() {
    return this.connected;
  }

  connect() {
    if (this.client) return;
    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    this.client = new Client({
      // Token is passed as a query param (handshake interceptor reads it).
      brokerURL: `${WS_URL}?token=${encodeURIComponent(token)}`,
      // Also send it as a STOMP header for the message-level fallback.
      connectHeaders: { Authorization: `Bearer ${token}` },
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      webSocketFactory: () => new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`),
    });

    this.client.onConnect = () => {
      this.connected = true;
      this.messageSub = this.client!.subscribe('/user/queue/messages', (frame: IMessage) => {
        try {
          const msg = JSON.parse(frame.body) as ChatMessage;
          this.messageHandlers.forEach((h) => h(msg));
        } catch {
          /* ignore malformed frame */
        }
      });
      this.typingSub = this.client!.subscribe('/user/queue/typing', (frame: IMessage) => {
        try {
          const evt = JSON.parse(frame.body) as TypingEvent;
          this.typingHandlers.forEach((h) => h(evt));
        } catch {
          /* ignore */
        }
      });
    };

    this.client.onStompError = () => { this.connected = false; };
    this.client.onWebSocketClose = () => { this.connected = false; };

    this.client.activate();
  }

  disconnect() {
    this.messageSub?.unsubscribe();
    this.typingSub?.unsubscribe();
    this.messageSub = null;
    this.typingSub = null;
    this.client?.deactivate();
    this.client = null;
    this.connected = false;
    this.messageHandlers.clear();
    this.typingHandlers.clear();
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onTyping(handler: TypingHandler): () => void {
    this.typingHandlers.add(handler);
    return () => this.typingHandlers.delete(handler);
  }

  sendMessage(conversationId: number, content: string) {
    if (!this.client?.connected) return false;
    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ conversationId, content, messageType: 'TEXT' }),
    });
    return true;
  }

  sendTyping(conversationId: number, typing: boolean) {
    if (!this.client?.connected) return;
    this.client.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({ conversationId, typing }),
    });
  }
}

export const chatSocket = new ChatSocket();
