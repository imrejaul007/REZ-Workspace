/**
 * RisaCare Ambient Audio Service
 * Real-time clinical documentation with Whisper + LLM
 */

import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import axios from 'axios';

const PORT = parseInt(process.env.PORT || '4762', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_ambient';
const LLM_SERVICE = process.env.LLM_SERVICE_URL || 'http://localhost:4730';
const VOICE_SERVICE = process.env.VOICE_SERVICE_URL || 'http://localhost:4590';

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) })]
});

const app: Express = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, { cors: { origin: '*' } });
const wss = new WebSocketServer({ server: httpServer });

app.use(cors());
app.use(helmet());
app.use(express.json());

// Schemas
const SessionSchema = new mongoose.Schema({
  sessionId: String,
  encounterId: String,
  patientId: String,
  providerId: String,
  startTime: Date,
  endTime: Date,
  status: { type: String, enum: ['active', 'paused', 'completed'] },
  transcript: [{
    speaker: String,
    text: String,
    startTime: Number,
    endTime: Number,
    confidence: Number
  }],
  summary: String,
  soapNote: mongoose.Schema.Types.Mixed
});

const Session = mongoose.model('Session', SessionSchema);

// WebSocket clients
const clients = new Map<string, WebSocket>();

// WebSocket handling
wss.on('connection', (ws, req) => {
  const clientId = uuidv4();
  clients.set(clientId, ws);
  logger.info('WebSocket client connected', { clientId });

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      await handleWebSocketMessage(clientId, ws, message);
    } catch (error) {
      logger.error('WebSocket message error', { error });
      ws.send(JSON.stringify({ error: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    clients.delete(clientId);
    logger.info('WebSocket client disconnected', { clientId });
  });
});

async function handleWebSocketMessage(clientId: string, ws: WebSocket, message: any) {
  const { type, payload } = message;

  switch (type) {
    case 'start_session':
      await startSession(clientId, payload, ws);
      break;
    case 'audio_chunk':
      await processAudioChunk(clientId, payload, ws);
      break;
    case 'end_session':
      await endSession(clientId, payload, ws);
      break;
    case 'pause':
      await pauseSession(clientId, ws);
      break;
    case 'resume':
      await resumeSession(clientId, ws);
      break;
    case 'get_transcript':
      await getTranscript(clientId, payload, ws);
      break;
    default:
      ws.send(JSON.stringify({ error: 'Unknown message type' }));
  }
}

async function startSession(clientId: string, payload: any, ws: WebSocket) {
  const { patientId, providerId, encounterId } = payload;

  const session = await Session.create({
    sessionId: `amb_${uuidv4()}`,
    encounterId: encounterId || `enc_${uuidv4()}`,
    patientId,
    providerId,
    startTime: new Date(),
    status: 'active',
    transcript: []
  });

  ws.send(JSON.stringify({
    type: 'session_started',
    sessionId: session.sessionId,
    encounterId: session.encounterId
  }));

  logger.info('Ambient session started', { sessionId: session.sessionId, patientId, providerId });
}

async function processAudioChunk(clientId: string, payload: any, ws: WebSocket) {
  const { sessionId, audioData, isFinal } = payload;

  try {
    // Call STT service (Whisper)
    let transcription: any;

    // In production:
    // const response = await axios.post(`${VOICE_SERVICE}/api/stt`, audioData, {
    //   headers: { 'Content-Type': 'application/octet-stream' }
    // });
    // transcription = response.data;

    // Mock for now
    transcription = {
      text: 'Mock transcription',
      confidence: 0.95,
      duration: 5
    };

    // Save transcript segment
    await Session.findOneAndUpdate(
      { sessionId },
      { $push: { transcript: { speaker: 'unknown', text: transcription.text, confidence: transcription.confidence, startTime: Date.now(), endTime: Date.now() + 5000 } }
    );

    // If final segment, generate summary
    if (isFinal) {
      await generateSessionSummary(sessionId);
    }

    ws.send(JSON.stringify({
      type: 'transcription',
      sessionId,
      text: transcription.text,
      confidence: transcription.confidence
    }));
  } catch (error) {
    logger.error('Audio processing error', { error });
    ws.send(JSON.stringify({ type: 'error', message: 'Processing failed' }));
  }
}

async function endSession(clientId: string, payload: any, ws: WebSocket) {
  const { sessionId } = payload;

  const session = await Session.findOneAndUpdate(
    { sessionId },
    { status: 'completed', endTime: new Date() },
    { new: true }
  );

  // Generate final SOAP note
  const soapNote = await generateSOAPNote(session);

  session.soapNote = soapNote;
  session.summary = soapNote.Summary;
  await session.save();

  ws.send(JSON.stringify({
    type: 'session_ended',
    sessionId,
    summary: session.summary,
    soapNote
  }));

  logger.info('Ambient session ended', { sessionId });
}

async function pauseSession(clientId: string, ws: WebSocket) {
  ws.send(JSON.stringify({ type: 'paused' }));
}

async function resumeSession(clientId: string, ws: WebSocket) {
  ws.send(JSON.stringify({ type: 'resumed' }));
}

async function getTranscript(clientId: string, payload: any, ws: WebSocket) {
  const { sessionId } = payload;
  const session = await Session.findOne({ sessionId });

  if (!session) {
    return ws.send(JSON.stringify({ error: 'Session not found' }));
  }

  ws.send(JSON.stringify({
    type: 'transcript',
    sessionId,
    transcript: session.transcript
  }));
}

async function generateSessionSummary(sessionId: string) {
  try {
    const session = await Session.findOne({ sessionId });
    if (!session) return;

    const transcript = session.transcript.map(t => t.text).join(' ');

    // Call LLM for summary
    const messages = [
      {
        role: 'system',
        content: 'Summarize this clinical encounter concisely:'
      },
      {
        role: 'user',
        content: transcript
      }
    ];

    // In production:
    // const response = await axios.post(`${LLM_SERVICE}/api/chat`, {
    //   messages, temperature: 0.3
    // });

    const mockSummary = 'Patient presents for consultation. Assessment and plan documented.';

    session.summary = mockSummary;
    await session.save();

    // Broadcast summary update
    const client = clients.get(sessionId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'summary_update',
        summary: mockSummary
      }));
    }
  } catch (error) {
    logger.error('Summary generation error', { error });
  }
}

async function generateSOAPNote(session: any) {
  const transcript = session.transcript.map((t: any) => t.text).join(' ');

  // Call LLM for SOAP note
  // In production:
  // const response = await axios.post(`${LLM_SERVICE}/api/chat`, {
  //   messages: [
  //     { role: 'system', content: 'Generate a SOAP note from this transcript.' },
  //     { role: 'user', content: transcript }
  //   ]
  // });

  // Mock SOAP note
  return {
    Summary: session.summary || 'Clinical encounter documented.',
    Subjective: {
      ChiefComplaint: 'Patient presents for consultation.',
      HistoryOfPresentIllness: transcript.substring(0, 500),
      ReviewOfSystems: [],
      PastMedicalHistory: [],
      Medications: [],
      Allergies: []
    },
    Objective: {
      VitalSigns: {},
      PhysicalExamination: [],
      LabResults: []
    },
    Assessment: {
      Diagnoses: [],
      ClinicalReasoning: 'Assessment pending review.'
    },
    Plan: {
      Treatment: [],
      Medications: [],
      FollowUp: 'As needed.'
    }
  };
}

// REST Endpoints
app.get('/health', async (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ambient-audio-service',
    version: '1.0.0',
    wsClients: clients.size,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/sessions', async (req, res) => {
  const { patientId, providerId, status } = req.query;
  const query: any = {};
  if (patientId) query.patientId = patientId;
  if (providerId) query.providerId = providerId;
  if (status) query.status = status;

  const sessions = await Session.find(query).sort({ startTime: -1 }).limit(50);
  res.json({ success: true, sessions });
});

app.get('/api/sessions/:id', async (req, res) => {
  const session = await Session.findOne({ sessionId: req.params.id });
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json({ success: true, session });
});

app.get('/api/sessions/:id/transcript', async (req, res) => {
  const session = await Session.findOne({ sessionId: req.params.id });
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json({
    success: true,
    transcript: session.transcript,
    summary: session.summary
  });
});

app.post('/api/sessions/:id/generate-summary', async (req, res) => {
  const session = await Session.findOne({ sessionId: req.params.id });
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const soapNote = await generateSOAPNote(session);
  session.soapNote = soapNote;
  session.summary = soapNote.Summary;
  await session.save();

  res.json({ success: true, soapNote, summary: soapNote.Summary });
});

// Socket.IO for mobile apps
io.on('connection', (socket) => {
  logger.info('Socket.IO client connected', { socketId: socket.id });

  socket.on('join_session', (sessionId: string) => {
    socket.join(sessionId);
    logger.info('Client joined session', { sessionId });
  });

  socket.on('leave_session', (sessionId: string) => {
    socket.leave(sessionId);
  });

  socket.on('transcription_update', (data: any) => {
    io.to(data.sessionId).emit('transcription', data);
  });

  socket.on('summary_update', (data: any) => {
    io.to(data.sessionId).emit('summary', data);
  });
});

async function start() {
  await mongoose.connect(MONGODB_URI);
  logger.info('Ambient Audio Service connected to MongoDB');
  httpServer.listen(PORT, () => {
    logger.info(`Ambient Audio Service started on port ${PORT}`);
    logger.info('Protocols: WebSocket, Socket.IO');
  });
}

start().catch(e => { logger.error(e); process.exit(1); });
export default app;
