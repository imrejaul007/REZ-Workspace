export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  context: {
    preferences?: { preferredCabin?: string; preferredAirline?: string };
    recentSearches?: string[];
    upcomingTrips?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  context?: Record<string, unknown>;
}

export interface ChatResponse {
  message: string;
  sessionId: string;
  suggestions?: string[];
  actions?: { type: string; payload: unknown }[];
  confidence?: number;
}

export interface Recommendation {
  id: string;
  type: 'flight' | 'hotel' | 'lounge' | 'transfer' | 'activity';
  title: string;
  description: string;
  score: number;
  reason: string;
  metadata?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  meta?: { requestId: string; timestamp: number };
}