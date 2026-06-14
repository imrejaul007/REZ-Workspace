/**
 * REZ Business AI - API Service
 * Connects app to AI backend
 */

const API_BASE = process.env.EXPO_PUBLIC_AI_URL || 'https://rez-business-ai.rezapp.com';

export interface AISuggestion {
  id: string;
  type: 'campaign' | 'retention' | 'pricing' | 'inventory' | 'growth';
  title: string;
  description: string;
  estimatedImpact: { revenue: number; customers: number; roi: number };
  confidence: number;
  status: 'pending' | 'approved' | 'rejected' | 'executing';
  agent: string;
  reasoning: string;
  createdAt: string;
}

export interface BusinessHealth {
  score: number;
  revenue: number;
  customers: number;
  orders: number;
  retention: number;
  streak: number;
  achievements: Achievement[];
  pendingActions: AISuggestion[];
  lastUpdated: string;
}

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  unlocked: boolean;
  unlockedAt?: string;
}

// Get business health
export async function getBusinessHealth(merchantId: string): Promise<BusinessHealth> {
  try {
    const res = await fetch(`${API_BASE}/api/business-ai/health?merchantId=${merchantId}`);
    if (res.ok) {
      return res.json();
    }
  } catch (e) {
    // Fallback mock
  }
  return getMockHealth();
}

// Get suggestions
export async function getSuggestions(merchantId: string): Promise<AISuggestion[]> {
  try {
    const res = await fetch(`${API_BASE}/api/business-ai/suggestions?merchantId=${merchantId}`);
    if (res.ok) {
      const data = await res.json();
      return data.suggestions || [];
    }
  } catch (e) {
    // Fallback mock
  }
  return getMockSuggestions();
}

// Approve action
export async function approveAction(suggestionId: string, merchantId: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/api/business-ai/actions/${suggestionId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchantId }),
  });
  return res.json();
}

// Dismiss action
export async function dismissAction(suggestionId: string, merchantId: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/api/business-ai/actions/${suggestionId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchantId }),
  });
  return res.json();
}

// Execute all approved
export async function executeAllApproved(merchantId: string): Promise<{ executed: number }> {
  const res = await fetch(`${API_BASE}/api/business-ai/execute-all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchantId }),
  });
  return res.json();
}

// Mock data for fallback
function getMockHealth(): BusinessHealth {
  return {
    score: 87,
    revenue: 12500,
    customers: 45,
    orders: 120,
    retention: 78,
    streak: 7,
    achievements: [
      { id: '1', emoji: '🎯', title: 'First Campaign', unlocked: true, unlockedAt: '2024-05-12' },
      { id: '2', emoji: '🔥', title: '7-Day Streak', unlocked: true, unlockedAt: '2024-05-13' },
      { id: '3', emoji: '🚀', title: '100 Orders', unlocked: false },
      { id: '4', emoji: '👑', title: 'VIP Status', unlocked: false },
    ],
    pendingActions: [],
    lastUpdated: new Date().toISOString(),
  };
}

function getMockSuggestions(): AISuggestion[] {
  return [
    {
      id: 'suggest-1',
      type: 'campaign',
      title: 'Launch Weekend Rush',
      description: 'Weekend traffic typically 40% higher - perfect time',
      estimatedImpact: { revenue: 8000, customers: 40, roi: 2.5 },
      confidence: 85,
      status: 'pending',
      agent: 'marketing-agent',
      reasoning: 'Historical data shows strong weekend demand',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'suggest-2',
      type: 'retention',
      title: 'Win-Back Campaign',
      description: '3 customers inactive 14+ days',
      estimatedImpact: { revenue: 5000, customers: 15, roi: 3.2 },
      confidence: 92,
      status: 'pending',
      agent: 'retention-agent',
      reasoning: 'High-value customers showing churn signals',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'suggest-3',
      type: 'pricing',
      title: 'Apply Happy Hour Pricing',
      description: 'Evening demand detected, adjust pricing',
      estimatedImpact: { revenue: 3000, customers: 20, roi: 2.1 },
      confidence: 72,
      status: 'pending',
      agent: 'pricing-agent',
      reasoning: 'Time-based pricing opportunity',
      createdAt: new Date().toISOString(),
    },
  ];
}
