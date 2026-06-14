/**
 * REZ Intelligence Integration
 * PeopleOS → REZ Intelligence services
 */

const REZ_INTELLIGENCE = {
  INTENT: process.env.REZ_INTENT_API || 'https://intent.rezapp.com/api',
  PREDICTIVE: process.env.REZ_PREDICTIVE_API || 'https://predictive.rezapp.com/api',
  INSIGHTS: process.env.REZ_INSIGHTS_API || 'https://insights.rezapp.com/api',
  SIGNALS: process.env.REZ_SIGNALS_API || 'https://signals.rezapp.com/api',
};

const REZ_INTELLIGENCE_AGENTS = {
  AUTONOMOUS_AGENTS: process.env.REZ_AGENTS_API || 'https://agents.rezapp.com/api',
  AI_ADVISOR: process.env.REZ_ADVISOR_API || 'https://advisor.rezapp.com/api',
};

// ─── Employee Attrition ───────────────────────────────────────

export async function predictAttrition(employeeId: string) {
  const res = await fetch(`${REZ_INTELLIGENCE.PREDICTIVE}/attrition/${employeeId}`);
  return res.json();
}

export async function getAttritionFactors(employeeId: string) {
  const res = await fetch(`${REZ_INTELLIGENCE.PREDICTIVE}/attrition/${employeeId}/factors`);
  return res.json();
}

// ─── Burnout Detection ──────────────────────────────────

export async function detectBurnout(employeeId: string) {
  const res = await fetch(`${REZ_INTELLIGENCE.PREDICTIVE}/burnout/${employeeId}`);
  return res.json();
}

export async function burnoutRiskFactors(employeeId: string) {
  const res = await fetch(`${REZ_INTELLIGENCE.PREDICTIVE}/burnout/${employeeId}/factors`);
  return res.json();
}

// ─── Intent Prediction ──────────────────────────────────

export async function predictIntent(employeeId: string) {
  const res = await fetch(`${REZ_INTELLIGENCE.INTENT}/predict/${employeeId}`);
  return res.json();
}

// ─── Workforce Signals ──────────────────────────────────

export async function getWorkforceSignals(companyId: string) {
  const res = await fetch(`${REZ_INTELLIGENCE.SIGNALS}/company/${companyId}`);
  return res.json();
}

export async function getEmployeeSignals(employeeId: string) {
  const res = await fetch(`${REZ_INTELLIGENCE.SIGNALS}/employee/${employeeId}`);
  return res.json();
}

// ─── Insights & Analytics ────────────────────────────────

export async function getWorkforceInsights(companyId: string) {
  const res = await fetch(`${REZ_INTELLIGENCE.INSIGHTS}/workforce/${companyId}`);
  return res.json();
}

export async function getProductivityScore(employeeId: string) {
  const res = await fetch(`${REZ_INTELLIGENCE.INSIGHTS}/productivity/${employeeId}`);
  return res.json();
}

// ─── AI Agents ─────────────────────────────────────────

export async function askAIAdvisor(query: string) {
  const res = await fetch(`${REZ_INTELLIGENCE_AGENTS.AI_ADVISOR}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  return res.json();
}

export async function runAutonomousAgent(task: string, context: any) {
  const res = await fetch(`${REZ_INTELLIGENCE_AGENTS.AUTONOMOUS_AGENTS}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, context }),
  });
  return res.json();
}
