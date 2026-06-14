/**
 * CorpPerks Types
 * Shared TypeScript types for CorpPerks
 */

export interface CorpBenefit {
  id: string;
  name: string;
  type: 'meal' | 'travel' | 'wellness' | 'learning' | 'gift';
  description: string;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  validUntil?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CorpEmployee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  level: string;
  status: 'enrolled' | 'pending' | 'suspended';
  benefits: string[];
  enrolledAt: string;
}

export interface CorpBooking {
  id: string;
  bookingId: string;
  confirmationNumber: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  property: {
    name: string;
    address: string;
  };
  room: {
    name: string;
    bedType: string;
  };
  guest: {
    firstName: string;
    lastName: string;
    email: string;
  };
  dates: {
    checkIn: string;
    checkOut: string;
    nights: number;
  };
  pricing: {
    roomRate: number;
    totalAmount: number;
    currency: string;
  };
}

export interface CorpInvoice {
  invoiceNumber: string;
  invoiceDate: string;
  companyName: string;
  gstIn: string;
  amount: number;
  cgst: number;
  sgst: number;
  totalTax: number;
  grandTotal: number;
  itcEligible: boolean;
}

export interface CorpCampaign {
  id: string;
  name: string;
  type: 'gift' | 'karma' | 'reward';
  status: 'draft' | 'active' | 'paused' | 'completed';
  budget: number;
  spent: number;
  participants: number;
  startDate: string;
  endDate: string;
}

export interface CorpReward {
  balance: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  transactions: Array<{
    id: string;
    type: 'earn' | 'redeem';
    amount: number;
    source: string;
    description: string;
    createdAt: string;
  }>;
}

export interface CorpIntegration {
  provider: string;
  connected: boolean;
  lastSync?: string;
  healthy?: boolean;
  issues?: string[];
}
