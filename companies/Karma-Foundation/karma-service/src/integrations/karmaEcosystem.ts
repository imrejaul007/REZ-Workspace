/**
 * Karma Ecosystem Integration
 * Karma flows between REZ-Media, CorpPerks, StayOwn, REZ-Merchant, REZ-Consumer
 */

const WALLET_URL = process.env.WALLET_SERVICE_URL || 'http://localhost:4004';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

interface KarmaTransaction {
  userId: string;
  amount: number;
  reason: string;
  source: 'consumer' | 'corp' | 'hotel' | 'merchant';
}

/**
 * Karma Ecosystem Service
 * Unified Karma that works everywhere
 */
export const karmaEcosystem = {
  /**
   * Earn Karma
   */
  async earn(params: KarmaTransaction): Promise<void> {
    await fetch(`${WALLET_URL}/api/wallet/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({
        userId: params.userId,
        amount: params.amount,
        reason: `karma_${params.source}_${params.reason}`,
        metadata: {
          source: params.source,
          reason: params.reason,
          ecosystem: true,
        },
      }),
    });
  },

  /**
   * Spend Karma
   */
  async spend(userId: string, amount: number, reason: string): Promise<void> {
    await fetch(`${WALLET_URL}/api/wallet/deduct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({
        userId,
        amount,
        reason: `karma_spend_${reason}`,
      }),
    });
  },

  /**
   * Transfer Karma (user to user)
   */
  async transfer(from: string, to: string, amount: number): Promise<void> {
    // Deduct from sender
    await fetch(`${WALLET_URL}/api/wallet/deduct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({
        userId: from,
        amount,
        reason: `karma_transfer_to_${to}`,
      }),
    });

    // Add to receiver
    await fetch(`${WALLET_URL}/api/wallet/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({
        userId: to,
        amount,
        reason: `karma_transfer_from_${from}`,
      }),
    });
  },

  /**
   * Balance check
   */
  async balance(userId: string): Promise<number> {
    const res = await fetch(`${WALLET_URL}/api/wallet/balance/${userId}`, {
      headers: { 'X-Internal-Token': INTERNAL_TOKEN },
    });
    const data = await res.json();
    return data.coins || 0;
  },

  /**
   * Get transaction history
   */
  async history(userId: string): Promise<unknown[]> {
    const res = await fetch(`${WALLET_URL}/api/wallet/transactions/${userId}?limit=50`, {
      headers: { 'X-Internal-Token': INTERNAL_TOKEN },
    });
    return res.json();
  },
};

export default karmaEcosystem;
