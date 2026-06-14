/**
 * REZ Smart Lock Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  LockType,
  LockProvider,
  LockStatus,
  KeyStatus,
  KeyPermission,
  AccessAction,
  resetStore,
  registerLock,
  getLock,
  getLocksByHotel,
  getLockByRoom,
  updateLock,
  deleteLock,
  generateKey,
  getKey,
  getKeysByGuest,
  getKeysByBooking,
  getKeysByRoom,
  revokeKey,
  revokeKeysByBooking,
  extendKey,
  verifyAccess,
  verifyQRCode,
  verifyPIN,
  getAuditLogs,
  getBatteryLevel,
} from './services/smart-lock.service.js';

describe('Smart Lock Service', () => {
  beforeEach(() => {
    resetStore();
  });

  // ========================
  // LOCK TESTS
  // ========================

  describe('Lock Management', () => {
    it('should register a BLE lock', () => {
      const lock = registerLock('hotel-1', 'room-101', LockType.BLE, LockProvider.SALTO);

      expect(lock).toBeDefined();
      expect(lock.lockId).toMatch(/^LOCK-[A-Z0-9]+$/);
      expect(lock.hotelId).toBe('hotel-1');
      expect(lock.roomId).toBe('room-101');
      expect(lock.lockType).toBe(LockType.BLE);
      expect(lock.provider).toBe(LockProvider.SALTO);
      expect(lock.status).toBe(LockStatus.ACTIVE);
      expect(lock.batteryLevel).toBe(100);
    });

    it('should register a QR lock', () => {
      const lock = registerLock('hotel-1', 'room-102', LockType.QR, LockProvider.GENERIC);

      expect(lock.lockType).toBe(LockType.QR);
      expect(lock.provider).toBe(LockProvider.GENERIC);
    });

    it('should get lock by ID', () => {
      const created = registerLock('hotel-1', 'room-101', LockType.BLE, LockProvider.YALE);
      const found = getLock(created.lockId);

      expect(found?.lockId).toBe(created.lockId);
    });

    it('should get locks by hotel', () => {
      registerLock('hotel-1', 'room-101', LockType.BLE, LockProvider.SALTO);
      registerLock('hotel-1', 'room-102', LockType.NFC, LockProvider.IGLOOHOME);
      registerLock('hotel-2', 'room-201', LockType.QR, LockProvider.GENERIC);

      const hotel1Locks = getLocksByHotel('hotel-1');
      expect(hotel1Locks).toHaveLength(2);
    });

    it('should get lock by room', () => {
      registerLock('hotel-1', 'room-101', LockType.BLE, LockProvider.SALTO);
      const lock = getLockByRoom('hotel-1', 'room-101');

      expect(lock?.roomId).toBe('room-101');
    });

    it('should update lock status', () => {
      const lock = registerLock('hotel-1', 'room-101', LockType.BLE, LockProvider.SALTO);
      const updated = updateLock(lock.lockId, { status: LockStatus.MAINTENANCE, batteryLevel: 50 });

      expect(updated?.status).toBe(LockStatus.MAINTENANCE);
      expect(updated?.batteryLevel).toBe(50);
    });

    it('should delete lock', () => {
      const lock = registerLock('hotel-1', 'room-101', LockType.BLE, LockProvider.SALTO);
      const deleted = deleteLock(lock.lockId);

      expect(deleted).toBe(true);
      expect(getLock(lock.lockId)).toBeUndefined();
    });

    it('should return undefined for non-existent lock', () => {
      const found = getLock('non-existent');
      expect(found).toBeUndefined();
    });
  });

  // ========================
  // KEY TESTS
  // ========================

  describe('Key Management', () => {
    let lock: ReturnType<typeof registerLock>;

    beforeEach(() => {
      lock = registerLock('hotel-1', 'room-101', LockType.BLE, LockProvider.SALTO);
    });

    it('should generate a key', () => {
      const validFrom = new Date();
      const validUntil = new Date(validFrom.getTime() + 24 * 60 * 60 * 1000);

      const key = generateKey(
        'hotel-1',
        'room-101',
        'guest-1',
        'booking-1',
        lock.lockId,
        validFrom,
        validUntil,
        [KeyPermission.ENTER, KeyPermission.EXIT]
      );

      expect(key).toBeDefined();
      expect(key.keyId).toMatch(/^[a-f0-9-]+$/);
      expect(key.guestId).toBe('guest-1');
      expect(key.bookingId).toBe('booking-1');
      expect(key.status).toBe(KeyStatus.ACTIVE);
      expect(key.keyType).toBe(LockType.BLE);
    });

    it('should generate QR key data', () => {
      const lockQR = registerLock('hotel-1', 'room-102', LockType.QR, LockProvider.GENERIC);
      const key = generateKey(
        'hotel-1',
        'room-102',
        'guest-1',
        'booking-1',
        lockQR.lockId,
        new Date(),
        new Date(Date.now() + 86400000)
      );

      expect(key.keyData).toContain('https://keys.stayown.com/qr/');
    });

    it('should get key by ID', () => {
      const key = generateKey(
        'hotel-1',
        'room-101',
        'guest-1',
        'booking-1',
        lock.lockId,
        new Date(),
        new Date(Date.now() + 86400000)
      );

      const found = getKey(key.keyId);
      expect(found?.keyId).toBe(key.keyId);
    });

    it('should get keys by guest', () => {
      generateKey('hotel-1', 'room-101', 'guest-1', 'booking-1', lock.lockId, new Date(), new Date(Date.now() + 86400000));
      generateKey('hotel-1', 'room-102', 'guest-1', 'booking-2', lock.lockId, new Date(), new Date(Date.now() + 86400000));
      generateKey('hotel-1', 'room-103', 'guest-2', 'booking-3', lock.lockId, new Date(), new Date(Date.now() + 86400000));

      const guest1Keys = getKeysByGuest('guest-1');
      expect(guest1Keys).toHaveLength(2);
    });

    it('should get keys by booking', () => {
      const key = generateKey(
        'hotel-1',
        'room-101',
        'guest-1',
        'booking-x',
        lock.lockId,
        new Date(),
        new Date(Date.now() + 86400000)
      );

      const bookingKeys = getKeysByBooking('booking-x');
      expect(bookingKeys).toHaveLength(1);
      expect(bookingKeys[0].keyId).toBe(key.keyId);
    });

    it('should revoke key', () => {
      const key = generateKey(
        'hotel-1',
        'room-101',
        'guest-1',
        'booking-1',
        lock.lockId,
        new Date(),
        new Date(Date.now() + 86400000)
      );

      const revoked = revokeKey(key.keyId);
      expect(revoked?.status).toBe(KeyStatus.REVOKED);
    });

    it('should revoke all keys for booking', () => {
      generateKey('hotel-1', 'room-101', 'guest-1', 'booking-1', lock.lockId, new Date(), new Date(Date.now() + 86400000));
      generateKey('hotel-1', 'room-102', 'guest-1', 'booking-1', lock.lockId, new Date(), new Date(Date.now() + 86400000));

      const count = revokeKeysByBooking('booking-1');
      expect(count).toBe(2);

      const remainingKeys = getKeysByBooking('booking-1');
      expect(remainingKeys.every(k => k.status === KeyStatus.REVOKED)).toBe(true);
    });

    it('should extend key validity', () => {
      const key = generateKey(
        'hotel-1',
        'room-101',
        'guest-1',
        'booking-1',
        lock.lockId,
        new Date(),
        new Date(Date.now() + 86400000)
      );

      const newExpiry = new Date(Date.now() + 172800000); // 2 days
      const extended = extendKey(key.keyId, newExpiry);

      expect(extended?.validUntil.getTime()).toBe(newExpiry.getTime());
    });

    it('should not extend revoked key', () => {
      const key = generateKey(
        'hotel-1',
        'room-101',
        'guest-1',
        'booking-1',
        lock.lockId,
        new Date(),
        new Date(Date.now() + 86400000)
      );

      revokeKey(key.keyId);
      const extended = extendKey(key.keyId, new Date(Date.now() + 172800000));

      expect(extended).toBeUndefined();
    });
  });

  // ========================
  // ACCESS VERIFICATION TESTS
  // ========================

  describe('Access Verification', () => {
    let lock: ReturnType<typeof registerLock>;
    let key: ReturnType<typeof generateKey>;

    beforeEach(() => {
      lock = registerLock('hotel-1', 'room-101', LockType.BLE, LockProvider.SALTO);
      key = generateKey(
        'hotel-1',
        'room-101',
        'guest-1',
        'booking-1',
        lock.lockId,
        new Date(Date.now() - 3600000), // 1 hour ago
        new Date(Date.now() + 86400000) // 24 hours from now
      );
    });

    it('should grant access with valid key', () => {
      const result = verifyAccess(key.keyId, lock.lockId);

      expect(result.granted).toBe(true);
      expect(result.permissions).toContain(KeyPermission.ENTER);
      expect(result.permissions).toContain(KeyPermission.EXIT);
    });

    it('should deny access with invalid key ID', () => {
      const result = verifyAccess('invalid-key-id', lock.lockId);

      expect(result.granted).toBe(false);
      expect(result.reason).toContain('not found');
    });

    it('should deny access with revoked key', () => {
      revokeKey(key.keyId);
      const result = verifyAccess(key.keyId, lock.lockId);

      expect(result.granted).toBe(false);
      expect(result.reason).toContain('revoked');
    });

    it('should deny access with expired key', () => {
      const expiredKey = generateKey(
        'hotel-1',
        'room-101',
        'guest-2',
        'booking-2',
        lock.lockId,
        new Date(Date.now() - 172800000), // 2 days ago
        new Date(Date.now() - 86400000) // 1 day ago (expired)
      );

      const result = verifyAccess(expiredKey.keyId, lock.lockId);

      expect(result.granted).toBe(false);
      expect(result.reason).toContain('expired');
    });

    it('should deny access with wrong lock', () => {
      const otherLock = registerLock('hotel-1', 'room-102', LockType.BLE, LockProvider.SALTO);
      const result = verifyAccess(key.keyId, otherLock.lockId);

      expect(result.granted).toBe(false);
      expect(result.reason).toContain('not valid for this lock');
    });

    it('should verify QR code', () => {
      const qrLock = registerLock('hotel-1', 'room-102', LockType.QR, LockProvider.GENERIC);
      const qrKey = generateKey(
        'hotel-1',
        'room-102',
        'guest-1',
        'booking-1',
        qrLock.lockId,
        new Date(Date.now() - 3600000),
        new Date(Date.now() + 86400000)
      );

      const result = verifyQRCode(qrKey.keyData, qrLock.lockId);

      expect(result.granted).toBe(true);
    });
  });

  // ========================
  // AUDIT LOG TESTS
  // ========================

  describe('Audit Logging', () => {
    it('should log access events', () => {
      const lock = registerLock('hotel-1', 'room-101', LockType.BLE, LockProvider.SALTO);
      const key = generateKey(
        'hotel-1',
        'room-101',
        'guest-1',
        'booking-1',
        lock.lockId,
        new Date(),
        new Date(Date.now() + 86400000)
      );

      verifyAccess(key.keyId, lock.lockId);

      const logs = getAuditLogs('hotel-1');
      expect(logs.length).toBeGreaterThan(0);
      expect(logs.some(l => l.action === AccessAction.GRANT)).toBe(true);
    });

    it('should filter logs by action', () => {
      const lock = registerLock('hotel-1', 'room-101', LockType.BLE, LockProvider.SALTO);
      const key = generateKey(
        'hotel-1',
        'room-101',
        'guest-1',
        'booking-1',
        lock.lockId,
        new Date(),
        new Date(Date.now() + 86400000)
      );

      verifyAccess(key.keyId, lock.lockId);
      revokeKey(key.keyId);

      const accessLogs = getAuditLogs('hotel-1', { action: AccessAction.ACCESS_GRANTED });
      expect(accessLogs.every(l => l.action === AccessAction.ACCESS_GRANTED)).toBe(true);
    });

    it('should filter logs by lock', () => {
      const lock1 = registerLock('hotel-1', 'room-101', LockType.BLE, LockProvider.SALTO);
      const lock2 = registerLock('hotel-1', 'room-102', LockType.BLE, LockProvider.SALTO);

      generateKey('hotel-1', 'room-101', 'guest-1', 'booking-1', lock1.lockId, new Date(), new Date(Date.now() + 86400000));
      generateKey('hotel-1', 'room-102', 'guest-2', 'booking-2', lock2.lockId, new Date(), new Date(Date.now() + 86400000));

      const room101Logs = getAuditLogs('hotel-1', { lockId: lock1.lockId });
      expect(room101Logs.every(l => l.roomId === 'room-101')).toBe(true);
    });
  });

  // ========================
  // BATTERY TESTS
  // ========================

  describe('Battery Monitoring', () => {
    it('should get battery level', () => {
      const lock = registerLock('hotel-1', 'room-101', LockType.BLE, LockProvider.SALTO);
      const battery = getBatteryLevel(lock.lockId);

      expect(battery?.batteryLevel).toBe(100);
      expect(battery?.needsAttention).toBe(false);
    });

    it('should indicate needs attention when low battery', () => {
      const lock = registerLock('hotel-1', 'room-101', LockType.BLE, LockProvider.SALTO);
      updateLock(lock.lockId, { batteryLevel: 15 });

      const battery = getBatteryLevel(lock.lockId);
      expect(battery?.needsAttention).toBe(true);
    });

    it('should return undefined for non-existent lock', () => {
      const battery = getBatteryLevel('non-existent');
      expect(battery).toBeUndefined();
    });
  });

  // ========================
  // EDGE CASES
  // ========================

  describe('Edge Cases', () => {
    it('should handle all lock types', () => {
      const types = Object.values(LockType);

      for (const type of types) {
        const lock = registerLock('hotel-1', `room-${type}`, type, LockProvider.GENERIC);
        expect(lock.lockType).toBe(type);
      }
    });

    it('should handle all providers', () => {
      const providers = Object.values(LockProvider);

      for (const provider of providers) {
        const lock = registerLock('hotel-1', 'room-101', LockType.BLE, provider);
        expect(lock.provider).toBe(provider);
      }
    });

    it('should handle all key permissions', () => {
      const lock = registerLock('hotel-1', 'room-101', LockType.BLE, LockProvider.SALTO);
      const allPermissions = Object.values(KeyPermission);

      const key = generateKey(
        'hotel-1',
        'room-101',
        'guest-1',
        'booking-1',
        lock.lockId,
        new Date(),
        new Date(Date.now() + 86400000),
        allPermissions
      );

      expect(key.permissions).toEqual(allPermissions);
    });

    it('should return undefined for non-existent key', () => {
      const found = getKey('non-existent');
      expect(found).toBeUndefined();
    });

    it('should handle empty audit logs', () => {
      const logs = getAuditLogs('empty-hotel');
      expect(logs).toHaveLength(0);
    });
  });
});
