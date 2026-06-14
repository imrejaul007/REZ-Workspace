/**
 * REZ Intelligence Integration
 * PeopleOS AI Hub
 */

const AI_SERVICES = {
  INTENT: process.env.REZ_INTENT_API || 'https://rez-intent-predictor.rezapp.com',
  PREDICTIVE: process.env.REZ_PREDICTIVE_API || 'https://rez-predictive-engine.rezapp.com',
  INSIGHTS: process.env.REZ_INSIGHTS_API || 'https://rez-insights-service.rezapp.com',
  RECOMMEND: process.env.REZ_RECOMMEND_API || 'https://rez-recommendation-engine.rezapp.com',
  SIGNAL: process.env.REZ_SIGNAL_API || 'https://rez-signal-aggregator.rezapp.com',
  CAREER_GRAPH: process.env.REZ_CAREER_GRAPH || 'https://rez-career-graph.rezapp.com',
};

// ─── Predictive Engine - Attrition & Retention ────────────────────────────────

export async function predictAttrition(employeeId: string): Promise<{
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: string[];
  recommendations: string[];
}> {
  const res = await fetch(`${AI_SERVICES.PREDICTIVE}/api/predict/attrition`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId }),
  });
  return res.json();
}

export async function predictBurnout(employeeId: string): Promise<{
  score: number;
  level: 'low' | 'medium' | 'high';
  factors: string[];
}> {
  const res = await fetch(`${AI_SERVICES.PREDICTIVE}/api/predict/burnout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId }),
  });
  return res.json();
}

export async function getRetentionScore(employeeId: string): Promise<{
  score: number;
  factors: string[];
  improvements: string[];
}> {
  const res = await fetch(`${AI_SERVICES.PREDICTIVE}/api/retention`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId }),
  });
  return res.json();
}

// ─── Intent Service - Workforce Intent ──────────────────────────────

export async function predictWorkIntent(employeeId: string): Promise<{
  intent: 'growth' | 'stable' | 'leaving';
  confidence: number;
  signals: string[];
}> {
  const res = await fetch(`${AI_SERVICES.INTENT}/api/worker-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId }),
  });
  return res.json();
}

export async function getTrainingRecommendations(employeeId: string): Promise<{
  skills: string[];
  courses: string[];
  urgency: 'low' | 'medium' | 'high';
}> {
  const res = await fetch(`${AI_SERVICES.RECOMMEND}/api/training`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId }),
  });
  return res.json();
}

// ─── Insights - Workforce Analytics ──────────────────────────────

export async function getWorkforceInsights(companyId: string): Promise<{
  engagement: number;
  productivity: number;
  satisfaction: number;
  trends: { metric: string; change: number }[];
}> {
  const res = await fetch(`${AI_SERVICES.INSIGHTS}/api/insights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ companyId }),
  });
  return res.json();
}

export async function getTeamHealth(teamId: string): Promise<{
  health: number;
  risks: string[];
  recommendations: string[];
}> {
  const res = await fetch(`${AI_SERVICES.INSIGHTS}/api/team-health`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId }),
  });
  return res.json();
}

// ─── Signals - Workforce Signals ──────────────────────────────

export async function getEmployeeSignals(employeeId: string): Promise<{
  signals: { type: string; score: number; description: string }[];
  summary: string;
}> {
  const res = await fetch(`${AI_SERVICES.SIGNAL}/api/employee-signals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId }),
  });
  return res.json();
}
