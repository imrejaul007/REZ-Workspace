/**
 * REZ Unified Input Manager
 *
 * Handles all input types in one place:
 * - Voice (mic input)
 * - Text (keyboard)
 * - QR (camera scan)
 * - Tap (NFC, cards)
 *
 * Routes to appropriate service based on input type
 *
 * Port: 4095
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const app = express();

// Config
const PORT = parseInt(process.env.PORT || '4095', 10);

// Service URLs
const GENIE_VOICE_URL = process.env.GENIE_VOICE_URL || 'http://localhost:4760';
const VOICEOS_URL = process.env.VOICEOS_URL || 'http://localhost:4850';
const REZ_CHAT_URL = process.env.REZ_CHAT_URL || 'http://localhost:4103';
const REZ_QR_URL = process.env.REZ_QR_URL || 'http://localhost:4090';
const TRAINING_URL = process.env.TRAINING_URL || 'http://localhost:4760/api/training';

// Types
type InputType = 'voice' | 'text' | 'qr' | 'tap' | 'unknown';

interface InputContext {
  id: string;
  type: InputType;
  source: 'app' | 'web' | 'pos' | 'qr';
  userId?: string;
  businessId?: string;
  timestamp: Date;
}

interface InputResult {
  context: InputContext;
  transcript?: string;
  intent?: string;
  entities?: Record<string, any>;
  response?: string;
  routedTo?: string;
}

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

// In-memory storage
const inputHistory = new Map<string, InputResult[]>();

// ============================================
// HEALTH
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-unified-input-manager',
    version: '1.0.0',
    inputTypes: ['voice', 'text', 'qr', 'tap'],
    routes: {
      voice: GENIE_VOICE_URL,
      text: REZ_CHAT_URL,
      qr: REZ_QR_URL,
    },
  });
});

// ============================================
// VOICE INPUT
// ============================================

/**
 * POST /api/input/voice
 * Handle voice input
 */
app.post('/api/input/voice', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    const { userId, businessId, source, language } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No audio provided' });
    }

    const context: InputContext = {
      id: uuidv4(),
      type: 'voice',
      source: source || 'app',
      userId,
      businessId,
      timestamp: new Date(),
    };

    // Route to Genie Voice for transcription
    const formData = new FormData();
    formData.append('audio', new Blob([req.file.buffer]), 'audio.wav');
    formData.append('language', language || 'en-IN');

    const sttResponse = await axios.post(`${GENIE_VOICE_URL}/api/stt`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });

    const transcript = sttResponse.data.text;

    // Process intent
    const intentResponse = await axios.post(`${GENIE_VOICE_URL}/api/intent`, {
      text: transcript,
      userId,
      context: { source: 'voice-input' },
    });

    const result: InputResult = {
      context,
      transcript,
      intent: intentResponse.data.action,
      entities: intentResponse.data.entities,
      routedTo: 'genie-voice',
    };

    // Collect training data
    await collectTrainingData(result);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// TEXT INPUT
// ============================================

/**
 * POST /api/input/text
 * Handle text input
 */
app.post('/api/input/text', async (req: Request, res: Response) => {
  try {
    const { text, userId, businessId, source } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const context: InputContext = {
      id: uuidv4(),
      type: 'text',
      source: source || 'app',
      userId,
      businessId,
      timestamp: new Date(),
    };

    // Process via Genie Voice intent
    const intentResponse = await axios.post(`${GENIE_VOICE_URL}/api/intent`, {
      text,
      userId,
      context: { source: 'text-input' },
    });

    const result: InputResult = {
      context,
      transcript: text,
      intent: intentResponse.data.action,
      entities: intentResponse.data.entities,
      response: intentResponse.data.response,
      routedTo: 'genie-voice',
    };

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// QR INPUT
// ============================================

/**
 * POST /api/input/qr
 * Handle QR scan
 */
app.post('/api/input/qr', async (req: Request, res: Response) => {
  try {
    const { qrCode, userId, businessId, source } = req.body;

    if (!qrCode) {
      return res.status(400).json({ error: 'No QR code provided' });
    }

    const context: InputContext = {
      id: uuidv4(),
      type: 'qr',
      source: source || 'qr',
      userId,
      businessId,
      timestamp: new Date(),
    };

    // Route to QR service for processing
    const qrResponse = await axios.post(`${REZ_QR_URL}/api/scan`, {
      code: qrCode,
      userId,
      businessId,
    });

    const result: InputResult = {
      context,
      transcript: `QR: ${qrCode}`,
      intent: qrResponse.data.intent || 'qr_scan',
      entities: qrResponse.data,
      routedTo: 'rez-qr',
    };

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// TAP INPUT (NFC/Cards)
// ============================================

/**
 * POST /api/input/tap
 * Handle NFC/card tap
 */
app.post('/api/input/tap', async (req: Request, res: Response) => {
  try {
    const { tapData, type, userId, businessId, source } = req.body;

    if (!tapData) {
      return res.status(400).json({ error: 'No tap data provided' });
    }

    const context: InputContext = {
      id: uuidv4(),
      type: 'tap',
      source: source || 'pos',
      userId,
      businessId,
      timestamp: new Date(),
    };

    // Tap types: 'card', 'nfc', 'upi'
    const intentMap: Record<string, string> = {
      card: 'payment',
      nfc: 'payment',
      upi: 'payment',
    };

    const result: InputResult = {
      context,
      transcript: `Tap: ${type} - ${tapData}`,
      intent: intentMap[type] || 'tap',
      entities: { tapData, type },
      routedTo: 'rabtul-payment',
    };

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// AUTO-DETECT INPUT TYPE
// ============================================

/**
 * POST /api/input/auto
 * Auto-detect input type and route
 */
app.post('/api/input/auto', async (req: Request, res: Response) => {
  try {
    const { type, data, userId, businessId, source } = req.body;

    let inputType: InputType = 'unknown';
    let result: InputResult;

    // Auto-detect based on input
    if (type === 'audio' || req.headers['content-type']?.includes('audio')) {
      inputType = 'voice';
    } else if (type === 'qr') {
      inputType = 'qr';
    } else if (type === 'tap') {
      inputType = 'tap';
    } else if (type === 'text' || (typeof data === 'string' && data.length < 500)) {
      inputType = 'text';
    }

    const context: InputContext = {
      id: uuidv4(),
      type: inputType,
      source: source || 'auto',
      userId,
      businessId,
      timestamp: new Date(),
    };

    // Route based on detected type
    switch (inputType) {
      case 'voice':
        // Would need audio in body
        result = {
          context,
          transcript: 'Voice input detected',
          intent: 'voice_command',
          routedTo: 'genie-voice',
        };
        break;

      case 'text':
        result = {
          context,
          transcript: data,
          intent: 'text_command',
          routedTo: 'genie-voice',
        };
        break;

      case 'qr':
        result = {
          context,
          transcript: `QR: ${data}`,
          intent: 'qr_scan',
          routedTo: 'rez-qr',
        };
        break;

      case 'tap':
        result = {
          context,
          transcript: `Tap: ${data}`,
          intent: 'payment',
          routedTo: 'rabtul-payment',
        };
        break;

      default:
        result = {
          context,
          transcript: data,
          intent: 'unknown',
          routedTo: 'unified-input',
        };
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// HISTORY
// ============================================

/**
 * GET /api/input/history
 * Get input history for user
 */
app.get('/api/input/history', async (req: Request, res: Response) => {
  const { userId, limit } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  const history = inputHistory.get(userId as string) || [];
  const limitNum = parseInt(limit as string) || 50;

  res.json({
    history: history.slice(-limitNum),
    total: history.length,
  });
});

// ============================================
// TRAINING DATA
// ============================================

async function collectTrainingData(result: InputResult): Promise<void> {
  try {
    await axios.post(`${TRAINING_URL}/collect`, {
      type: 'input',
      source: 'unified-input-manager',
      inputType: result.context.type,
      transcript: result.transcript,
      intent: result.intent,
      entities: result.entities,
      source: result.context.source,
      userId: result.context.userId,
      businessId: result.context.businessId,
      timestamp: result.context.timestamp,
    });
  } catch (error) {
    console.warn('[InputManager] Failed to collect training data');
  }
}

// ============================================
// START
// ============================================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔌 REZ Unified Input Manager                         ║
║                                                           ║
║   Port: ${PORT}                                              ║
║                                                           ║
║   Input Types:                                            ║
║   ✅ Voice (mic)                                        ║
║   ✅ Text (keyboard)                                    ║
║   ✅ QR (camera)                                        ║
║   ✅ Tap (NFC, cards)                                   ║
║                                                           ║
║   Routes:                                                ║
║   📞 Voice ──► Genie Voice (4760)                     ║
║   💬 Text ──► Genie Voice (4760)                      ║
║   📷 QR ──► REZ QR (4090)                             ║
║   💳 Tap ──► RABTUL Payment                          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;