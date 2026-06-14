/**
 * Loyalty Service for REZ Merchant App
 * Handles loyalty programs, points, punch cards, and tiers
 */

const BASE_URL = 'https://rez-karma-service.onrender.com';

// ============================================
// TypeScript Interfaces
// ============================================

export interface LoyaltySettings {
  id: string;
  merchantId: string;
  isEnabled: boolean;
  pointsPerDollar: number;
  pointsToDollarRatio: number;
  minimumPointsToRedeem: number;
  pointsExpirationDays: number | null;
  earnPointsOnDiscountedItems: boolean;
  doublePointsOnSpecialDays: string[] | null;
  welcomePoints: number;
  referralPoints: number;
  birthdayBonusPoints: number;
  tierEnabled: boolean;
  punchCardEnabled: boolean;
  maxPunchCardsPerCustomer: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateLoyaltySettings {
  pointsPerDollar?: number;
  pointsToDollarRatio?: number;
  minimumPointsToRedeem?: number;
  pointsExpirationDays?: number | null;
  earnPointsOnDiscountedItems?: boolean;
  doublePointsOnSpecialDays?: string[] | null;
  welcomePoints?: number;
  referralPoints?: number;
  birthdayBonusPoints?: number;
  tierEnabled?: boolean;
  punchCardEnabled?: boolean;
  maxPunchCardsPerCustomer?: number;
}

export interface LoyaltyMember {
  id: string;
  merchantId: string;
  customerId: string;
  phone: string;
  email?: string;
  name: string;
  totalPoints: number;
  lifetimePoints: number;
  availablePoints: number;
  tierId?: string;
  tierName?: string;
  tierColor?: string;
  joinDate: string;
  lastVisit?: string;
  visitCount: number;
  totalSpent: number;
  birthday?: string;
  referralCode?: string;
  referredBy?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MemberFilters {
  search?: string;
  tierId?: string;
  isActive?: boolean;
  minPoints?: number;
  maxPoints?: number;
  joinedAfter?: string;
  joinedBefore?: string;
  sortBy?: 'name' | 'totalPoints' | 'lifetimePoints' | 'joinDate' | 'lastVisit' | 'visitCount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreateMember {
  merchantId: string;
  customerId: string;
  phone: string;
  email?: string;
  name: string;
  birthday?: string;
  referralCode?: string;
  referredBy?: string;
  notes?: string;
  welcomePoints?: boolean;
}

export interface UpdateMember {
  name?: string;
  email?: string;
  birthday?: string;
  notes?: string;
  tierId?: string;
}

export interface PointsTransaction {
  id: string;
  memberId: string;
  type: 'earn' | 'redeem' | 'adjust' | 'expire' | 'transfer';
  points: number;
  balanceAfter: number;
  description: string;
  orderId?: string;
  orderTotal?: number;
  referenceId?: string;
  expiresAt?: string;
  isExpired: boolean;
  adjustedBy?: string;
  adjustmentReason?: string;
  createdAt: string;
}

export interface EarnPoints {
  orderId: string;
  orderTotal: number;
  pointsToEarn?: number;
  description?: string;
  doublePointsEligible?: boolean;
}

export interface RedeemPoints {
  points: number;
  description: string;
  orderId?: string;
  referenceId?: string;
}

export interface AdjustPoints {
  points: number;
  reason: string;
  adjustedBy: string;
}

export interface PunchCard {
  id: string;
  merchantId: string;
  name: string;
  description?: string;
  requiredPunches: number;
  punchesRequired: number;
  rewardDescription: string;
  rewardValue: number;
  validForDays: number | null;
  categories?: string[];
  isActive: boolean;
  totalIssued: number;
  totalRedeemed: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePunchCard {
  name: string;
  description?: string;
  requiredPunches: number;
  rewardDescription: string;
  rewardValue: number;
  validForDays?: number | null;
  categories?: string[];
}

export interface PunchCardPunch {
  id: string;
  punchCardId: string;
  customerId: string;
  punchNumber: number;
  totalPunches: number;
  isComplete: boolean;
  isRedeemed: boolean;
  punchedAt: string;
}

export interface Tier {
  id: string;
  merchantId: string;
  name: string;
  color: string;
  icon?: string;
  minimumPoints: number;
  minimumLifetimePoints: number;
  pointsMultiplier: number;
  benefits: string[];
  discountPercentage: number;
  freeItemThreshold?: number;
  birthdayBonus: number;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTier {
  name: string;
  color: string;
  icon?: string;
  minimumPoints: number;
  minimumLifetimePoints: number;
  pointsMultiplier: number;
  benefits: string[];
  discountPercentage: number;
  freeItemThreshold?: number;
  birthdayBonus: number;
  priority: number;
}

export interface UpdateTier extends Partial<CreateTier> {
  isActive?: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ============================================
// Mock Data for Fallback
// ============================================

const MOCK_SETTINGS: LoyaltySettings = {
  id: 'settings-001',
  merchantId: 'merchant-001',
  isEnabled: true,
  pointsPerDollar: 1,
  pointsToDollarRatio: 100,
  minimumPointsToRedeem: 500,
  pointsExpirationDays: 365,
  earnPointsOnDiscountedItems: true,
  doublePointsOnSpecialDays: ['2026-12-25', '2026-01-01'],
  welcomePoints: 100,
  referralPoints: 200,
  birthdayBonusPoints: 50,
  tierEnabled: true,
  punchCardEnabled: true,
  maxPunchCardsPerCustomer: 5,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const MOCK_MEMBERS: LoyaltyMember[] = [
  {
    id: 'member-001',
    merchantId: 'merchant-001',
    customerId: 'customer-001',
    phone: '+1234567890',
    email: 'john@example.com',
    name: 'John Doe',
    totalPoints: 1500,
    lifetimePoints: 5000,
    availablePoints: 1200,
    tierId: 'tier-002',
    tierName: 'Silver',
    tierColor: '#C0C0C0',
    joinDate: '2024-01-15T10:00:00Z',
    lastVisit: '2025-12-20T14:30:00Z',
    visitCount: 45,
    totalSpent: 2500.00,
    birthday: '1990-05-15',
    referralCode: 'JOHN2024',
    notes: 'VIP customer, prefers window seating',
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2025-12-20T14:30:00Z',
  },
  {
    id: 'member-002',
    merchantId: 'merchant-001',
    customerId: 'customer-002',
    phone: '+1987654321',
    email: 'jane@example.com',
    name: 'Jane Smith',
    totalPoints: 3500,
    lifetimePoints: 12000,
    availablePoints: 2800,
    tierId: 'tier-003',
    tierName: 'Gold',
    tierColor: '#FFD700',
    joinDate: '2023-06-20T09:00:00Z',
    lastVisit: '2025-12-22T18:45:00Z',
    visitCount: 120,
    totalSpent: 8500.00,
    birthday: '1985-08-22',
    referralCode: 'JANE2023',
    notes: 'Regular lunch customer',
    isActive: true,
    createdAt: '2023-06-20T09:00:00Z',
    updatedAt: '2025-12-22T18:45:00Z',
  },
  {
    id: 'member-003',
    merchantId: 'merchant-001',
    customerId: 'customer-003',
    phone: '+1555123456',
    name: 'Bob Wilson',
    totalPoints: 200,
    lifetimePoints: 200,
    availablePoints: 200,
    joinDate: '2025-11-01T12:00:00Z',
    visitCount: 3,
    totalSpent: 120.00,
    isActive: true,
    createdAt: '2025-11-01T12:00:00Z',
    updatedAt: '2025-11-01T12:00:00Z',
  },
];

const MOCK_PUNCH_CARDS: PunchCard[] = [
  {
    id: 'punch-001',
    merchantId: 'merchant-001',
    name: 'Buy 9 Get 1 Free Coffee',
    description: 'Every 10th coffee is on us!',
    requiredPunches: 10,
    punchesRequired: 10,
    rewardDescription: 'Free Regular Coffee',
    rewardValue: 4.99,
    validForDays: 90,
    isActive: true,
    totalIssued: 156,
    totalRedeemed: 42,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'punch-002',
    merchantId: 'merchant-001',
    name: 'Pizza Lover',
    description: 'Collect stamps for free pizza',
    requiredPunches: 8,
    punchesRequired: 8,
    rewardDescription: 'Free 12" Pizza',
    rewardValue: 14.99,
    validForDays: 60,
    isActive: true,
    totalIssued: 89,
    totalRedeemed: 15,
    createdAt: '2024-02-15T00:00:00Z',
    updatedAt: '2024-02-15T00:00:00Z',
  },
];

const MOCK_TIERS: Tier[] = [
  {
    id: 'tier-001',
    merchantId: 'merchant-001',
    name: 'Bronze',
    color: '#CD7F32',
    minimumPoints: 0,
    minimumLifetimePoints: 0,
    pointsMultiplier: 1.0,
    benefits: ['Earn 1 point per $1', 'Birthday reward'],
    discountPercentage: 0,
    birthdayBonus: 25,
    priority: 1,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tier-002',
    merchantId: 'merchant-001',
    name: 'Silver',
    color: '#C0C0C0',
    minimumPoints: 500,
    minimumLifetimePoints: 1000,
    pointsMultiplier: 1.25,
    benefits: ['Earn 1.25 points per $1', 'Birthday reward', 'Priority support'],
    discountPercentage: 5,
    birthdayBonus: 50,
    priority: 2,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tier-003',
    merchantId: 'merchant-001',
    name: 'Gold',
    color: '#FFD700',
    minimumPoints: 2000,
    minimumLifetimePoints: 5000,
    pointsMultiplier: 1.5,
    benefits: ['Earn 1.5 points per $1', 'Birthday reward', 'Priority support', 'Free drink monthly'],
    discountPercentage: 10,
    freeItemThreshold: 100,
    birthdayBonus: 100,
    priority: 3,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tier-004',
    merchantId: 'merchant-001',
    name: 'Platinum',
    color: '#E5E4E2',
    minimumPoints: 5000,
    minimumLifetimePoints: 15000,
    pointsMultiplier: 2.0,
    benefits: ['Earn 2x points per $1', 'Birthday reward', 'VIP support', 'Free item monthly', 'Exclusive events'],
    discountPercentage: 15,
    freeItemThreshold: 50,
    birthdayBonus: 200,
    priority: 4,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const MOCK_TRANSACTIONS: PointsTransaction[] = [
  {
    id: 'txn-001',
    memberId: 'member-001',
    type: 'earn',
    points: 250,
    balanceAfter: 1500,
    description: 'Purchase #1234',
    orderId: 'order-1234',
    orderTotal: 250.00,
    isExpired: false,
    createdAt: '2025-12-20T14:30:00Z',
  },
  {
    id: 'txn-002',
    memberId: 'member-001',
    type: 'redeem',
    points: -300,
    balanceAfter: 1200,
    description: 'Redeemed for $3 discount',
    orderId: 'order-1235',
    referenceId: 'ref-001',
    isExpired: false,
    createdAt: '2025-12-18T10:15:00Z',
  },
  {
    id: 'txn-003',
    memberId: 'member-001',
    type: 'earn',
    points: 100,
    balanceAfter: 1500,
    description: 'Welcome bonus',
    isExpired: false,
    createdAt: '2024-01-15T10:00:00Z',
  },
];

// ============================================
// Utility Functions
// ============================================

/** FIX (security): Replaced Math.random() with crypto.randomUUID() for secure ID generation */
const generateSecureUUID = (): string => {
  if (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }
  // Node.js fallback
  try {
    const { randomUUID } = require('crypto');
    return randomUUID();
  } catch {
    // Legacy fallback (only for environments without crypto)
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
  }
};

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${generateSecureUUID().replace(/-/g, '').substring(0, 9)}`;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  retries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error as Error;

      if (attempt < retries) {
        await delay(delayMs * Math.pow(2, attempt));
        continue;
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
}

// ============================================
// Loyalty Service Class
// ============================================

class LoyaltyService {
  private baseUrl: string;
  private useMockData: boolean = false;

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  enableMockData(): void {
    this.useMockData = true;
  }

  disableMockData(): void {
    this.useMockData = false;
  }

  // ============================================
  // Settings Methods
  // ============================================

  async getLoyaltySettings(merchantId: string): Promise<LoyaltySettings> {
    if (this.useMockData) {
      return { ...MOCK_SETTINGS, merchantId };
    }

    try {
      return await fetchWithRetry<LoyaltySettings>(
        `${this.baseUrl}/api/loyalty/settings/${merchantId}`
      );
    } catch (error) {
      console.warn('Failed to fetch loyalty settings, using mock data:', error);
      this.useMockData = true;
      return { ...MOCK_SETTINGS, merchantId };
    }
  }

  async updateLoyaltySettings(
    id: string,
    data: UpdateLoyaltySettings
  ): Promise<LoyaltySettings> {
    if (this.useMockData) {
      const updated = { ...MOCK_SETTINGS, ...data, updatedAt: new Date().toISOString() };
      return updated;
    }

    try {
      return await fetchWithRetry<LoyaltySettings>(
        `${this.baseUrl}/api/loyalty/settings/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      );
    } catch (error) {
      console.warn('Failed to update loyalty settings, using mock data:', error);
      this.useMockData = true;
      return { ...MOCK_SETTINGS, ...data, updatedAt: new Date().toISOString() };
    }
  }

  async enableLoyalty(merchantId: string): Promise<void> {
    if (this.useMockData) {
      return;
    }

    try {
      await fetchWithRetry<void>(
        `${this.baseUrl}/api/loyalty/settings/${merchantId}/enable`,
        { method: 'POST' }
      );
    } catch (error) {
      console.warn('Failed to enable loyalty:', error);
      this.useMockData = true;
    }
  }

  async disableLoyalty(merchantId: string): Promise<void> {
    if (this.useMockData) {
      return;
    }

    try {
      await fetchWithRetry<void>(
        `${this.baseUrl}/api/loyalty/settings/${merchantId}/disable`,
        { method: 'POST' }
      );
    } catch (error) {
      console.warn('Failed to disable loyalty:', error);
      this.useMockData = true;
    }
  }

  // ============================================
  // Member Methods
  // ============================================

  async getLoyaltyMembers(
    merchantId: string,
    filters?: MemberFilters
  ): Promise<LoyaltyMember[]> {
    if (this.useMockData) {
      let members = MOCK_MEMBERS.filter(m => m.merchantId === merchantId || m.merchantId === 'merchant-001');

      if (filters) {
        if (filters.search) {
          const search = filters.search.toLowerCase();
          members = members.filter(
            m =>
              m.name.toLowerCase().includes(search) ||
              m.phone.includes(search) ||
              m.email?.toLowerCase().includes(search)
          );
        }

        if (filters.tierId) {
          members = members.filter(m => m.tierId === filters.tierId);
        }

        if (filters.isActive !== undefined) {
          members = members.filter(m => m.isActive === filters.isActive);
        }

        if (filters.minPoints !== undefined) {
          members = members.filter(m => m.totalPoints >= filters.minPoints!);
        }

        if (filters.maxPoints !== undefined) {
          members = members.filter(m => m.totalPoints <= filters.maxPoints!);
        }

        if (filters.sortBy) {
          const sortKey = filters.sortBy;
          const sortOrder = filters.sortOrder === 'desc' ? -1 : 1;
          members.sort((a, b) => {
            const aVal = a[sortKey as keyof LoyaltyMember];
            const bVal = b[sortKey as keyof LoyaltyMember];
            if (aVal === undefined || bVal === undefined) return 0;
            if (aVal < bVal) return -1 * sortOrder;
            if (aVal > bVal) return 1 * sortOrder;
            return 0;
          });
        }

        if (filters.page && filters.limit) {
          const start = (filters.page - 1) * filters.limit;
          members = members.slice(start, start + filters.limit);
        }
      }

      return members;
    }

    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, String(value));
          }
        });
      }

      const url = `${this.baseUrl}/api/loyalty/members/${merchantId}${queryParams.toString() ? `?${queryParams}` : ''}`;
      return await fetchWithRetry<LoyaltyMember[]>(url);
    } catch (error) {
      console.warn('Failed to fetch loyalty members, using mock data:', error);
      this.useMockData = true;
      return MOCK_MEMBERS.filter(m => m.merchantId === merchantId || m.merchantId === 'merchant-001');
    }
  }

  async getMemberById(id: string): Promise<LoyaltyMember> {
    if (this.useMockData) {
      const member = MOCK_MEMBERS.find(m => m.id === id);
      if (!member) {
        throw new Error(`Member not found: ${id}`);
      }
      return member;
    }

    try {
      return await fetchWithRetry<LoyaltyMember>(
        `${this.baseUrl}/api/loyalty/members/id/${id}`
      );
    } catch (error) {
      console.warn('Failed to fetch member by id, using mock data:', error);
      this.useMockData = true;
      const member = MOCK_MEMBERS.find(m => m.id === id);
      if (!member) {
        throw new Error(`Member not found: ${id}`);
      }
      return member;
    }
  }

  async getMemberByPhone(phone: string): Promise<LoyaltyMember> {
    if (this.useMockData) {
      const member = MOCK_MEMBERS.find(m => m.phone === phone);
      if (!member) {
        throw new Error(`Member not found with phone: ${phone}`);
      }
      return member;
    }

    try {
      return await fetchWithRetry<LoyaltyMember>(
        `${this.baseUrl}/api/loyalty/members/phone/${encodeURIComponent(phone)}`
      );
    } catch (error) {
      console.warn('Failed to fetch member by phone, using mock data:', error);
      this.useMockData = true;
      const member = MOCK_MEMBERS.find(m => m.phone === phone);
      if (!member) {
        throw new Error(`Member not found with phone: ${phone}`);
      }
      return member;
    }
  }

  async createMember(data: CreateMember): Promise<LoyaltyMember> {
    if (this.useMockData) {
      const newMember: LoyaltyMember = {
        id: generateId('member'),
        merchantId: data.merchantId,
        customerId: data.customerId,
        phone: data.phone,
        email: data.email,
        name: data.name,
        totalPoints: data.welcomePoints ? MOCK_SETTINGS.welcomePoints : 0,
        lifetimePoints: data.welcomePoints ? MOCK_SETTINGS.welcomePoints : 0,
        availablePoints: data.welcomePoints ? MOCK_SETTINGS.welcomePoints : 0,
        tierId: MOCK_TIERS[0].id,
        tierName: MOCK_TIERS[0].name,
        tierColor: MOCK_TIERS[0].color,
        joinDate: new Date().toISOString(),
        visitCount: 0,
        totalSpent: 0,
        birthday: data.birthday,
        referralCode: data.referralCode || generateId('ref').toUpperCase(),
        referredBy: data.referredBy,
        notes: data.notes,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      MOCK_MEMBERS.push(newMember);
      return newMember;
    }

    try {
      return await fetchWithRetry<LoyaltyMember>(
        `${this.baseUrl}/api/loyalty/members`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
    } catch (error) {
      console.warn('Failed to create member, using mock data:', error);
      this.useMockData = true;
      const newMember: LoyaltyMember = {
        id: generateId('member'),
        merchantId: data.merchantId,
        customerId: data.customerId,
        phone: data.phone,
        email: data.email,
        name: data.name,
        totalPoints: data.welcomePoints ? MOCK_SETTINGS.welcomePoints : 0,
        lifetimePoints: data.welcomePoints ? MOCK_SETTINGS.welcomePoints : 0,
        availablePoints: data.welcomePoints ? MOCK_SETTINGS.welcomePoints : 0,
        tierId: MOCK_TIERS[0].id,
        tierName: MOCK_TIERS[0].name,
        tierColor: MOCK_TIERS[0].color,
        joinDate: new Date().toISOString(),
        visitCount: 0,
        totalSpent: 0,
        birthday: data.birthday,
        referralCode: data.referralCode || generateId('ref').toUpperCase(),
        referredBy: data.referredBy,
        notes: data.notes,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      MOCK_MEMBERS.push(newMember);
      return newMember;
    }
  }

  async updateMember(id: string, data: UpdateMember): Promise<LoyaltyMember> {
    if (this.useMockData) {
      const index = MOCK_MEMBERS.findIndex(m => m.id === id);
      if (index === -1) {
        throw new Error(`Member not found: ${id}`);
      }
      const updated = {
        ...MOCK_MEMBERS[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      if (data.tierId) {
        const tier = MOCK_TIERS.find(t => t.id === data.tierId);
        if (tier) {
          updated.tierName = tier.name;
          updated.tierColor = tier.color;
        }
      }
      MOCK_MEMBERS[index] = updated;
      return updated;
    }

    try {
      return await fetchWithRetry<LoyaltyMember>(
        `${this.baseUrl}/api/loyalty/members/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      );
    } catch (error) {
      console.warn('Failed to update member, using mock data:', error);
      this.useMockData = true;
      const index = MOCK_MEMBERS.findIndex(m => m.id === id);
      if (index === -1) {
        throw new Error(`Member not found: ${id}`);
      }
      const updated = {
        ...MOCK_MEMBERS[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      if (data.tierId) {
        const tier = MOCK_TIERS.find(t => t.id === data.tierId);
        if (tier) {
          updated.tierName = tier.name;
          updated.tierColor = tier.color;
        }
      }
      MOCK_MEMBERS[index] = updated;
      return updated;
    }
  }

  async deleteMember(id: string): Promise<void> {
    if (this.useMockData) {
      const index = MOCK_MEMBERS.findIndex(m => m.id === id);
      if (index === -1) {
        throw new Error(`Member not found: ${id}`);
      }
      MOCK_MEMBERS[index].isActive = false;
      MOCK_MEMBERS[index].updatedAt = new Date().toISOString();
      return;
    }

    try {
      await fetchWithRetry<void>(
        `${this.baseUrl}/api/loyalty/members/${id}`,
        { method: 'DELETE' }
      );
    } catch (error) {
      console.warn('Failed to delete member:', error);
      this.useMockData = true;
      const index = MOCK_MEMBERS.findIndex(m => m.id === id);
      if (index !== -1) {
        MOCK_MEMBERS[index].isActive = false;
        MOCK_MEMBERS[index].updatedAt = new Date().toISOString();
      }
    }
  }

  // ============================================
  // Points Methods
  // ============================================

  async earnPoints(memberId: string, data: EarnPoints): Promise<PointsTransaction> {
    if (this.useMockData) {
      const member = MOCK_MEMBERS.find(m => m.id === memberId);
      if (!member) {
        throw new Error(`Member not found: ${memberId}`);
      }

      let pointsEarned = data.pointsToEarn;
      if (!pointsEarned) {
        pointsEarned = Math.floor(data.orderTotal * MOCK_SETTINGS.pointsPerDollar);

        if (member.tierId) {
          const tier = MOCK_TIERS.find(t => t.id === member.tierId);
          if (tier) {
            pointsEarned = Math.floor(pointsEarned * tier.pointsMultiplier);
          }
        }
      }

      const transaction: PointsTransaction = {
        id: generateId('txn'),
        memberId,
        type: 'earn',
        points: pointsEarned,
        balanceAfter: member.totalPoints + pointsEarned,
        description: data.description || `Purchase #${data.orderId}`,
        orderId: data.orderId,
        orderTotal: data.orderTotal,
        isExpired: false,
        createdAt: new Date().toISOString(),
      };

      member.totalPoints += pointsEarned;
      member.availablePoints += pointsEarned;
      member.lifetimePoints += pointsEarned;
      member.lastVisit = new Date().toISOString();
      member.visitCount += 1;
      member.totalSpent += data.orderTotal;
      member.updatedAt = new Date().toISOString();

      return transaction;
    }

    try {
      return await fetchWithRetry<PointsTransaction>(
        `${this.baseUrl}/api/loyalty/points/earn/${memberId}`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
    } catch (error) {
      console.warn('Failed to earn points, using mock data:', error);
      this.useMockData = true;

      const member = MOCK_MEMBERS.find(m => m.id === memberId);
      if (!member) {
        throw new Error(`Member not found: ${memberId}`);
      }

      let pointsEarned = data.pointsToEarn || Math.floor(data.orderTotal * MOCK_SETTINGS.pointsPerDollar);
      const transaction: PointsTransaction = {
        id: generateId('txn'),
        memberId,
        type: 'earn',
        points: pointsEarned,
        balanceAfter: member.totalPoints + pointsEarned,
        description: data.description || `Purchase #${data.orderId}`,
        orderId: data.orderId,
        orderTotal: data.orderTotal,
        isExpired: false,
        createdAt: new Date().toISOString(),
      };

      member.totalPoints += pointsEarned;
      member.availablePoints += pointsEarned;
      member.lifetimePoints += pointsEarned;

      return transaction;
    }
  }

  async redeemPoints(memberId: string, data: RedeemPoints): Promise<PointsTransaction> {
    if (this.useMockData) {
      const member = MOCK_MEMBERS.find(m => m.id === memberId);
      if (!member) {
        throw new Error(`Member not found: ${memberId}`);
      }

      if (member.availablePoints < data.points) {
        throw new Error(`Insufficient points. Available: ${member.availablePoints}, Required: ${data.points}`);
      }

      const transaction: PointsTransaction = {
        id: generateId('txn'),
        memberId,
        type: 'redeem',
        points: -data.points,
        balanceAfter: member.availablePoints - data.points,
        description: data.description,
        orderId: data.orderId,
        referenceId: data.referenceId,
        isExpired: false,
        createdAt: new Date().toISOString(),
      };

      member.availablePoints -= data.points;
      member.updatedAt = new Date().toISOString();

      return transaction;
    }

    try {
      return await fetchWithRetry<PointsTransaction>(
        `${this.baseUrl}/api/loyalty/points/redeem/${memberId}`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
    } catch (error) {
      console.warn('Failed to redeem points, using mock data:', error);
      this.useMockData = true;

      const member = MOCK_MEMBERS.find(m => m.id === memberId);
      if (!member) {
        throw new Error(`Member not found: ${memberId}`);
      }

      if (member.availablePoints < data.points) {
        throw new Error(`Insufficient points. Available: ${member.availablePoints}, Required: ${data.points}`);
      }

      const transaction: PointsTransaction = {
        id: generateId('txn'),
        memberId,
        type: 'redeem',
        points: -data.points,
        balanceAfter: member.availablePoints - data.points,
        description: data.description,
        orderId: data.orderId,
        referenceId: data.referenceId,
        isExpired: false,
        createdAt: new Date().toISOString(),
      };

      member.availablePoints -= data.points;

      return transaction;
    }
  }

  async getPointsHistory(memberId: string): Promise<PointsTransaction[]> {
    if (this.useMockData) {
      return MOCK_TRANSACTIONS.filter(t => t.memberId === memberId);
    }

    try {
      return await fetchWithRetry<PointsTransaction[]>(
        `${this.baseUrl}/api/loyalty/points/history/${memberId}`
      );
    } catch (error) {
      console.warn('Failed to fetch points history, using mock data:', error);
      this.useMockData = true;
      return MOCK_TRANSACTIONS.filter(t => t.memberId === memberId);
    }
  }

  async adjustPoints(memberId: string, data: AdjustPoints): Promise<PointsTransaction> {
    if (this.useMockData) {
      const member = MOCK_MEMBERS.find(m => m.id === memberId);
      if (!member) {
        throw new Error(`Member not found: ${memberId}`);
      }

      const transaction: PointsTransaction = {
        id: generateId('txn'),
        memberId,
        type: 'adjust',
        points: data.points,
        balanceAfter: member.totalPoints + data.points,
        description: `Adjustment: ${data.reason}`,
        adjustedBy: data.adjustedBy,
        adjustmentReason: data.reason,
        isExpired: false,
        createdAt: new Date().toISOString(),
      };

      member.totalPoints += data.points;
      member.availablePoints += data.points;
      member.lifetimePoints += data.points > 0 ? data.points : 0;
      member.updatedAt = new Date().toISOString();

      return transaction;
    }

    try {
      return await fetchWithRetry<PointsTransaction>(
        `${this.baseUrl}/api/loyalty/points/adjust/${memberId}`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
    } catch (error) {
      console.warn('Failed to adjust points, using mock data:', error);
      this.useMockData = true;

      const member = MOCK_MEMBERS.find(m => m.id === memberId);
      if (!member) {
        throw new Error(`Member not found: ${memberId}`);
      }

      const transaction: PointsTransaction = {
        id: generateId('txn'),
        memberId,
        type: 'adjust',
        points: data.points,
        balanceAfter: member.totalPoints + data.points,
        description: `Adjustment: ${data.reason}`,
        adjustedBy: data.adjustedBy,
        adjustmentReason: data.reason,
        isExpired: false,
        createdAt: new Date().toISOString(),
      };

      member.totalPoints += data.points;
      member.availablePoints += data.points;
      member.lifetimePoints += data.points > 0 ? data.points : 0;

      return transaction;
    }
  }

  // ============================================
  // Punch Card Methods
  // ============================================

  async getPunchCards(merchantId: string): Promise<PunchCard[]> {
    if (this.useMockData) {
      return MOCK_PUNCH_CARDS.filter(p => p.merchantId === merchantId || p.merchantId === 'merchant-001');
    }

    try {
      return await fetchWithRetry<PunchCard[]>(
        `${this.baseUrl}/api/loyalty/punch-cards/${merchantId}`
      );
    } catch (error) {
      console.warn('Failed to fetch punch cards, using mock data:', error);
      this.useMockData = true;
      return MOCK_PUNCH_CARDS.filter(p => p.merchantId === merchantId || p.merchantId === 'merchant-001');
    }
  }

  async createPunchCard(merchantId: string, data: CreatePunchCard): Promise<PunchCard> {
    if (this.useMockData) {
      const newCard: PunchCard = {
        id: generateId('punch'),
        merchantId,
        name: data.name,
        description: data.description,
        requiredPunches: data.requiredPunches,
        punchesRequired: data.requiredPunches,
        rewardDescription: data.rewardDescription,
        rewardValue: data.rewardValue,
        validForDays: data.validForDays ?? null,
        categories: data.categories,
        isActive: true,
        totalIssued: 0,
        totalRedeemed: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      MOCK_PUNCH_CARDS.push(newCard);
      return newCard;
    }

    try {
      return await fetchWithRetry<PunchCard>(
        `${this.baseUrl}/api/loyalty/punch-cards`,
        {
          method: 'POST',
          body: JSON.stringify({ merchantId, ...data }),
        }
      );
    } catch (error) {
      console.warn('Failed to create punch card, using mock data:', error);
      this.useMockData = true;
      const newCard: PunchCard = {
        id: generateId('punch'),
        merchantId,
        name: data.name,
        description: data.description,
        requiredPunches: data.requiredPunches,
        punchesRequired: data.requiredPunches,
        rewardDescription: data.rewardDescription,
        rewardValue: data.rewardValue,
        validForDays: data.validForDays ?? null,
        categories: data.categories,
        isActive: true,
        totalIssued: 0,
        totalRedeemed: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      MOCK_PUNCH_CARDS.push(newCard);
      return newCard;
    }
  }

  async punchCard(punchCardId: string, customerId: string): Promise<PunchCardPunch> {
    if (this.useMockData) {
      const card = MOCK_PUNCH_CARDS.find(c => c.id === punchCardId);
      if (!card) {
        throw new Error(`Punch card not found: ${punchCardId}`);
      }

      const punch: PunchCardPunch = {
        id: generateId('punch-record'),
        punchCardId,
        customerId,
        punchNumber: 1,
        totalPunches: card.requiredPunches,
        isComplete: false,
        isRedeemed: false,
        punchedAt: new Date().toISOString(),
      };

      return punch;
    }

    try {
      return await fetchWithRetry<PunchCardPunch>(
        `${this.baseUrl}/api/loyalty/punch-cards/${punchCardId}/punch`,
        {
          method: 'POST',
          body: JSON.stringify({ customerId }),
        }
      );
    } catch (error) {
      console.warn('Failed to punch card, using mock data:', error);
      this.useMockData = true;
      const card = MOCK_PUNCH_CARDS.find(c => c.id === punchCardId);
      if (!card) {
        throw new Error(`Punch card not found: ${punchCardId}`);
      }
      return {
        id: generateId('punch-record'),
        punchCardId,
        customerId,
        punchNumber: 1,
        totalPunches: card.requiredPunches,
        isComplete: false,
        isRedeemed: false,
        punchedAt: new Date().toISOString(),
      };
    }
  }

  async redeemPunchCard(punchCardId: string, customerId: string): Promise<void> {
    if (this.useMockData) {
      const card = MOCK_PUNCH_CARDS.find(c => c.id === punchCardId);
      if (!card) {
        throw new Error(`Punch card not found: ${punchCardId}`);
      }
      card.totalRedeemed += 1;
      card.updatedAt = new Date().toISOString();
      return;
    }

    try {
      await fetchWithRetry<void>(
        `${this.baseUrl}/api/loyalty/punch-cards/${punchCardId}/redeem`,
        {
          method: 'POST',
          body: JSON.stringify({ customerId }),
        }
      );
    } catch (error) {
      console.warn('Failed to redeem punch card:', error);
      this.useMockData = true;
      const card = MOCK_PUNCH_CARDS.find(c => c.id === punchCardId);
      if (card) {
        card.totalRedeemed += 1;
        card.updatedAt = new Date().toISOString();
      }
    }
  }

  // ============================================
  // Tier Methods
  // ============================================

  async getTiers(merchantId: string): Promise<Tier[]> {
    if (this.useMockData) {
      return MOCK_TIERS.filter(t => t.merchantId === merchantId || t.merchantId === 'merchant-001');
    }

    try {
      return await fetchWithRetry<Tier[]>(
        `${this.baseUrl}/api/loyalty/tiers/${merchantId}`
      );
    } catch (error) {
      console.warn('Failed to fetch tiers, using mock data:', error);
      this.useMockData = true;
      return MOCK_TIERS.filter(t => t.merchantId === merchantId || t.merchantId === 'merchant-001');
    }
  }

  async createTier(merchantId: string, data: CreateTier): Promise<Tier> {
    if (this.useMockData) {
      const newTier: Tier = {
        id: generateId('tier'),
        merchantId,
        name: data.name,
        color: data.color,
        icon: data.icon,
        minimumPoints: data.minimumPoints,
        minimumLifetimePoints: data.minimumLifetimePoints,
        pointsMultiplier: data.pointsMultiplier,
        benefits: data.benefits,
        discountPercentage: data.discountPercentage,
        freeItemThreshold: data.freeItemThreshold,
        birthdayBonus: data.birthdayBonus,
        priority: data.priority,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      MOCK_TIERS.push(newTier);
      return newTier;
    }

    try {
      return await fetchWithRetry<Tier>(
        `${this.baseUrl}/api/loyalty/tiers`,
        {
          method: 'POST',
          body: JSON.stringify({ merchantId, ...data }),
        }
      );
    } catch (error) {
      console.warn('Failed to create tier, using mock data:', error);
      this.useMockData = true;
      const newTier: Tier = {
        id: generateId('tier'),
        merchantId,
        name: data.name,
        color: data.color,
        icon: data.icon,
        minimumPoints: data.minimumPoints,
        minimumLifetimePoints: data.minimumLifetimePoints,
        pointsMultiplier: data.pointsMultiplier,
        benefits: data.benefits,
        discountPercentage: data.discountPercentage,
        freeItemThreshold: data.freeItemThreshold,
        birthdayBonus: data.birthdayBonus,
        priority: data.priority,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      MOCK_TIERS.push(newTier);
      return newTier;
    }
  }

  async updateTier(id: string, data: UpdateTier): Promise<Tier> {
    if (this.useMockData) {
      const index = MOCK_TIERS.findIndex(t => t.id === id);
      if (index === -1) {
        throw new Error(`Tier not found: ${id}`);
      }
      const updated = { ...MOCK_TIERS[index], ...data, updatedAt: new Date().toISOString() };
      MOCK_TIERS[index] = updated;
      return updated;
    }

    try {
      return await fetchWithRetry<Tier>(
        `${this.baseUrl}/api/loyalty/tiers/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      );
    } catch (error) {
      console.warn('Failed to update tier, using mock data:', error);
      this.useMockData = true;
      const index = MOCK_TIERS.findIndex(t => t.id === id);
      if (index === -1) {
        throw new Error(`Tier not found: ${id}`);
      }
      const updated = { ...MOCK_TIERS[index], ...data, updatedAt: new Date().toISOString() };
      MOCK_TIERS[index] = updated;
      return updated;
    }
  }
}

// ============================================
// Export Singleton Instance
// ============================================

export const loyaltyService = new LoyaltyService();

export default LoyaltyService;
