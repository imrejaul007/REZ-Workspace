/**
 * REZ Voice AI Service
 * Speak to command your business
 * Port: 4500
 *
 * Features:
 * - Speech to text integration
 * - Natural language command processing
 * - WebSocket streaming
 * - Command execution
 * - Response synthesis
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import winston from 'winston';
import axios from 'axios';
import WebSocket, { WebSocketServer } from 'ws';
import { createServer } from 'http';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
  defaultMeta: { service: 'rez-voice-ai' },
});

const PORT = parseInt(process.env.PORT || '4500', 10);
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/rez-voice-ai';
const RELATIONSHIP_OS_URL = process.env.RELATIONSHIP_OS_URL || 'http://localhost:4800';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-token';

const app = express();
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

interface AuthRequest extends Request { user?: any; isInternal?: boolean; }

const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const internalToken = req.headers['x-internal-token'];
  if (internalToken === INTERNAL_TOKEN) { req.isInternal = true; return next(); }
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } });
  next();
};

// ============================================
// VOICE COMMANDS DATABASE
// ============================================

const voiceCommands = [
  {
    pattern: /revenue|sales|today/i,
    command: 'revenue_report',
    description: 'Show revenue for today/week/month',
    examples: [
      'Show today\'s revenue',
      'How much did we sell today?',
      'What is our sales today?',
    ],
  },
  {
    pattern: /leads?|prospects?|new customers/i,
    command: 'leads_report',
    description: 'Show new leads',
    examples: [
      'Show new leads',
      'How many leads today?',
      'Any new prospects?',
    ],
  },
  {
    pattern: /pipeline|deals|opportunities/i,
    command: 'pipeline_view',
    description: 'Show deal pipeline',
    examples: [
      'Show pipeline',
      'What deals are stuck?',
      'Any opportunities?',
    ],
  },
  {
    pattern: /team|performance|salesperson/i,
    command: 'team_performance',
    description: 'Show team performance',
    examples: [
      'Show team performance',
      'Who is our best salesperson?',
      'How is the team doing?',
    ],
  },
  {
    pattern: /customer|client|churn/i,
    command: 'customer_analysis',
    description: 'Customer analysis',
    examples: [
      'Which customer may churn?',
      'Show top customers',
      'Any unhappy customers?',
    ],
  },
  {
    pattern: /task|remind|follow.up/i,
    command: 'create_task',
    description: 'Create a task',
    examples: [
      'Create follow up task',
      'Remind me tomorrow',
      'Set a reminder',
    ],
  },
  {
    pattern: /send|message|whatsapp|email/i,
    command: 'send_message',
    description: 'Send a message',
    examples: [
      'Send WhatsApp to John',
      'Email the report',
      'Message the team',
    ],
  },
  {
    pattern: /report|generate|summary/i,
    command: 'generate_report',
    description: 'Generate a report',
    examples: [
      'Generate daily report',
      'Show summary',
      'Create weekly report',
    ],
  },
  {
    pattern: /appointment|schedule|book/i,
    command: 'schedule_appointment',
    description: 'Schedule appointment',
    examples: [
      'Schedule appointment with John',
      'Book a meeting',
      'Set up a call',
    ],
  },
  {
    pattern: /inventory|stock|product/i,
    command: 'inventory_check',
    description: 'Check inventory',
    examples: [
      'Check inventory',
      'Any low stock items?',
      'Show stock levels',
    ],
  },
  {
    pattern: /why|analyze|compare/i,
    command: 'analysis',
    description: 'Analysis and insights',
    examples: [
      'Why is revenue down?',
      'Compare this month vs last',
      'Analyze trends',
    ],
  },
  {
    pattern: /call|phone|dial/i,
    command: 'initiate_call',
    description: 'Initiate a call',
    examples: [
      'Call John',
      'Dial the customer',
      'Make a call',
    ],
  },
];

// ============================================
// VOICE SESSIONS
// ============================================

interface VoiceSession {
  sessionId: string;
  userId: string;
  commands: string[];
  responses: string[];
  context: Record<string, any>;
  createdAt: Date;
}

const sessions = new Map<string, VoiceSession>();

// ============================================
// HEALTH CHECKS
// ============================================

app.get('/health', async (req, res) => {
  res.json({
    status: mongoose.connection.readyState === 1 ? 'healthy' : 'degraded',
    service: 'rez-voice-ai',
    version: '1.0.0',
    description: 'Voice AI - Speak to command',
    commands: voiceCommands.length,
    activeSessions: sessions.size,
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/live', (req, res) => res.json({ status: 'alive' }));
app.get('/health/ready', async (req, res) => {
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ status: 'not_ready' });
  res.json({ status: 'ready' });
});

// ============================================
// VOICE API
// ============================================

// Process voice command (text input)
app.post('/api/voice/command', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      text: z.string().min(1),
      sessionId: z.string().optional(),
      userId: z.string().optional(),
      context: z.record(z.any()).optional(),
    });
    const { text, sessionId, userId, context } = schema.parse(req.body);

    // Find matching command
    let matchedCommand = null;
    for (const cmd of voiceCommands) {
      if (cmd.pattern.test(text)) {
        matchedCommand = cmd;
        break;
      }
    }

    // Create or update session
    const currentSessionId = sessionId || `VS-${Date.now().toString(36)}`;
    let session = sessions.get(currentSessionId);
    if (!session) {
      session = {
        sessionId: currentSessionId,
        userId: userId || 'anonymous',
        commands: [],
        responses: [],
        context: context || {},
        createdAt: new Date(),
      };
      sessions.set(currentSessionId, session);
    }

    session.commands.push(text);

    let response: any;
    if (!matchedCommand) {
      response = {
        message: 'I\'m not sure how to help with that. Here are some things I can do:',
        suggestions: voiceCommands.map(c => c.examples[0]),
        command: 'unknown',
      };
    } else {
      // Execute command via Relationship OS
      try {
        const aiResponse = await axios.post(
          `${RELATIONSHIP_OS_URL}/ai/command`,
          { command: text },
          { headers: { Authorization: `Bearer ${req.headers.authorization}`, 'X-Internal-Token': INTERNAL_TOKEN } }
        );

        response = {
          message: aiResponse.data.data?.message || 'Command executed',
          data: aiResponse.data.data,
          command: matchedCommand.command,
          suggestions: matchedCommand.examples.slice(1),
        };
      } catch (aiError: any) {
        response = {
          message: `I can help with ${matchedCommand.description}. Let me try that for you.`,
          command: matchedCommand.command,
          status: 'processing',
        };
      }
    }

    session.responses.push(response.message || JSON.stringify(response));
    session.context = { ...session.context, ...context };

    logger.info(`Voice command processed`, { sessionId: currentSessionId, command: matchedCommand?.command || 'unknown' });

    res.json({
      success: true,
      data: {
        sessionId: currentSessionId,
        ...response,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
    logger.error('Error:', error); res.status(500).json({ success: false, error: { code: 'VOICE_ERROR' } });
  }
});

// Get available commands
app.get('/api/commands', authenticate, async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      commands: voiceCommands.map(c => ({
        command: c.command,
        description: c.description,
        examples: c.examples,
      })),
      total: voiceCommands.length,
    },
  });
});

// Process audio (placeholder - would integrate with STT service)
app.post('/api/voice/transcribe', authenticate, async (req: AuthRequest, res: Response) => {
  // In production, this would:
  // 1. Receive audio blob
  // 2. Send to Speech-to-Text service
  // 3. Return transcribed text

  res.json({
    success: true,
    data: {
      message: 'Audio transcription placeholder. Configure STT service in production.',
      text: 'Show today\'s revenue',
    },
  });
});

// Text to speech (placeholder)
app.post('/api/voice/speak', authenticate, async (req: AuthRequest, res: Response) => {
  const { text } = req.body;

  // In production, this would:
  // 1. Send text to TTS service
  // 2. Return audio URL

  res.json({
    success: true,
    data: {
      message: 'Text-to-speech placeholder. Configure TTS service in production.',
      audioUrl: null,
    },
  });
});

// Session management
app.get('/api/sessions/:sessionId', authenticate, async (req: AuthRequest, res: Response) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
  res.json({ success: true, data: session });
});

app.delete('/api/sessions/:sessionId', authenticate, async (req: AuthRequest, res: Response) => {
  const deleted = sessions.delete(req.params.sessionId);
  if (!deleted) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
  res.json({ success: true, message: 'Session deleted' });
});

// Analytics
app.get('/api/analytics/usage', authenticate, async (req: AuthRequest, res: Response) => {
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  let recentCommands = 0;
  sessions.forEach(s => {
    if (s.createdAt > hourAgo) recentCommands++;
  });

  res.json({
    success: true,
    data: {
      activeSessions: sessions.size,
      recentCommands,
      totalCommands: voiceCommands.length,
      commands: voiceCommands.map(c => ({ name: c.command, uses: 0 })),
    },
  });
});

// ============================================
// WEBSOCKET FOR REAL-TIME VOICE
// ============================================

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

wss.on('connection', (ws, req) => {
  const sessionId = `VS-${Date.now().toString(36)}`;
  logger.info(`Voice WebSocket connected`, { sessionId });

  // Create session
  sessions.set(sessionId, {
    sessionId,
    userId: 'websocket',
    commands: [],
    responses: [],
    context: {},
    createdAt: new Date(),
  });

  ws.send(JSON.stringify({
    type: 'session',
    sessionId,
    message: 'Connected to Voice AI. What would you like to do?',
    suggestions: voiceCommands.slice(0, 5).map(c => c.examples[0]),
  }));

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === 'audio') {
        // Process audio (placeholder)
        // In production, stream to STT service
        ws.send(JSON.stringify({
          type: 'transcribed',
          text: 'Processing audio...',
        }));
      } else if (message.type === 'text') {
        // Process text command
        let matchedCommand = null;
        for (const cmd of voiceCommands) {
          if (cmd.pattern.test(message.text)) {
            matchedCommand = cmd;
            break;
          }
        }

        const session = sessions.get(sessionId);
        if (session) {
          session.commands.push(message.text);
        }

        if (!matchedCommand) {
          ws.send(JSON.stringify({
            type: 'response',
            message: 'I\'m not sure how to help. Try asking about revenue, leads, or team performance.',
            suggestions: voiceCommands.map(c => c.examples[0]),
          }));
          return;
        }

        // Execute via Relationship OS
        try {
          const aiResponse = await axios.post(
            `${RELATIONSHIP_OS_URL}/ai/command`,
            { command: message.text },
            { headers: { 'X-Internal-Token': INTERNAL_TOKEN } }
          );

          ws.send(JSON.stringify({
            type: 'response',
            message: aiResponse.data.data?.message || 'Command executed',
            data: aiResponse.data.data,
            command: matchedCommand.command,
          }));
        } catch (aiError) {
          ws.send(JSON.stringify({
            type: 'response',
            message: `Processing your request for ${matchedCommand.description}...`,
            command: matchedCommand.command,
          }));
        }
      }
    } catch (error) {
      logger.error('WebSocket message error:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Failed to process message' }));
    }
  });

  ws.on('close', () => {
    logger.info(`Voice WebSocket disconnected`, { sessionId });
    sessions.delete(sessionId);
  });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
});

const shutdown = async () => {
  logger.info('Shutting down...');
  sessions.clear();
  await mongoose.disconnect();
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

const start = async () => {
  try {
    await mongoose.connect(MONGO_URL, { maxPoolSize: 10, minPoolSize: 2 });
    logger.info('Connected to MongoDB');

    httpServer.listen(PORT, () => {
      logger.info(`Voice AI Service started on port ${PORT}`);
      logger.info(`WebSocket available at ws://localhost:${PORT}/ws`);
      logger.info(`Available commands: ${voiceCommands.length}`);
    });
  } catch (error) {
    logger.error('Failed to start:', error);
    process.exit(1);
  }
};

start();