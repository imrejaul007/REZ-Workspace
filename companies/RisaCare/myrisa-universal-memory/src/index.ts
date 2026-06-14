import { logger } from '../../shared/logger';
/**
 * MyRisa Universal Memory
 *
 * Human Intelligence OS - All 7 Domains
 * Following RTNM Doctrine: Identity → Memory → Knowledge → Twin → Agent → Intelligence
 *
 * Port: 4800
 */

import express from 'express';
import cors from 'cors';
import { universalMemoryService } from './services/universalMemoryService.js';

const app = express();
const PORT = process.env.PORT || 4800;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    service: 'myrisa-universal-memory',
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    service: 'MyRisa Universal Memory',
    description: 'Human Intelligence OS - All 7 Domains',
    version: '1.0.0',
    domains: [
      'Physical Health',
      'Mental Wellness',
      'Sexual Wellness',
      'Lifestyle',
      'Work-Life Balance',
      'Family',
      'Relationships'
    ],
    endpoints: {
      health: '/health',
      person: '/api/person',
      humanTwin: '/api/human-twin',
      summary: '/api/summary',
      lifeEvents: '/api/life-events',
      physical: '/api/physical',
      mental: '/api/mental',
      sexual: '/api/sexual',
      lifestyle: '/api/lifestyle',
      worklife: '/api/worklife',
      family: '/api/family',
      relationships: '/api/relationships',
      consultations: '/api/consultations'
    }
  });
});

// ============================================
// PERSON
// ============================================

app.post('/api/person', async (req, res) => {
  try {
    const { corpId } = req.body;
    if (!corpId) {
      return res.status(400).json({ success: false, error: 'CorpID required' });
    }
    const person = await universalMemoryService.getOrCreatePerson(corpId);
    res.json({ success: true, data: person });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create person' });
  }
});

app.get('/api/person/:corpId', async (req, res) => {
  try {
    const person = await universalMemoryService.getPerson(req.params.corpId);
    if (!person) {
      return res.status(404).json({ success: false, error: 'Person not found' });
    }
    res.json({ success: true, data: person });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get person' });
  }
});

// ============================================
// LIFE EVENTS
// ============================================

app.post('/api/life-events', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const event = await universalMemoryService.recordLifeEvent(personId, req.body);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to record life event' });
  }
});

app.get('/api/life-events', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const events = await universalMemoryService.getLifeEvents(personId, {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string
    });
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get life events' });
  }
});

// ============================================
// DOMAIN 1: PHYSICAL HEALTH
// ============================================

app.post('/api/physical/vitals', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const record = await universalMemoryService.logVital(personId, req.body);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to log vitals' });
  }
});

app.get('/api/physical/vitals', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const vitals = await universalMemoryService.getVitals(personId, {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    });
    res.json({ success: true, data: vitals });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get vitals' });
  }
});

// ============================================
// DOMAIN 2: MENTAL WELLNESS
// ============================================

app.post('/api/mental/mood', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const mood = await universalMemoryService.logMood(personId, req.body);
    res.status(201).json({ success: true, data: mood });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to log mood' });
  }
});

app.get('/api/mental/mood', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const moods = await universalMemoryService.getMoods(personId, {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    });
    res.json({ success: true, data: moods });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get moods' });
  }
});

app.post('/api/mental/stress', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const stress = await universalMemoryService.logStress(personId, req.body);
    res.status(201).json({ success: true, data: stress });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to log stress' });
  }
});

app.get('/api/mental/summary', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const summary = await universalMemoryService.getMentalWellnessSummary(personId);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get mental summary' });
  }
});

// ============================================
// DOMAIN 3: SEXUAL WELLNESS
// ============================================

app.post('/api/sexual/activity', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const activity = await universalMemoryService.logSexualActivity(personId, req.body);
    res.status(201).json({ success: true, data: activity });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to log sexual activity' });
  }
});

app.post('/api/sexual/libido', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const record = await universalMemoryService.logLibido(personId, req.body);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to log libido' });
  }
});

app.post('/api/sexual/fertility', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const record = await universalMemoryService.logFertility(personId, req.body);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to log fertility' });
  }
});

app.post('/api/sexual/contraception', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const contraception = await universalMemoryService.setContraception(personId, req.body);
    res.status(201).json({ success: true, data: contraception });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to set contraception' });
  }
});

// ============================================
// DOMAIN 4: LIFESTYLE
// ============================================

app.post('/api/lifestyle/sleep', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const sleep = await universalMemoryService.logSleep(personId, req.body);
    res.status(201).json({ success: true, data: sleep });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to log sleep' });
  }
});

app.get('/api/lifestyle/sleep', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const records = await universalMemoryService.getSleepRecords(personId, {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    });
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get sleep records' });
  }
});

app.post('/api/lifestyle/nutrition', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const nutrition = await universalMemoryService.logNutrition(personId, req.body);
    res.status(201).json({ success: true, data: nutrition });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to log nutrition' });
  }
});

app.post('/api/lifestyle/exercise', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const exercise = await universalMemoryService.logExercise(personId, req.body);
    res.status(201).json({ success: true, data: exercise });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to log exercise' });
  }
});

app.post('/api/lifestyle/habits', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const habit = await universalMemoryService.createHabit(personId, req.body);
    res.status(201).json({ success: true, data: habit });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create habit' });
  }
});

app.get('/api/lifestyle/habits', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const habits = await universalMemoryService.getHabits(personId);
    res.json({ success: true, data: habits });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get habits' });
  }
});

// ============================================
// DOMAIN 5: WORK-LIFE BALANCE
// ============================================

app.post('/api/worklife/record', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const record = await universalMemoryService.logWorkRecord(personId, req.body);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to log work record' });
  }
});

app.get('/api/worklife/score', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const score = await universalMemoryService.getWorkLifeBalanceScore(personId);
    res.json({ success: true, data: score });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get work-life score' });
  }
});

app.get('/api/worklife/burnout', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const assessment = await universalMemoryService.assessBurnoutRisk(personId);
    res.json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to assess burnout risk' });
  }
});

// ============================================
// DOMAIN 6: FAMILY
// ============================================

app.post('/api/family/member', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const member = await universalMemoryService.addFamilyMember(personId, req.body);
    res.status(201).json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add family member' });
  }
});

app.get('/api/family/members', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const members = await universalMemoryService.getFamilyMembers(personId);
    res.json({ success: true, data: members });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get family members' });
  }
});

app.post('/api/family/care-task', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const task = await universalMemoryService.createCareTask(personId, req.body);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create care task' });
  }
});

app.get('/api/family/care-tasks', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const tasks = await universalMemoryService.getCareTasks(personId, {
      status: req.query.status as string,
      familyMemberId: req.query.familyMemberId as string
    });
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get care tasks' });
  }
});

app.post('/api/family/care-circle', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const circle = await universalMemoryService.addToCareCircle(personId, req.body);
    res.status(201).json({ success: true, data: circle });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add to care circle' });
  }
});

// ============================================
// DOMAIN 7: RELATIONSHIPS
// ============================================

app.post('/api/relationships', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const relationship = await universalMemoryService.addRelationship(personId, req.body);
    res.status(201).json({ success: true, data: relationship });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add relationship' });
  }
});

app.get('/api/relationships', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const relationships = await universalMemoryService.getRelationships(personId);
    res.json({ success: true, data: relationships });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get relationships' });
  }
});

app.get('/api/relationships/health', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const score = await universalMemoryService.getRelationshipHealthScore(personId);
    res.json({ success: true, data: score });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get relationship health' });
  }
});

// ============================================
// CONSULTATIONS
// ============================================

app.post('/api/consultations', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const consultation = await universalMemoryService.scheduleConsultation(personId, req.body);
    res.status(201).json({ success: true, data: consultation });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to schedule consultation' });
  }
});

app.get('/api/consultations', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const consultations = await universalMemoryService.getConsultations(personId, {
      status: req.query.status as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    });
    res.json({ success: true, data: consultations });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get consultations' });
  }
});

// ============================================
// HUMAN TWIN
// ============================================

app.get('/api/human-twin', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const twin = await universalMemoryService.getHumanTwin(personId);
    res.json({ success: true, data: twin });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get human twin' });
  }
});

app.get('/api/summary', async (req, res) => {
  try {
    const personId = req.headers['x-person-id'] as string;
    if (!personId) {
      return res.status(401).json({ success: false, error: 'Person ID required' });
    }
    const summary = await universalMemoryService.getHumanMemorySummary(personId);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get summary' });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   🧬 MyRisa Universal Memory                                       ║
║                                                                   ║
║   Human Intelligence OS                                           ║
║   All 7 Domains: Physical, Mental, Sexual, Lifestyle,             ║
║   Work-Life, Family, Relationships                                ║
║                                                                   ║
║   Port: ${PORT}                                                       ║
║                                                                   ║
║   Following RTNM Doctrine:                                        ║
║   Identity → Memory → Knowledge → Twin → Agent → Intelligence     ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
  `);
});