export interface ItineraryItem {
  id: string;
  type: 'flight' | 'hotel' | 'transfer' | 'lounge' | 'activity' | 'restaurant';
  title: string;
  description?: string;
  date: string;
  time?: string;
  location?: string;
  bookingId?: string;
  confirmationCode?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  metadata?: Record<string, unknown>;
}

export interface Itinerary {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  items: ItineraryItem[];
  status: 'planning' | 'confirmed' | 'completed' | 'cancelled';
  sharedWith: string[];
  reminders: { id: string; date: string; message: string; sent: boolean }[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShareRequest {
  emails: string[];
  permission: 'view' | 'edit';
  message?: string;
}

export interface CalendarSync {
  provider: 'google' | 'apple' | 'outlook';
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: unknown };
  meta?: { requestId: string; timestamp: number };
}