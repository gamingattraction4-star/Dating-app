// SparkMatch — Chat Service
import api from './api';
import { Conversation, ChatMessage, ApiResponse } from '../types';

export const chatService = {
  getConversations: async (): Promise<Conversation[]> => {
    const response = await api.get<ApiResponse<Conversation[]>>('/conversations');
    return response.data.data;
  },

  getMessages: async (conversationId: number, page: number = 0, size: number = 50): Promise<ChatMessage[]> => {
    const response = await api.get<ApiResponse<ChatMessage[]>>(
      `/conversations/${conversationId}/messages`,
      { params: { page, size } }
    );
    return response.data.data;
  },

  sendMessage: async (conversationId: number, content: string, messageType: string = 'TEXT'): Promise<ChatMessage> => {
    const response = await api.post<ApiResponse<ChatMessage>>(
      `/conversations/${conversationId}/messages`,
      { conversationId, content, messageType }
    );
    return response.data.data;
  },
};
