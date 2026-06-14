/**
 * REZ Guest Mobile App Types
 */

export interface GuestProfile {
  id: string;
  guestId: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  loyaltyPoints: number;
  preferences: GuestPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface GuestPreferences {
  roomPreference?: string;
  dietaryRestrictions?: string[];
  notifications: NotificationPreferences;
  language: string;
  currency: string;
}

export interface NotificationPreferences {
  push: boolean;
  email: boolean;
  sms: boolean;
  types: string[];
}

export interface Booking {
  id: string;
  bookingId: string;
  guestId: string;
  hotelId: string;
  hotelName: string;
  roomNumber: string;
  roomType: string;
  checkIn: Date;
  checkOut: Date;
  status: 'upcoming' | 'checked-in' | 'checked-out' | 'cancelled';
  totalAmount: number;
  paidAmount: number;
  currency: string;
  amenities: string[];
  createdAt: Date;
}

export interface RoomServiceRequest {
  id: string;
  bookingId: string;
  guestId: string;
  type: 'cleaning' | 'towels' | 'toiletries' | 'minibar' | 'maintenance' | 'dnd' | 'other';
  description?: string;
  priority: 'low' | 'normal' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  notes?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface ServiceRequest {
  id: string;
  bookingId: string;
  guestId: string;
  serviceType: 'room_service' | 'spa' | 'transport' | 'restaurant' | 'concierge' | 'laundry';
  subject: string;
  description: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  scheduledTime?: Date;
  notes?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface Notification {
  id: string;
  guestId: string;
  type: 'booking' | 'service' | 'promotion' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

export interface Feedback {
  id: string;
  bookingId: string;
  guestId: string;
  hotelId: string;
  rating: number;
  categories?: {
    cleanliness?: number;
    service?: number;
    amenities?: number;
    value?: number;
  };
  comment?: string;
  status: 'pending' | 'submitted';
  createdAt: Date;
}

export interface CreateBookingInput {
  guestId: string;
  hotelId: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  specialRequests?: string;
}

export interface CreateServiceRequestInput {
  bookingId: string;
  guestId: string;
  serviceType: ServiceRequest['serviceType'];
  subject: string;
  description: string;
  priority?: 'low' | 'normal' | 'high';
  scheduledTime?: Date;
}

export interface CreateFeedbackInput {
  bookingId: string;
  guestId: string;
  hotelId: string;
  rating: number;
  categories?: Feedback['categories'];
  comment?: string;
}

export interface CheckInInput {
  bookingId: string;
  guestId: string;
  idType: string;
  idNumber: string;
}

export interface CheckoutInput {
  bookingId: string;
  guestId: string;
  paymentMethod?: string;
}
