import challengesApi from '@/services/challengesApi';

jest.mock('@/services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockClient = require('@/services/apiClient').default;

const mockChallenge = {
  _id: 'ch1',
  type: 'weekly' as const,
  title: 'Visit 5 stores this week',
  description: 'Earn bonus coins for visiting 5 stores',
  icon: '🏪',
  requirements: { action: 'visit_stores' as const, target: 5 },
  rewards: { coins: 500, multiplier: 1.5 },
  difficulty: 'medium' as const,
  startDate: '2026-04-05T00:00:00Z',
  endDate: '2026-04-12T00:00:00Z',
  participantCount: 1200,
  completionCount: 340,
  active: true,
  featured: true,
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
};

const mockProgress = {
  _id: 'prog1',
  user: 'u1',
  challenge: mockChallenge,
  progress: 3,
  target: 5,
  completed: false,
  rewardsClaimed: false,
  startedAt: '2026-04-05T00:00:00Z',
  lastUpdatedAt: '2026-04-05T10:00:00Z',
  progressPercentage: 60,
};

describe('challengesApi', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getChallenges', () => {
    it('returns all active challenges', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: [mockChallenge] });
      const res = await challengesApi.getChallenges();
      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(1);
    });

    it('filters by type', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: [mockChallenge] });
      await challengesApi.getChallenges('weekly');
      expect(mockClient.get).toHaveBeenCalledWith('/gamification/challenges', expect.objectContaining({ type: 'weekly' }));
    });

    it('handles error', async () => {
      mockClient.get.mockRejectedValueOnce(new Error('Network error'));
      const res = await challengesApi.getChallenges();
      expect(res.success).toBe(false);
    });
  });

  describe('getDailyChallenges', () => {
    it('returns daily challenges with progress', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: [mockProgress] });
      const res = await challengesApi.getDailyChallenges();
      expect(res.success).toBe(true);
    });
  });

  describe('getWeeklyChallenges', () => {
    it('returns weekly challenges with progress', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: [mockProgress] });
      const res = await challengesApi.getWeeklyChallenges();
      expect(res.success).toBe(true);
    });
  });

  describe('getMyProgress', () => {
    it('returns user progress for all challenges', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: [mockProgress] });
      const res = await challengesApi.getMyProgress();
      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(1);
      expect(res.data?.[0].progress).toBe(3);
    });

    it('can exclude completed challenges', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: [] });
      await challengesApi.getMyProgress(false);
      // Service serialises boolean to string for query param
      expect(mockClient.get).toHaveBeenCalledWith(
        '/gamification/challenges/my-progress',
        expect.objectContaining({ includeCompleted: 'false' }),
      );
    });
  });

  describe('joinChallenge', () => {
    it('joins a challenge successfully', async () => {
      mockClient.post.mockResolvedValueOnce({ success: true, data: mockProgress });
      const res = await challengesApi.joinChallenge('ch1');
      expect(res.success).toBe(true);
      // Service calls post with no second arg
      expect(mockClient.post).toHaveBeenCalledWith('/gamification/challenges/ch1/join');
    });

    it('handles already joined', async () => {
      mockClient.post.mockResolvedValueOnce({ success: false, message: 'Already joined' });
      const res = await challengesApi.joinChallenge('ch1');
      expect(res.success).toBe(false);
    });
  });

  describe('claimReward', () => {
    it('claims reward for completed challenge', async () => {
      mockClient.post.mockResolvedValueOnce({ success: true, data: { coinsEarned: 500, badges: [] } });
      const res = await challengesApi.claimReward('prog1');
      expect(res.success).toBe(true);
      expect(res.data?.coinsEarned).toBe(500);
    });

    it('handles already claimed', async () => {
      mockClient.post.mockResolvedValueOnce({ success: false, message: 'Reward already claimed' });
      const res = await challengesApi.claimReward('prog1');
      expect(res.success).toBe(false);
    });
  });

  describe('getChallengeLeaderboard', () => {
    it('returns leaderboard for a challenge', async () => {
      mockClient.get.mockResolvedValueOnce({ success: true, data: [{ userId: 'u1', rank: 1, progress: 5 }] });
      const res = await challengesApi.getChallengeLeaderboard('ch1', 10);
      expect(res.success).toBe(true);
    });
  });

  describe('getStatistics', () => {
    it('returns challenge statistics from my-progress endpoint', async () => {
      // getStatistics() delegates to getMyProgressWithStats() which calls GET /my-progress
      // backend uses 'completed' and 'active' field names; mapped to totalCompleted/activeChallenges
      mockClient.get.mockResolvedValueOnce({
        success: true,
        data: { challenges: [], stats: { completed: 5, totalCoinsEarned: 2500, currentStreak: 3, active: 1 } },
      });
      const res = await challengesApi.getStatistics();
      expect(res.success).toBe(true);
      expect(res.data?.totalCompleted).toBe(5);
    });

    it('returns zero stats when progress endpoint fails', async () => {
      mockClient.get.mockRejectedValueOnce(new Error('fail'));
      const res = await challengesApi.getStatistics();
      expect(res.success).toBe(true);
      expect(res.data?.totalCompleted).toBe(0);
    });
  });

  describe('getTimeRemaining', () => {
    it('returns human-readable time remaining', () => {
      const future = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours from now
      const result = challengesApi.getTimeRemaining(future);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('returns expired text for past dates', () => {
      const past = new Date(Date.now() - 1000).toISOString();
      const result = challengesApi.getTimeRemaining(past);
      expect(result.toLowerCase()).toMatch(/expired|ended|over/i);
    });
  });
});
