// Hotel customer 360 extends CustomerService
import { CustomerService } from '@rez/base-services/customer';

interface StayRecord {
  checkIn: Date;
  checkOut: Date;
  roomType: string;
  totalSpent: number;
}

interface GuestPreferences {
  roomType: string;
  amenities: string[];
  dietaryRestrictions: string[];
}

interface LoyaltyInfo {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
  nightsThisYear: number;
}

class HotelCustomerService extends CustomerService {
  private stayHistory: Map<string, StayRecord[]> = new Map();
  private preferences: Map<string, GuestPreferences> = new Map();
  private loyaltyInfo: Map<string, LoyaltyInfo> = new Map();

  async getStayHistory(customerId: string): Promise<StayRecord[]> {
    return this.stayHistory.get(customerId) || [];
  }

  async getPreferences(customerId: string): Promise<GuestPreferences | null> {
    return this.preferences.get(customerId) || null;
  }

  async getLoyaltyTier(customerId: string): Promise<LoyaltyInfo | null> {
    return this.loyaltyInfo.get(customerId) || null;
  }

  async addStay(customerId: string, stay: StayRecord): Promise<void> {
    const history = this.stayHistory.get(customerId) || [];
    history.push(stay);
    this.stayHistory.set(customerId, history);
  }

  async updatePreferences(customerId: string, prefs: GuestPreferences): Promise<void> {
    this.preferences.set(customerId, prefs);
  }

  async updateLoyalty(customerId: string, loyalty: LoyaltyInfo): Promise<void> {
    this.loyaltyInfo.set(customerId, loyalty);
  }
}

export const hotelCustomerService = new HotelCustomerService();
export { HotelCustomerService };
