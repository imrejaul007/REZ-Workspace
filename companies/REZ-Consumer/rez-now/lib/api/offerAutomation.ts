/**
 * Offer Automation API Client
 * Frontend API calls for the merchant offer automation feature.
 */

import { authClient } from './client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type RuleType =
  | 'dormant_customer'
  | 'happy_hour'
  | 'low_footfall'
  | 'birthday'
  | 'first_visit'
  | 'milestone_visit'
  | 'weather_trigger';

export type OfferType = 'cashback' | 'discount' | 'free_item';
export type NotificationChannel = 'whatsapp' | 'push' | 'sms';

export interface TriggerConfig {
  daysSinceLastVisit?: number;
  startTime?: string;
  endTime?: string;
  activeDays?: number[];
  revenueThreshold?: number;
  period?: 'day' | 'week';
  daysBefore?: number;
  daysAfter?: number;
  visitCounts?: number[];
  condition?: 'rain' | 'hot' | 'cold';
  city?: string;
}

export interface OfferConfig {
  type: OfferType;
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  validityDays: number;
  title: string;
  message: string;
}

export interface OfferRule {
  _id: string;
  storeId: string;
  merchantId: string;
  type: RuleType;
  triggerConfig: { type: RuleType; config: TriggerConfig };
  offerConfig: OfferConfig;
  notificationChannel: NotificationChannel;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEntry {
  _id: string;
  ruleId: string;
  customerId: { _id: string; fullName?: string; profile?: { phone?: string; firstName?: string; lastName?: string } };
  triggerType: string;
  offerTitle: string;
  offerMessage: string;
  offerSent: boolean;
  offerUsed: boolean;
  offerUsedAt?: string;
  revenue?: number;
  notificationChannel: NotificationChannel;
  sentAt: string;
  createdAt: string;
}

export interface AuditStats {
  totalSent: number;
  totalUsed: number;
  totalRevenue: number;
}

export interface PaginatedRules {
  data: OfferRule[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface AuditResponse {
  audits: AuditEntry[];
  stats: AuditStats;
  pagination: { page: number; limit: number; total: number };
}

// ── API Calls ─────────────────────────────────────────────────────────────────

export async function getOfferRules(storeId: string, params?: {
  type?: RuleType;
  enabled?: boolean;
  page?: number;
  limit?: number;
}): Promise<PaginatedRules> {
  const { data } = await authClient.get(`/api/merchants/${storeId}/offer-rules`, { params });
  return data.data as PaginatedRules;
}

export async function createOfferRule(
  storeId: string,
  payload: {
    type: RuleType;
    triggerConfig: TriggerConfig;
    offerConfig: OfferConfig;
    notificationChannel: NotificationChannel;
    enabled?: boolean;
  },
): Promise<OfferRule> {
  const { data } = await authClient.post(`/api/merchants/${storeId}/offer-rules`, payload);
  return data.data as OfferRule;
}

export async function updateOfferRule(
  storeId: string,
  ruleId: string,
  payload: Partial<{
    triggerConfig: TriggerConfig;
    offerConfig: OfferConfig;
    notificationChannel: NotificationChannel;
    enabled: boolean;
  }>,
): Promise<OfferRule> {
  const { data } = await authClient.patch(`/api/merchants/${storeId}/offer-rules/${ruleId}`, payload);
  return data.data as OfferRule;
}

export async function deleteOfferRule(storeId: string, ruleId: string): Promise<void> {
  await authClient.delete(`/api/merchants/${storeId}/offer-rules/${ruleId}`);
}

export async function getRuleAudit(
  storeId: string,
  ruleId: string,
  params?: { page?: number; limit?: number },
): Promise<AuditResponse> {
  const { data } = await authClient.get(`/api/merchants/${storeId}/offer-rules/${ruleId}/audit`, { params });
  return data.data as AuditResponse;
}

// ── Helper: Build trigger description string ───────────────────────────────────

const RULE_LABELS: Record<RuleType, string> = {
  dormant_customer: 'Dormant Customer',
  happy_hour: 'Happy Hour',
  low_footfall: 'Low Footfall',
  birthday: 'Birthday',
  first_visit: 'First Visit',
  milestone_visit: 'Milestone Visit',
  weather_trigger: 'Weather Trigger',
};

const RULE_COLORS: Record<RuleType, string> = {
  dormant_customer: 'bg-orange-100 text-orange-800',
  happy_hour: 'bg-yellow-100 text-yellow-800',
  low_footfall: 'bg-blue-100 text-blue-800',
  birthday: 'bg-pink-100 text-pink-800',
  first_visit: 'bg-green-100 text-green-800',
  milestone_visit: 'bg-purple-100 text-purple-800',
  weather_trigger: 'bg-gray-100 text-gray-800',
};

export function getRuleLabel(type: RuleType): string {
  return RULE_LABELS[type] ?? type;
}

export function getRuleColor(type: RuleType): string {
  return RULE_COLORS[type] ?? 'bg-gray-100 text-gray-800';
}

export function formatTriggerDescription(rule: OfferRule): string {
  const { type, config } = rule.triggerConfig;
  switch (type) {
    case 'dormant_customer':
      return `No visit in ${config.daysSinceLastVisit ?? 14} days`;
    case 'happy_hour':
      return `${config.startTime}–${config.endTime} on ${(config.activeDays ?? []).join(', ')}`;
    case 'low_footfall':
      return `Revenue < ₹${config.revenueThreshold ?? 0} per ${config.period ?? 'day'}`;
    case 'birthday':
      return `${config.daysBefore ?? 0} days before – ${config.daysAfter ?? 0} days after`;
    case 'first_visit':
      return '1st order at store';
    case 'milestone_visit':
      return `Visits: ${(config.visitCounts ?? []).join(', ')}`;
    case 'weather_trigger':
      return `${config.condition} in ${config.city ?? 'city'}`;
    default:
      return '';
  }
}
