/**
 * REZ CorpPerks → Intelligence Connector
 *
 * Connects enterprise data to REZ Intelligence
 *
 * Tracks:
 * - Employee engagement
 * - Productivity patterns
 * - Wellness signals
 * - Enterprise insights
 */

import axios from 'axios';

// ============================================================================
// Configuration
// ============================================================================

const EVENT_BUS_URL = process.env.EVENT_BUS_URL || 'http://localhost:4025';
const INTENT_SERVICE_URL = process.env.INTENT_SERVICE_URL || 'http://localhost:4018';

// ============================================================================
// Types
// ============================================================================

export interface EmployeeEngagement {
  employeeId: string;
  companyId: string;
  metrics: {
    attendance: number; // 0-100%
    productivity: number; // 0-100%
    wellness: number; // 0-100%
    engagement: number; // 0-100%
  };
  patterns: {
    peakHours: number[];
    preferredWorkStyle: 'morning' | 'afternoon' | 'evening' | 'flexible';
    collaborationScore: number;
  };
}

export interface WellnessSignal {
  employeeId: string;
  companyId: string;
  type: 'step_count' | 'mood_check' | 'stress_level' | 'sleep_quality';
  value: number;
  timestamp: string;
}

export interface ProductivityInsight {
  employeeId: string;
  companyId: string;
  insights: {
    type: 'focus_time' | 'meeting_overload' | 'burnout_risk' | 'engagement_drop';
    severity: 'low' | 'medium' | 'high';
    recommendation: string;
  }[];
}

// ============================================================================
// CorpPerks Intelligence Connector
// ============================================================================

class CorpPerksIntelligenceConnector {

  // ============================================
  // Engagement Tracking
  // ============================================

  /**
   * Track employee engagement
   */
  async trackEngagement(engagement: EmployeeEngagement): Promise<void> {
    // Emit event
    await this.emitEvent({
      type: 'enterprise.engagement.updated',
      userId: engagement.employeeId,
      data: {
        companyId: engagement.companyId,
        metrics: engagement.metrics,
        patterns: engagement.patterns
      }
    });

    // Update intent signals
    await this.updateIntent({
      userId: engagement.employeeId,
      intent: `enterprise_engagement_${engagement.patterns.preferredWorkStyle}`,
      strength: engagement.metrics.engagement / 100,
      metadata: {
        companyId: engagement.companyId,
        productivity: engagement.metrics.productivity
      }
    });
  }

  /**
   * Track wellness signal
   */
  async trackWellness(signal: WellnessSignal): Promise<void> {
    await this.emitEvent({
      type: 'enterprise.wellness.signal',
      userId: signal.employeeId,
      data: {
        companyId: signal.companyId,
        type: signal.type,
        value: signal.value
      }
    });

    // Alert if burnout risk detected
    if (signal.type === 'stress_level' && signal.value > 80) {
      await this.emitEvent({
        type: 'enterprise.burnout.risk_detected',
        userId: signal.employeeId,
        data: {
          companyId: signal.companyId,
          stressLevel: signal.value,
          recommendation: 'Consider wellness break'
        }
      });
    }
  }

  // ============================================
  // AI Insights
  // ============================================

  /**
   * Get productivity insights
   */
  async getInsights(employeeId: string): Promise<ProductivityInsight> {
    return {
      employeeId,
      companyId: 'default',
      insights: [
        {
          type: 'meeting_overload',
          severity: 'medium',
          recommendation: 'Consider blocking 2 hours of focus time daily'
        }
      ]
    };
  }

  /**
   * Get team health score
   */
  async getTeamHealth(companyId: string): Promise<{
    companyId: string;
    healthScore: number;
    riskFactors: string[];
    recommendations: string[];
  }> {
    return {
      companyId,
      healthScore: 78,
      riskFactors: ['High meeting load', 'Low wellness scores'],
      recommendations: [
        'Encourage wellness breaks',
        'Reduce meeting hours by 20%'
      ]
    };
  }

  // ============================================
  // Enterprise Signals
  // ============================================

  /**
   * Get behavior signals for enterprise
   */
  async getBehaviorSignals(companyId: string): Promise<{
    signals: {
      type: string;
      count: number;
      trend: 'up' | 'down' | 'stable';
    }[];
  }> {
    return {
      signals: [
        { type: 'engagement', count: 1500, trend: 'up' },
        { type: 'wellness_checkins', count: 890, trend: 'stable' },
        { type: 'productivity', count: 1200, trend: 'down' }
      ]
    };
  }

  // ============================================
  // Private Methods
  // ============================================

  private async emitEvent(event: {
    type: string;
    userId?: string;
    data: Record<string, unknown>;
  }): Promise<void> {
    try {
      await axios.post(`${EVENT_BUS_URL}/api/events`, {
        ...event,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to emit event:', error);
    }
  }

  private async updateIntent(data: {
    userId: string;
    intent: string;
    strength: number;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await axios.post(`${INTENT_SERVICE_URL}/api/intents`, data);
    } catch (error) {
      console.error('Failed to update intent:', error);
    }
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const corpperksConnector = new CorpPerksIntelligenceConnector();
export default corpperksConnector;
