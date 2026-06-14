export interface Franchise {
  id: string;
  name: string;
  code: string;
  brand: string;
  type: 'fast-food' | 'retail' | 'services' | 'hospitality' | 'other';
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  address: Address;
  location: GeoLocation;
  licenseNumber: string;
  licenseExpiry: string;
  franchiseStartDate: string;
  royaltyFee: number;
  marketingFee: number;
  status: 'active' | 'suspended' | 'terminated' | 'pending';
  locations: Location[];
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface Location {
  id: string;
  franchiseId: string;
  name: string;
  code: string;
  address: Address;
  location: GeoLocation;
  managerName: string;
  managerPhone: string;
  employees: number;
  openingHours: OperatingHours;
  status: 'open' | 'closed' | 'renovating';
  salesTarget: number;
  currentSales: number;
  createdAt: string;
}

export interface OperatingHours {
  monday: TimeSlot;
  tuesday: TimeSlot;
  wednesday: TimeSlot;
  thursday: TimeSlot;
  friday: TimeSlot;
  saturday: TimeSlot;
  sunday: TimeSlot;
}

export interface TimeSlot {
  open: string;
  close: string;
  isClosed: boolean;
}

export interface Performance {
  id: string;
  franchiseId: string;
  locationId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  startDate: string;
  endDate: string;
  revenue: number;
  target: number;
  achievement: number;
  transactions: number;
  avgTransactionValue: number;
  topProducts: { productId: string; name: string; quantity: number; revenue: number }[];
  customerCount: number;
  newCustomers: number;
  returningCustomers: number;
  createdAt: string;
}

export interface RoyaltyPayment {
  id: string;
  franchiseId: string;
  period: string;
  revenue: number;
  royaltyRate: number;
  royaltyAmount: number;
  marketingFee: number;
  totalDue: number;
  status: 'pending' | 'paid' | 'overdue';
  dueDate: string;
  paidDate?: string;
  createdAt: string;
}
