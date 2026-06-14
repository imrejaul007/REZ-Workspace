/**
 * Corporate Karma Integration with RABTUL Wallet
 * CorpPerks employees earn and redeem Karma across ecosystem
 */

const WALLET_URL = process.env.WALLET_SERVICE_URL || 'http://localhost:4004';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

export const corporateKarma = {
  /**
   * Award Karma for achievements
   */
  async award(employeeId: string, points: number, reason: string): Promise<void> {
    await fetch(`${WALLET_URL}/api/wallet/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({
        userId: employeeId,
        amount: points,
        reason: `corp_${reason}`,
      }),
    });
  },

  /**
   * Deduct Karma for redemptions
   */
  async redeem(employeeId: string, points: number, reward: string): Promise<void> {
    await fetch(`${WALLET_URL}/api/wallet/deduct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({
        userId: employeeId,
        amount: points,
        reason: `corp_redeem_${reward}`,
      }),
    });
  },

  /**
   * Get balance
   */
  async balance(employeeId: string): Promise<number> {
    const res = await fetch(`${WALLET_URL}/api/wallet/balance/${employeeId}`, {
      headers: { 'X-Internal-Token': INTERNAL_TOKEN },
    });
    const data = await res.json();
    return data.coins || 0;
  },

  /**
   * Get history
   */
  async history(employeeId: string): Promise<any[]> {
    const res = await fetch(`${WALLET_URL}/api/wallet/transactions/${employeeId}?limit=50`, {
      headers: { 'X-Internal-Token': INTERNAL_TOKEN },
    });
    return res.json();
  },
};

export default corporateKarma;
