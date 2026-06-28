// SparkMatch — Premium / Subscription Service
import api from './api';
import { ApiResponse, SubscriptionPlan, SubscriptionResponse } from '../types';

export const premiumService = {
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    const response = await api.get<ApiResponse<SubscriptionPlan[]>>('/premium/plans');
    return response.data.data;
  },

  subscribe: async (planId: number, paymentId?: string): Promise<SubscriptionResponse> => {
    const response = await api.post<ApiResponse<SubscriptionResponse>>('/premium/subscribe', {
      planId,
      paymentId: paymentId || `demo_${Date.now()}`,
    });
    return response.data.data;
  },

  getActive: async (): Promise<SubscriptionResponse | null> => {
    const response = await api.get<ApiResponse<SubscriptionResponse | null>>('/premium/subscription');
    return response.data.data;
  },

  cancel: async (): Promise<void> => {
    await api.post('/premium/cancel', {});
  },
};
