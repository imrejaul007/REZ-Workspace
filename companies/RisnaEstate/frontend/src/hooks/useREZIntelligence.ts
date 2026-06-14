/**
 * RisnaEstate - REZ Intelligence Integration
 * Uses REZ Intelligence for predictions, recommendations, lead scoring
 */

import { useState, useEffect, useCallback } from 'react';

const REZ_INTELLIGENCE_URL = process.env.NEXT_PUBLIC_REZ_INTELLIGENCE_URL || 'https://rez-intelligence.rez.app';

interface LeadProfile {
  name: string;
  phone: string;
  email?: string;
  source: string;
  budget?: { min: number; max: number; currency: string };
  timeline?: string;
  purpose?: string;
  propertyTypes?: string[];
  interestedCountries?: string[];
}

interface IntelligenceScore {
  overall: number;
  nriProbability: number;
  hniScore: number;
  investorScore: number;
  visaProbability: number;
  urgencyScore: number;
  recommendations: string[];
  segment: string;
}

interface PropertyRecommendation {
  propertyId: string;
  score: number;
  reason: string;
}

export function useREZIntelligence() {
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeLead = async (profile: LeadProfile): Promise<IntelligenceScore> => {
    setAnalyzing(true);
    try {
      const res = await fetch(`${REZ_INTELLIGENCE_URL}/api/intelligence/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      const data = await res.json();
      return data.data;
    } finally {
      setAnalyzing(false);
    }
  };

  const getNRIProbability = async (phone: string, email?: string) => {
    const res = await fetch(`${REZ_INTELLIGENCE_URL}/api/intelligence/nri-score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, email })
    });
    return (await res.json()).data;
  };

  const getHNIScore = async (profile: LeadProfile) => {
    const res = await fetch(`${REZ_INTELLIGENCE_URL}/api/intelligence/hni-score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    return (await res.json()).data;
  };

  const getInvestorScore = async (profile: LeadProfile) => {
    const res = await fetch(`${REZ_INTELLIGENCE_URL}/api/intelligence/investor-score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    return (await res.json()).data;
  };

  const predictIntent = async (userId: string) => {
    const res = await fetch(`${REZ_INTELLIGENCE_URL}/api/intent/predict/${userId}`);
    return (await res.json()).data;
  };

  const getRecommendations = async (userId: string, limit = 10): Promise<PropertyRecommendation[]> => {
    const res = await fetch(`${REZ_INTELLIGENCE_URL}/api/recommendations/${userId}?limit=${limit}`);
    const data = await res.json();
    return data.data;
  };

  const predictChurn = async (userId: string) => {
    const res = await fetch(`${REZ_INTELLIGENCE_URL}/api/churn/predict/${userId}`);
    return (await res.json()).data;
  };

  const getLTV = async (userId: string) => {
    const res = await fetch(`${REZ_INTELLIGENCE_URL}/api/ltv/${userId}`);
    return (await res.json()).data;
  };

  return {
    analyzing,
    analyzeLead,
    getNRIProbability,
    getHNIScore,
    getInvestorScore,
    predictIntent,
    getRecommendations,
    predictChurn,
    getLTV
  };
}

// Hook for real-time lead scoring
export function useLiveLeadScore(leadId: string | null) {
  const [score, setScore] = useState<IntelligenceScore | null>(null);

  useEffect(() => {
    if (!leadId) return;
    const poll = setInterval(async () => {
      // Poll for score updates
      // In production, use WebSocket subscription
    }, 30000);
    return () => clearInterval(poll);
  }, [leadId]);

  return score;
}
