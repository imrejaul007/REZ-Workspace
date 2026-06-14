/**
 * RABTUL Loyalty Connector
 * Loyalty points, tiers, rewards
 */
import axios from 'axios';

const LOYALTY_URL = process.env.LOYALTY_URL || 'http://localhost:4041';
const TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

export class LoyaltyConnector {
  private url: string;
  private token: string;

  constructor(url?: string, token?: string) {
    this.url = url || LOYALTY_URL;
    this.token = token || TOKEN || '';
  }

  private headers() {
    return { 'X-Internal-Token': this.token };
  }

  // Get loyalty status
  async getStatus(userId: string) {
    const res = await axios.get(`${this.url}/api/loyalty/${userId}/status`, { headers: this.headers() });
    return res.data;
  }

  // Earn points
  async earnPoints(userId: string, points: number, source: string) {
    const res = await axios.post(`${this.url}/api/loyalty/points/earn`, { userId, points, source }, { headers: this.headers() });
    return res.data;
  }

  // Redeem points
  async redeem(userId: string, points: number, reward: string) {
    const res = await axios.post(`${this.url}/api/loyalty/redeem`, { userId, points, reward }, { headers: this.headers() });
    return res.data;
  }

  // Get tier benefits
  async getTier(userId: string) {
    const res = await axios.get(`${this.url}/api/loyalty/${userId}/tier`, { headers: this.headers() });
    return res.data;
  }

  // Referral
  async referral(referrerId: string, refereeId: string) {
    const res = await axios.post(`${this.url}/api/loyalty/referral`, { referrerId, refereeId }, { headers: this.headers() });
    return res.data;
  }
}

export const loyaltyConnector = new LoyaltyConnector();
