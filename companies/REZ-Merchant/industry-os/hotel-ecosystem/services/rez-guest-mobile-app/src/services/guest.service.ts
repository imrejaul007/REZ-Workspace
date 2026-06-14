export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface GuestProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  nationality?: string;
  preferences: {
    roomType?: string;
    floor?: number;
    smoking?: boolean;
    dietaryRestrictions?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyStatus {
  guestId: string;
  tier: LoyaltyTier;
  points: number;
  lifetimePoints: number;
  pointsToNextTier: number;
  memberSince: string;
  benefits: string[];
  progress: number; // 0-100 percentage to next tier
}

export interface StayHistory {
  id: string;
  guestId: string;
  hotelId: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  totalSpent: number;
  pointsEarned: number;
}

export interface Notification {
  id: string;
  guestId: string;
  type: 'checkin' | 'checkout' | 'promotion' | 'service' | 'reminder';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// In-memory data stores
const guestProfiles: Map<string, GuestProfile> = new Map();
const loyaltyStatuses: Map<string, LoyaltyStatus> = new Map();
const stayHistory: Map<string, StayHistory[]> = new Map();
const notifications: Map<string, Notification[]> = new Map();

// Tier thresholds
const TIER_THRESHOLDS = {
  bronze: { min: 0, max: 9999 },
  silver: { min: 10000, max: 24999 },
  gold: { min: 25000, max: 49999 },
  platinum: { min: 50000, max: Infinity },
};

const TIER_BENEFITS = {
  bronze: ['Welcome drink', 'Late checkout (2 PM)'],
  silver: ['Welcome drink', 'Late checkout (3 PM)', 'Room upgrade (subject to availability)'],
  gold: ['Welcome amenity', 'Late checkout (4 PM)', 'Room upgrade (priority)', 'Free breakfast'],
  platinum: ['All Gold benefits', 'Airport transfer', 'Spa credit (₹2000)', 'Suite upgrade (guaranteed)'],
};

function getTierFromPoints(points: number): LoyaltyTier {
  if (points >= 50000) return 'platinum';
  if (points >= 25000) return 'gold';
  if (points >= 10000) return 'silver';
  return 'bronze';
}

function calculateProgress(points: number, tier: LoyaltyTier): number {
  const thresholds = TIER_THRESHOLDS[tier];
  if (tier === 'platinum') return 100;
  const range = thresholds.max - thresholds.min;
  const progress = points - thresholds.min;
  return Math.round((progress / range) * 100);
}

function getPointsToNextTier(points: number, tier: LoyaltyTier): number {
  if (tier === 'platinum') return 0;
  const nextTier = tier === 'bronze' ? 'silver' : tier === 'silver' ? 'gold' : 'platinum';
  return TIER_THRESHOLDS[nextTier].min - points;
}

export function createGuest(profile: Omit<GuestProfile, 'id' | 'createdAt' | 'updatedAt'>): GuestProfile {
  const id = `guest-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const now = new Date().toISOString();

  const guest: GuestProfile = {
    ...profile,
    id,
    createdAt: now,
    updatedAt: now,
  };

  guestProfiles.set(id, guest);

  // Initialize loyalty status
  const loyalty: LoyaltyStatus = {
    guestId: id,
    tier: 'bronze',
    points: 0,
    lifetimePoints: 0,
    pointsToNextTier: 10000,
    memberSince: now,
    benefits: TIER_BENEFITS.bronze,
    progress: 0,
  };
  loyaltyStatuses.set(id, loyalty);

  return guest;
}

export function getGuestById(id: string): GuestProfile | undefined {
  return guestProfiles.get(id);
}

export function updateGuest(id: string, updates: Partial<GuestProfile>): GuestProfile | undefined {
  const guest = guestProfiles.get(id);
  if (!guest) return undefined;

  const updated = {
    ...guest,
    ...updates,
    id: guest.id,
    createdAt: guest.createdAt,
    updatedAt: new Date().toISOString(),
  };

  guestProfiles.set(id, updated);
  return updated;
}

export function getLoyaltyStatus(guestId: string): LoyaltyStatus | undefined {
  return loyaltyStatuses.get(guestId);
}

export function addPoints(guestId: string, points: number, stayId?: string): LoyaltyStatus | undefined {
  const loyalty = loyaltyStatuses.get(guestId);
  if (!loyalty) return undefined;

  loyalty.points += points;
  loyalty.lifetimePoints += points;

  const newTier = getTierFromPoints(loyalty.lifetimePoints);
  if (newTier !== loyalty.tier) {
    loyalty.tier = newTier;
    loyalty.benefits = TIER_BENEFITS[newTier];
  }

  loyalty.pointsToNextTier = getPointsToNextTier(loyalty.lifetimePoints, loyalty.tier);
  loyalty.progress = calculateProgress(loyalty.lifetimePoints, loyalty.tier);

  loyaltyStatuses.set(guestId, loyalty);

  // Add stay to history if provided
  if (stayId) {
    const history = stayHistory.get(guestId) || [];
    const stay = history.find((s) => s.id === stayId);
    if (stay) {
      stay.pointsEarned = points;
    }
    stayHistory.set(guestId, history);
  }

  return loyalty;
}

export function redeemPoints(guestId: string, points: number): boolean {
  const loyalty = loyaltyStatuses.get(guestId);
  if (!loyalty || loyalty.points < points) return false;

  loyalty.points -= points;
  loyaltyStatuses.set(guestId, loyalty);
  return true;
}

export function addStay(guestId: string, stay: Omit<StayHistory, 'id' | 'guestId' | 'pointsEarned'>): StayHistory {
  const id = `stay-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const fullStay: StayHistory = {
    ...stay,
    id,
    guestId,
    pointsEarned: 0,
  };

  const existing = stayHistory.get(guestId) || [];
  existing.push(fullStay);
  stayHistory.set(guestId, existing);

  // Auto-add loyalty points (1 point per 100 rupees spent)
  const points = Math.floor(stay.totalSpent / 100);
  addPoints(guestId, points, id);

  return fullStay;
}

export function getStayHistory(guestId: string): StayHistory[] {
  return stayHistory.get(guestId) || [];
}

export function sendNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Notification {
  const id = `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const fullNotification: Notification = {
    ...notification,
    id,
    read: false,
    createdAt: new Date().toISOString(),
  };

  const existing = notifications.get(notification.guestId) || [];
  existing.unshift(fullNotification);
  notifications.set(notification.guestId, existing);

  return fullNotification;
}

export function getNotifications(guestId: string, unreadOnly: boolean = false): Notification[] {
  const all = notifications.get(guestId) || [];
  return unreadOnly ? all.filter((n) => !n.read) : all;
}

export function markNotificationRead(guestId: string, notificationId: string): boolean {
  const all = notifications.get(guestId) || [];
  const notification = all.find((n) => n.id === notificationId);
  if (!notification) return false;

  notification.read = true;
  notifications.set(guestId, all);
  return true;
}

export function getAllGuests(): GuestProfile[] {
  return Array.from(guestProfiles.values());
}
