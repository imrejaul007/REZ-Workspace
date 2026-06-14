/**
 * Fraud Detection Hook
 * Connects to REZ-fraud-detection (Port 4059)
 * Transaction monitoring and risk assessment
 */

import { useState, useCallback } from 'react';
import { useAuthUser } from '@/stores/selectors';
import apiClient from '@/services/apiClient';

const FRAUD_URL = process.env.EXPO_PUBLIC_FRAUD_URL || 'https://REZ-fraud-detection.onrender.com';

export interface RiskAssessment {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: {
    type: string;
    impact: number;
    description: string;
  }[];
  recommendations: string[];
  timestamp: string;
}

export interface TransactionContext {
  amount: number;
  currency: string;
  paymentMethod: 'upi' | 'card' | 'wallet' | 'netbanking';
  merchantId?: string;
  category?: string;
  deviceId?: string;
  ipAddress?: string;
  location?: {
    country: string;
    city?: string;
  };
}

export function useFraudDetection() {
  const user = useAuthUser();

  const assessTransaction = useCallback(async (
    transactionId: string,
    context: TransactionContext
  ): Promise<RiskAssessment | null> => {
    if (!user?.id) return null;

    try {
      const response = await apiClient.post(`${FRAUD_URL}/assess`, {
        userId: user.id,
        transactionId,
        ...context,
      });

      if (response.success && response.data) {
        return response.data as RiskAssessment;
      }
      return null;
    } catch {
      return null;
    }
  }, [user?.id]);

  const checkVelocityLimits = useCallback(async (
    windowMinutes: number = 60
  ) => {
    if (!user?.id) return null;

    try {
      const response = await apiClient.get(`${FRAUD_URL}/velocity/${user.id}`, {
        windowMinutes,
      });

      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch {
      return null;
    }
  }, [user?.id]);

  const reportFraud = useCallback(async (
    transactionId: string,
    fraudType: string,
    details: string
  ) => {
    if (!user?.id) return { success: false };

    try {
      const response = await apiClient.post(`${FRAUD_URL}/report`, {
        userId: user.id,
        transactionId,
        fraudType,
        details,
        reportedAt: new Date().toISOString(),
      });

      return response;
    } catch {
      return { success: false, error: 'Failed to report fraud' };
    }
  }, [user?.id]);

  const getUserRiskProfile = useCallback(async () => {
    if (!user?.id) return null;

    try {
      const response = await apiClient.get(`${FRAUD_URL}/profile/${user.id}`);

      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch {
      return null;
    }
  }, [user?.id]);

  return {
    assessTransaction,
    checkVelocityLimits,
    reportFraud,
    getUserRiskProfile,
  };
}

export function useDeviceFingerprint() {
  const user = useAuthUser();
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateFingerprint = useCallback(async () => {
    setLoading(true);

    try {
      const components = [
        navigator.userAgent,
        navigator.language,
        screen.width,
        screen.height,
        screen.colorDepth,
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || 'unknown',
        navigator.platform,
      ].join('|');

      // Simple hash function
      let hash = 0;
      for (let i = 0; i < components.length; i++) {
        const char = components.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }

      const deviceId = `web_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
      setFingerprint(deviceId);

      // Optionally sync with server
      if (user?.id) {
        await apiClient.post(`${FRAUD_URL}/device`, {
          userId: user.id,
          fingerprint: deviceId,
          components: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            screenSize: `${screen.width}x${screen.height}`,
            platform: navigator.platform,
          },
        }).catch(() => {});
      }

      return deviceId;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  return { fingerprint, loading, generateFingerprint };
}
