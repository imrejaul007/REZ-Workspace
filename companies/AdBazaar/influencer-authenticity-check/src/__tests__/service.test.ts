/** Influencer Authenticity Check - Service Tests */
import { AuthenticityCheckService } from '../services/authenticityCheckService';
import { ProfileService } from '../services/profileService';
import { AlertService } from '../services/alertService';

jest.mock('../models', () => ({
  InfluencerProfile: { find: jest.fn(), findById: jest.fn(), create: jest.fn(), findByIdAndUpdate: jest.fn() },
  AuthenticityCheck: { find: jest.fn(), create: jest.fn(), countDocuments: jest.fn() },
  CheckHistory: { find: jest.fn(), create: jest.fn() },
}));

describe('AuthenticityCheckService', () => {
  let service: AuthenticityCheckService;
  beforeEach(() => { jest.clearAllMocks(); service = new AuthenticityCheckService(); });

  describe('performCheck', () => {
    it('should perform authenticity check', async () => {
      const AuthenticityCheck = require('../models').AuthenticityCheck;
      AuthenticityCheck.create.mockResolvedValue(createMockAuthenticityCheck({ score: 0.9 }));
      const result = await service.performCheck('profile-123', { checkTypes: ['followers', 'engagement'] });
      expect(result.score).toBeGreaterThan(0);
    });

    it('should detect fake followers', async () => {
      const AuthenticityCheck = require('../models').AuthenticityCheck;
      AuthenticityCheck.create.mockResolvedValue(createMockAuthenticityCheck({ score: 0.2, flags: ['high_fake_follower_ratio'] }));
      const result = await service.performCheck('profile-123', { checkTypes: ['followers'] });
      expect(result.score).toBeLessThan(0.5);
    });
  });

  describe('getCheckHistory', () => {
    it('should return check history', async () => {
      const AuthenticityCheck = require('../models').AuthenticityCheck;
      AuthenticityCheck.find.mockReturnValue({ sort: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue([createMockAuthenticityCheck()]) });
      const result = await service.getCheckHistory('profile-123');
      expect(result).toHaveLength(1);
    });
  });

  describe('generateReport', () => {
    it('should generate authenticity report', async () => {
      const AuthenticityCheck = require('../models').AuthenticityCheck;
      AuthenticityCheck.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([createMockAuthenticityCheck({ score: 0.85 }), createMockAuthenticityCheck({ score: 0.9 })]) });
      const result = await service.generateReport('profile-123');
      expect(result).toBeDefined();
      expect(result.averageScore).toBeDefined();
    });
  });
});

describe('ProfileService', () => {
  let service: ProfileService;
  beforeEach(() => { jest.clearAllMocks(); service = new ProfileService(); });

  describe('addProfile', () => {
    it('should add influencer profile', async () => {
      const InfluencerProfile = require('../models').InfluencerProfile;
      InfluencerProfile.create.mockResolvedValue(createMockProfile());
      const result = await service.addProfile({ platform: 'instagram', username: 'testuser', userId: '123' });
      expect(result.username).toBe('testuser');
    });
  });

  describe('getProfiles', () => {
    it('should return all profiles', async () => {
      const InfluencerProfile = require('../models').InfluencerProfile;
      InfluencerProfile.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([createMockProfile(), createMockProfile({ username: 'user2' })]) });
      const result = await service.getProfiles({});
      expect(result).toHaveLength(2);
    });
  });

  describe('updateProfile', () => {
    it('should update profile data', async () => {
      const InfluencerProfile = require('../models').InfluencerProfile;
      InfluencerProfile.findByIdAndUpdate.mockResolvedValue(createMockProfile({ followers: 15000 }));
      const result = await service.updateProfile('profile-123', { followers: 15000 });
      expect(result?.followers).toBe(15000);
    });
  });
});

describe('AlertService', () => {
  let service: AlertService;
  beforeEach(() => { jest.clearAllMocks(); service = new AlertService(); });

  describe('createAlert', () => {
    it('should create alert for suspicious profile', async () => {
      const result = await service.createAlert({ profileId: 'profile-123', type: 'fake_followers', severity: 'high', message: 'High fake follower percentage' });
      expect(result).toBeDefined();
    });
  });

  describe('getAlerts', () => {
    it('should return alerts for profile', async () => {
      const result = await service.getAlerts('profile-123');
      expect(Array.isArray(result)).toBe(true);
    });
  });
});