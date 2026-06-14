/**
 * REZ Intelligence Data Pipeline
 * All PeopleOS data → REZ Intelligence
 */

const REZ_INTELLIGENCE = process.env.REZ_INSIGHTS_API || 'https://insights.rezapp.com';
const REZ_PREDICTIVE = process.env.REZ_PREDICTIVE_API || 'https://predictive.rezapp.com';
const REZ_SIGNALS = process.env.REZ_SIGNALS_API || 'https://signals.rezapp.com';

// ─── Employee Data ─────────────────────────────────────────

export async function syncEmployee(employee: {
  id: string;
  companyId: string;
  department: string;
  role: string;
  salary: number;
  tenure: number;
  performance: number;
}) {
  await fetch(`${REZ_SIGNALS}/employee`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...employee, source: 'peopleos', timestamp: Date.now() }),
  });
}

// ─── Attendance Data ──────────────────────────────────────

export async function syncAttendance(data: {
  employeeId: string;
  companyId: string;
  checkIn: Date;
  checkOut?: Date;
  type: 'office' | 'wfh' | 'field';
  location?: { lat: number; lng: number };
  onTime: boolean;
}) {
  await fetch(`${REZ_SIGNALS}/attendance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, timestamp: Date.now() }),
  });
}

// ─── Payroll Data ────────────────────────────────────────

export async function syncPayroll(data: {
  employeeId: string;
  companyId: string;
  gross: number;
  net: number;
  deductions: number;
  bonus?: number;
  month: string;
}) {
  await fetch(`${REZ_SIGNALS}/payroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, timestamp: Date.now() }),
  });
}

// ─── Performance Data ───────────────────────────────────

export async function syncPerformance(data: {
  employeeId: string;
  companyId: string;
  rating: number;
  goals: string[];
  feedback: string;
}) {
  await fetch(`${REZ_SIGNALS}/performance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, timestamp: Date.now() }),
  });
}

// ─── Engagement Data ─────────────────────────────────────

export async function syncEngagement(data: {
  employeeId: string;
  companyId: string;
  recognition: number;
  badges: string[];
  moodScore?: number;
  surveyResponses?: Record<string, any>;
}) {
  await fetch(`${REZ_SIGNALS}/engagement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, timestamp: Date.now() }),
  });
}

// ─── Task Data ──────────────────────────────────────────

export async function syncTasks(data: {
  employeeId: string;
  companyId: string;
  tasksCompleted: number;
  tasksDelayed: number;
  avgCompletion: number;
}) {
  await fetch(`${REZ_SIGNALS}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, timestamp: Date.now() }),
  });
}

// ─── Career Data ────────────────────────────────────────

export async function syncCareer(data: {
  employeeId: string;
  companyId: string;
  promotions: number;
  department: string;
  role: string;
  skills: string[];
  certifications: string[];
}) {
  await fetch(`${REZ_PREDICTIVE}/career-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, timestamp: Date.now() }),
  });
}

// ─── Training Data ─────────────────────────────────────

export async function syncTraining(data: {
  employeeId: string;
  course: string;
  progress: number;
  completion: number;
}) {
  await fetch(`${REZ_SIGNALS}/training`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, timestamp: Date.now() }),
  });
}

// ─── Benefits Utilization ────────────────────────────────

export async function syncBenefits(data: {
  employeeId: string;
  walletUsed: number;
  rewards: number;
  perks: string[];
}) {
  await fetch(`${REZ_SIGNALS}/benefits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, timestamp: Date.now() }),
  });
}

// ─── Predictive Insights ─────────────────────────────────

export async function getPredictions(employeeId: string) {
  const [attrition, burnout, intent] = await Promise.all([
    fetch(`${REZ_PREDICTIVE}/attrition/${employeeId}`).then(r => r.json()),
    fetch(`${REZ_PREDICTIVE}/burnout/${employeeId}`).then(r => r.json()),
    fetch(`${REZ_PREDICTIVE}/intent/${employeeId}`).then(r => r.json()),
  ]);

  return { attrition, burnout, intent };
}
