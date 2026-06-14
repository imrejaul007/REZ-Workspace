/**
 * RisaCare AI Service v2.0
 * Real LLM-powered healthcare AI with HOJAI integration
 *
 * Features:
 * - Report interpretation with Claude/GPT-4
 * - Symptom assessment with medical AI
 * - Care plan generation
 * - Medication explanations
 * - Integration with HOJAI LLM Service (port 4730)
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import winston from 'winston';

// LLM Client - Real AI integration with HOJAI
import { llmClient, LLMRisaCareClient } from './llm-client';

// STT Client - Whisper integration
import { sttClient, medicalNlpClient } from './stt-client';

// ============================================
// CONFIGURATION
// ============================================

const PORT = parseInt(process.env.PORT || '4703', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const LLM_SERVICE_URL = process.env.LLM_SERVICE_URL || 'http://localhost:4730';
const VOICE_SERVICE_URL = process.env.VOICE_SERVICE_URL || 'http://localhost:4590';

// ============================================
// LOGGER
// ============================================

const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// ============================================
// EXPRESS APP
// ============================================

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Request ID middleware
app.use((req: Request, res: Response, next) => {
  req.requestId = (req.headers['x-request-id'] as string) || `req_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// Logging middleware
app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`, {
      requestId: req.requestId,
      duration
    });
  });
  next();
});

// ============================================
// ZOD SCHEMAS
// ============================================

const interpretReportSchema = z.object({
  profileId: z.string(),
  recordId: z.string().optional(),
  recordType: z.string().optional(),
  reportDate: z.string().optional(),
  rawText: z.string().optional(),
  extractedBiomarkers: z.array(z.object({
    name: z.string(),
    value: z.number(),
    unit: z.string(),
    referenceRange: z.string().optional()
  })).optional(),
  options: z.object({
    language: z.string().optional(),
    includeDietary: z.boolean().optional()
  }).optional()
});

const analyzeSymptomsSchema = z.object({
  profileId: z.string(),
  symptoms: z.array(z.object({
    name: z.string(),
    duration: z.string().optional(),
    severity: z.enum(['mild', 'moderate', 'severe']).optional(),
    bodyPart: z.string().optional()
  })),
  additionalInfo: z.string().optional()
});

const generateCarePlanSchema = z.object({
  profileId: z.string(),
  diagnosis: z.string(),
  patientContext: z.object({
    age: z.number(),
    gender: z.string(),
    medicalHistory: z.array(z.string()),
    currentMedications: z.array(z.string()),
    lifestyle: z.object({
      exercise: z.string(),
      diet: z.string(),
      smoking: z.boolean(),
      alcohol: z.string()
    })
  }),
  goals: z.array(z.string()).optional()
});

const explainMedicationSchema = z.object({
  medicationName: z.string(),
  dosage: z.string(),
  frequency: z.string(),
  profileId: z.string().optional()
});

const transcribeAudioSchema = z.object({
  format: z.enum(['buffer', 'url']),
  language: z.string().optional()
});

// ============================================
// IN-MEMORY STORAGE (Replace with MongoDB)
// ============================================

interface AIConversation {
  id: string;
  profileId: string;
  messages: { role: 'user' | 'assistant'; content: string; timestamp: Date }[];
  context: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const conversations = new Map<string, AIConversation>();

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', async (req: Request, res: Response) => {
  const llmHealth = await llmClient.healthCheck();
  const sttHealth = await sttClient.healthCheck();

  res.json({
    status: 'healthy',
    service: 'risa-care-ai-service',
    version: '2.0.0',
    llm: llmHealth ? 'connected' : 'disconnected',
    stt: sttHealth ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/ready', async (req: Request, res: Response) => {
  const llmHealth = await llmClient.healthCheck();
  if (llmHealth) {
    res.json({ status: 'ready', llm: 'ok' });
  } else {
    res.json({ status: 'ready', llm: 'fallback_mode' });
  }
});

// ============================================
// REPORT INTERPRETATION ENDPOINT
// ============================================

/**
 * POST /ai/interpret
 * Interpret a medical report using real LLM
 */
app.post('/ai/interpret', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = interpretReportSchema.parse(req.body);
    const { profileId, recordType, rawText, extractedBiomarkers } = validated;

    logger.info('Starting report interpretation', {
      requestId: req.requestId,
      profileId,
      recordType
    });

    // Build the report text for analysis
    let reportContent = rawText || '';

    if (extractedBiomarkers && extractedBiomarkers.length > 0) {
      reportContent += '\n\nBiomarker Values:\n';
      extractedBiomarkers.forEach(b => {
        reportContent += `- ${b.name}: ${b.value} ${b.unit}`;
        if (b.referenceRange) {
          reportContent += ` (Reference: ${b.referenceRange})`;
        }
        reportContent += '\n';
      });
    }

    // Call the LLM for interpretation
    const llmResponse = await llmClient.interpretReport(
      reportContent || 'No report content provided',
      recordType || 'medical_report'
    );

    const responseTime = Date.now();

    if (llmResponse.success && llmResponse.data) {
      logger.info('Report interpretation completed with LLM', {
        requestId: req.requestId,
        profileId,
        responseTime,
        tokens: llmResponse.data.usage
      });

      res.json({
        success: true,
        data: {
          recordId: validated.recordId || `rec_${Date.now()}`,
          interpretation: llmResponse.data.content,
          confidence: calculateLLMConfidence(llmResponse.data.usage),
          provider: 'hojai-llm',
          disclaimer: 'This interpretation is AI-assisted and for educational purposes only. Always consult a healthcare provider for medical advice.',
          metadata: {
            recordType,
            biomarkersCount: extractedBiomarkers?.length || 0,
            processingTime: responseTime,
            model: llmResponse.data.model
          }
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      // LLM failed, return error
      logger.error('LLM interpretation failed', {
        requestId: req.requestId,
        error: llmResponse.error
      });

      res.status(503).json({
        success: false,
        error: {
          code: 'LLM_UNAVAILABLE',
          message: 'AI interpretation service is temporarily unavailable. Please try again later.',
          fallback: 'mock'
        }
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request',
          details: error.errors
        }
      });
    }
    next(error);
  }
});

// ============================================
// SYMPTOM ASSESSMENT ENDPOINT
// ============================================

/**
 * POST /ai/symptoms
 * Analyze symptoms and provide triage guidance using real LLM
 */
app.post('/ai/symptoms', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = analyzeSymptomsSchema.parse(req.body);
    const { profileId, symptoms, additionalInfo } = validated;

    logger.info('Starting symptom assessment', {
      requestId: req.requestId,
      profileId,
      symptomCount: symptoms.length
    });

    // Format symptoms for LLM
    const formattedSymptoms = symptoms.map(s => ({
      name: s.name,
      duration: s.duration || 'Not specified',
      severity: s.severity || 'moderate'
    }));

    // Call LLM for symptom analysis
    const llmResponse = await llmClient.analyzeSymptoms(
      formattedSymptoms.map(s => s.name),
      formattedSymptoms[0]?.duration || 'varied',
      formattedSymptoms[0]?.severity || 'moderate'
    );

    if (llmResponse.success && llmResponse.data) {
      logger.info('Symptom assessment completed with LLM', {
        requestId: req.requestId,
        profileId,
        tokens: llmResponse.data.usage
      });

      // Extract urgency from response
      const urgency = extractUrgency(llmResponse.data.content);

      res.json({
        success: true,
        data: {
          sessionId: `session_${Date.now()}`,
          analysis: llmResponse.data.content,
          urgency: urgency.level,
          urgencyReason: urgency.reason,
          emergencyFlags: urgency.isEmergency,
          recommendations: extractRecommendations(llmResponse.data.content),
          disclaimer: 'This assessment is for informational purposes only and is not a medical diagnosis. Always consult a healthcare provider.',
          provider: 'hojai-llm',
          metadata: {
            symptomsCount: symptoms.length,
            model: llmResponse.data.model
          }
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(503).json({
        success: false,
        error: {
          code: 'LLM_UNAVAILABLE',
          message: 'AI assessment service is temporarily unavailable.'
        }
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: error.errors }
      });
    }
    next(error);
  }
});

// ============================================
// CARE PLAN GENERATION ENDPOINT
// ============================================

/**
 * POST /ai/care-plan
 * Generate a comprehensive care plan using real LLM
 */
app.post('/ai/care-plan', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = generateCarePlanSchema.parse(req.body);
    const { profileId, diagnosis, patientContext, goals } = validated;

    logger.info('Generating care plan', {
      requestId: req.requestId,
      profileId,
      diagnosis
    });

    const llmResponse = await llmClient.generateCarePlan(diagnosis, patientContext, goals);

    if (llmResponse.success && llmResponse.data) {
      res.json({
        success: true,
        data: {
          planId: `plan_${Date.now()}`,
          carePlan: llmResponse.data.content,
          disclaimer: 'This care plan is AI-generated and must be reviewed and approved by a healthcare provider before implementation.',
          provider: 'hojai-llm',
          metadata: {
            diagnosis,
            patientAge: patientContext.age,
            model: llmResponse.data.model
          }
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(503).json({
        success: false,
        error: {
          code: 'LLM_UNAVAILABLE',
          message: 'AI service unavailable for care plan generation.'
        }
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: error.errors }
      });
    }
    next(error);
  }
});

// ============================================
// MEDICATION EXPLANATION ENDPOINT
// ============================================

/**
 * POST /ai/medication/explain
 * Explain a medication in patient-friendly terms
 */
app.post('/ai/medication/explain', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = explainMedicationSchema.parse(req.body);
    const { medicationName, dosage, frequency, profileId } = validated;

    const llmResponse = await llmClient.explainMedication(medicationName, dosage, frequency);

    if (llmResponse.success && llmResponse.data) {
      res.json({
        success: true,
        data: {
          explanation: llmResponse.data.content,
          medication: {
            name: medicationName,
            dosage,
            frequency
          },
          disclaimer: 'This information is for educational purposes. Always follow your healthcare provider\'s instructions and read the official patient information leaflet.',
          provider: 'hojai-llm'
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(503).json({
        success: false,
        error: { code: 'LLM_UNAVAILABLE', message: 'AI service unavailable.' }
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: error.errors }
      });
    }
    next(error);
  }
});

// ============================================
// TRANSCRIPTION ENDPOINT (MEDICAL SCRIBE)
// ============================================

/**
 * POST /ai/transcribe
 * Transcribe audio for medical documentation
 */
app.post('/ai/transcribe', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Handle audio transcription
    const { audioUrl, language } = req.body;

    if (!audioUrl) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'audioUrl is required' }
      });
    }

    logger.info('Starting audio transcription', {
      requestId: req.requestId,
      language
    });

    const transcription = await sttClient.transcribeFromUrl(audioUrl, { language });

    if (transcription.success) {
      // Extract medical entities
      const entities = await medicalNlpClient.extractEntities(transcription.text || '');

      logger.info('Transcription completed', {
        requestId: req.requestId,
        duration: transcription.duration,
        confidence: transcription.segments?.[0]?.confidence
      });

      res.json({
        success: true,
        data: {
          transcriptionId: `tr_${Date.now()}`,
          text: transcription.text,
          segments: transcription.segments,
          duration: transcription.duration,
          language: transcription.language,
          entities: entities.entities || {},
          provider: 'hojai-voice'
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(503).json({
        success: false,
        error: { code: 'STT_UNAVAILABLE', message: 'Transcription service unavailable.' }
      });
    }
  } catch (error) {
    next(error);
  }
});

// ============================================
// VISIT SUMMARY ENDPOINT (MEDICAL SCRIBE)
// ============================================

/**
 * POST /ai/visit-summary
 * Generate SOAP note from consultation
 */
app.post('/ai/visit-summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transcript, patientContext, options } = req.body;

    if (!transcript) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'transcript is required' }
      });
    }

    logger.info('Generating visit summary from transcript', {
      requestId: req.requestId,
      transcriptLength: transcript.length
    });

    // Extract entities first
    const entities = await medicalNlpClient.extractEntities(transcript);

    // Generate visit summary using LLM
    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert medical documentation AI. Generate a structured SOAP note from the consultation transcript.

SOAP Note Structure:
- Subjective: Patient's symptoms, history, concerns
- Objective: Observable findings, vitals, examination results
- Assessment: Diagnosis, differential diagnoses
- Plan: Treatment plan, medications, follow-up

Important:
- Use professional medical terminology
- Maintain patient privacy
- Be concise but comprehensive
- Flag any red flags or urgent concerns`
      },
      {
        role: 'user' as const,
        content: `Generate a SOAP note from this consultation transcript:\n\n${transcript}`
      }
    ];

    const llmResponse = await llmClient.chat(messages, {
      temperature: 0.3,
      maxTokens: 3000
    });

    if (llmResponse.success && llmResponse.data) {
      res.json({
        success: true,
        data: {
          summaryId: `sum_${Date.now()}`,
          soapNote: llmResponse.data.content,
          extractedEntities: entities.entities,
          transcript: transcript.substring(0, 500) + '...',
          disclaimer: 'This AI-generated note requires physician review and approval before inclusion in medical records.',
          provider: 'hojai-llm',
          metadata: {
            transcriptLength: transcript.length,
            model: llmResponse.data.model
          }
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(503).json({
        success: false,
        error: { code: 'LLM_UNAVAILABLE', message: 'AI service unavailable.' }
      });
    }
  } catch (error) {
    next(error);
  }
});

// ============================================
// HEALTH RECOMMENDATIONS ENDPOINT
// ============================================

/**
 * POST /ai/recommendations
 * Generate personalized health recommendations
 */
app.post('/ai/recommendations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { profileId, healthData } = req.body;

    if (!healthData) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'healthData is required' }
      });
    }

    const llmResponse = await llmClient.generateHealthRecommendations(healthData);

    if (llmResponse.success && llmResponse.data) {
      res.json({
        success: true,
        data: {
          recommendations: llmResponse.data.content,
          disclaimer: 'These recommendations are AI-generated and not a substitute for professional medical advice.',
          provider: 'hojai-llm'
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(503).json({
        success: false,
        error: { code: 'LLM_UNAVAILABLE', message: 'AI service unavailable.' }
      });
    }
  } catch (error) {
    next(error);
  }
});

// ============================================
// AI COPILOT CHAT ENDPOINT
// ============================================

/**
 * POST /ai/chat
 * Conversational AI copilot for health queries
 */
app.post('/ai/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { profileId, message, conversationId, context } = req.body;

    if (!profileId || !message) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'profileId and message are required' }
      });
    }

    // Get or create conversation
    const convId = conversationId || `conv_${Date.now()}`;
    let conversation = conversations.get(convId);

    if (!conversation) {
      conversation = {
        id: convId,
        profileId,
        messages: [],
        context: context || {},
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    // Add user message
    conversation.messages.push({ role: 'user', content: message, timestamp: new Date() });

    // Build messages for LLM with healthcare context
    const systemPrompt = `You are RisaCare AI, a helpful healthcare assistant. You can:

- Answer general health questions
- Explain medical terms in simple language
- Provide medication information
- Offer wellness tips
- Help navigate healthcare services

IMPORTANT GUIDELINES:
- Never diagnose or prescribe
- Always recommend consulting a healthcare provider for medical concerns
- Be empathetic and supportive
- Use simple, clear language
- Include disclaimers when providing medical information
- For emergencies, immediately direct to emergency services`;

    const llmMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversation.messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    ];

    const llmResponse = await llmClient.chat(llmMessages, {
      temperature: 0.7,
      maxTokens: 2000
    });

    if (llmResponse.success && llmResponse.data) {
      // Add assistant response
      conversation.messages.push({ role: 'assistant', content: llmResponse.data.content, timestamp: new Date() });
      conversation.updatedAt = new Date();
      conversations.set(convId, conversation);

      res.json({
        success: true,
        data: {
          conversationId: convId,
          message: llmResponse.data.content,
          disclaimer: 'RisaCare AI provides general health information and is not a substitute for professional medical advice.',
          provider: 'hojai-llm'
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(503).json({
        success: false,
        error: { code: 'LLM_UNAVAILABLE', message: 'AI service temporarily unavailable.' }
      });
    }
  } catch (error) {
    next(error);
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateLLMConfidence(usage: { promptTokens: number; completionTokens: number }): number {
  // Higher token usage usually means more thorough analysis
  const totalTokens = usage.promptTokens + usage.completionTokens;
  if (totalTokens > 2000) return 0.9;
  if (totalTokens > 1000) return 0.85;
  if (totalTokens > 500) return 0.8;
  return 0.75;
}

function extractUrgency(content: string): { level: 'low' | 'moderate' | 'high' | 'emergency'; reason: string; isEmergency: boolean } {
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('emergency') || lowerContent.includes('immediate') || lowerContent.includes('call 108')) {
    return { level: 'emergency', reason: 'Potential emergency symptoms detected', isEmergency: true };
  }

  if (lowerContent.includes('urgent') || lowerContent.includes('soon') || lowerContent.includes('within 24')) {
    return { level: 'high', reason: 'Symptoms may require prompt medical attention', isEmergency: false };
  }

  if (lowerContent.includes('routine') || lowerContent.includes('schedule')) {
    return { level: 'low', reason: 'Symptoms appear manageable with routine care', isEmergency: false };
  }

  return { level: 'moderate', reason: 'Monitor symptoms and consult if they persist', isEmergency: false };
}

function extractRecommendations(content: string): string[] {
  // Extract recommendations from the LLM response
  const lines = content.split('\n');
  const recommendations: string[] = [];

  for (const line of lines) {
    if (line.includes('-') || line.includes('•') || line.match(/^\d+\./)) {
      recommendations.push(line.replace(/^[\d\.\-\•\s]+/, '').trim());
    }
  }

  return recommendations.slice(0, 5);
}

// ============================================
// ERROR HANDLER
// ============================================

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    requestId: req.requestId
  });

  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
    }
  });
});

// ============================================
// SERVER STARTUP
// ============================================

app.listen(PORT, () => {
  logger.info(`RisaCare AI Service v2.0 started on port ${PORT}`);
  logger.info(`LLM Service: ${LLM_SERVICE_URL}`);
  logger.info(`Voice Service: ${VOICE_SERVICE_URL}`);
  logger.info('Real AI Integration: ENABLED');
});

export default app;
