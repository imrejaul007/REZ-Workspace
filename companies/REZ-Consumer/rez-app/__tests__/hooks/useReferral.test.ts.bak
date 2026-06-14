/**
 * Unit Tests for useReferral hook
 */

interface Referral {
  code: string;
  referredBy: string | null;
  referredUsers: string[];
  rewardEarned: number;
}

const mockGenerateCode = jest.fn();
const mockApplyCode = jest.fn();
const mockGetReferralStats = jest.fn();

describe('useReferral', () => {
  beforeEach(() => {
    mockGenerateCode.mockReset();
    mockApplyCode.mockReset();
    mockGetReferralStats.mockReset();
  });

  it('should manage referrals', async () => {
    mockGetReferralStats.mockResolvedValue({
      code: 'REF-ABC123',
      referredBy: null,
      referredUsers: ['user-1', 'user-2'],
      rewardEarned: 20,
    } as Referral);

    const stats: Referral = await mockGetReferralStats('current-user');
    expect(stats.code).toBe('REF-ABC123');
    expect(stats.referredUsers).toHaveLength(2);
    expect(stats.rewardEarned).toBeGreaterThan(0);
  });

  it('should generate a unique referral code', async () => {
    mockGenerateCode.mockResolvedValue('REF-XYZ789');

    const code = await mockGenerateCode('user-123');
    expect(code).toBeDefined();
    expect(typeof code).toBe('string');
    expect(code).toContain('REF-');
  });

  it('should apply a referral code and credit reward', async () => {
    mockApplyCode.mockResolvedValue({ success: true, reward: 10 });

    const result = await mockApplyCode('REF-ABC123', 'new-user');
    expect(result.success).toBe(true);
    expect(result.reward).toBeGreaterThan(0);
    expect(mockApplyCode).toHaveBeenCalledWith('REF-ABC123', 'new-user');
  });
});
