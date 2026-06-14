/**
 * Integration Test: Enums from @rez/shared
 *
 * Verifies that PaymentStatus and UserRole enums are properly imported and used
 * in rez-payment-service payment workflows.
 *
 * Phase 7 Fix: Canonical PaymentStatus uses lowercase string values
 * (e.g., PaymentStatus.PENDING === 'pending'), not uppercase.
 */

import { PaymentStatus } from '@rez/shared/enums';
import { USER_ROLES } from '@rez/shared';

describe('PaymentService Enum Integration', () => {
  describe('PaymentStatus', () => {
    it('should import PaymentStatus from @rez/shared/enums', () => {
      expect(PaymentStatus).toBeDefined();
      // Canonical enum uses lowercase string values
      expect(PaymentStatus.PENDING).toBe('pending');
      expect(PaymentStatus.PROCESSING).toBe('processing');
      expect(PaymentStatus.COMPLETED).toBe('completed');
      expect(PaymentStatus.FAILED).toBe('failed');
      expect(PaymentStatus.CANCELLED).toBe('cancelled');
      expect(PaymentStatus.EXPIRED).toBe('expired');
      expect(PaymentStatus.REFUND_INITIATED).toBe('refund_initiated');
      expect(PaymentStatus.REFUND_PROCESSING).toBe('refund_processing');
      expect(PaymentStatus.REFUNDED).toBe('refunded');
      expect(PaymentStatus.REFUND_FAILED).toBe('refund_failed');
      expect(PaymentStatus.PARTIALLY_REFUNDED).toBe('partially_refunded');
    });

    it('should validate PaymentStatus transitions with lowercase values', () => {
      const validStatuses = Object.values(PaymentStatus);
      expect(validStatuses).toContain('pending');
      expect(validStatuses).toContain('completed');
      expect(validStatuses).toContain('failed');
    });

    it('should use canonical lowercase enum values for payment state', () => {
      const pendingStatus = PaymentStatus.PENDING;
      const failedStatus = PaymentStatus.FAILED;

      expect(typeof pendingStatus).toBe('string');
      expect(typeof failedStatus).toBe('string');
      // Verify canonical lowercase semantics
      expect(pendingStatus).toBe('pending');
      expect(failedStatus).toBe('failed');
    });
  });

  describe('UserRole', () => {
    it('should include CONSUMER role in canonical USER_ROLES', () => {
      expect(USER_ROLES.CONSUMER).toBe('consumer');
      expect(USER_ROLES.USER).toBe('user');
      expect(USER_ROLES.MERCHANT).toBe('merchant');
      expect(USER_ROLES.ADMIN).toBe('admin');
    });

    it('should have 7 user roles', () => {
      const roleValues = Object.values(USER_ROLES);
      expect(roleValues).toHaveLength(7);
      expect(roleValues).toContain('user');
      expect(roleValues).toContain('consumer');
      expect(roleValues).toContain('merchant');
      expect(roleValues).toContain('admin');
      expect(roleValues).toContain('support');
      expect(roleValues).toContain('operator');
      expect(roleValues).toContain('super_admin');
    });
  });
});
