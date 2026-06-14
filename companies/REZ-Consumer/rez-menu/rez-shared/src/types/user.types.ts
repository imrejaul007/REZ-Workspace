/**
 * Canonical User types for the REZ platform.
 *
 * Source of truth: rezbackend/src/models/User.ts
 * Do NOT redefine these types in frontend apps — import from @rez/shared instead.
 */

// ── Profile ──────────────────────────────────────────────────────────────────

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  dateOfBirth?: string;           // ISO date string
  gender?: 'male' | 'female' | 'other';
  location?: {
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    coordinates?: [number, number]; // [longitude, latitude]
  };
}

// ── Preferences ──────────────────────────────────────────────────────────────

export interface UserPreferences {
  language?: string;
  theme?: 'light' | 'dark';
  notifications?: {
    push?: boolean;
    email?: boolean;
    sms?: boolean;
  };
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface UserAuth {
  isVerified: boolean;
  isOnboarded?: boolean;
  lastLogin?: string;   // ISO date string
}

// ── Wallet ────────────────────────────────────────────────────────────────────

export interface UserWallet {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  pendingAmount: number;
}

// ── Role ─────────────────────────────────────────────────────────────────────

export type UserRole =
  | 'user'
  | 'admin'
  | 'merchant'
  | 'support'
  | 'operator'
  | 'super_admin';

export const USER_ROLES: readonly UserRole[] = [
  'user',
  'admin',
  'merchant',
  'support',
  'operator',
  'super_admin',
] as const;

// ── Tier / Zone ───────────────────────────────────────────────────────────────

export type RezPlusTier = 'free' | 'premium' | 'vip';
/** @deprecated use RezPlusTier */
export type NuqtaPlusTier = RezPlusTier;
export type PriveTier = 'none' | 'entry' | 'signature' | 'elite';

// ── Main User type ────────────────────────────────────────────────────────────

export interface User {
  _id: string;
  phoneNumber: string;
  email?: string;
  profile: UserProfile;
  preferences?: UserPreferences;
  wallet?: UserWallet;
  auth: UserAuth;
  role: UserRole;
  isActive: boolean;
  isSuspended?: boolean;

  // Convenience / denormalized fields
  walletBalance?: number;       // Direct access to wallet.balance
  referralCode?: string;
  fullName?: string;            // Computed: profile.firstName + profile.lastName
  username?: string;
  isPremium?: boolean;
  rezPlusTier?: RezPlusTier;
  /** @deprecated use rezPlusTier */
  nuqtaPlusTier?: NuqtaPlusTier;
  priveTier?: PriveTier;
  activeZones?: string[];

  createdAt: string;
  updatedAt: string;
}

// ── Type guards ───────────────────────────────────────────────────────────────

export function isUserRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value);
}
