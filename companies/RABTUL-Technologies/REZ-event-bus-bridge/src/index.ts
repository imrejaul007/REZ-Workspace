/**
 * REZ Event Bus Bridge
 *
 * Bidirectional sync between RABTUL Event Bus (4025) and HOJAI Event Bus (4510)
 *
 * Purpose: Connect the two event bus systems so events flow between
 * RABTUL services and HOJAI AI services seamlessly.
 */

import express, { Request, Response } from 'express';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

// ============================================
// CONFIGURATION
// ============================================

const RABTUL_EVENT_BUS = process.env.RABTUL_EVENT_BUS || 'http://localhost:4025';
const HOJAI_EVENT_BUS = process.env.HOJAI_EVENT_BUS || 'http://localhost:4510';
const BRIDGE_ID = process.env.BRIDGE_ID || uuidv4();
const INTERNAL_KEY = process.env.INTERNAL_SERVICE_TOKEN || 'your-internal-token';

// ============================================
// EVENT TYPE MAPPING
// ============================================

interface EventMapping {
  rabtulToHojai: Record<string, string>;
  hojaiToRabtul: Record<string, string>;
}

const EVENT_MAPPING: EventMapping = {
  // Commerce events
  rabtulToHojai: {
    'commerce.order.created': 'hojai.commerce.order.created',
    'commerce.order.completed': 'hojai.commerce.order.completed',
    'commerce.payment.completed': 'hojai.commerce.payment.completed',
    'commerce.cart.abandoned': 'hojai.commerce.cart.abandoned',
  },
  hojaiToRabtul: {
    'hojai.commerce.order.created': 'commerce.order.created',
    'hojai.commerce.order.completed': 'commerce.order.completed',
    'hojai.commerce.payment.completed': 'commerce.payment.completed',
  },
};

// ============================================
// EVENT BRIDGE CLASS
// ============================================

class EventBusBridge {
  private eventBuffer: Array<{
    event: unknown;
    source: 'rabtul' | 'hojai';
    timestamp: number;
    retryCount: number;
  }> = [];

  private isRunning = false;
  private pollInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startPolling();
  }

  /**
   * Forward event from RABTUL to HOJAI
   */
  async forwardToHojai(event: unknown): Promise<boolean> {
    try {
      const mappedEvent = this.mapEvent(event, 'rabtul');

      await axios.post(`${HOJAI_EVENT_BUS}/api/events`, mappedEvent, {
        headers: {
          'X-Internal-Token': INTERNAL_KEY,
          'X-Bridge-ID': BRIDGE_ID,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      console.log(`[Bridge] Forwarded to HOJAI: ${(event as { type: string })?.type}`);
      return true;
    } catch (error) {
      console.error(`[Bridge] Failed to forward to HOJAI:`, error);
      this.bufferEvent(event, 'rabtul');
      return false;
    }
  }

  /**
   * Forward event from HOJAI to RABTUL
   */
  async forwardToRabtul(event: unknown): Promise<boolean> {
    try {
      const mappedEvent = this.mapEvent(event, 'hojai');

      await axios.post(`${RABTUL_EVENT_BUS}/api/events`, mappedEvent, {
        headers: {
          'X-Internal-Token': INTERNAL_KEY,
          'X-Bridge-ID': BRIDGE_ID,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      console.log(`[Bridge] Forwarded to RABTUL: ${(event as { type: string })?.type}`);
      return true;
    } catch (error) {
      console.error(`[Bridge] Failed to forward to RABTUL:`, error);
      this.bufferEvent(event, 'hojai');
      return false;
    }
  }

  /**
   * Map event type between bus systems
   */
  private mapEvent(event: unknown, direction: 'rabtul' | 'hojai'): unknown {
    const e = event as { type: string; [key: string]: unknown };
    const mapping = direction === 'rabtul' ? EVENT_MAPPING.rabtulToHojai : EVENT_MAPPING.hojaiToRabtul;

    const mappedType = mapping[e.type] || e.type;

    return {
      ...e,
      type: mappedType,
      metadata: {
        ...e.metadata,
        bridge_id: BRIDGE_ID,
        original_type: e.type,
        bridged_at: new Date().toISOString(),
      },
    };
  }

  /**
   * Buffer failed events for retry
   */
  private bufferEvent(event: unknown, source: 'rabtul' | 'hojai') {
    this.eventBuffer.push({
      event,
      source,
      timestamp: Date.now(),
      retryCount: 0,
    });

    // Keep buffer size manageable
    if (this.eventBuffer.length > 1000) {
      this.eventBuffer = this.eventBuffer.slice(-500);
    }
  }

  /**
   * Retry buffered events
   */
  async retryBufferedEvents(): Promise<void> {
    const toRetry = this.eventBuffer.filter(e => e.retryCount < 3);

    for (const item of toRetry) {
      const success = item.source === 'rabtul'
        ? await this.forwardToHojai(item.event)
        : await this.forwardToRabtul(item.event);

      if (success) {
        this.eventBuffer = this.eventBuffer.filter(e => e !== item);
      } else {
        item.retryCount++;
      }
    }
  }

  /**
   * Start polling for events from both buses
   */
  private startPolling() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Poll every 5 seconds
    this.pollInterval = setInterval(async () => {
      await this.pollRABTUL();
      await this.pollHOJAI();
      await this.retryBufferedEvents();
    }, 5000);

    console.log('[Bridge] Event polling started');
  }

  /**
   * Poll RABTUL Event Bus for new events
   */
  private async pollRABTUL(): Promise<void> {
    try {
      const response = await axios.get(`${RABTUL_EVENT_BUS}/api/events/recent`, {
        params: { limit: 10 },
        timeout: 3000,
      });

      if (response.data?.events) {
        for (const event of response.data.events) {
          // Skip events we already bridged
          if ((event as { metadata?: { bridge_id?: string } }).metadata?.bridge_id === BRIDGE_ID) {
            continue;
          }
          await this.forwardToHojai(event);
        }
      }
    } catch (error) {
      // Silent fail - bus might be down
    }
  }

  /**
   * Poll HOJAI Event Bus for new events
   */
  private async pollHOJAI(): Promise<void> {
    try {
      const response = await axios.get(`${HOJAI_EVENT_BUS}/api/events/recent`, {
        params: { limit: 10 },
        timeout: 3000,
      });

      if (response.data?.events) {
        for (const event of response.data.events) {
          // Skip events we already bridged
          if ((event as { metadata?: { bridge_id?: string } }).metadata?.bridge_id === BRIDGE_ID) {
            continue;
          }
          await this.forwardToRabtul(event);
        }
      }
    } catch (error) {
      // Silent fail - bus might be down
    }
  }

  /**
   * Get bridge statistics
   */
  getStats() {
    return {
      bridge_id: BRIDGE_ID,
      is_running: this.isRunning,
      buffered_events: this.eventBuffer.length,
      connected_buses: {
        rabtul: RABTUL_EVENT_BUS,
        hojai: HOJAI_EVENT_BUS,
      },
    };
  }

  /**
   * Stop the bridge
   */
  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isRunning = false;
    console.log('[Bridge] Event polling stopped');
  }
}

// ============================================
// INITIALIZE BRIDGE
// ============================================

const bridge = new EventBusBridge();

// ============================================
// HEALTH ENDPOINTS
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'REZ-event-bus-bridge',
    bridge_id: BRIDGE_ID,
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/ready', (req: Request, res: Response) => {
  res.json({
    status: 'ready',
    ...bridge.getStats(),
  });
});

// ============================================
// PROXY ENDPOINTS
// ============================================

/**
 * Proxy to RABTUL Event Bus
 * POST /api/rabtul/events
 */
app.post('/api/rabtul/events', async (req: Request, res: Response) => {
  try {
    const success = await bridge.forwardToHojai(req.body);
    res.json({ success, bridged_to: 'hojai' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

/**
 * Proxy to HOJAI Event Bus
 * POST /api/hojai/events
 */
app.post('/api/hojai/events', async (req: Request, res: Response) => {
  try {
    const success = await bridge.forwardToRabtul(req.body);
    res.json({ success, bridged_to: 'rabtul' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

/**
 * Get bridge statistics
 * GET /api/stats
 */
app.get('/api/stats', (req: Request, res: Response) => {
  res.json({ success: true, stats: bridge.getStats() });
});

/**
 * Get event mappings
 * GET /api/mappings
 */
app.get('/api/mappings', (req: Request, res: Response) => {
  res.json({ success: true, mappings: EVENT_MAPPING });
});

/**
 * Add custom event mapping
 * POST /api/mappings
 */
app.post('/api/mappings', (req: Request, res: Response) => {
  const { direction, sourceType, targetType } = req.body;

  if (!direction || !sourceType || !targetType) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  if (direction === 'rabtul-to-hojai') {
    EVENT_MAPPING.rabtulToHojai[sourceType] = targetType;
  } else if (direction === 'hojai-to-rabtul') {
    EVENT_MAPPING.hojaiToRabtul[sourceType] = targetType;
  } else {
    return res.status(400).json({ success: false, error: 'Invalid direction' });
  }

  res.json({ success: true, mappings: EVENT_MAPPING });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 4090;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(parseInt(PORT as string), HOST as string, () => {
  console.log(`[REZ Event Bus Bridge] Running on http://${HOST}:${PORT}`);
  console.log(`[REZ Event Bus Bridge] Bridge ID: ${BRIDGE_ID}`);
  console.log(`[REZ Event Bus Bridge] RABTUL Bus: ${RABTUL_EVENT_BUS}`);
  console.log(`[REZ Event Bus Bridge] HOJAI Bus: ${HOJAI_EVENT_BUS}`);
});

export { app, bridge };
export default app;