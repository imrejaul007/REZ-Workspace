export interface Transfer {
  id: string;
  type: 'sedan' | 'suv' | 'minivan' | 'luxury';
  name: string;
  description: string;
  maxPassengers: number;
  maxLuggage: number;
  price: { amount: number; currency: string; perTrip: boolean };
  amenities: string[];
}

export interface TransferBooking {
  id: string;
  confirmationCode: string;
  userId: string;
  transferType: string;
  pickup: { location: string; address: string; time: string; flightNumber?: string };
  dropoff: { location: string; address: string };
  driver?: { name: string; phone: string; vehicleNumber: string };
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  totalAmount: number;
  currency: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  meta?: { requestId: string; timestamp: number };
}