export interface Hotel {
  id: string;
  name: string;
  location: { address: string; city: string; country: string; lat: number; lng: number };
  rating: number;
  reviewCount: number;
  images: string[];
  amenities: string[];
  price: { amount: number; currency: string };
  roomTypes: RoomType[];
}

export interface RoomType {
  id: string;
  name: string;
  description: string;
  maxGuests: number;
  price: { amount: number; currency: string };
  amenities: string[];
  available: number;
}

export interface HotelBooking {
  id: string;
  confirmationCode: string;
  userId: string;
  hotel: { id: string; name: string };
  room: { id: string; name: string };
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: Date;
}

export interface RoomServiceOrder {
  id: string;
  bookingId: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'delivered';
  createdAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  meta?: { requestId: string; timestamp: number };
}