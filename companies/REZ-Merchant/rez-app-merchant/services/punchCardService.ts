/**
 * Punch Card Tracking Service
 *
 * Hooks and utilities for punch card functionality
 * Connected to: https://rez-karma-service.onrender.com
 */

import { useState, useCallback, useEffect } from 'react';
import { loyaltyService, PunchCard } from './loyalty';
import { logger } from '../utils/logger';

// ============== Types ==============

export interface PunchCardProgress {
  punchCardId: string;
  name: string;
  totalStamps: number;
  currentStamps: number;
  progress: number; // 0-100
  isCompleted: boolean;
  rewardDescription: string;
  expiresAt?: string;
}

export interface IssueStampResult {
  success: boolean;
  currentStamps: number;
  isCompleted: boolean;
  reward?: string;
  error?: string;
}

// ============== Punch Card Hook ==============

/**
 * Hook for tracking punch card progress for a customer
 */
export function usePunchCardProgress(merchantId: string, customerId: string) {
  const [punchCards, setPunchCards] = useState<PunchCardProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPunchCards = useCallback(async () => {
    if (!merchantId || !customerId) return;

    try {
      setLoading(true);
      setError(null);

      const cards = await loyaltyService.getMemberPunchCards(merchantId, customerId);

      const progress: PunchCardProgress[] = cards.map((card) => ({
        punchCardId: card.id,
        name: card.name,
        totalStamps: card.totalStamps,
        currentStamps: card.currentStamps,
        progress: Math.round((card.currentStamps / card.totalStamps) * 100),
        isCompleted: card.isCompleted,
        rewardDescription: card.rewardDescription,
        expiresAt: card.expiresAt,
      }));

      setPunchCards(progress);
    } catch (err) {
      setError(err.message);
      logger.error('[usePunchCardProgress] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [merchantId, customerId]);

  useEffect(() => {
    loadPunchCards();
  }, [loadPunchCards]);

  return { punchCards, loading, error, refetch: loadPunchCards };
}

// ============== Issue Stamp Hook ==============

/**
 * Hook for issuing stamps on punch cards
 */
export function usePunchCardStamp(merchantId: string) {
  const [issuing, setIssuing] = useState(false);
  const [result, setResult] = useState<IssueStampResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const issueStamp = useCallback(
    async (customerId: string, punchCardId: string): Promise<IssueStampResult> => {
      if (!merchantId) {
        return { success: false, currentStamps: 0, isCompleted: false, error: 'Merchant ID not found' };
      }

      try {
        setIssuing(true);
        setError(null);
        setResult(null);

        const stampResult = await loyaltyService.issueStamp(merchantId, customerId, punchCardId);

        const issueResult: IssueStampResult = {
          success: stampResult.success,
          currentStamps: stampResult.currentStamps,
          isCompleted: stampResult.isCompleted,
          reward: stampResult.reward,
        };

        setResult(issueResult);
        return issueResult;
      } catch (err) {
        const errorResult: IssueStampResult = {
          success: false,
          currentStamps: 0,
          isCompleted: false,
          error: err.message || 'Failed to issue stamp',
        };
        setError(err.message);
        setResult(errorResult);
        return errorResult;
      } finally {
        setIssuing(false);
      }
    },
    [merchantId]
  );

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { issueStamp, issuing, result, error, clearResult };
}

// ============== Punch Card Manager Hook ==============

/**
 * Hook for managing punch cards (create, update, delete)
 */
export function usePunchCardManager(merchantId: string) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPunchCard = useCallback(
    async (cardData: {
      name: string;
      description: string;
      totalStamps: number;
      rewardDescription: string;
      expiresInDays?: number;
    }): Promise<{ id: string; name: string } | null> => {
      if (!merchantId) {
        setError('Merchant ID not found');
        return null;
      }

      try {
        setCreating(true);
        setError(null);

        const result = await loyaltyService.createPunchCard(merchantId, cardData);
        return result;
      } catch (err) {
        setError(err.message);
        logger.error('[usePunchCardManager] Create error:', err);
        return null;
      } finally {
        setCreating(false);
      }
    },
    [merchantId]
  );

  const deletePunchCard = useCallback(async (punchCardId: string): Promise<boolean> => {
    if (!merchantId) {
      setError('Merchant ID not found');
      return false;
    }

    // Note: This would need a delete endpoint in the karma service
    logger.warn('[usePunchCardManager] Delete not implemented - needs karma service endpoint');
    return false;
  }, [merchantId]);

  return { createPunchCard, deletePunchCard, creating, error };
}

// ============== Utility Functions ==============

/**
 * Format punch card progress for display
 */
export function formatPunchCardProgress(progress: PunchCardProgress): {
  progressText: string;
  progressColor: string;
  isExpiring: boolean;
} {
  const stampsRemaining = progress.totalStamps - progress.currentStamps;

  let progressText: string;
  if (progress.isCompleted) {
    progressText = 'Completed!';
  } else if (stampsRemaining === 1) {
    progressText = '1 stamp to go!';
  } else {
    progressText = `${stampsRemaining} stamps to go`;
  }

  let progressColor: string;
  if (progress.isCompleted) {
    progressColor = '#059669'; // green
  } else if (progress.progress >= 75) {
    progressColor = '#6366f1'; // indigo
  } else if (progress.progress >= 50) {
    progressColor = '#f59e0b'; // amber
  } else {
    progressColor = '#6b7280'; // gray
  }

  const isExpiring =
    progress.expiresAt && new Date(progress.expiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  return { progressText, progressColor, isExpiring: !!isExpiring };
}

/**
 * Generate stamp icons for display
 */
export function generateStampDisplay(
  totalStamps: number,
  currentStamps: number,
  maxDisplay: number = 10
): Array<{ filled: boolean; index: number }> {
  const displayStamps = Math.min(totalStamps, maxDisplay);
  const stamps = [];

  for (let i = 0; i < displayStamps; i++) {
    stamps.push({
      filled: i < currentStamps,
      index: i,
    });
  }

  return stamps;
}

// ============== Punch Card History ==============

export interface PunchCardTransaction {
  id: string;
  punchCardId: string;
  punchCardName: string;
  stampsEarned: number;
  totalStamps: number;
  isCompleted: boolean;
  rewardRedeemed?: string;
  createdAt: string;
}

/**
 * Hook for punch card transaction history
 */
export function usePunchCardHistory(merchantId: string, customerId: string) {
  const [transactions, setTransactions] = useState<PunchCardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!merchantId || !customerId) return;

    try {
      setLoading(true);
      setError(null);

      // Get point history which includes punch card activity
      const history = await loyaltyService.getPointHistory(merchantId, customerId, 1, 50);

      // Filter and transform punch card related transactions
      const punchCardTxns: PunchCardTransaction[] = history.transactions
        .filter((t) => t.description.toLowerCase().includes('stamp') || t.type === 'earn')
        .map((t) => ({
          id: t.id,
          punchCardId: '', // Would need to be included in the response
          punchCardName: 'Punch Card',
          stampsEarned: t.type === 'earn' ? 1 : 0,
          totalStamps: 0,
          isCompleted: false,
          createdAt: t.createdAt,
        }));

      setTransactions(punchCardTxns);
    } catch (err) {
      setError(err.message);
      logger.error('[usePunchCardHistory] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [merchantId, customerId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return { transactions, loading, error, refetch: loadHistory };
}
