/**
 * REZ Assistant - Types
 * Complete type definitions for the AI assistant service
 */

// ============================================
// CONVERSATION MODELS
// ============================================

export interface Conversation {
  id: string;
  userId: string;
  title?: string;
  messages: Message[];
  context: ConversationContext;
  metadata: ConversationMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  intent?: DetectedIntent;
  entities?: ExtractedEntity[];
  actions?: Action[];
  metadata?: MessageMetadata;
  createdAt: Date;
}

export interface ConversationContext {
  location?: LocationContext;
  preferences?: UserPreferences;
  sessionData?: Record<string, any>;
  previousIntents?: string[];
}

export interface ConversationMetadata {
  messageCount: number;
  lastIntent?: string;
  language?: string;
  isActive: boolean;
}

// ============================================
// INTENT DETECTION
// ============================================

export interface DetectedIntent {
  name: string;
  confidence: number;
  category: IntentCategory;
  subIntents?: string[];
  requiresAction: boolean;
}

export type IntentCategory =
  | 'food_order'
  | 'travel'
  | 'shopping'
  | 'bill_payment'
  | 'support'
  | 'product_verification'
  | 'recommendation'
  | 'general'
  | 'calendar'
  | 'task'
  | 'reminder'
  | 'note'
  | 'wallet'
  | 'order';

export interface IntentPattern {
  keywords: string[];
  intent: string;
  category: IntentCategory;
  confidence: number;
  examples: string[];
}

// ============================================
// ENTITY EXTRACTION
// ============================================

export interface ExtractedEntity {
  type: EntityType;
  value: string;
  normalizedValue?: string;
  confidence: number;
  startIndex?: number;
  endIndex?: number;
}

export type EntityType =
  | 'food_item'
  | 'restaurant'
  | 'location'
  | 'price'
  | 'time'
  | 'date'
  | 'person'
  | 'organization'
  | 'product'
  | 'brand'
  | 'category'
  | 'quantity'
  | 'phone'
  | 'email'
  | 'url'
  | 'order_id'
  | 'product_id';

// ============================================
// ACTION EXECUTION
// ============================================

export interface Action {
  type: ActionType;
  parameters: Record<string, any>;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export type ActionType =
  | 'search_restaurants'
  | 'search_products'
  | 'track_order'
  | 'verify_product'
  | 'create_reminder'
  | 'create_task'
  | 'create_note'
  | 'create_event'
  | 'pay_bill'
  | 'recharge'
  | 'send_notification'
  | 'update_wallet'
  | 'fetch_wallet_balance';

// ============================================
// AI RESPONSE
// ============================================

export interface AIResponse {
  content: string;
  intents: DetectedIntent[];
  entities: ExtractedEntity[];
  actions: Action[];
  context: {
    usedContext: boolean;
    conversationTurns: number;
  };
  metadata: {
    model: string;
    tokensUsed?: number;
    responseTimeMs: number;
  };
}

// ============================================
// USER PREFERENCES & PROFILES
// ============================================

export interface UserPreferences {
  userId: string;
  cuisinePreferences: string[];
  dietaryRestrictions: string[];
  budget: 'low' | 'medium' | 'high';
  favoriteCategories: string[];
  recentSearches: string[];
  language: string;
  updatedAt: Date;
}

export interface UserProfile {
  userId: string;
  preferences: UserPreferences;
  conversationStyle: 'formal' | 'casual' | 'friendly';
  notificationPreferences: NotificationPreferences;
  createdAt: Date;
  lastActive: Date;
}

// ============================================
// NOTIFICATIONS
// ============================================

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface ChatRequest {
  userId: string;
  message: string;
  conversationId?: string;
  context?: Record<string, any>;
  stream?: boolean;
}

export interface ChatResponse {
  success: boolean;
  response: AIResponse;
  conversationId: string;
  messageId: string;
}

export interface ConversationsListResponse {
  success: boolean;
  conversations: ConversationSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ConversationSummary {
  id: string;
  title?: string;
  lastMessage: string;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntentDetectionRequest {
  text: string;
  userId?: string;
  context?: Record<string, any>;
}

export interface IntentDetectionResponse {
  success: boolean;
  intents: DetectedIntent[];
  entities: ExtractedEntity[];
}

export interface ActionExecutionRequest {
  userId: string;
  action: Action;
  context?: Record<string, any>;
}

export interface ActionExecutionResponse {
  success: boolean;
  action: Action;
  result?: any;
}

// ============================================
// INTERNAL TYPES
// ============================================

export interface LocationContext {
  latitude?: number;
  longitude?: number;
  city?: string;
  address?: string;
}

export interface MessageMetadata {
  messageLength: number;
  detectedIntents: string[];
  confidence: number;
  processingTimeMs?: number;
}

export interface Prediction {
  userId: string;
  needs: {
    intent: string;
    confidence: number;
    reason: string;
    action?: string;
  }[];
  context: {
    location?: string;
    time?: string;
    weather?: string;
  };
  generatedAt: Date;
}

export interface Recommendation {
  id: string;
  userId: string;
  type: 'product' | 'service' | 'content';
  category: string;
  title: string;
  description: string;
  confidence: number;
  actionUrl?: string;
  imageUrl?: string;
}

// ============================================
// CALENDAR & TASKS
// ============================================

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
  recurrence?: RecurrenceRule;
  reminder?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval?: number;
  endDate?: Date;
  count?: number;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  tags?: string[];
  project?: string;
  subtasks?: Subtask[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags?: string[];
  category: string;
  color?: string;
  pinned?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  message?: string;
  time: Date;
  type: 'once' | 'daily' | 'weekly' | 'monthly';
  relatedId?: string;
  status: 'pending' | 'triggered' | 'dismissed';
  createdAt: Date;
}

// ============================================
// SERVICE CONFIGURATION
// ============================================

export interface ServiceConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  anthropicApiKey?: string;
  redisUrl?: string;
  mongoUri?: string;

  // RABTUL Services
  authServiceUrl?: string;
  walletServiceUrl?: string;
  notificationServiceUrl?: string;
  orderServiceUrl?: string;

  // REZ Intelligence
  intentServiceUrl?: string;
  mindServiceUrl?: string;
  agentServiceUrl?: string;

  // Security
  internalApiKey?: string;
  allowedOrigins?: string[];
  rateLimitWindowMs?: number;
  rateLimitMax?: number;
}
