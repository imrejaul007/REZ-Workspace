import { MembershipTier } from '../models/Membership';

export const MembershipTierBenefits: Record<MembershipTier, string[]> = {
  [MembershipTier.BASIC]: [
    '5% discount on all services',
    'Birthday special offer',
    'Priority booking (subject to availability)',
  ],
  [MembershipTier.SILVER]: [
    '10% discount on all services',
    'Birthday special offer',
    'Priority booking',
    'Free hair wash with unknown haircut',
    'Early access to promotions',
  ],
  [MembershipTier.GOLD]: [
    '15% discount on all services',
    'Birthday special offer (20% off)',
    'Priority booking',
    'Free hair treatment (monthly)',
    'Complimentary beverages',
    'Early access to promotions',
    'Exclusive member events',
  ],
  [MembershipTier.PLATINUM]: [
    '20% discount on all services',
    'Birthday special offer (25% off)',
    'VIP priority booking',
    'Free premium hair treatment (bi-monthly)',
    'Complimentary beverages and snacks',
    'Early access to new services',
    'Exclusive member events',
    'Dedicated concierge service',
    'Free extensions/shampoo kit (quarterly)',
  ],
  [MembershipTier.VIP]: [
    '25% discount on all services',
    'Premium birthday package (30% off + free massage)',
    'VIP priority booking with guaranteed slots',
    'Unlimited premium hair treatments',
    'Premium lounge access',
    'Complimentary beverages, snacks, and champagne',
    'First access to new services and products',
    'Exclusive VIP member events',
    'Personal stylist consultation (monthly)',
    'Free premium product kit (monthly)',
    'Dedicated relationship manager',
  ],
};

export const MembershipTierFeatures: Record<MembershipTier, {
  maxFamilyMembers: number;
  maxVisitsPerMonth?: number;
  prepaidCardDiscount: number;
  advanceBookingDays: number;
}> = {
  [MembershipTier.BASIC]: {
    maxFamilyMembers: 0,
    prepaidCardDiscount: 0,
    advanceBookingDays: 3,
  },
  [MembershipTier.SILVER]: {
    maxFamilyMembers: 1,
    prepaidCardDiscount: 5,
    advanceBookingDays: 5,
  },
  [MembershipTier.GOLD]: {
    maxFamilyMembers: 2,
    prepaidCardDiscount: 10,
    advanceBookingDays: 7,
  },
  [MembershipTier.PLATINUM]: {
    maxFamilyMembers: 3,
    prepaidCardDiscount: 15,
    advanceBookingDays: 14,
  },
  [MembershipTier.VIP]: {
    maxFamilyMembers: 4,
    prepaidCardDiscount: 20,
    advanceBookingDays: 30,
  },
};
