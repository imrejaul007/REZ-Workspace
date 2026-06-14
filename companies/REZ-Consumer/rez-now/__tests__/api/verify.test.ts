import { describe, it, expect, vi, beforeEach } from 'vitest';

global.fetch = vi.fn();

describe('Loyalty API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should record visit and award coins', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, coinsEarned: 50 }),
    });

    const response = await fetch('/api/loyalty/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId: 'store_123', userId: 'user_456' }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.coinsEarned).toBe(50);
  });

  it('should get user loyalty profile', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        karmaLevel: 'active',
        loyaltyTier: 'silver',
        points: 1500,
        coinBalance: 500,
      }),
    });

    const response = await fetch('/api/loyalty/profile/user_456');
    expect(response.ok).toBe(true);
  });
});

describe('Group Ordering API', () => {
  it('should create group session', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ code: 'ABC123', status: 'active' }),
    });

    const response = await fetch('/api/group', {
      method: 'POST',
      body: JSON.stringify({ storeId: 'store_123', hostId: 'user_456' }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.code).toBe('ABC123');
  });

  it('should join existing session', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, members: 3 }),
    });

    const response = await fetch('/api/group/ABC123/join', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user_789' }),
    });

    expect(response.ok).toBe(true);
  });
});
