// Unified API Client - Connects to all services
// REZ Now (Next.js) uses this to get user state from Auth, Profile, Wallet, REE

const AUTH_URL = process.env.REZ_AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com';
const PROFILE_URL = process.env.REZ_PROFILE_SERVICE_URL || 'https://rezprofile.onrender.com';
const WALLET_URL = process.env.REZ_WALLET_SERVICE_URL || 'https://rez-wallet-service-36vo.onrender.com';
const REE_URL = process.env.REZ_ECONOMIC_ENGINE_URL || 'https://rez-economic-engine.onrender.com';

export interface AuthUser {
  id: string;
  phone: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  preferences: {
    language: string;
    theme: string;
    notifications: { push: boolean; sms: boolean; email: boolean; whatsapp: boolean };
  };
  addresses: unknown[];
  role: string;
}

export interface WalletData {
  coins: number;
  balance: number;
  transactions: unknown[];
}

export interface UserState {
  auth: AuthUser | null;
  profile: UserProfile | null;
  wallet: WalletData | null;
}

class UnifiedApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private headers() {
    return this.token
      ? { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  }

  async authGetMe(): Promise<AuthUser | null> {
    try {
      const res = await fetch(`${AUTH_URL}/auth/me`, {
        headers: this.headers(),
      });
      const data = await res.json();
      return data.user;
    } catch {
      return null;
    }
  }

  async profileGet(userId: string): Promise<UserProfile | null> {
    try {
      const res = await fetch(`${PROFILE_URL}/profile/${userId}`, {
        headers: this.headers(),
      });
      return res.json();
    } catch {
      return null;
    }
  }

  async profileUpdate(userId: string, data: Partial<UserProfile>) {
    const res = await fetch(`${PROFILE_URL}/profile/${userId}`, {
      method: 'PATCH',
      headers: this.headers(),
      body: JSON.stringify(data),
    });
    return res.json();
  }

  async profileGetAddresses(userId: string) {
    try {
      const res = await fetch(`${PROFILE_URL}/profile/${userId}/addresses`, {
        headers: this.headers(),
      });
      const data = await res.json();
      return data.addresses || [];
    } catch {
      return [];
    }
  }

  async profileAddAddress(userId: string, address) {
    const res = await fetch(`${PROFILE_URL}/profile/${userId}/addresses`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(address),
    });
    return res.json();
  }

  async walletGet(userId: string): Promise<WalletData | null> {
    try {
      const res = await fetch(`${WALLET_URL}/wallet/${userId}`, {
        headers: this.headers(),
      });
      return res.json();
    } catch {
      return null;
    }
  }

  async walletGetTransactions(userId: string, limit = 20) {
    try {
      const res = await fetch(`${WALLET_URL}/wallet/${userId}/transactions?limit=${limit}`, {
        headers: this.headers(),
      });
      const data = await res.json();
      return data.transactions || [];
    } catch {
      return [];
    }
  }

  // Get complete user state in parallel
  async getUserState(userId: string): Promise<UserState> {
    const [profile, wallet] = await Promise.all([
      this.profileGet(userId),
      this.walletGet(userId),
    ]);

    return {
      auth: null,
      profile,
      wallet,
    };
  }
}

export const unifiedApi = new UnifiedApiClient();
export default unifiedApi;
