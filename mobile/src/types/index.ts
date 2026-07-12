// SparkMatch — TypeScript Types

export interface User {
  id: number;
  email: string;
  phone?: string;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'DEACTIVATED' | 'PENDING_VERIFICATION';
  isVerified: boolean;
  isPremium: boolean;
}

export interface Profile {
  userId: number;
  displayName: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER';
  bio?: string;
  jobTitle?: string;
  company?: string;
  school?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  heightCm?: number;
  drinking?: 'NEVER' | 'SOMETIMES' | 'OFTEN';
  smoking?: 'NEVER' | 'SOMETIMES' | 'OFTEN';
  lookingFor?: 'RELATIONSHIP' | 'CASUAL' | 'FRIENDSHIP' | 'NOT_SURE';
  workout?: string;
  educationLevel?: string;
  pets?: string;
  zodiac?: string;
  children?: string;
  religion?: string;
  languages?: string;
  instagram?: string;
  profileCompletePct: number;
  verified: boolean;
  premium: boolean;
  photos: Photo[];
  interests?: Interest[];
  prompts?: PromptAnswer[];
  distanceKm?: number;
}

export interface Photo {
  id: number;
  photoUrl: string;
  thumbnailUrl?: string;
  orderIndex: number;
  primary: boolean;
}

export interface Interest {
  id: number;
  name: string;
  category: string;
  icon: string;
}

export interface PromptAnswer {
  promptId: number;
  promptText: string;
  answer: string;
}

export interface Preferences {
  minAge: number;
  maxAge: number;
  maxDistanceKm: number;
  genderPreference: 'MALE' | 'FEMALE' | 'EVERYONE';
  showMeOnApp: boolean;
  globalMode: boolean;
}

/** Payload for PUT /users/me. Mirrors the backend ProfileUpdateRequest. */
export interface ProfileUpdate {
  displayName?: string;
  birthdate?: string; // YYYY-MM-DD
  gender?: string;
  bio?: string;
  jobTitle?: string;
  company?: string;
  school?: string;
  city?: string;
  heightCm?: number;
  drinking?: string;
  smoking?: string;
  lookingFor?: string;
  workout?: string;
  educationLevel?: string;
  pets?: string;
  zodiac?: string;
  children?: string;
  religion?: string;
  languages?: string;
  instagram?: string;
  interestIds?: number[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: number;
  email: string;
  displayName?: string;
  profileComplete: boolean;
  // When true, tokens are absent and the client must verify an emailed OTP first.
  otpRequired?: boolean;
}

export interface SwipeResponse {
  matched: boolean;
  matchId?: number;
  matchedUser?: {
    userId: number;
    displayName: string;
    photoUrl?: string;
    age?: number;
  };
}

export interface MatchInfo {
  matchId: number;
  userId: number;
  displayName: string;
  photoUrl?: string;
  age?: number;
  city?: string;
  verified: boolean;
  matchedAt: string;
  lastMessage?: string;
  lastMessageAt?: string;
}

export interface Conversation {
  id: number;
  matchId: number;
  otherUserId: number;
  otherUserName: string;
  otherUserPhoto?: string;
  otherUserVerified: boolean;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  active: boolean;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'VOICE' | 'GIF' | 'ICE_BREAKER';
  mediaUrl?: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  description?: string;
  priceCents: number;
  currency: string;
  durationDays: number;
  features?: Record<string, any>;
  isActive?: boolean;
}

export interface SubscriptionResponse {
  id: number;
  planName: string;
  planDescription?: string;
  priceCents: number;
  currency: string;
  durationDays: number;
  status: string;
  startsAt?: string;
  expiresAt?: string;
  autoRenew: boolean;
  active: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: any;
  timestamp: string;
}
