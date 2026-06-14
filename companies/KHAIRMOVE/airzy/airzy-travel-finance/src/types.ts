/**
 * Travel Finance Types
 * BNPL, forex, insurance marketplace
 */

export interface BNPLApplication {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  purpose: 'flight' | 'hotel' | 'package' | 'visa' | 'other';
  destination?: string;
  tenure: number;  // months
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed';
  emiAmount?: number;
  interestRate?: number;
  processingFee?: number;
  approvedAt?: string;
  rejectedReason?: string;
  createdAt: string;
}

export interface BNPLOffer {
  id: string;
  userId: string;
  eligibility: {
    eligible: boolean;
    maxAmount: number;
    minAmount: number;
    maxTenure: number;
    interestRate: number;
    processingFee: number;
  };
  offers: {
    tenure: number;
    emiAmount: number;
    totalAmount: number;
    interestAmount: number;
  }[];
  validUntil: string;
}

export interface ForexCard {
  id: string;
  userId: string;
  currency: string;
  cardNumber: string;  // Last 4 digits
  balance: number;
  cardStatus: 'active' | 'blocked' | 'expired';
  issuedAt: string;
  expiresAt: string;
}

export interface ForexOrder {
  id: string;
  userId: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  rate: number;
  totalAmount: number;
  fee: number;
  deliveryMethod: 'card' | 'cash' | 'account';
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  deliveryAddress?: string;
  createdAt: string;
}

export interface TravelInsurance {
  id: string;
  provider: string;
  providerLogo?: string;
  name: string;
  type: 'medical' | 'flight' | 'trip' | 'comprehensive';
  coverage: {
    medicalExpenses: number;
    emergencyEvacuation: number;
    tripCancellation: number;
    baggageLoss: number;
    personalLiability: number;
    flightDelay: number;
  };
  price: {
    amount: number;
    currency: string;
    perDay?: boolean;
  };
  duration: {
    minDays: number;
    maxDays: number;
  };
  eligibility: string[];
  exclusions: string[];
  claimsProcess: string;
  destination: string[];  // Countries covered
}

export interface InsuranceQuote {
  id: string;
  userId: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  ages: number[];
  type: 'medical' | 'flight' | 'trip' | 'comprehensive';
  selectedPlan?: TravelInsurance;
  quotes: {
    plan: TravelInsurance;
    totalPrice: number;
  }[];
  createdAt: string;
}

export interface InsurancePurchase {
  id: string;
  userId: string;
  insuranceId: string;
  planName: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: {
    name: string;
    age: number;
    passportLast4?: string;
  }[];
  premium: number;
  policyNumber: string;
  coverage: TravelInsurance['coverage'];
  status: 'active' | 'expired' | 'claimed';
  claimId?: string;
  purchasedAt: string;
}

// Currency rates (mock - would come from live feed)
export const FOREX_RATES: Record<string, { rate: number; symbol: string; name: string }> = {
  'USD': { rate: 83.12, symbol: '$', name: 'US Dollar' },
  'EUR': { rate: 90.45, symbol: '€', name: 'Euro' },
  'GBP': { rate: 105.67, symbol: '£', name: 'British Pound' },
  'SGD': { rate: 61.89, symbol: 'S$', name: 'Singapore Dollar' },
  'AED': { rate: 22.64, symbol: 'د.إ', name: 'UAE Dirham' },
  'THB': { rate: 2.42, symbol: '฿', name: 'Thai Baht' },
  'MYR': { rate: 17.89, symbol: 'RM', name: 'Malaysian Ringgit' },
  'JPY': { rate: 0.56, symbol: '¥', name: 'Japanese Yen' },
  'AUD': { rate: 54.32, symbol: 'A$', name: 'Australian Dollar' },
  'CAD': { rate: 61.45, symbol: 'C$', name: 'Canadian Dollar' },
  'CHF': { rate: 93.78, symbol: 'CHF', name: 'Swiss Franc' },
  'LKR': { rate: 0.27, symbol: 'Rs', name: 'Sri Lankan Rupee' },
  'NPR': { rate: 0.62, symbol: 'Rs', name: 'Nepalese Rupee' },
  'BND': { rate: 61.89, symbol: 'B$', name: 'Brunei Dollar' },
};
