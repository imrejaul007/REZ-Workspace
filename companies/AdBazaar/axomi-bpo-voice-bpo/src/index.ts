/**
 * Axomi BPO Voice Service
 *
 * Voice AI for BPO/Call Centers
 * - Inbound/outbound calls
 * - Agent routing
 * - Call recording
 * - Training data collection
 *
 * Port: 4980
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const app = express();

// Config
const PORT = parseInt(process.env.PORT || '4980', 10);
const VOICEOS_URL = process.env.VOICEOS_URL || 'http://localhost:4850';
const TRAINING_ENDPOINT = process.env.TRAINING_ENDPOINT || 'http://localhost:4760/api/training';
const GENIE_VOICE_URL = process.env.GENIE_VOICE_URL || 'http://localhost:4760';

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// Types
interface Call {
  id: string;
  callerId: string;
  agentId?: string;
  status: 'queued' | 'ringing' | 'active' | 'completed' | 'missed';
  startTime?: Date;
  endTime?: Date;
  transcript?: string;
  intent?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  recordingUrl?: string;
  duration?: number;
  outcome?: 'resolved' | 'escalated' | 'transferred' | 'failed';
}

interface Agent {
  id: string;
  name: string;
  status: 'available' | 'busy' | 'break' | 'offline';
  skills: string[];
  currentCallId?: string;
}

// In-memory storage
const calls = new Map<string, Call>();
const agents = new Map<string, Agent>();
const callQueue: string[] = [];

// ============================================
// HEALTH
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'axomi-bpo-voice-bpo',
    version: '1.0.0',
    capabilities: {
      inbound: true,
      outbound: true,
      agentRouting: true,
      callRecording: true,
      stt: true,
      tts: true,
      trainingData: true,
    },
    stats: {
      totalCalls: calls.size,
      activeCalls: Array.from(calls.values()).filter(c => c.status === 'active').length,
      queuedCalls: callQueue.length,
      availableAgents: Array.from(agents.values()).filter(a => a.status === 'available').length,
    },
  });
});

// ============================================
// CALL MANAGEMENT
// ============================================

/**
 * POST /api/calls/inbound
 * Handle inbound call
 */
app.post('/api/calls/inbound', async (req: Request, res: Response) => {
  try {
    const { callerId, phoneNumber, metadata } = req.body;

    const callId = uuidv4();
    const call: Call = {
      id: callId,
      callerId: callerId || phoneNumber,
      status: 'queued',
    };

    calls.set(callId, call);
    callQueue.push(callId);

    // Route to available agent
    const agent = findAvailableAgent();
    if (agent) {
      agent.status = 'busy';
      agent.currentCallId = callId;
      call.agentId = agent.id;
      call.status = 'ringing';
    }

    res.json({
      callId,
      status: call.status,
      agentId: call.agentId,
      queuePosition: callQueue.indexOf(callId),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/calls/:id/start
 * Start call with voice AI
 */
app.post('/api/calls/:id/start', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const call = calls.get(id);

    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    call.status = 'active';
    call.startTime = new Date();

    res.json({
      callId: id,
      status: 'active',
      sessionId: uuidv4(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/calls/:id/transcribe
 * Transcribe and process call
 */
app.post('/api/calls/:id/transcribe', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { audio, language } = req.body;

    const call = calls.get(id);
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    // Transcribe using VoiceOS
    const sttResponse = await axios.post(
      `${VOICEOS_URL}/api/v1/stt/transcribe`,
      { audio, language: language || 'en-IN' },
      { timeout: 30000 }
    );

    const transcript = sttResponse.data.text;

    // Process intent
    const intentResponse = await axios.post(
      `${VOICEOS_URL}/api/v1/intent/process`,
      { text: transcript, context: { source: 'bpo-call' } }
    );

    call.transcript = (call.transcript || '') + ' ' + transcript;
    call.intent = intentResponse.data.action;

    // Collect training data
    if (process.env.TRAINING_COLLECTION_ENABLED === 'true') {
      await collectTrainingData(call);
    }

    res.json({
      transcript,
      intent: call.intent,
      confidence: sttResponse.data.confidence,
      entities: intentResponse.data.entities,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/calls/:id/complete
 * Complete call
 */
app.post('/api/calls/:id/complete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { outcome, sentiment, notes } = req.body;

    const call = calls.get(id);
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    call.status = 'completed';
    call.endTime = new Date();
    call.outcome = outcome || 'resolved';
    call.sentiment = sentiment;
    call.duration = call.endTime.getTime() - (call.startTime?.getTime() || 0);

    // Free up agent
    if (call.agentId) {
      const agent = agents.get(call.agentId);
      if (agent) {
        agent.status = 'available';
        agent.currentCallId = undefined;
      }
    }

    // Collect final training data
    if (process.env.TRAINING_COLLECTION_ENABLED === 'true') {
      await collectTrainingData(call);
    }

    res.json({
      callId: id,
      duration: call.duration,
      outcome: call.outcome,
      sentiment: call.sentiment,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/calls
 * List all calls
 */
app.get('/api/calls', async (req: Request, res: Response) => {
  const { status, agentId, limit } = req.query;

  let filtered = Array.from(calls.values());

  if (status) {
    filtered = filtered.filter(c => c.status === status);
  }
  if (agentId) {
    filtered = filtered.filter(c => c.agentId === agentId);
  }

  filtered.sort((a, b) => (b.startTime?.getTime() || 0) - (a.startTime?.getTime() || 0));

  const limitNum = parseInt(limit as string) || 100;
  res.json({
    calls: filtered.slice(0, limitNum),
    total: filtered.length,
  });
});

// ============================================
// AGENT MANAGEMENT
// ============================================

/**
 * POST /api/agents
 * Register agent
 */
app.post('/api/agents', async (req: Request, res: Response) => {
  try {
    const { name, skills } = req.body;

    const agent: Agent = {
      id: uuidv4(),
      name,
      status: 'available',
      skills: skills || [],
    };

    agents.set(agent.id, agent);

    res.json(agent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/agents
 * List agents
 */
app.get('/api/agents', async (req: Request, res: Response) => {
  const { status } = req.query;

  let filtered = Array.from(agents.values());
  if (status) {
    filtered = filtered.filter(a => a.status === status);
  }

  res.json({ agents: filtered, total: filtered.length });
});

/**
 * PUT /api/agents/:id/status
 * Update agent status
 */
app.put('/api/agents/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const agent = agents.get(id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    agent.status = status;

    res.json(agent);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// TRAINING DATA COLLECTION
// ============================================

async function collectTrainingData(call: Call): Promise<void> {
  try {
    await axios.post(`${TRAINING_ENDPOINT}/collect`, {
      type: 'voice',
      source: 'axomi-bpo',
      transcript: call.transcript || '',
      language: 'en-IN',
      intent: call.intent || 'unknown',
      sentiment: call.sentiment,
      confidence: 0.9,
      duration: call.duration,
      outcome: call.outcome,
      channel: 'phone',
      businessId: 'axomi-bpo',
      metadata: {
        agentId: call.agentId,
        callerId: call.callerId,
      },
    });
    logger.info(`[BPO] Training data collected for call ${call.id}`);
  } catch (error) {
    logger.error('[BPO] Failed to collect training data:', { error: error instanceof Error ? error.message : String(error) });
  }
}

// ============================================
// HELPERS
// ============================================

function findAvailableAgent(): Agent | undefined {
  return Array.from(agents.values()).find(a => a.status === 'available');
}

// ============================================
// START
// ============================================

app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎧 Axomi BPO Voice Service                           ║
║                                                           ║
║   Port: ${PORT}                                              ║
║                                                           ║
║   Features:                                                ║
║   ✅ Inbound/Outbound calls                             ║
║   ✅ Agent routing                                       ║
║   ✅ STT/TTS                                             ║
║   ✅ Call recording                                     ║
║   ✅ Training data collection                           ║
║                                                           ║
║   Connected to:                                           ║
║   📞 VoiceOS (${VOICEOS_URL})                        ║
║   🧞 Genie Voice (${GENIE_VOICE_URL})              ║
║   📊 Training (${TRAINING_ENDPOINT})              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;