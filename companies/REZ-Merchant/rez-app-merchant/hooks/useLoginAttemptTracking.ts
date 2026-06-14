/**
 * useLoginAttemptTracking - Brute force protection hook
 *
 * Tracks failed login attempts per email and locks the account after
 * MAX_ATTEMPTS failed attempts for LOCKOUT_DURATION_MS.
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import { logger } from '@/utils/logger';

const STORAGE_KEY_PREFIX = '@rez_login_attempts_';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

interface LoginAttemptData {
  attempts: number;
  firstFailedAt: number;
  lockedUntil: number | null;
}

interface LoginAttemptTrackingResult {
  isLocked: boolean;
  currentAttempts: number;
  remainingAttempts: number;
  lockoutRemainingMs: number | null;
  checkLockout: (email: string) => Promise<boolean>;
  recordFailedAttempt: (email: string) => Promise<void>;
  clearAttempts: (email: string) => Promise<void>;
  getCurrentAttempts: (email: string) => Promise<number>;
}

/**
 * Hash email using SHA-256 for secure storage key generation.
 * Unlike simple charCode sum, SHA-256 is non-reversible.
 */
const hashEmail = (email: string): string => {
  const normalized = email.toLowerCase().trim();
  return CryptoJS.SHA256(normalized).toString();
};

/**
 * Hook for tracking login attempts and enforcing brute force protection.
 * Stores attempt data in AsyncStorage keyed by SHA-256 hashed email.
 */
export function useLoginAttemptTracking(): LoginAttemptTrackingResult {
  const [lockoutExpiry, setLockoutExpiry] = useState<number | null>(null);
  const [currentAttempts, setCurrentAttempts] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get storage key for email using SHA-256 hash
  const getStorageKey = (email: string): string => {
    const hash = hashEmail(email);
    return `${STORAGE_KEY_PREFIX}${hash}`;
  };

  // Get attempt data for an email
  const getAttemptData = async (email: string): Promise<LoginAttemptData | null> => {
    try {
      const key = getStorageKey(email);
      const data = await AsyncStorage.getItem(key);
      if (data) {
        return JSON.parse(data) as LoginAttemptData;
      }
      return null;
    } catch (error) {
      logger.error('Error reading login attempts:', error);
      return null;
    }
  };

  // Save attempt data for an email
  const saveAttemptData = async (email: string, data: LoginAttemptData): Promise<void> => {
    try {
      const key = getStorageKey(email);
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      logger.error('Error saving login attempts:', error);
    }
  };

  // Get current attempts for an email (external use)
  const getCurrentAttempts = useCallback(async (email: string): Promise<number> => {
    const data = await getAttemptData(email);
    return data?.attempts || 0;
  }, []);

  // Check if email is currently locked out
  const checkLockout = useCallback(async (email: string): Promise<boolean> => {
    const data = await getAttemptData(email);

    if (!data || !data.lockedUntil) {
      setCurrentAttempts(data?.attempts || 0);
      return false;
    }

    const now = Date.now();
    if (now >= data.lockedUntil) {
      // Lockout expired, clear it
      await saveAttemptData(email, {
        attempts: 0,
        firstFailedAt: 0,
        lockedUntil: null,
      });
      setCurrentAttempts(0);
      return false;
    }

    // Still locked
    setLockoutExpiry(data.lockedUntil);
    setCurrentAttempts(data.attempts);
    return true;
  }, []);

  // Record a failed login attempt
  const recordFailedAttempt = useCallback(async (email: string): Promise<void> => {
    const now = Date.now();
    const data = await getAttemptData(email);

    const newAttempts = (data?.attempts || 0) + 1;
    const firstFailedAt = data?.firstFailedAt || now;

    let lockedUntil: number | null = null;
    if (newAttempts >= MAX_ATTEMPTS) {
      lockedUntil = now + LOCKOUT_DURATION_MS;
      setLockoutExpiry(lockedUntil);
    }

    setCurrentAttempts(newAttempts);

    await saveAttemptData(email, {
      attempts: newAttempts,
      firstFailedAt,
      lockedUntil,
    });
  }, []);

  // Clear attempts on successful login
  const clearAttempts = useCallback(async (email: string): Promise<void> => {
    try {
      const key = getStorageKey(email);
      await AsyncStorage.removeItem(key);
      setLockoutExpiry(null);
      setCurrentAttempts(0);
    } catch (error) {
      logger.error('Error clearing login attempts:', error);
    }
  }, []);

  // Update remaining time every second when locked
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!lockoutExpiry) return;

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      if (now >= lockoutExpiry) {
        setLockoutExpiry(null);
        setCurrentAttempts(0);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [lockoutExpiry]);

  const lockoutRemainingMs = lockoutExpiry ? Math.max(0, lockoutExpiry - Date.now()) : null;
  const remainingAttempts = Math.max(0, MAX_ATTEMPTS - currentAttempts);

  return {
    isLocked: lockoutExpiry !== null && lockoutExpiry > Date.now(),
    currentAttempts,
    remainingAttempts,
    lockoutRemainingMs,
    checkLockout,
    recordFailedAttempt,
    clearAttempts,
    getCurrentAttempts,
  };
}

/**
 * Get the number of remaining attempts for an email.
 * Returns MAX_ATTEMPTS if no previous attempts.
 */
export async function getRemainingAttempts(email: string): Promise<number> {
  try {
    const hash = hashEmail(email);
    const key = `${STORAGE_KEY_PREFIX}${hash}`;
    const data = await AsyncStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data) as LoginAttemptData;
      if (parsed.lockedUntil && Date.now() >= parsed.lockedUntil) {
        return MAX_ATTEMPTS;
      }
      return Math.max(0, MAX_ATTEMPTS - (parsed.attempts || 0));
    }
    return MAX_ATTEMPTS;
  } catch {
    return MAX_ATTEMPTS;
  }
}

/**
 * Get lockout remaining time in a human-readable format.
 */
export function formatLockoutTime(ms: number | null): string {
  if (!ms || ms <= 0) return '';

  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export { MAX_ATTEMPTS, LOCKOUT_DURATION_MS };
