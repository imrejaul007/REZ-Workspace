/**
 * Predictive Engine Hooks
 * React hooks for AI-powered predictions
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthUser } from '@/stores/selectors';
import {
  getChurnPrediction,
  getLTVPrediction,
  getRevisitPrediction,
  getConversionPrediction,
  getAllPredictions,
  getUserSegment,
  getChurnRiskLabel,
  getTierColor,
  getConversionStageLabel,
  ChurnPrediction,
  LTVPrediction,
  RevisitPrediction,
  ConversionPrediction,
  UserSegment,
} from '@/services/predictiveService';

// ============================================================================
// CHURN PREDICTION HOOK
// ============================================================================

interface UseChurnPredictionReturn {
  prediction: ChurnPrediction | null;
  loading: boolean;
  riskLabel: string;
  riskColor: string;
  needsAttention: boolean;
}

export function useChurnPrediction(): UseChurnPredictionReturn {
  const user = useAuthUser();
  const [prediction, setPrediction] = useState<ChurnPrediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrediction() {
      if (!user?.id) {
        setPrediction(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await getChurnPrediction(user.id);
        if (response.success && response.data) {
          setPrediction(response.data);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }

    fetchPrediction();
  }, [user?.id]);

  const riskLabel = prediction
    ? `${prediction.risk.charAt(0).toUpperCase() + prediction.risk.slice(1)} Risk`
    : 'Unknown';

  const riskColors = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#F97316',
    critical: '#EF4444',
  };
  const riskColor = prediction ? riskColors[prediction.risk] : '#9CA3AF';

  return {
    prediction,
    loading,
    riskLabel,
    riskColor,
    needsAttention: prediction ? prediction.risk === 'high' || prediction.risk === 'critical' : false,
  };
}

// ============================================================================
// LTV PREDICTION HOOK
// ============================================================================

interface UseLTVPredictionReturn {
  prediction: LTVPrediction | null;
  loading: boolean;
  tierColor: string;
  formattedLTV: string;
  isHighValue: boolean;
}

export function useLTVPrediction(): UseLTVPredictionReturn {
  const user = useAuthUser();
  const [prediction, setPrediction] = useState<LTVPrediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrediction() {
      if (!user?.id) {
        setPrediction(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await getLTVPrediction(user.id);
        if (response.success && response.data) {
          setPrediction(response.data);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }

    fetchPrediction();
  }, [user?.id]);

  const formattedLTV = prediction
    ? `₹${prediction.predictedLTV['365d'].toLocaleString()}`
    : '₹0';

  return {
    prediction,
    loading,
    tierColor: prediction ? getTierColor(prediction.tier) : '#9CA3AF',
    formattedLTV,
    isHighValue: prediction ? prediction.tier === 'gold' || prediction.tier === 'platinum' : false,
  };
}

// ============================================================================
// REVISIT PREDICTION HOOK
// ============================================================================

interface UseRevisitPredictionReturn {
  prediction: RevisitPrediction | null;
  loading: boolean;
  daysUntil: number;
  isDueSoon: boolean;
  timeUntilEngagement: string;
}

export function useRevisitPrediction(): UseRevisitPredictionReturn {
  const user = useAuthUser();
  const [prediction, setPrediction] = useState<RevisitPrediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrediction() {
      if (!user?.id) {
        setPrediction(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await getRevisitPrediction(user.id);
        if (response.success && response.data) {
          setPrediction(response.data);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }

    fetchPrediction();
  }, [user?.id]);

  const daysUntil = prediction?.daysUntilRevisit || 0;

  // Calculate time until engagement window
  const timeUntilEngagement = prediction?.optimalEngagementWindow
    ? new Date(prediction.optimalEngagementWindow.start).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return {
    prediction,
    loading,
    daysUntil,
    isDueSoon: daysUntil <= 1,
    timeUntilEngagement,
  };
}

// ============================================================================
// CONVERSION PREDICTION HOOK
// ============================================================================

interface UseConversionPredictionReturn {
  prediction: ConversionPrediction | null;
  loading: boolean;
  stageLabel: string;
  probabilityPercent: string;
  recommendedOffer: ConversionPrediction['incentives'][0] | null;
}

export function useConversionPrediction(): UseConversionPredictionReturn {
  const user = useAuthUser();
  const [prediction, setPrediction] = useState<ConversionPrediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrediction() {
      if (!user?.id) {
        setPrediction(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await getConversionPrediction(user.id);
        if (response.success && response.data) {
          setPrediction(response.data);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }

    fetchPrediction();
  }, [user?.id]);

  const stageLabel = prediction ? getConversionStageLabel(prediction.stage) : 'Unknown';
  const probabilityPercent = prediction ? `${prediction.probability}%` : '0%';
  const recommendedOffer = prediction?.incentives[0] || null;

  return {
    prediction,
    loading,
    stageLabel,
    probabilityPercent,
    recommendedOffer,
  };
}

// ============================================================================
// ALL PREDICTIONS HOOK (Combined Dashboard)
// ============================================================================

interface UseAllPredictionsReturn {
  churn: ChurnPrediction | null;
  ltv: LTVPrediction | null;
  revisit: RevisitPrediction | null;
  segment: UserSegment | null;
  loading: boolean;
  error: string | null;
  insights: string[];
  actionItems: Array<{ priority: 'high' | 'medium' | 'low'; action: string }>;
}

export function useAllPredictions(): UseAllPredictionsReturn {
  const user = useAuthUser();
  const [churn, setChurn] = useState<ChurnPrediction | null>(null);
  const [ltv, setLtv] = useState<LTVPrediction | null>(null);
  const [revisit, setRevisit] = useState<RevisitPrediction | null>(null);
  const [segment, setSegment] = useState<UserSegment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [predictionsRes, segmentRes] = await Promise.all([
          getAllPredictions(user.id),
          getUserSegment(user.id),
        ]);

        if (predictionsRes.success && predictionsRes.data) {
          setChurn(predictionsRes.data.churn);
          setLtv(predictionsRes.data.ltv);
          setRevisit(predictionsRes.data.revisit);
        }

        if (segmentRes.success && segmentRes.data) {
          setSegment(segmentRes.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load predictions');
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [user?.id]);

  // Generate insights
  const insights: string[] = [];
  if (churn) {
    if (churn.risk === 'high' || churn.risk === 'critical') {
      insights.push(`High churn risk detected (${churn.score}%) - consider retention offer`);
    }
  }
  if (ltv) {
    if (ltv.tier === 'platinum') {
      insights.push(`VIP customer - prioritize for exclusive offers`);
    }
  }
  if (revisit) {
    if (revisit.daysUntilRevisit <= 1) {
      insights.push(`User likely to return today - good time for retargeting`);
    }
  }

  // Generate action items
  const actionItems: UseAllPredictionsReturn['actionItems'] = [];
  if (churn?.recommendedActions) {
    churn.recommendedActions.forEach((action) => {
      actionItems.push({
        priority: action.priority <= 1 ? 'high' : action.priority <= 3 ? 'medium' : 'low',
        action: action.description,
      });
    });
  }

  return {
    churn,
    ltv,
    revisit,
    segment,
    loading,
    error,
    insights,
    actionItems,
  };
}
