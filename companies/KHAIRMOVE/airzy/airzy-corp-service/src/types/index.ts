export interface TravelPolicy {
  id: string;
  companyId: string;
  name: string;
  description: string;
  rules: {
    maxFlightPrice: number;
    maxHotelPrice: number;
    allowedCabins: ('economy' | 'premium_economy' | 'business' | 'first')[];
    advanceBookingDays: number;
    requiresApproval: boolean;
    approvalThreshold: number;
    allowedExpenseCategories: string[];
  };
  active: boolean;
  createdAt: Date;
}

export interface Approval {
  id: string;
  userId: string;
  companyId: string;
  type: 'flight' | 'hotel' | 'transfer' | 'expense';
  amount: number;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  approverId?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
}

export interface Expense {
  id: string;
  userId: string;
  companyId: string;
  tripId?: string;
  category: string;
  amount: number;
  currency: string;
  description: string;
  receiptUrl?: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'reimbursed';
  submittedAt?: Date;
  reimbursedAt?: Date;
  createdAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  meta?: { requestId: string; timestamp: number };
}