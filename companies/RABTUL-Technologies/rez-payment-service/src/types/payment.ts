export type PaymentStatus =
  | 'pending'
  | 'created'
  | 'attempted'
  | 'captured'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'
  | 'expired'
  | 'timeout'
  | 'error';

export interface PaymentRecord {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  coinsCredited: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface CreatePaymentRequest {
  userId: string;
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface CreatePaymentResponse {
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
}

export interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface WebhookPayload {
  event: string;
  payload: {
    payment: {
      entity: {
        id: string;
        order_id: string;
        amount: number;
        currency: string;
        status: string;
        method: string;
        card_id?: string;
        bank?: string;
        wallet?: string;
        vpa?: string;
        email?: string;
        contact?: string;
        error_code?: string;
        error_description?: string;
        created_at: number;
      };
    };
  };
}

export interface PollingPaymentData {
  paymentId: string;
  razorpayOrderId: string;
  amount: number;
  userId: string;
  startedAt: number;
}
