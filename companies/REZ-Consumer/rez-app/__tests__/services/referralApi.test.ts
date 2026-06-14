// @ts-nocheck
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('referralApi', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should manage referrals', async () => {
    const referralData = {
      code: 'REF-ABC123',
      referredUsers: ['user-2', 'user-3'],
      totalRewards: 30,
    };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: referralData }),
    });

    const response = await fetch('/api/referrals/user-1');
    const body = await response.json();

    expect(body.data.code).toBe('REF-ABC123');
    expect(body.data.referredUsers).toHaveLength(2);
    expect(body.data.totalRewards).toBeGreaterThan(0);
  });

  it('should apply a referral code', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, reward: 10 }),
    });

    const response = await fetch('/api/referrals/apply', { method: 'POST' });
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.reward).toBe(10);
  });

  it('should reject invalid referral code', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ error: 'Invalid referral code' }),
    });

    const response = await fetch('/api/referrals/apply', { method: 'POST' });
    const body = await response.json();

    expect(response.ok).toBe(false);
    expect(body.error).toContain('Invalid');
  });
});
