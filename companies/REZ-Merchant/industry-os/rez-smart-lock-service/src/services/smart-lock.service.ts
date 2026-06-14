/**
 * REZ Smart Lock Service
 * In-memory data store for digital room keys (BLE/NFC/QR)
 */

import { v4 as uuidv4 } from 'uuid';

// Types
export enum LockType {
  BLE = 'ble',
  NFC = 'nfc',
  QR = 'qr',
  PIN = 'pin',
}

export enum LockProvider {
  SALTO = 'salto',
  YALE = 'yale',
  AUGUST = 'august',
  SAMSUNG = 'samsung',
  IGLOOHOME = 'igloohome',
  GENERIC = 'generic',
}

export enum LockStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  MAINTENANCE = 'maintenance',
}

export enum KeyStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  USED = 'used',
}

export enum KeyPermission {
  ENTER = 'enter',
  EXIT = 'exit',
  EMERGENCY = 'emergency',
  MINIBAR = 'minibar',
  SAFE = 'safe',
}

export enum AccessAction {
  GRANT = 'grant',
  REVOKE = 'revoke',
  ACCESS_GRANTED = 'access_granted',
  ACCESS_DENIED = 'access_denied',
  LOW_BATTERY = 'low_battery',
}

export interface Lock {
  lockId: string;
  hotelId: string;
  roomId: string;
  lockType: LockType;
  provider: LockProvider;
  status: LockStatus;
  batteryLevel: number;
  doorStatus: 'open' | 'closed' | 'ajar' | 'unknown';
  lastSync: Date | null;
  createdAt: Date;
}

export interface DigitalKey {
  keyId: string;
  hotelId: string;
  roomId: string;
  guestId: string;
  bookingId: string;
  guestPhone?: string;
  guestEmail?: string;
  lockId: string;
  keyType: LockType;
  keyData: string;
  permissions: KeyPermission[];
  validFrom: Date;
  validUntil: Date;
  status: KeyStatus;
  createdAt: Date;
  activatedAt: Date | null;
  lastUsed: Date | null;
}

export interface AccessLog {
  logId: string;
  hotelId: string;
  roomId: string;
  lockId: string;
  keyId: string | null;
  guestId: string | null;
  action: AccessAction;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

// In-memory data stores
const locks = new Map<string, Lock>();
const keys = new Map<string, DigitalKey>();
const accessLogs = new Map<string, AccessLog>();

// Helper functions
function generateLockId(): string {
  return `LOCK-${uuidv4().slice(0, 8).toUpperCase()}`;
}

function generateKeyId(): string {
  return uuidv4();
}

function generateLogId(): string {
  return `LOG-${uuidv4().slice(0, 8).toUpperCase()}`;
}

// Lock Functions
export function registerLock(
  hotelId: string,
  roomId: string,
  lockType: LockType,
  provider: LockProvider
): Lock {
  const lockId = generateLockId();
  const now = new Date();

  const lock: Lock = {
    lockId,
    hotelId,
    roomId,
    lockType,
    provider,
    status: LockStatus.ACTIVE,
    batteryLevel: 100,
    doorStatus: 'unknown',
    lastSync: now,
    createdAt: now,
  };

  locks.set(lockId, lock);
  return lock;
}

export function getLock(lockId: string): Lock | undefined {
  return locks.get(lockId);
}

export function getLocksByHotel(hotelId: string): Lock[] {
  const result: Lock[] = [];
  for (const lock of locks.values()) {
    if (lock.hotelId === hotelId) {
      result.push(lock);
    }
  }
  return result.sort((a, b) => a.roomId.localeCompare(b.roomId));
}

export function getLockByRoom(hotelId: string, roomId: string): Lock | undefined {
  for (const lock of locks.values()) {
    if (lock.hotelId === hotelId && lock.roomId === roomId) {
      return lock;
    }
  }
  return undefined;
}

export function updateLock(
  lockId: string,
  updates: Partial<Pick<Lock, 'status' | 'batteryLevel' | 'doorStatus'>>
): Lock | undefined {
  const lock = locks.get(lockId);
  if (!lock) return undefined;

  Object.assign(lock, updates, { lastSync: new Date() });
  locks.set(lockId, lock);
  return lock;
}

export function deleteLock(lockId: string): boolean {
  return locks.delete(lockId);
}

// Key Functions
export function generateKey(
  hotelId: string,
  roomId: string,
  guestId: string,
  bookingId: string,
  lockId: string,
  validFrom: Date,
  validUntil: Date,
  permissions: KeyPermission[] = [KeyPermission.ENTER, KeyPermission.EXIT],
  guestPhone?: string,
  guestEmail?: string
): DigitalKey {
  const keyId = generateKeyId();
  const now = new Date();

  // Generate key data based on lock type
  const lock = locks.get(lockId);
  const lockType = lock?.lockType || LockType.QR;

  const keyData = generateKeyData(lockType, keyId, lockId, validFrom, validUntil, permissions);

  const key: DigitalKey = {
    keyId,
    hotelId,
    roomId,
    guestId,
    bookingId,
    guestPhone,
    guestEmail,
    lockId,
    keyType: lockType,
    keyData,
    permissions,
    validFrom,
    validUntil,
    status: KeyStatus.ACTIVE,
    createdAt: now,
    activatedAt: now,
    lastUsed: null,
  };

  keys.set(keyId, key);

  // Log the key generation
  logAccess(hotelId, roomId, lockId, keyId, guestId, AccessAction.GRANT);

  return key;
}

function generateKeyData(
  lockType: LockType,
  keyId: string,
  lockId: string,
  validFrom: Date,
  validUntil: Date,
  permissions: KeyPermission[]
): string {
  const payload = {
    keyId,
    lockId,
    f: validFrom.getTime(),
    t: validUntil.getTime(),
    p: permissions,
  };

  switch (lockType) {
    case LockType.BLE:
      return `BLE:${Buffer.from(JSON.stringify(payload)).toString('base64')}`;
    case LockType.NFC:
      return `NFC:${Buffer.from(JSON.stringify(payload)).toString('base64')}`;
    case LockType.QR:
      return `https://keys.stayown.com/qr/${lockId}/${keyId}`;
    case LockType.PIN:
      // Generate a 6-digit PIN
      const pin = String(Math.floor(100000 + Math.random() * 900000));
      return JSON.stringify({ ...payload, pin });
    default:
      return Buffer.from(JSON.stringify(payload)).toString('base64');
  }
}

export function getKey(keyId: string): DigitalKey | undefined {
  return keys.get(keyId);
}

export function getKeysByHotel(hotelId: string): DigitalKey[] {
  const result: DigitalKey[] = [];
  for (const key of keys.values()) {
    if (key.hotelId === hotelId) {
      result.push(key);
    }
  }
  return result;
}

export function getKeysByGuest(guestId: string): DigitalKey[] {
  const result: DigitalKey[] = [];
  for (const key of keys.values()) {
    if (key.guestId === guestId) {
      result.push(key);
    }
  }
  return result.sort((a, b) => b.validFrom.getTime() - a.validFrom.getTime());
}

export function getKeysByBooking(bookingId: string): DigitalKey[] {
  const result: DigitalKey[] = [];
  for (const key of keys.values()) {
    if (key.bookingId === bookingId) {
      result.push(key);
    }
  }
  return result;
}

export function getKeysByRoom(hotelId: string, roomId: string): DigitalKey[] {
  const result: DigitalKey[] = [];
  for (const key of keys.values()) {
    if (key.hotelId === hotelId && key.roomId === roomId) {
      result.push(key);
    }
  }
  return result;
}

export function revokeKey(keyId: string): DigitalKey | undefined {
  const key = keys.get(keyId);
  if (!key) return undefined;

  key.status = KeyStatus.REVOKED;
  keys.set(keyId, key);

  logAccess(key.hotelId, key.roomId, key.lockId, keyId, key.guestId, AccessAction.REVOKE);

  return key;
}

export function revokeKeysByBooking(bookingId: string): number {
  let count = 0;
  for (const key of keys.values()) {
    if (key.bookingId === bookingId && key.status === KeyStatus.ACTIVE) {
      key.status = KeyStatus.REVOKED;
      keys.set(key.keyId, key);
      count++;

      logAccess(key.hotelId, key.roomId, key.lockId, key.keyId, key.guestId, AccessAction.REVOKE);
    }
  }
  return count;
}

export function markKeyUsed(keyId: string): DigitalKey | undefined {
  const key = keys.get(keyId);
  if (!key) return undefined;

  key.lastUsed = new Date();
  keys.set(keyId, key);
  return key;
}

export function extendKey(keyId: string, newValidUntil: Date): DigitalKey | undefined {
  const key = keys.get(keyId);
  if (!key || key.status !== KeyStatus.ACTIVE) return undefined;

  key.validUntil = newValidUntil;
  keys.set(keyId, key);
  return key;
}

// Access Functions
export function verifyAccess(
  keyId: string,
  lockId: string
): { granted: boolean; reason?: string; permissions?: KeyPermission[] } {
  const key = keys.get(keyId);
  const lock = locks.get(lockId);

  if (!key || !lock) {
    return { granted: false, reason: 'Key or lock not found' };
  }

  if (key.lockId !== lockId) {
    return { granted: false, reason: 'Key not valid for this lock' };
  }

  if (key.status === KeyStatus.REVOKED) {
    return { granted: false, reason: 'Key has been revoked' };
  }

  if (key.status === KeyStatus.EXPIRED) {
    return { granted: false, reason: 'Key has expired' };
  }

  const now = new Date();

  if (now < key.validFrom) {
    return { granted: false, reason: 'Key is not yet valid' };
  }

  if (now > key.validUntil) {
    return { granted: false, reason: 'Key has expired' };
  }

  // Check battery for physical locks
  if (lock.batteryLevel < 20) {
    logAccess(key.hotelId, key.roomId, lockId, keyId, key.guestId, AccessAction.LOW_BATTERY, { battery: lock.batteryLevel });
  }

  // Mark key as used
  markKeyUsed(keyId);

  // Log successful access
  logAccess(key.hotelId, key.roomId, lockId, keyId, key.guestId, AccessAction.ACCESS_GRANTED);

  return { granted: true, permissions: key.permissions };
}

export function verifyQRCode(qrCode: string, lockId: string): { granted: boolean; reason?: string } {
  // Parse QR code URL
  const match = qrCode.match(/\/qr\/([^/]+)\/([a-f0-9-]+)$/i);

  if (!match) {
    return { granted: false, reason: 'Invalid QR code format' };
  }

  const extractedLockId = match[1];
  const keyId = match[2];

  if (extractedLockId !== lockId) {
    return { granted: false, reason: 'QR code not valid for this lock' };
  }

  return verifyAccess(keyId, lockId);
}

export function verifyPIN(pin: string, lockId: string): { granted: boolean; reason?: string } {
  for (const key of keys.values()) {
    if (key.lockId === lockId && key.status === KeyStatus.ACTIVE) {
      try {
        const keyData = JSON.parse(key.keyData);
        if (keyData.pin === pin) {
          return verifyAccess(key.keyId, lockId);
        }
      } catch {
        // Not a PIN key
      }
    }
  }
  return { granted: false, reason: 'Invalid PIN' };
}

// Audit Log Functions
export function logAccess(
  hotelId: string,
  roomId: string,
  lockId: string,
  keyId: string | null,
  guestId: string | null,
  action: AccessAction,
  metadata: Record<string, unknown> = {}
): AccessLog {
  const logId = generateLogId();

  const log: AccessLog = {
    logId,
    hotelId,
    roomId,
    lockId,
    keyId,
    guestId,
    action,
    timestamp: new Date(),
    metadata,
  };

  accessLogs.set(logId, log);
  return log;
}

export function getAuditLogs(
  hotelId: string,
  filters?: {
    roomId?: string;
    lockId?: string;
    action?: AccessAction;
    startDate?: Date;
    endDate?: Date;
  }
): AccessLog[] {
  const result: AccessLog[] = [];

  for (const log of accessLogs.values()) {
    if (log.hotelId !== hotelId) continue;
    if (filters?.roomId && log.roomId !== filters.roomId) continue;
    if (filters?.lockId && log.lockId !== filters.lockId) continue;
    if (filters?.action && log.action !== filters.action) continue;
    if (filters?.startDate && log.timestamp < filters.startDate) continue;
    if (filters?.endDate && log.timestamp > filters.endDate) continue;

    result.push(log);
  }

  return result.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// Battery Functions
export function getBatteryLevel(lockId: string): { lockId: string; batteryLevel: number; needsAttention: boolean } | undefined {
  const lock = locks.get(lockId);
  if (!lock) return undefined;

  return {
    lockId,
    batteryLevel: lock.batteryLevel,
    needsAttention: lock.batteryLevel < 20,
  };
}

// Reset function for testing
export function resetStore(): void {
  locks.clear();
  keys.clear();
  accessLogs.clear();
}
