/**
 * REZ Business AI - Playbook Engine
 *
 * Industry-specific automation playbooks
 */

import { BusinessIntelligence, AIAction } from '../types';

export interface Playbook {
  id: string;
  name: string;
  businessType: string[];
  trigger: PlaybookTrigger;
  actions: PlaybookAction[];
  constraints: PlaybookConstraints;
  priority: 'critical' | 'high' | 'medium' | 'low';
  effectiveness?: number;
}

export interface PlaybookTrigger {
  type: 'event' | 'weather' | 'time' | 'demand' | 'customer' | 'competitor';
  conditions: TriggerCondition[];
}

export interface TriggerCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains' | 'between';
  value;
}

export interface PlaybookAction {
  type: string;
  params: Record<string, unknown>;
  delay?: number; // minutes
  sequence: number;
}

export interface PlaybookConstraints {
  maxDiscount: number;
  maxBudget: number;
  requireApproval: boolean;
  maxFrequency: number; // per day
}

export class PlaybookEngine {
  private playbooks: Map<string, Playbook> = new Map();

  constructor() {
    this.initializePlaybooks();
  }

  /**
   * Initialize industry-specific playbooks
   */
  private initializePlaybooks() {
    // Restaurant Playbooks
    this.registerPlaybook({
      id: 'restaurant-lunch-rush',
      name: 'Lunch Rush Boost',
      businessType: ['restaurant'],
      trigger: {
        type: 'time',
        conditions: [
          { field: 'hour', operator: 'between', value: [11, 14] },
          { field: 'day', operator: 'ne', value: [0, 6] }, // Not weekend
        ],
      },
      actions: [
        { type: 'pricing_adjustment', params: { discount: 10, items: ['combo'] }, sequence: 1 },
        { type: 'push_notification', params: { title: 'Lunch Special!', message: '20% off on combos' }, sequence: 2 },
      ],
      constraints: { maxDiscount: 15, maxBudget: 1000, requireApproval: false, maxFrequency: 2 },
      priority: 'high',
      effectiveness: 0.85,
    });

    this.registerPlaybook({
      id: 'restaurant-dinner-peak',
      name: 'Dinner Peak Maximizer',
      businessType: ['restaurant'],
      trigger: {
        type: 'time',
        conditions: [
          { field: 'hour', operator: 'between', value: [19, 21] },
        ],
      },
      actions: [
        { type: 'pricing_adjustment', params: { premium: true, items: ['premium'] }, sequence: 1 },
        { type: 'whatsapp_campaign', params: { segment: 'high_value', offer: 'VIP dinner' }, sequence: 2 },
      ],
      constraints: { maxDiscount: 5, maxBudget: 500, requireApproval: false, maxFrequency: 2 },
      priority: 'high',
      effectiveness: 0.78,
    });

    this.registerPlaybook({
      id: 'restaurant-rainy-day',
      name: 'Rainy Day Delivery Boost',
      businessType: ['restaurant'],
      trigger: {
        type: 'weather',
        conditions: [
          { field: 'condition', operator: 'eq', value: 'rainy' },
        ],
      },
      actions: [
        { type: 'offer_launch', params: { type: 'free_delivery', minOrder: 200 }, sequence: 1 },
        { type: 'push_notification', params: { title: 'Rain? We deliver!', message: 'Free delivery on rainy days' }, sequence: 2 },
        { type: 'cashback_offer', params: { percent: 15, maxCashback: 100 }, sequence: 3 },
      ],
      constraints: { maxDiscount: 20, maxBudget: 2000, requireApproval: true, maxFrequency: 1 },
      priority: 'critical',
      effectiveness: 0.92,
    });

    this.registerPlaybook({
      id: 'restaurant-ipl-match',
      name: 'IPL Match Campaign',
      businessType: ['restaurant'],
      trigger: {
        type: 'event',
        conditions: [
          { field: 'eventType', operator: 'eq', value: 'sports' },
          { field: 'eventName', operator: 'contains', value: 'IPL' },
        ],
      },
      actions: [
        { type: 'campaign_create', params: { type: 'sports', theme: 'cricket' }, sequence: 1 },
        { type: 'pricing_adjustment', params: { discount: 25, items: ['beer', 'snacks'] }, sequence: 2 },
        { type: 'whatsapp_campaign', params: { segment: 'sports_fans', offer: 'Match combo' }, sequence: 3 },
        { type: 'influencer_activate', params: { count: 5 }, sequence: 4 },
      ],
      constraints: { maxDiscount: 30, maxBudget: 5000, requireApproval: true, maxFrequency: 1 },
      priority: 'critical',
      effectiveness: 0.88,
    });

    // Salon Playbooks
    this.registerPlaybook({
      id: 'salon-weekday-slots',
      name: 'Weekday Slot Filler',
      businessType: ['salon'],
      trigger: {
        type: 'demand',
        conditions: [
          { field: 'hour', operator: 'between', value: [10, 16] },
          { field: 'day', operator: 'ne', value: [0, 6] },
        ],
      },
      actions: [
        { type: 'offer_launch', params: { type: 'weekday_discount', discount: 20 }, sequence: 1 },
        { type: 'whatsapp_campaign', params: { segment: 'inactive_30_days', offer: 'Refresh yourself' }, sequence: 2 },
      ],
      constraints: { maxDiscount: 25, maxBudget: 1500, requireApproval: false, maxFrequency: 3 },
      priority: 'medium',
      effectiveness: 0.72,
    });

    this.registerPlaybook({
      id: 'salon-wedding-season',
      name: 'Wedding Season Package',
      businessType: ['salon'],
      trigger: {
        type: 'event',
        conditions: [
          { field: 'eventType', operator: 'eq', value: 'festival' },
          { field: 'eventName', operator: 'contains', value: ['wedding', 'marriage', 'festive'] },
        ],
      },
      actions: [
        { type: 'campaign_create', params: { type: 'wedding', theme: 'bridal' }, sequence: 1 },
        { type: 'offer_launch', params: { type: 'package', discount: 30 }, sequence: 2 },
        { type: 'loyalty_boost', params: { bonusPoints: 500 }, sequence: 3 },
      ],
      constraints: { maxDiscount: 35, maxBudget: 3000, requireApproval: true, maxFrequency: 1 },
      priority: 'high',
      effectiveness: 0.82,
    });

    // Hotel Playbooks
    this.registerPlaybook({
      id: 'hotel-checkin-welcome',
      name: 'Welcome Offer',
      businessType: ['hotel'],
      trigger: {
        type: 'event',
        conditions: [
          { field: 'eventType', operator: 'eq', value: 'checkin' },
        ],
      },
      actions: [
        { type: 'notification', params: { channel: 'in_app', message: 'Welcome! 10% off on spa' }, sequence: 1 },
        { type: 'loyalty_points', params: { bonusPoints: 100, reason: 'Welcome' }, sequence: 2 },
      ],
      constraints: { maxDiscount: 15, maxBudget: 500, requireApproval: false, maxFrequency: 1 },
      priority: 'medium',
      effectiveness: 0.68,
    });

    this.registerPlaybook({
      id: 'hotel-low-occupancy',
      name: 'Occupancy Booster',
      businessType: ['hotel'],
      trigger: {
        type: 'demand',
        conditions: [
          { field: 'occupancy', operator: 'lt', value: 50 },
        ],
      },
      actions: [
        { type: 'offer_launch', params: { type: 'last_minute', discount: 25 }, sequence: 1 },
        { type: 'ota_promotion', params: { channels: ['booking', 'goibibo'] }, sequence: 2 },
      ],
      constraints: { maxDiscount: 30, maxBudget: 5000, requireApproval: true, maxFrequency: 2 },
      priority: 'high',
      effectiveness: 0.75,
    });

    // Gym Playbooks
    this.registerPlaybook({
      id: 'gym-january-resolution',
      name: 'New Year Resolution Push',
      businessType: ['gym'],
      trigger: {
        type: 'event',
        conditions: [
          { field: 'month', operator: 'eq', value: 0 }, // January
        ],
      },
      actions: [
        { type: 'campaign_create', params: { type: 'resolution', theme: 'fitness' }, sequence: 1 },
        { type: 'offer_launch', params: { type: 'join_bonus', discount: 20 }, sequence: 2 },
        { type: 'referral_campaign', params: { reward: '1 month free' }, sequence: 3 },
      ],
      constraints: { maxDiscount: 25, maxBudget: 10000, requireApproval: true, maxFrequency: 1 },
      priority: 'critical',
      effectiveness: 0.91,
    });

    this.registerPlaybook({
      id: 'gym-churn-risk',
      name: 'Member Retention',
      businessType: ['gym'],
      trigger: {
        type: 'customer',
        conditions: [
          { field: 'attendanceRate', operator: 'lt', value: 30 },
          { field: 'membershipDays', operator: 'gt', value: 60 },
        ],
      },
      actions: [
        { type: 'personal_offer', params: { type: 'comeback', discount: 50 }, sequence: 1 },
        { type: 'whatsapp_campaign', params: { message: 'We miss you at the gym!' }, sequence: 2 },
        { type: 'call_reminder', params: { priority: 'high' }, sequence: 3 },
      ],
      constraints: { maxDiscount: 50, maxBudget: 2000, requireApproval: false, maxFrequency: 1 },
      priority: 'critical',
      effectiveness: 0.88,
    });

    // Healthcare Playbooks
    this.registerPlaybook({
      id: 'healthcare-followup',
      name: 'Appointment Follow-up',
      businessType: ['clinic', 'pharmacy'],
      trigger: {
        type: 'customer',
        conditions: [
          { field: 'lastVisit', operator: 'gt', value: 30 },
        ],
      },
      actions: [
        { type: 'reminder', params: { channel: 'whatsapp', message: 'Time for your checkup' }, sequence: 1 },
        { type: 'offer_launch', params: { type: 'followup_discount', discount: 15 }, sequence: 2 },
      ],
      constraints: { maxDiscount: 20, maxBudget: 500, requireApproval: false, maxFrequency: 1 },
      priority: 'high',
      effectiveness: 0.78,
    });
  }

  /**
   * Register a playbook
   */
  private registerPlaybook(playbook: Playbook) {
    this.playbooks.set(playbook.id, playbook);
  }

  /**
   * Get playbooks for business type
   */
  getPlaybooksForBusiness(businessType: string): Playbook[] {
    return Array.from(this.playbooks.values()).filter(p =>
      p.businessType.includes(businessType)
    );
  }

  /**
   * Check if playbook triggers match conditions
   */
  checkTrigger(playbook: Playbook, context: Record<string, unknown>): boolean {
    return playbook.trigger.conditions.every(condition => {
      const value = context[condition.field];
      return this.evaluateCondition(condition, value);
    });
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: TriggerCondition, value): boolean {
    switch (condition.operator) {
      case 'eq':
        return value === condition.value;
      case 'ne':
        return value !== condition.value;
      case 'gt':
        return value > condition.value;
      case 'lt':
        return value < condition.value;
      case 'contains':
        return String(condition.value).toLowerCase().includes(String(value).toLowerCase());
      case 'between':
        return value >= condition.value[0] && value <= condition.value[1];
      default:
        return false;
    }
  }

  /**
   * Get triggered playbooks for context
   */
  getTriggeredPlaybooks(
    businessType: string,
    intelligence: BusinessIntelligence
  ): Playbook[] {
    const playbooks = this.getPlaybooksForBusiness(businessType);
    const context = this.buildContext(intelligence);

    return playbooks.filter(playbook => this.checkTrigger(playbook, context));
  }

  /**
   * Build context from intelligence
   */
  private buildContext(intelligence: BusinessIntelligence): Record<string, unknown> {
    const hour = new Date().getHours();
    const day = new Date().getDay();
    const month = new Date().getMonth();

    return {
      hour,
      day,
      month,
      weather: intelligence.weatherImpact?.condition || 'unknown',
      demandLevel: intelligence.demandSignals[0]?.strength || 0,
      occupancy: intelligence.financialHealth?.healthScore || 50,
      events: intelligence.eventImpact.map(e => e.event),
      eventTypes: intelligence.eventImpact.map(e => e.type),
    };
  }

  /**
   * Execute playbook actions
   */
  executePlaybook(playbook: Playbook): PlaybookAction[] {
    // Sort by sequence and add delays
    return playbook.actions
      .sort((a, b) => a.sequence - b.sequence)
      .map(action => ({
        ...action,
        delay: (action.delay || action.sequence * 5) * 60 * 1000, // Convert to ms
      }));
  }

  /**
   * Get playbook recommendations
   */
  getRecommendations(businessType: string, intelligence: BusinessIntelligence): {
    playbook: Playbook;
    actions: PlaybookAction[];
    estimatedImpact: { revenue: number; customers: number; roi: number };
  }[] {
    const triggeredPlaybooks = this.getTriggeredPlaybooks(businessType, intelligence);

    return triggeredPlaybooks.map(playbook => ({
      playbook,
      actions: this.executePlaybook(playbook),
      estimatedImpact: {
        revenue: Math.round((playbook.effectiveness || 0.7) * 10000),
        customers: Math.round((playbook.effectiveness || 0.7) * 50),
        roi: (playbook.effectiveness || 0.7) * 2.5,
      },
    }));
  }
}

export const playbookEngine = new PlaybookEngine();
