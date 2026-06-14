/**
 * REZ BUSINESS AI SERVICE
 * Connects to Port 4059
 */

export const BUSINESS_AI_URL = process.env.BUSINESS_AI_URL || 'http://localhost:4059';

export interface AISuggestion {
  id: string;
  type: 'campaign' | 'retention' | 'pricing' | 'inventory' | 'retention';
  title: string;
  description: string;
  estimated_impact: { revenue: number; customers: number; roi: number };
  confidence: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface BusinessHealth {
  score: number;
  revenue: number;
  customers: number;
  orders: number;
  retention: number;
  streak_days: number;
}

export async function getBusinessHealth(merchantId: string): Promise<BusinessHealth> {
  const res = await fetch(`${BUSINESS_AI_URL}/api/business-ai/health/${merchantId}`);
  if (!res.ok) throw new Error('Failed to fetch health');
  return res.json();
}

export async function getSuggestions(merchantId: string): Promise<AISuggestion[]> {
  const res = await fetch(`${BUSINESS_AI_URL}/api/business-ai/suggestions?merchant=${merchantId}`);
  if (!res.ok) throw new Error('Failed to fetch suggestions');
  const data = await res.json();
  return data.suggestions || [];
}

export async function approveSuggestion(suggestionId: string): Promise<void> {
  await fetch(`${BUSINESS_AI_URL}/api/business-ai/actions/${suggestionId}/approve`, { method: 'POST' });
}

export async function rejectSuggestion(suggestionId: string): Promise<void> {
  await fetch(`${BUSINESS_AI_URL}/api/business-ai/actions/${suggestionId}/reject`, { method: 'POST' });
}

export async function getAttribution(merchantId: string): Promise<unknown> {
  const res = await fetch(`${BUSINESS_AI_URL}/api/business-ai/attribution/${merchantId}`);
  return res.json();
}

export async function getIntelligence(merchantId: string): Promise<unknown> {
  const res = await fetch(`${BUSINESS_AI_URL}/api/business-ai/intelligence/${merchantId}`);
  return res.json();
}
