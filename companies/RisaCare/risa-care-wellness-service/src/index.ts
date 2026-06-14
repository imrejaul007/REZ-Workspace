// RisaCare Wellness Service v2.0 - With MongoDB

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { WellnessEntry, HealthScore, logger, now, generateId, calculateCycleDay, predictNextPeriod, predictFertileWindow } from '@risa-care/shared';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

// ============================================
// MONGOOSE SCHEMAS
// ============================================

const WellnessEntrySchema = new mongoose.Schema({
  entryId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  profileId: String,
  date: { type: String, required: true },
  type: { type: String, enum: ['cycle', 'habit', 'mood', 'sleep', 'exercise'] },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: String, default: () => now() },
  updatedAt: { type: String, default: () => now() }
}, { timestamps: true });

WellnessEntrySchema.index({ userId: 1, profileId: 1, type: 1 });
WellnessEntrySchema.index({ userId: 1, date: -1 });

const PregnancyRecordSchema = new mongoose.Schema({
  recordId: { type: String, required: true, unique: true, index: true },
  profileId: String,
  userId: String,
  status: { type: String, enum: ['planning', 'pregnant', 'postpartum'] },
  conceptionDate: String,
  dueDate: String,
  currentWeek: Number,
  trimester: String,
  checkups: [{
    id: String,
    week: Number,
    scheduledDate: String,
    completedDate: String,
    status: String,
    doctorName: String,
    hospitalName: String,
    notes: String
  }],
  ultrasounds: [{
    id: String,
    date: String,
    week: Number,
    findings: String,
    imageUrl: String
  }],
  bloodTests: [{
    id: String,
    date: String,
    testName: String,
    results: String
  }],
  createdAt: { type: String, default: () => now() },
  updatedAt: { type: String, default: () => now() }
}, { timestamps: true });

const ChildVaccineRecordSchema = new mongoose.Schema({
  recordId: { type: String, required: true, unique: true, index: true },
  profileId: String,
  userId: String,
  childName: String,
  dateOfBirth: String,
  vaccines: [{
    id: String,
    vaccineType: String,
    vaccineName: String,
    doseNumber: Number,
    totalDoses: Number,
    scheduledDate: String,
    dueDate: String,
    completedDate: String,
    status: String,
    administeredBy: String,
    hospitalName: String,
    sideEffects: String,
    notes: String,
    nextDoseDate: String,
    nextDoseVaccine: String
  }],
  reminders: {
    enabled: Boolean,
    advanceDays: Number,
    viaPush: Boolean,
    viaSMS: Boolean,
    viaEmail: Boolean
  },
  createdAt: { type: String, default: () => now() },
  updatedAt: { type: String, default: () => now() }
}, { timestamps: true });

const ChallengeProgressSchema = new mongoose.Schema({
  progressId: { type: String, required: true, unique: true, index: true },
  userId: String,
  profileId: String,
  challengeId: String,
  joinedAt: String,
  currentStreak: { type: Number, default: 0 },
  completedDays: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
  createdAt: { type: String, default: () => now() },
  updatedAt: { type: String, default: () => now() }
}, { timestamps: true });

const WellnessEntryModel = mongoose.model('WellnessEntry', WellnessEntrySchema);
const PregnancyRecord = mongoose.model('PregnancyRecord', PregnancyRecordSchema);
const ChildVaccineRecord = mongoose.model('ChildVaccineRecord', ChildVaccineRecordSchema);
const ChallengeProgress = mongoose.model('ChallengeProgress', ChallengeProgressSchema);

// ============================================
// CHALLENGES DATA
// ============================================

const challenges = [
  { id: 'hydration_7', name: '7-Day Hydration Challenge', description: 'Drink 8 glasses of water daily', type: 'hydration', requirements: { dailyGoal: 8, totalDays: 7, minimumDaysRequired: 5 }, rewards: { coins: 100, badge: 'hydration_hero' } },
  { id: 'sleep_30', name: '30-Day Sleep Challenge', description: 'Get 7+ hours of sleep', type: 'sleep', requirements: { dailyGoal: 7, totalDays: 30, minimumDaysRequired: 25 }, rewards: { coins: 500, badge: 'sleep_champion' } },
  { id: 'walk_10k', name: '10K Steps Daily', description: 'Walk 10,000 steps daily', type: 'steps', requirements: { dailyGoal: 10000, totalDays: 14, minimumDaysRequired: 10 }, rewards: { coins: 300, badge: 'step_master' } }
];

const pregnancyWeekData: Record<number, any> = {
  4: { week: 4, trimester: 'first', babySize: 'Poppy seed', motherChanges: ['Fatigue', 'Breast tenderness'], commonSymptoms: ['Nausea'], recommendedTests: ['Pregnancy test'] },
  8: { week: 8, trimester: 'first', babySize: 'Raspberry', commonSymptoms: ['Morning sickness'], recommendedTests: ['First ultrasound'] },
  12: { week: 12, trimester: 'first', babySize: 'Plum', motherChanges: ['Energy returns'], recommendedTests: ['NT scan'] },
  20: { week: 20, trimester: 'second', babySize: 'Banana', motherChanges: ['Baby bump visible'], recommendedTests: ['Anatomy scan'] },
  24: { week: 24, trimester: 'second', babySize: 'Cantaloupe', recommendedTests: ['Glucose test'] },
  28: { week: 28, trimester: 'third', babySize: 'Eggplant', recommendedTests: ['TDAP vaccine'] },
  40: { week: 40, trimester: 'third', babySize: 'Pumpkin', recommendedTests: ['Weekly checkups'] }
};

const vaccinationSchedule = [
  { name: 'BCG', type: 'bcg', doses: 1, age: 'At birth' },
  { name: 'Hepatitis B', type: 'hepb', doses: 3, age: '0, 1, 6 months' },
  { name: 'OPV', type: 'opv', doses: 4, age: '0, 2, 4, 6 months' },
  { name: 'DTP', type: 'dtap', doses: 5, age: '2, 4, 6, 18 months, 5 years' },
  { name: 'MMR', type: 'mmr', doses: 2, age: '9, 15 months' }
];

// ============================================
// APP SETUP
// ============================================

const app = express();
const PORT = parseInt(process.env.PORT || '4710', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/risa_care_wellness';

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use((req: Request, res: Response, next) => {
  req.requestId = (req.headers['x-request-id'] as string) || `req_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'risa-care-wellness-service',
    version: '2.0.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/ready', (req: Request, res: Response) => {
  res.json({ status: 'ready' });
});

// ============================================
// CYCLE TRACKING
// ============================================

app.get('/cycle', async (req: Request, res: Response) => {
  const profileId = req.query.profileId as string;
  const userId = req.headers['x-user-id'] as string || 'default_user';

  const entries = await WellnessEntryModel.find({ userId, profileId, type: 'cycle' }).sort({ date: -1 }).limit(20);

  let predictions = {};
  if (entries.length > 0) {
    const lastPeriod = entries.find(e => (e.data as any).cycleType === 'period_start');
    if (lastPeriod) {
      const startDate = (lastPeriod.data as any).date || lastPeriod.date;
      const cycleInfo = calculateCycleDay(startDate, 28);
      predictions = {
        currentCycle: { startDate, dayNumber: cycleInfo.day, predictedEnd: predictNextPeriod(startDate, 28) },
        predictions: { nextPeriodStart: predictNextPeriod(startDate, 28), fertileWindow: predictFertileWindow(startDate, 28) }
      };
    }
  }

  res.json({
    success: true,
    data: { profileId, ...predictions, recentEntries: entries.map(e => ({ id: e.entryId, date: e.date, ...e.data })) },
    meta: { requestId: req.requestId, timestamp: now() }
  });
});

app.post('/cycle', async (req: Request, res: Response) => {
  const { profileId, date, cycleType, flowIntensity, symptoms, mood, energy, notes } = req.body;
  const userId = req.headers['x-user-id'] as string || 'default_user';

  const entry = await WellnessEntryModel.create({
    entryId: generateId('entry'),
    userId,
    profileId,
    date,
    type: 'cycle',
    data: { cycleType, flowIntensity, symptoms: symptoms || [], mood, energy, notes }
  });

  logger.info(`Logged cycle entry for ${profileId}: ${cycleType}`);
  res.status(201).json({ success: true, data: entry, meta: { requestId: req.requestId, timestamp: now() } });
});

// ============================================
// HABIT TRACKING
// ============================================

app.get('/habits', async (req: Request, res: Response) => {
  const profileId = req.query.profileId as string;
  const userId = req.headers['x-user-id'] as string || 'default_user';
  const today = new Date().toISOString().split('T')[0];

  const [todayEntries, recentEntries] = await Promise.all([
    WellnessEntryModel.find({ userId, profileId, date: today, type: 'habit' }),
    WellnessEntryModel.find({ userId, profileId, type: 'habit' }).sort({ date: -1 }).limit(20)
  ]);

  res.json({
    success: true,
    data: {
      profileId,
      todayProgress: {
        water: todayEntries.filter(e => (e.data as any).habitType === 'water').reduce((sum, e) => sum + Number((e.data as any).value), 0),
        sleep: Number(todayEntries.find(e => (e.data as any).habitType === 'sleep')?.data?.value || 0),
        steps: todayEntries.filter(e => (e.data as any).habitType === 'steps').reduce((sum, e) => sum + Number((e.data as any).value), 0)
      },
      recentEntries: recentEntries.map(e => ({ id: e.entryId, date: e.date, ...e.data }))
    },
    meta: { requestId: req.requestId, timestamp: now() }
  });
});

app.post('/habits', async (req: Request, res: Response) => {
  const { profileId, date, habitType, value, unit, goal, notes } = req.body;
  const userId = req.headers['x-user-id'] as string || 'default_user';

  const entry = await WellnessEntryModel.create({
    entryId: generateId('entry'),
    userId,
    profileId,
    date: date || new Date().toISOString().split('T')[0],
    type: 'habit',
    data: { habitType, value, unit, goal, completed: goal ? value >= goal : false, notes }
  });

  logger.info(`Logged habit for ${profileId}: ${habitType} = ${value}${unit || ''}`);
  res.status(201).json({ success: true, data: entry, meta: { requestId: req.requestId, timestamp: now() } });
});

// ============================================
// CHALLENGES
// ============================================

app.get('/challenges', async (req: Request, res: Response) => {
  const profileId = req.query.profileId as string;
  const userId = req.headers['x-user-id'] as string || 'default_user';

  const progress = await ChallengeProgress.find({ userId, profileId });
  const progressMap = new Map(progress.map(p => [p.challengeId, p]));

  const challengesWithProgress = challenges.map(c => {
    const p = progressMap.get(c.id);
    return {
      ...c,
      progress: { currentStreak: p?.currentStreak || 0, completedDays: p?.completedDays || 0, percentage: Math.min(100, Math.round(((p?.completedDays || 0) / c.requirements.totalDays) * 100)) },
      isJoined: !!p,
      status: p?.status || 'active'
    };
  });

  res.json({ success: true, data: challengesWithProgress, meta: { requestId: req.requestId, timestamp: now() } });
});

app.post('/challenges/:id/join', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { profileId } = req.body;
  const userId = req.headers['x-user-id'] as string || 'default_user';

  const challenge = challenges.find(c => c.id === id);
  if (!challenge) return res.status(404).json({ success: false, error: { code: 'CHALLENGE_NOT_FOUND' } });

  const existing = await ChallengeProgress.findOne({ userId, profileId, challengeId: id });
  if (existing) return res.json({ success: true, data: { challengeId: id, joinedAt: existing.joinedAt } });

  const progress = await ChallengeProgress.create({
    progressId: generateId('prog'),
    userId,
    profileId,
    challengeId: id,
    joinedAt: now()
  });

  logger.info(`User ${userId} joined challenge ${id}`);
  res.status(201).json({ success: true, data: { challengeId: id, joinedAt: progress.joinedAt, rewards: challenge.rewards } });
});

// ============================================
// PREGNANCY TRACKING
// ============================================

function calculatePregnancyWeek(dueDate: string): { week: number; trimester: string } {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - today.getTime();
  const weeksUntilDue = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  const currentWeek = 40 - Math.abs(weeksUntilDue);
  const trimester = currentWeek <= 12 ? 'first' : currentWeek <= 28 ? 'second' : 'third';
  return { week: Math.max(1, Math.min(42, currentWeek)), trimester };
}

app.post('/pregnancy', async (req: Request, res: Response) => {
  const { profileId, status, conceptionDate, dueDate } = req.body;
  const userId = req.headers['x-user-id'] as string || 'default_user';

  let weekInfo: any = {};
  if (dueDate) weekInfo = calculatePregnancyWeek(dueDate);

  const record = await PregnancyRecord.create({
    recordId: generateId('preg'),
    profileId,
    userId,
    status,
    conceptionDate,
    dueDate,
    ...weekInfo
  });

  res.status(201).json({ success: true, data: record });
});

app.get('/pregnancy/:profileId', async (req: Request, res: Response) => {
  const record = await PregnancyRecord.findOne({ profileId: req.params.profileId, status: 'pregnant' }).sort({ createdAt: -1 });
  res.json({ success: true, data: record });
});

app.get('/pregnancy/:profileId/week', async (req: Request, res: Response) => {
  const record = await PregnancyRecord.findOne({ profileId: req.params.profileId, status: 'pregnant' });
  if (!record || !record.dueDate) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });

  const { week, trimester } = calculatePregnancyWeek(record.dueDate);
  const weekInfo = pregnancyWeekData[week] || pregnancyWeekData[Math.floor(week / 4) * 4] || pregnancyWeekData[40];

  res.json({ success: true, data: { currentWeek: week, trimester, dueDate: record.dueDate, weekInfo } });
});

app.post('/pregnancy/:id/checkup', async (req: Request, res: Response) => {
  const { week, scheduledDate, doctorName, hospitalName, notes } = req.body;
  const record = await PregnancyRecord.findOneAndUpdate(
    { recordId: req.params.id },
    { $push: { checkups: { id: generateId('chk'), week, scheduledDate, status: 'scheduled', doctorName, hospitalName, notes } } },
    { new: true }
  );
  if (!record) return res.status(404).json({ success: false });
  res.json({ success: true, data: record });
});

// ============================================
// VACCINATION TRACKING
// ============================================

function generateVaccineDoses(dob: Date): any[] {
  const doses: any[] = [];
  const schedule = [
    { month: 0, vaccines: ['bcg', 'hepb', 'opv'] }, { month: 2, vaccines: ['dtap', 'opv'] },
    { month: 4, vaccines: ['dtap', 'opv'] }, { month: 6, vaccines: ['dtap', 'hepb', 'opv'] },
    { month: 9, vaccines: ['mmr'] }, { month: 12, vaccines: ['hepa'] }, { month: 15, vaccines: ['mmr'] }, { month: 18, vaccines: ['dtap'] }
  ];

  for (const s of schedule) {
    const scheduledDate = new Date(dob);
    scheduledDate.setMonth(scheduledDate.getMonth() + s.month);
    for (const vType of s.vaccines) {
      const vaccine = vaccinationSchedule.find(v => v.type === vType);
      if (!vaccine) continue;
      const doseNum = doses.filter(d => d.vaccineType === vType).length + 1;
      if (doseNum > vaccine.doses) continue;
      doses.push({ id: generateId('vac'), vaccineType: vType, vaccineName: vaccine.name, doseNumber: doseNum, totalDoses: vaccine.doses, scheduledDate: scheduledDate.toISOString(), dueDate: scheduledDate.toISOString(), status: 'pending' });
    }
  }
  return doses;
}

app.post('/vaccination/child', async (req: Request, res: Response) => {
  const { profileId, childName, dateOfBirth } = req.body;
  const userId = req.headers['x-user-id'] as string || 'default_user';

  const record = await ChildVaccineRecord.create({
    recordId: generateId('chld'),
    profileId, userId, childName, dateOfBirth,
    vaccines: generateVaccineDoses(new Date(dateOfBirth)),
    reminders: { enabled: true, advanceDays: 7, viaPush: true, viaSMS: false, viaEmail: false }
  });

  res.status(201).json({ success: true, data: record });
});

app.get('/vaccination/child/:profileId', async (req: Request, res: Response) => {
  const records = await ChildVaccineRecord.find({ profileId: req.params.profileId });
  res.json({ success: true, data: records });
});

app.get('/vaccination/child/:profileId/upcoming', async (req: Request, res: Response) => {
  const record = await ChildVaccineRecord.findOne({ profileId: req.params.profileId });
  if (!record) return res.status(404).json({ success: false });

  const today = new Date();
  const upcoming = record.vaccines.filter((v: any) => v.status === 'pending' && new Date(v.dueDate) <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000));
  res.json({ success: true, data: upcoming });
});

app.post('/vaccination/child/:id/dose', async (req: Request, res: Response) => {
  const { vaccineId, completedDate, administeredBy, hospitalName, sideEffects, notes } = req.body;

  const record = await ChildVaccineRecord.findOne({ recordId: req.params.id });
  if (!record) return res.status(404).json({ success: false });

  const vaccine = record.vaccines.find((v: any) => v.id === vaccineId);
  if (!vaccine) return res.status(404).json({ success: false });

  Object.assign(vaccine, { completedDate, status: 'completed', administeredBy, hospitalName, sideEffects, notes });

  const nextDose = record.vaccines.find((v: any) => v.vaccineType === vaccine.vaccineType && v.doseNumber === vaccine.doseNumber + 1);
  if (nextDose) { vaccine.nextDoseDate = nextDose.dueDate; vaccine.nextDoseVaccine = nextDose.vaccineName; }

  await record.save();
  res.json({ success: true, data: record });
});

app.get('/vaccination/schedule', (req: Request, res: Response) => {
  res.json({ success: true, data: vaccinationSchedule });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error', err);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR' } });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
});

// ============================================
// START
// ============================================

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Wellness Service connected to MongoDB');
    app.listen(PORT, () => logger.info(`RisaCare Wellness Service v2.0 started on port ${PORT}`));
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

startServer();
export default app;