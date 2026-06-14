/**
 * Karma → REZ Intelligence Continuous Data Flow
 *
 * Ensures Karma continuously feeds data to Intelligence for better insights:
 * - User actions → CDP
 * - Karma events → Signal Aggregator
 * - Mission completions → Recommendation Engine
 * - Trust scores → Identity Graph
 * - Impact data → Predictive Engine
 */

import axios from 'axios';
import { EventEmitter } from 'events';

const CDP_URL = process.env.CDP_URL || 'https://REZ-cdp-service.onrender.com';
const SIGNAL_URL = process.env.SIGNAL_URL || 'https://REZ-signal-aggregator.onrender.com';
const SEGMENTS_URL = process.env.SEGMENTS_URL || 'https://REZ-realtime-segments.onrender.com';
const INTERNAL_KEY = process.env.INTERNAL_SERVICE_TOKEN || 'your-key';

// ============================================
// KARM A → INTELLIGENCE DATA FLOW
// ============================================

class KarmaIntelligenceFlow extends EventEmitter {
  private buffer: Event[] = [];
  private flushInterval: NodeJS.Timeout;
  private readonly BUFFER_SIZE = 100;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds

  constructor() {
    super();
    this.startFlushInterval();
  }

  // ==========================================
  // USER ACTIONS → CDP
  // ==========================================

  /**
   * Track karma action to CDP
   */
  async trackKarmaAction(data: KarmaAction): Promise<void> {
    const event: Event = {
      type: 'karma.action',
      user_id: data.user_id,
      data: {
        action: data.action,
        karma_points: data.points,
        mission_id: data.mission_id,
        tier: data.tier,
        timestamp: new Date().toISOString()
      },
      source: 'karma-service'
    };

    this.buffer.push(event);

    // Emit for real-time processing
    this.emit('karma_action', data);

    // Immediate sync for important events
    if (data.action === 'mission_complete' || data.action === 'donation') {
      await this.syncToCDP(data);
    }
  }

  // ==========================================
  // MISSION EVENTS → SIGNAL AGGREGATOR
  // ==========================================

  /**
   * Track mission events
   */
  async trackMissionEvent(data: MissionEvent): Promise<void> {
    const event: Event = {
      type: 'karma.mission',
      user_id: data.user_id,
      data: {
        mission_id: data.mission_id,
        mission_type: data.mission_type,
        cause: data.cause,
        impact_score: data.impact_score,
        timestamp: new Date().toISOString()
      },
      source: 'karma-service'
    };

    this.buffer.push(event);
    this.emit('mission_event', data);
  }

  // ==========================================
  // TRUST UPDATES → IDENTITY GRAPH
  // ==========================================

  /**
   * Update trust score in Identity Graph
   */
  async updateTrustScore(data: TrustUpdate): Promise<void> {
    try {
      await axios.patch(`${SIGNAL_URL}/api/trust`, {
        user_id: data.user_id,
        trust_score: data.trust_score,
        trust_factors: data.trust_factors,
        source: 'karma'
      }, {
        headers: { 'X-Internal-Token': INTERNAL_KEY },
        timeout: 2000
      });

      logger.info(`[Karma→Intelligence] Trust score updated for ${data.user_id}: ${data.trust_score}`);
    } catch (error) {
      logger.error('[Karma→Intelligence] Trust update failed', { error });
    }
  }

  // ==========================================
  // SEGMENT UPDATES → REALTIME SEGMENTS
  // ==========================================

  /**
   * Update user segments
   */
  async updateSegments(userId: string, segments: string[]): Promise<void> {
    try {
      await axios.post(`${SEGMENTS_URL}/api/update`, {
        user_id: userId,
        segments,
        source: 'karma'
      }, {
        headers: { 'X-Internal-Token': INTERNAL_KEY },
        timeout: 2000
      });
    } catch (error) {
      logger.error('[Karma→Intelligence] Segment update failed', { error });
    }
  }

  // ==========================================
  // IMPACT DATA → CDP
  // ==========================================

  /**
   * Sync impact data to CDP
   */
  async syncImpactData(data: ImpactData): Promise<void> {
    try {
      await axios.patch(`${CDP_URL}/api/profiles/${data.user_id}`, {
        karma_impact: {
          total_impact_score: data.total_impact_score,
          causes_supported: data.causes,
          carbon_saved: data.carbon_saved,
          lives_impacted: data.lives_impacted,
          volunteering_hours: data.volunteering_hours,
          last_synced: new Date().toISOString()
        }
      }, {
        headers: { 'X-Internal-Token': INTERNAL_KEY }
      });
    } catch (error) {
      logger.error('[Karma→Intelligence] Impact sync failed', { error });
    }
  }

  // ==========================================
  // CONTINUOUS DATA FLOW
  // ==========================================

  /**
   * Start continuous data flow
   */
  start(): void {
    logger.info('[Karma→Intelligence] Continuous data flow started');
  }

  /**
   * Stop data flow
   */
  stop(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushBuffer();
    logger.info('[Karma→Intelligence] Data flow stopped');
  }

  /**
   * Buffer flush interval
   */
  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flushBuffer();
    }, this.FLUSH_INTERVAL);
  }

  /**
   * Flush buffered events to Signal Aggregator
   */
  private async flushBuffer(): Promise<void> {
    if (this.buffer.length === 0) return;

    const events = this.buffer.splice(0, this.BUFFER_SIZE);

    try {
      await axios.post(`${SIGNAL_URL}/api/events/batch`, {
        events
      }, {
        headers: { 'X-Internal-Token': INTERNAL_KEY },
        timeout: 5000
      });

      logger.info(`[Karma→Intelligence] Flushed ${events.length} events to Intelligence`);
    } catch (error) {
      // Re-add to buffer on failure
      this.buffer.unshift(...events);
      logger.error('[Karma→Intelligence] Flush failed, events buffered');
    }
  }

  /**
   * Immediate sync to CDP
   */
  private async syncToCDP(data: KarmaAction): Promise<void> {
    try {
      await axios.patch(`${CDP_URL}/api/profiles/${data.user_id}`, {
        karma: {
          last_action: data.action,
          last_action_at: new Date().toISOString(),
          karma_points: data.points,
          tier: data.tier
        }
      }, {
        headers: { 'X-Internal-Token': INTERNAL_KEY }
      });
    } catch (error) {
      logger.error('[Karma→Intelligence] CDP sync failed', { error });
    }
  }
}

// ============================================
// TYPES
// ============================================

interface Event {
  type: string;
  user_id: string;
  data;
  source: string;
  timestamp: string;
}

interface KarmaAction {
  user_id: string;
  action: string;
  points: number;
  mission_id?: string;
  tier: string;
}

interface MissionEvent {
  user_id: string;
  mission_id: string;
  mission_type: string;
  cause: string;
  impact_score: number;
}

interface TrustUpdate {
  user_id: string;
  trust_score: number;
  trust_factors: string[];
}

interface ImpactData {
  user_id: string;
  total_impact_score: number;
  causes: string[];
  carbon_saved: number;
  lives_impacted: number;
  volunteering_hours: number;
}

// ============================================
// SINGLETON
// ============================================

let karmaIntelligenceFlow: KarmaIntelligenceFlow | null = null;

export function initKarmaIntelligence(): KarmaIntelligenceFlow {
  if (!karmaIntelligenceFlow) {
    karmaIntelligenceFlow = new KarmaIntelligenceFlow();
    karmaIntelligenceFlow.start();
  }
  return karmaIntelligenceFlow;
}

export function getKarmaIntelligence(): KarmaIntelligenceFlow {
  if (!karmaIntelligenceFlow) {
    return initKarmaIntelligence();
  }
  return karmaIntelligenceFlow;
}

// ============================================
// EXPRESS ROUTES
// ============================================

import express from 'express';
import { logger } from './utils/logger';
const router = express.Router();

/**
 * POST /api/karma/track/action
 * Track karma action (called from karma service)
 */
router.post('/track/action', async (req, res) => {
  const flow = getKarmaIntelligence();
  await flow.trackKarmaAction(req.body);
  res.json({ tracked: true });
});

/**
 * POST /api/karma/track/mission
 * Track mission event
 */
router.post('/track/mission', async (req, res) => {
  const flow = getKarmaIntelligence();
  await flow.trackMissionEvent(req.body);
  res.json({ tracked: true });
});

/**
 * POST /api/karma/track/impact
 * Sync impact data
 */
router.post('/track/impact', async (req, res) => {
  const flow = getKarmaIntelligence();
  await flow.syncImpactData(req.body);
  res.json({ synced: true });
});

/**
 * POST /api/karma/track/segments
 * Update user segments
 */
router.post('/track/segments', async (req, res) => {
  const flow = getKarmaIntelligence();
  await flow.updateSegments(req.body.user_id, req.body.segments);
  res.json({ updated: true });
});

/**
 * POST /api/karma/track/trust
 * Update trust score
 */
router.post('/track/trust', async (req, res) => {
  const flow = getKarmaIntelligence();
  await flow.updateTrustScore(req.body);
  res.json({ updated: true });
});

export { router as intelligenceRouter };

export default {
  initKarmaIntelligence,
  getKarmaIntelligence
};
