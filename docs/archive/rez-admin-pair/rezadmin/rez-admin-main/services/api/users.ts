import { apiClient } from './apiClient';

export interface User {
  _id: string;
  phoneNumber: string;
  email?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  role: 'user' | 'merchant' | 'admin';
  status?: 'active' | 'suspended';
  isSuspended?: boolean;
  // isActive is the canonical field on the User model (false = suspended).
  // Some endpoints return isActive instead of isSuspended — both are checked in UI.
  isActive?: boolean;
  isVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  coinBalance?: number;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  segment?:
    | 'normal'
    | 'verified_student'
    | 'verified_employee'
    | 'verified_defence'
    | 'verified_healthcare'
    | 'verified_teacher'
    | 'verified_senior'
    | 'verified_government'
    | 'verified_differentlyAbled';
  featureLevel?: number;
  verificationStatus?: 'none' | 'provisional' | 'pending' | 'verified';
  isFlagged?: boolean;
  flagReason?: string;
  // Sprint 14: User detail stats
  stats?: {
    lifetimeCoinsEarned?: number;
    coinsRedeemed?: number;
    totalCheckIns?: number;
    currentStreak?: number;
    lastActive?: string;
  };
  achievements?: Array<{
    _id: string;
    title: string;
    description?: string;
    unlockedAt: string;
  }>;
}

export interface FraudFlaggedUser {
  _id: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  earnedLast24h?: number;
  zScore?: number;
  flaggedAt?: string;
  fraudFlags?: {
    coinVelocity?: {
      flaggedAt?: string;
      zScore?: number;
      earnedLast24h?: number;
      cleared?: boolean;
      clearedAt?: string;
    };
  };
  isSuspended?: boolean;
  status?: 'active' | 'suspended';
  reviewStatus?: 'pending' | 'cleared';
  clearedAt?: string;
}

export interface FraudQueueSummary {
  all: number;
  pending: number;
  cleared: number;
  suspended: number;
}

export interface FraudQueueResponse {
  users: FraudFlaggedUser[];
  summary: FraudQueueSummary;
}

export interface UserWallet {
  _id: string;
  user: string;
  balance: {
    total: number;
    available: number;
    pending: number;
    cashback: number;
  };
  coins?: Array<{
    type: 'rez' | 'prive' | 'branded' | 'promo';
    amount: number;
    isActive: boolean;
    expiryDate?: string;
  }>;
  brandedCoins?: Array<{
    merchantId: string;
    merchantName: string;
    amount: number;
    isActive: boolean;
  }>;
  currency: string;
  statistics?: {
    totalEarned: number;
    totalSpent: number;
    totalCashback: number;
    totalRefunds: number;
  };
  isFrozen: boolean;
  frozenReason?: string;
  lastTransactionAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsersListResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  role?: 'user' | 'merchant' | 'admin';
  status?: 'active' | 'suspended';
  search?: string;
}

class UsersService {
  /**
   * Get list of users with pagination and filters
   */
  async getUsers(params: GetUsersParams = {}): Promise<UsersListResponse> {
    try {
      const { page = 1, limit = 20, role, status, search } = params;

      let url = `admin/users?page=${page}&limit=${limit}`;
      if (role) url += `&role=${role}`;
      if (status) url += `&status=${status}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      if (__DEV__) console.log('[Users] Fetching users list...');
      const response = await apiClient.get<User[]>(url);

      if (response.success) {
        if (__DEV__) console.log('[Users] Users fetched successfully');
        // Backend v2 shape: { success, data: { users: [...], pagination: {...} } }
        const nested = response.data as any;

        const users: User[] = nested?.users ?? [];
        const pagination = nested?.pagination ?? {
          page,
          limit,
          total: users.length,
          totalPages: Math.ceil(users.length / limit) || 1,
        };

        return { users, pagination };
      }

      throw new Error(response.message || 'Failed to get users');
    } catch (error: any) {
      if (__DEV__) console.error('[Users] Get users error:', error.message);
      throw new Error(error.message || 'Failed to get users');
    }
  }

  /**
   * Get single user by ID
   */
  async getUser(userId: string): Promise<User> {
    try {
      if (__DEV__) console.log('[Users] Fetching user:', userId);
      const response = await apiClient.get<any>(`admin/users/${userId}`);

      if (response.success && response.data) {
        // AC2-H3: backend may nest the user under response.data.user or return
        // it flat as response.data. Normalise so callers always get a consistent
        // shape with userId set at the top level.
        const raw: any = (response.data as any)?.user ?? response.data;
        const user: User = {
          ...raw,
          userId: raw._id ?? raw.userId ?? userId,
        };
        return user;
      }

      throw new Error(response.message || 'Failed to get user');
    } catch (error: any) {
      if (__DEV__) console.error('[Users] Get user error:', error.message);
      throw new Error(error.message || 'Failed to get user');
    }
  }

  /**
   * Get user wallet balance and details
   */
  async getUserWallet(userId: string): Promise<UserWallet> {
    try {
      if (__DEV__) console.log('[Users] Fetching wallet for user:', userId);
      // AC2-C1 fix: backend returns { data: { user, wallet } } not a flat UserWallet.
      // Extract the nested wallet object so callers get the correct shape.
      const response = await apiClient.get<{ user: unknown; wallet: UserWallet }>(
        `admin/users/${userId}/wallet`
      );

      if (response.success && response.data) {
        return response.data.wallet;
      }

      throw new Error(response.message || 'Failed to get user wallet');
    } catch (error: any) {
      if (__DEV__) console.error('[Users] Get user wallet error:', error.message);
      throw new Error(error.message || 'Failed to get user wallet');
    }
  }

  /**
   * Suspend a user
   */
  async suspendUser(
    userId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (__DEV__) console.log('[Users] Suspending user:', userId);
      const response = await apiClient.post<any>(`admin/users/${userId}/suspend`, { reason });

      return {
        success: response.success,
        message: response.message || 'User suspended',
      };
    } catch (error: any) {
      if (__DEV__) console.error('[Users] Suspend user error:', error.message);
      throw new Error(error.message || 'Failed to suspend user');
    }
  }

  /**
   * Unsuspend a user
   */
  async unsuspendUser(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      if (__DEV__) console.log('[Users] Unsuspending user:', userId);
      const response = await apiClient.post<any>(`admin/users/${userId}/unsuspend`);

      return {
        success: response.success,
        message: response.message || 'User unsuspended',
      };
    } catch (error: any) {
      if (__DEV__) console.error('[Users] Unsuspend user error:', error.message);
      throw new Error(error.message || 'Failed to unsuspend user');
    }
  }

  async flagUser(userId: string, reason: string): Promise<void> {
    try {
      const response = await apiClient.put(`admin/users/${userId}/flag`, { reason });
      if (!response.success) {
        throw new Error(response.message || 'Failed to flag user');
      }
    } catch (error: any) {
      if (__DEV__) console.error('[Users] Flag user error:', error.message);
      throw new Error(error.message || 'Failed to flag user');
    }
  }

  async unflagUser(userId: string): Promise<void> {
    try {
      const response = await apiClient.put(`admin/users/${userId}/unflag`, {});
      if (!response.success) {
        throw new Error(response.message || 'Failed to unflag user');
      }
    } catch (error: any) {
      if (__DEV__) console.error('[Users] Unflag user error:', error.message);
      throw new Error(error.message || 'Failed to unflag user');
    }
  }

  /**
   * Suspend or unsuspend a user.
   * Backend has separate POST /:id/suspend and POST /:id/unsuspend endpoints.
   * Sending suspend=false to /suspend does not unsuspend — it must go to /unsuspend.
   */
  async setSuspendStatus(
    userId: string,
    suspend: boolean,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (suspend) {
        const response = await apiClient.post<any>(`admin/users/${userId}/suspend`, { reason });
        return { success: response.success, message: response.message || 'User suspended' };
      } else {
        const response = await apiClient.post<any>(`admin/users/${userId}/unsuspend`, {});
        return { success: response.success, message: response.message || 'User unsuspended' };
      }
    } catch (error: any) {
      if (__DEV__) console.error('[Users] setSuspendStatus error:', error.message);
      throw new Error(error.message || 'Failed to update suspend status');
    }
  }

  /**
   * Reset a user's streak (admin only)
   */
  async resetStreak(userId: string): Promise<void> {
    try {
      const response = await apiClient.post<any>(`admin/users/${userId}/reset-streak`, {});
      if (!response.success) throw new Error(response.message || 'Failed to reset streak');
    } catch (error: any) {
      if (__DEV__) console.error('[Users] resetStreak error:', error.message);
      throw new Error(error.message || 'Failed to reset streak');
    }
  }

  /**
   * Get recent transactions for a user (admin view)
   */
  async getUserTransactions(
    userId: string,
    limit = 10
  ): Promise<
    Array<{ _id: string; type: string; amount: number; description: string; createdAt: string }>
  > {
    try {
      const response = await apiClient.get<any>(
        `admin/users/${userId}/transactions?limit=${limit}`
      );
      if (response.success) {
        const data = response.data as any;
        // Backend returns { data: { transactions: [...], pagination: {...} } }
        return data?.transactions || (Array.isArray(data) ? data : []);
      }
      throw new Error(response.message || 'Failed to load transactions');
    } catch (error: any) {
      if (__DEV__) console.error('[Users] getUserTransactions error:', error.message);
      throw new Error(error.message || 'Failed to load transactions');
    }
  }

  /**
   * Get fraud-flagged users queue
   */
  async getFraudQueue(status: 'all' | 'pending' | 'cleared' = 'all'): Promise<FraudQueueResponse> {
    try {
      const response = await apiClient.get<any>(`admin/fraud-queue?status=${status}`);
      if (response.success) {
        const payload = response.data as any;
        const rawUsers = Array.isArray(payload?.users)
          ? payload.users
          : Array.isArray(payload)
            ? payload
            : [];

        const users: FraudFlaggedUser[] = rawUsers
          .map((item: any) => ({
            _id: item?._id || item?.userId || '',
            name: item?.name || '',
            email: item?.email || '',
            phoneNumber: item?.phoneNumber || '',
            earnedLast24h:
              item?.earnedLast24h ?? item?.fraudFlags?.coinVelocity?.earnedLast24h ?? 0,
            zScore: item?.zScore ?? item?.fraudFlags?.coinVelocity?.zScore ?? 0,
            flaggedAt: item?.flaggedAt ?? item?.fraudFlags?.coinVelocity?.flaggedAt,
            clearedAt: item?.clearedAt ?? item?.fraudFlags?.coinVelocity?.clearedAt,
            fraudFlags: item?.fraudFlags,
            isSuspended: Boolean(item?.isSuspended),
            status: item?.status || (item?.isSuspended ? 'suspended' : 'active'),
            reviewStatus:
              item?.reviewStatus ||
              (item?.fraudFlags?.coinVelocity?.cleared ? 'cleared' : 'pending'),
          }))
          .filter((item: any) => Boolean(item._id));

        const summary: FraudQueueSummary = payload?.summary || {
          all: users.length,
          pending: users.filter((item) => item.reviewStatus !== 'cleared').length,
          cleared: users.filter((item) => item.reviewStatus === 'cleared').length,
          suspended: users.filter((item) => item.isSuspended || item.status === 'suspended').length,
        };

        return { users, summary };
      }
      throw new Error(response.message || 'Failed to load fraud queue');
    } catch (error: any) {
      if (__DEV__) console.error('[Users] getFraudQueue error:', error.message);
      throw new Error(error.message || 'Failed to load fraud queue');
    }
  }

  /**
   * Clear fraud flag for a user
   */
  async clearFraudFlag(userId: string): Promise<void> {
    try {
      const response = await apiClient.post<any>(`admin/users/${userId}/clear-fraud-flag`, {});
      if (!response.success) throw new Error(response.message || 'Failed to clear flag');
    } catch (error: any) {
      if (__DEV__) console.error('[Users] clearFraudFlag error:', error.message);
      throw new Error(error.message || 'Failed to clear fraud flag');
    }
  }
}

export const usersService = new UsersService();
export default usersService;
