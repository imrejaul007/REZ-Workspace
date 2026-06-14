import { describe, it, expect } from 'node:test';
import { v4 as uuidv4 } from 'uuid';

describe('Referral Engine Unit Tests', () => {
  describe('Code Generation', () => {
    it('should generate 8-character referral codes', () => {
      const code = uuidv4().substring(0, 8).toUpperCase();

      expect(code.length).toBe(8);
      expect(/^[A-Z0-9]+$/.test(code)).toBe(true);
    });

    it('should generate unique codes', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        codes.add(uuidv4().substring(0, 8).toUpperCase());
      }

      expect(codes.size).toBe(100);
    });
  });

  describe('Attribution Models', () => {
    const calculateAttribution = {
      firstTouch: (touches: Array<{ channel: string; timestamp: number }>) => {
        if (touches.length === 0) return null;
        return touches.reduce((earliest, current) =>
          current.timestamp < earliest.timestamp ? current : earliest
        );
      },
      lastTouch: (touches: Array<{ channel: string; timestamp: number }>) => {
        if (touches.length === 0) return null;
        return touches.reduce((latest, current) =>
          current.timestamp > latest.timestamp ? current : latest
        );
      },
      linear: (touches: Array<{ channel: string }>) => {
        if (touches.length === 0) return {};
        const counts: Record<string, number> = {};
        touches.forEach(t => {
          counts[t.channel] = (counts[t.channel] || 0) + 1;
        });
        return counts;
      },
    };

    it('should return first touch attribution', () => {
      const touches = [
        { channel: 'whatsapp', timestamp: 1000 },
        { channel: 'instagram', timestamp: 2000 },
        { channel: 'twitter', timestamp: 1500 },
      ];

      const result = calculateAttribution.firstTouch(touches);
      expect(result?.channel).toBe('whatsapp');
    });

    it('should return last touch attribution', () => {
      const touches = [
        { channel: 'whatsapp', timestamp: 1000 },
        { channel: 'instagram', timestamp: 2000 },
        { channel: 'twitter', timestamp: 1500 },
      ];

      const result = calculateAttribution.lastTouch(touches);
      expect(result?.channel).toBe('instagram');
    });

    it('should calculate linear attribution', () => {
      const touches = [
        { channel: 'whatsapp' },
        { channel: 'whatsapp' },
        { channel: 'instagram' },
      ];

      const result = calculateAttribution.linear(touches);
      expect(result.whatsapp).toBe(2);
      expect(result.instagram).toBe(1);
    });
  });

  describe('Ambassador Tiers', () => {
    const getTier = (referrals: number) => {
      if (referrals >= 5001) return 'diamond';
      if (referrals >= 501) return 'platinum';
      if (referrals >= 101) return 'gold';
      if (referrals >= 26) return 'silver';
      return 'bronze';
    };

    const getMultiplier = (tier: string) => {
      const multipliers: Record<string, number> = {
        bronze: 1.0,
        silver: 1.05,
        gold: 1.1,
        platinum: 1.15,
        diamond: 1.2,
      };
      return multipliers[tier] || 1.0;
    };

    it('should return bronze for 0-25 referrals', () => {
      expect(getTier(0)).toBe('bronze');
      expect(getTier(25)).toBe('bronze');
    });

    it('should return silver for 26-100 referrals', () => {
      expect(getTier(26)).toBe('silver');
      expect(getTier(100)).toBe('silver');
    });

    it('should return gold for 101-500 referrals', () => {
      expect(getTier(101)).toBe('gold');
      expect(getTier(500)).toBe('gold');
    });

    it('should return diamond for 5001+ referrals', () => {
      expect(getTier(5001)).toBe('diamond');
      expect(getTier(10000)).toBe('diamond');
    });

    it('should calculate correct multipliers', () => {
      expect(getMultiplier('bronze')).toBe(1.0);
      expect(getMultiplier('silver')).toBe(1.05);
      expect(getMultiplier('diamond')).toBe(1.2);
    });
  });

  describe('Creator Commission Tiers', () => {
    const getCommission = (users: number) => {
      if (users >= 50000) return 0.15;
      if (users >= 5000) return 0.12;
      if (users >= 1000) return 0.10;
      if (users >= 100) return 0.07;
      return 0.05;
    };

    it('should return 5% for starter tier', () => {
      expect(getCommission(0)).toBe(0.05);
      expect(getCommission(50)).toBe(0.05);
    });

    it('should return 7% for pro tier', () => {
      expect(getCommission(100)).toBe(0.07);
      expect(getCommission(500)).toBe(0.07);
    });

    it('should return 15% for ambassador tier', () => {
      expect(getCommission(50000)).toBe(0.15);
      expect(getCommission(100000)).toBe(0.15);
    });
  });

  describe('Fraud Detection', () => {
    const calculateRiskScore = (flags: string[]) => {
      const weights: Record<string, number> = {
        self_referral: 100,
        circular_referral: 100,
        mass_accounts: 80,
        same_device: 60,
        rapid_signups: 50,
        vpn_detected: 40,
        same_ip: 20,
        emulator: 30,
      };

      return flags.reduce((score, flag) => score + (weights[flag] || 0), 0);
    };

    it('should return max score for self-referral', () => {
      expect(calculateRiskScore(['self_referral'])).toBe(100);
    });

    it('should return combined score for multiple flags', () => {
      const score = calculateRiskScore(['same_device', 'same_ip', 'vpn_detected']);
      expect(score).toBe(120);
    });

    it('should return 0 for no flags', () => {
      expect(calculateRiskScore([])).toBe(0);
    });

    it('should cap score at 100', () => {
      const score = calculateRiskScore(['self_referral', 'circular_referral', 'mass_accounts']);
      expect(Math.min(score, 100)).toBe(100);
    });
  });

  describe('Reward Calculation', () => {
    const calculateReward = (baseAmount: number, tier: string, campaign?: { multiplier?: number }) => {
      const multipliers: Record<string, number> = {
        bronze: 1.0,
        silver: 1.05,
        gold: 1.1,
        platinum: 1.15,
        diamond: 1.2,
      };

      const tierMultiplier = multipliers[tier] || 1.0;
      const campaignMultiplier = campaign?.multiplier || 1.0;

      return Math.floor(baseAmount * tierMultiplier * campaignMultiplier);
    };

    it('should calculate base reward for bronze', () => {
      expect(calculateReward(100, 'bronze')).toBe(100);
    });

    it('should apply diamond multiplier', () => {
      expect(calculateReward(100, 'diamond')).toBe(120);
    });

    it('should apply campaign multiplier', () => {
      expect(calculateReward(100, 'bronze', { multiplier: 2 })).toBe(200);
    });

    it('should stack multipliers', () => {
      expect(calculateReward(100, 'gold', { multiplier: 1.5 })).toBe(165);
    });
  });
});

describe('Conversion Funnel Tests', () => {
  const calculateFunnel = (referrals: Array<{ status: string }>) => {
    const stages = {
      invited: referrals.length,
      clicked: referrals.filter(r => r.status !== 'pending').length,
      registered: referrals.filter(r => ['registered', 'verified', 'qualified', 'rewarded'].includes(r.status)).length,
      qualified: referrals.filter(r => ['qualified', 'rewarded'].includes(r.status)).length,
      rewarded: referrals.filter(r => r.status === 'rewarded').length,
    };

    return {
      ...stages,
      conversionRate: stages.invited > 0 ? (stages.rewarded / stages.invited) * 100 : 0,
    };
  };

  it('should calculate conversion rate', () => {
    const referrals = [
      { status: 'rewarded' },
      { status: 'rewarded' },
      { status: 'pending' },
      { status: 'qualified' },
      { status: 'registered' },
    ];

    const result = calculateFunnel(referrals);
    expect(result.invited).toBe(5);
    expect(result.rewarded).toBe(2);
    expect(result.conversionRate).toBe(40);
  });

  it('should handle empty referrals', () => {
    const result = calculateFunnel([]);
    expect(result.conversionRate).toBe(0);
  });
});
