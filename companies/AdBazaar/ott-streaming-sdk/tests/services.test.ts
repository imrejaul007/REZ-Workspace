import { acquireDRMLicense, getDRMCertificates, validateDRMSession } from '../src/services/drmService.js';

describe('DRM Service', () => {
  describe('acquireDRMLicense', () => {
    it('should acquire a widevine license', async () => {
      const request = {
        contentId: 'movie-123',
        drmType: 'widevine' as const,
        deviceInfo: {
          manufacturer: 'Samsung',
          model: 'QN90B',
          osVersion: 'Tizen 7.0',
        },
      };

      const license = await acquireDRMLicense(request);

      expect(license).toBeDefined();
      expect(license.contentId).toBe('movie-123');
      expect(license.drmType).toBe('widevine');
      expect(license.licenseUrl).toContain('/widevine/license');
      expect(license.licenseId).toBeDefined();
      expect(license.sessionToken).toBeDefined();
      expect(license.expiresAt).toBeDefined();
    });

    it('should acquire a fairplay license', async () => {
      const request = {
        contentId: 'movie-456',
        drmType: 'fairplay' as const,
        deviceInfo: {
          manufacturer: 'Apple',
          model: 'Apple TV 4K',
          osVersion: 'tvOS 17.0',
        },
      };

      const license = await acquireDRMLicense(request);

      expect(license).toBeDefined();
      expect(license.contentId).toBe('movie-456');
      expect(license.drmType).toBe('fairplay');
      expect(license.licenseUrl).toContain('/fairplay/license');
    });

    it('should generate unique license IDs', async () => {
      const request = {
        contentId: 'movie-123',
        drmType: 'widevine' as const,
        deviceInfo: {
          manufacturer: 'Samsung',
          model: 'QN90B',
          osVersion: 'Tizen 7.0',
        },
      };

      const license1 = await acquireDRMLicense(request);
      const license2 = await acquireDRMLicense(request);

      expect(license1.licenseId).not.toBe(license2.licenseId);
      expect(license1.sessionToken).not.toBe(license2.sessionToken);
    });
  });

  describe('getDRMCertificates', () => {
    it('should get widevine certificates', async () => {
      const cert = await getDRMCertificates('widevine');

      expect(cert).toBeDefined();
      expect(cert.type).toBe('widevine');
      expect(cert.certificate).toBeDefined();
      expect(cert.expiresAt).toBeDefined();
    });

    it('should get fairplay certificates', async () => {
      const cert = await getDRMCertificates('fairplay');

      expect(cert).toBeDefined();
      expect(cert.type).toBe('fairplay');
      expect(cert.certificate).toBeDefined();
      expect(cert.expiresAt).toBeDefined();
    });
  });

  describe('validateDRMSession', () => {
    it('should validate a non-empty session token', async () => {
      const isValid = await validateDRMSession('valid-session-token', 'content-123');

      expect(isValid).toBe(true);
    });

    it('should reject empty session token', async () => {
      const isValid = await validateDRMSession('', 'content-123');

      expect(isValid).toBe(false);
    });
  });
});