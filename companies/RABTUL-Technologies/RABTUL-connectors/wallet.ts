/**
 * RABTUL Wallet Connector
 * Port: 4004
 */
import axios from 'axios';

const WALLET_URL = process.env.WALLET_URL || 'http://localhost:4004';
const TOKEN = process.env.INTERNAL_TOKEN;

export class WalletConnector {
  private url: string;
  private token: string;

  constructor(url?: string, token?: string) {
    this.url = url || WALLET_URL;
    this.token = token || TOKEN || '';
  }

  private headers() {
    return {
      'X-Internal-Token': this.token,
      'Content-Type': 'application/json'
    };
  }

  // Get balance
  async getBalance(userId: string) {
    const res = await axios.get(`${this.url}/api/wallet/balance/${userId}`, { headers: this.headers() });
    return res.data;
  }

  // Add cashback
  async addCashback(userId: string, amount: number, source: string) {
    const res = await axios.post(
      `${this.url}/api/wallet/cashback`,
      { userId, amount, source },
      { headers: this.headers() }
    );
    return res.data;
  }

  // Deduct balance
  async deduct(userId: string, amount: number, source: string) {
    const res = await axios.post(
      `${this.url}/api/wallet/deduct`,
      { userId, amount, source },
      { headers: this.headers() }
    );
    return res.data;
  }

  // Transfer to merchant
  async transferToMerchant(fromUserId: string, toMerchantId: string, amount: number) {
    const res = await axios.post(
      `${this.url}/api/wallet/transfer`,
      { fromUserId, toMerchantId, amount },
      { headers: this.headers() }
    );
    return res.data;
  }

  // Transaction history
  async history(userId: string, limit = 50) {
    const res = await axios.get(
      `${this.url}/api/wallet/history/${userId}?limit=${limit}`,
      { headers: this.headers() }
    );
    return res.data;
  }
}

export const walletConnector = new WalletConnector();
