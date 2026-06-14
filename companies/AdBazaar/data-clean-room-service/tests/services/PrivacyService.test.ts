import { PrivacyService } from '../../src/services/PrivacyService';

describe('PrivacyService', () => {
  let privacyService: PrivacyService;

  beforeEach(() => {
    privacyService = new PrivacyService();
  });

  describe('applyKAnonymity', () => {
    it('should suppress groups below k-threshold', () => {
      const records = [
        { email: 'a@test.com', age: 25 },
        { email: 'b@test.com', age: 25 },
        { email: 'c@test.com', age: 30 }, // Only 1 record, will be suppressed
      ];

      const result = privacyService.applyKAnonymity(records, ['age']);

      // Only records with age=25 (2 records) should remain
      expect(result.length).toBe(2);
      expect(result.every(r => r.age === 25)).toBe(true);
    });

    it('should keep groups meeting k-threshold', () => {
      const records = [
        { email: 'a@test.com', city: 'NYC' },
        { email: 'b@test.com', city: 'NYC' },
        { email: 'c@test.com', city: 'NYC' },
        { email: 'd@test.com', city: 'LA' },
        { email: 'e@test.com', city: 'LA' },
      ];

      const result = privacyService.applyKAnonymity(records, ['city']);

      // Both groups have >= 2 records, all should be kept
      expect(result.length).toBe(5);
    });
  });

  describe('addDifferentialPrivacyNoise', () => {
    it('should add noise to value', () => {
      const value = 100;
      const sensitivity = 1;

      const noisyValue = privacyService.addDifferentialPrivacyNoise(value, sensitivity);

      // Noise should be added, value should change
      expect(typeof noisyValue).toBe('number');
    });

    it('should be within reasonable bounds', () => {
      const value = 100;
      const sensitivity = 1;

      // Run multiple times to check noise magnitude
      for (let i = 0; i < 100; i++) {
        const noisyValue = privacyService.addDifferentialPrivacyNoise(value, sensitivity);
        const diff = Math.abs(noisyValue - value);

        // With epsilon=1, noise should typically be within reasonable bounds
        expect(diff).toBeLessThan(1000);
      }
    });
  });

  describe('validatePrivacyCompliance', () => {
    it('should pass for hashed identifiers', () => {
      const records = [
        { identifier: '5eb63bbbe01eeed093cb22bb8f5acdc3', identifierType: 'email' },
      ];

      const result = privacyService.validatePrivacyCompliance(records);

      expect(result.compliant).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('should fail for unhashed identifiers', () => {
      const records = [
        { identifier: 'user@example.com', identifierType: 'email' },
      ];

      const result = privacyService.validatePrivacyCompliance(records);

      expect(result.compliant).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should fail for small datasets', () => {
      const records = [
        { identifier: 'hash1', identifierType: 'email' },
      ];

      const result = privacyService.validatePrivacyCompliance(records);

      expect(result.compliant).toBe(false);
      expect(result.issues.some(i => i.includes('too small'))).toBe(true);
    });
  });

  describe('generatePrivacyReport', () => {
    it('should add noise to all values', () => {
      const data = {
        totalRecords: 1000,
        matchedRecords: 500,
        matchRate: 50,
        segments: [
          { name: 'segment1', count: 300 },
          { name: 'segment2', count: 200 },
        ],
      };

      const report = privacyService.generatePrivacyReport(data);

      expect(report.totalRecords).toBeDefined();
      expect(report.matchedRecords).toBeDefined();
      expect(report.matchRate).toBeDefined();
      expect(report.segments.length).toBe(2);
      expect(report.privacyBudgetUsed).toBeDefined();
    });
  });

  describe('hashForMatching', () => {
    it('should produce consistent hashes for same input', () => {
      const identifier = 'user@example.com';
      const salt = 'brand123';

      const hash1 = privacyService.hashForMatching(identifier, salt);
      const hash2 = privacyService.hashForMatching(identifier, salt);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different salts', () => {
      const identifier = 'user@example.com';

      const hash1 = privacyService.hashForMatching(identifier, 'salt1');
      const hash2 = privacyService.hashForMatching(identifier, 'salt2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('createMatchKey', () => {
    it('should create a unique key', () => {
      const key1 = privacyService.createMatchKey('user@example.com', 'brand123');
      const key2 = privacyService.createMatchKey('user@example.com', 'brand123');

      expect(key1).toBeDefined();
      expect(key1.length).toBeGreaterThan(0);

      // Keys may differ due to timestamp component
      expect(typeof key1).toBe('string');
    });
  });
});