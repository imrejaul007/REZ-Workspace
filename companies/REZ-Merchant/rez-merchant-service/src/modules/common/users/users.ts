import logger from './utils/logger';

/**
 * ReZ Merchant - Common Users Module
 * Profiles, addresses for all industries
 */

export interface UserProfile {
  id: string;
  businessId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: Date;
}

export interface Address {
  id: string;
  userId: string;
  type: 'home' | 'work' | 'other';
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export class CommonUsers {
  /**
   * Get profile
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    return null;
  }

  /**
   * Update profile
   */
  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    logger.info(`Updated profile for ${userId}`);
  }

  /**
   * Get addresses
   */
  async getAddresses(userId: string): Promise<Address[]> {
    return [];
  }

  /**
   * Add address
   */
  async addAddress(userId: string, address: Omit<Address, 'id' | 'userId'>): Promise<Address> {
    return { ...address, id: `ADDR-${Date.now()}`, userId };
  }
}

export const commonUsers = new CommonUsers();
