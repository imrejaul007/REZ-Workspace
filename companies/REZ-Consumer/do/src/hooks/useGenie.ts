/**
 * useGenie - Genie Dashboard & Twins Integration for DO App
 *
 * Connects DO App to:
 * - Genie Dashboard
 * - Personal Twin
 * - Relationship Twin
 * - Founder Twin
 * - Health Twin
 * - Financial Twin
 *
 * Usage:
 * ```typescript
 * import { useGenie } from '@/hooks/useGenie';
 *
 * function Dashboard() {
 *   const { dashboard, twins, isLoading } = useGenie(userId);
 *
 *   // Show Genie dashboard
 *   return <GenieDashboard data={dashboard} />;
 *
 *   // Access Personal Twin
 *   const preferences = twins.personal?.preferences;
 * }
 * ```
 */

import { useState, useCallback } from 'react';
import axios from 'axios';

// ============================================
// CONFIG
// ============================================

const GENIE_API_KEY = process.env.EXPO_PUBLIC_HOJAI_GENIE_API_KEY || '';
const GENIE_DASHBOARD = process.env.EXPO_PUBLIC_GENIE_DASHBOARD_URL || 'http://localhost:4701';
const GENIE_PERSONAL_TWIN = process.env.EXPO_PUBLIC_GENIE_PERSONAL_TWIN_URL || 'http://localhost:4708';
const GENIE_RELATIONSHIP_TWIN = process.env.EXPO_PUBLIC_GENIE_RELATIONSHIP_TWIN_URL || 'http://localhost:4705';
const GENIE_FOUNDER_TWIN = process.env.EXPO_PUBLIC_GENIE_FOUNDER_TWIN_URL || 'http://localhost:4709';
const GENIE_HEALTH_TWIN = process.env.EXPO_PUBLIC_GENIE_HEALTH_TWIN_URL || 'http://localhost:4730';
const GENIE_FINANCIAL_TWIN = process.env.EXPO_PUBLIC_GENIE_FINANCIAL_TWIN_URL || 'http://localhost:4731';

// ============================================
// TYPES
// ============================================

export interface DashboardData {
  greeting: string;
  totalMemories: number;
  upcomingEvents: number;
  unreadEmails: number;
  pendingTasks: number;
  quickActions: QuickAction[];
  insights: Insight[];
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: string;
}

export interface Insight {
  id: string;
  type: 'memory' | 'pattern' | 'suggestion';
  title: string;
  description: string;
}

export interface PersonalTwin {
  id: string;
  user_id: string;
  identity: {
    name: string;
    occupation?: string;
  };
  profile: {
    interests: string[];
    personality: Record<string, number>;
  };
  preferences: {
    food: { cuisines: string[]; dietary_restrictions: string[] };
    travel: { destinations: string[] };
    shopping: { brands: string[] };
  };
  goals: Goal[];
  behavioral: {
    engagement_score: number;
    active_hours: number[];
  };
}

export interface Goal {
  id: string;
  title: string;
  status: string;
  progress: number;
}

export interface RelationshipTwin {
  total_relationships: number;
  healthy_count: number;
  at_risk_count: number;
  needs_attention: Array<{
    id: string;
    name: string;
    health_score: number;
    last_interaction: string;
  }>;
}

export interface GenieOptions {
  enabled?: boolean;
  onError?: (error: string) => void;
}

// ============================================
// API CLIENT
// ============================================

const api = axios.create({
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': GENIE_API_KEY,
  },
});

// ============================================
// HOOK
// ============================================

export function useGenie(userId: string, options: GenieOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const opts = { enabled: true, onError: () => {}, ...options };

  // ============================================
  // API HELPERS
  // ============================================

  const apiRequest = async <T>(baseUrl: string, endpoint: string): Promise<T | null> => {
    if (!userId) return null;
    try {
      const response = await api.get<T>(`${baseUrl}${endpoint}`, {
        headers: { 'X-User-Id': userId },
      });
      return response.data;
    } catch (err: any) {
      const msg = err.message || 'API request failed';
      setError(msg);
      opts.onError?.(msg);
      return null;
    }
  };

  // ============================================
  // DASHBOARD
  // ============================================

  const getDashboard = useCallback(async (): Promise<DashboardData | null> => {
    setIsLoading(true);
    const data = await apiRequest<{ data: DashboardData }>(GENIE_DASHBOARD, '/api/dashboard');
    setIsLoading(false);
    return data?.data || null;
  }, [userId]);

  const getSummary = useCallback(async () => {
    return apiRequest<any>(GENIE_DASHBOARD, '/api/summary');
  }, [userId]);

  const getQuickActions = useCallback(async () => {
    return apiRequest<any>(GENIE_DASHBOARD, '/api/quick-actions');
  }, [userId]);

  const searchGenie = useCallback(async (query: string) => {
    return apiRequest<any>(GENIE_DASHBOARD, `/api/search?q=${encodeURIComponent(query)}`);
  }, [userId]);

  // ============================================
  // PERSONAL TWIN
  // ============================================

  const getPersonalTwin = useCallback(async (): Promise<PersonalTwin | null> => {
    const data = await apiRequest<{ data: PersonalTwin }>(GENIE_PERSONAL_TWIN, '/api/twin');
    return data?.data || null;
  }, [userId]);

  const getTwinSummary = useCallback(async () => {
    return apiRequest<any>(GENIE_PERSONAL_TWIN, '/api/twin/summary');
  }, [userId]);

  const getTwinRecommendations = useCallback(async () => {
    return apiRequest<any>(GENIE_PERSONAL_TWIN, '/api/twin/recommendations');
  }, [userId]);

  const learnPreference = useCallback(async (category: string, key: string, value: unknown) => {
    return apiRequest<any>(GENIE_PERSONAL_TWIN, '/api/twin/learn', {
      method: 'POST',
      data: { category, key, value },
    });
  }, [userId]);

  // ============================================
  // RELATIONSHIP TWIN
  // ============================================

  const getRelationships = useCallback(async (): Promise<RelationshipTwin | null> => {
    const data = await apiRequest<{ data: RelationshipTwin }>(GENIE_RELATIONSHIP_TWIN, '/api/relationships/summary');
    return data?.data || null;
  }, [userId]);

  const addRelationship = useCallback(async (person: { name: string; type: string; person_id: string }) => {
    return apiRequest<any>(GENIE_RELATIONSHIP_TWIN, '/api/relationships', {
      method: 'POST',
      data: person,
    });
  }, [userId]);

  const addInteraction = useCallback(async (relationshipId: string, interaction: { type: string; notes?: string }) => {
    return apiRequest<any>(GENIE_RELATIONSHIP_TWIN, `/api/relationships/${relationshipId}/interactions`, {
      method: 'POST',
      data: interaction,
    });
  }, [userId]);

  // ============================================
  // FOUNDER TWIN
  // ============================================

  const getFounderTwin = useCallback(async () => {
    return apiRequest<any>(GENIE_FOUNDER_TWIN, '/api/founder/summary');
  }, [userId]);

  // ============================================
  // HEALTH TWIN
  // ============================================

  const getHealthTwin = useCallback(async () => {
    return apiRequest<any>(GENIE_HEALTH_TWIN, '/api/health/summary');
  }, [userId]);

  // ============================================
  // FINANCIAL TWIN
  // ============================================

  const getFinancialTwin = useCallback(async () => {
    return apiRequest<any>(GENIE_FINANCIAL_TWIN, '/api/financial/summary');
  }, [userId]);

  // ============================================
  // GET ALL TWINS
  // ============================================

  const getAllTwins = useCallback(async () => {
    setIsLoading(true);
    const [personal, relationships, founder, health, financial] = await Promise.all([
      getPersonalTwin(),
      getRelationships(),
      getFounderTwin(),
      getHealthTwin(),
      getFinancialTwin(),
    ]);
    setIsLoading(false);

    return { personal, relationships, founder, health, financial };
  }, [userId, getPersonalTwin, getRelationships, getFounderTwin, getHealthTwin, getFinancialTwin]);

  return {
    // State
    isLoading,
    error,

    // Dashboard
    getDashboard,
    getSummary,
    getQuickActions,
    searchGenie,

    // Personal Twin
    getPersonalTwin,
    getTwinSummary,
    getTwinRecommendations,
    learnPreference,

    // Relationship Twin
    getRelationships,
    addRelationship,
    addInteraction,

    // Other Twins
    getFounderTwin,
    getHealthTwin,
    getFinancialTwin,

    // All
    getAllTwins,
  };
}

export default useGenie;
