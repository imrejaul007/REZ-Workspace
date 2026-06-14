/**
 * REZ Intelligence - Additional Services
 * Services not yet connected to PeopleOS
 */

const REZ_AI = {
  DEMAND: process.env.REZ_DEMAND_API || 'https://demand-forecast.rezapp.com/api',
  RECOMMEND: process.env.REZ_RECOMMEND_API || 'https://recommendation.rezapp.com/api',
  PERSONALIZE: process.env.REZ_PERSONALIZE_API || 'https://personalization.rezapp.com',
  FRAUD: process.env.REZ_FRAUD_API || 'https://fraud-detection.rezapp.com',
  REPUTATION: process.env.REZ_REPUTATION_API || 'https://reputation.rezapp.com',
  SENTIMENT: process.env.REZ_SENTIMENT_API || 'https://sentiment.rezapp.com/api',
  CHATBOT: process.env.REZ_CHATBOT_API || 'https://chatbot.rezapp.com',
  VOICE: process.env.REZ_VOICE_API || 'https://voice-bot.rezapp.com',
  AUTONOMOUS: process.env.REZ_AUTONOMOUS_API || 'https://autonomous-agents.rezapp.com',
  AGENT_OS: process.env.REZ_AGENT_OS || 'https://agent-os.rezapp.com',
};

// ─── Demand Forecasting ──────────────────────────────────

export async function getWorkforceDemand(companyId: string, period: 'week' | 'month' = 'month') {
  const res = await fetch(`${REZ_AI.DEMAND}/workforce/${companyId}?period=${period}`);
  return res.json();
}

export async function predictHiringNeed(companyId: string) {
  const res = await fetch(`${REZ_AI.DEMAND}/hiring-need/${companyId}`);
  return res.json();
}

// ─── Personalization ──────────────────────────────────

export async function getPersonalizedLearning(employeeId: string) {
  const res = await fetch(`${REZ_AI.PERSONALIZE}/learning/${employeeId}`);
  return res.json();
}

export async function getPersonalizedBenefits(employeeId: string) {
  const res = await fetch(`${REZ_AI.PERSONALIZE}/benefits/${employeeId}`);
  return res.json();
}

// ─── Fraud Detection ───────────────────────────────────

export async function detectAttendanceAnomaly(employeeId: string, data: { checkIn: string; checkOut: string; location: any }) {
  const res = await fetch(`${REZ_AI.FRAUD}/attendance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId, ...data }),
  });
  return res.json();
}

export async function detectExpenseFraud(expenseId: string, data: any) {
  const res = await fetch(`${REZ_AI.FRAUD}/expense`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expenseId, ...data }),
  });
  return res.json();
}

// ─── Reputation Scoring ─────────────────────────────────

export async function getEmployeeReputation(employeeId: string) {
  const res = await fetch(`${REZ_AI.REPUTATION}/employee/${employeeId}`);
  return res.json();
}

export async function getCompanyReputation(companyId: string) {
  const res = await fetch(`${REZ_AI.REPUTATION}/company/${companyId}`);
  return res.json();
}

// ─── Sentiment Analysis ─────────────────────────────────

export async function analyzeFeedbackSentiment(text: string) {
  const res = await fetch(`${REZ_AI.SENTIMENT}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return res.json();
}

export async function batchAnalyzeSentiment(texts: string[]) {
  const res = await fetch(`${REZ_AI.SENTIMENT}/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts }),
  });
  return res.json();
}

// ─── AI Chatbot ─────────────────────────────────────────

export async function chat(message: string, context?: any) {
  const res = await fetch(`${REZ_AI.CHATBOT}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, context }),
  });
  return res.json();
}

export async function getChatHistory(employeeId: string) {
  const res = await fetch(`${REZ_AI.CHATBOT}/history/${employeeId}`);
  return res.json();
}

// ─── Voice Bot ──────────────────────────────────────────

export async function voiceCommand(audioUrl: string) {
  const res = await fetch(`${REZ_AI.VOICE}/transcribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioUrl }),
  });
  return res.json();
}

export async function textToSpeech(text: string) {
  const res = await fetch(`${REZ_AI.VOICE}/speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return res.json();
}

// ─── Autonomous Agents ──────────────────────────────────

export async function runAgent(task: string, agent: 'recruiter' | 'manager' | 'analyst' = 'manager') {
  const res = await fetch(`${REZ_AI.AUTONOMOUS}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task, agent }),
  });
  return res.json();
}

export async function getAgentStatus(taskId: string) {
  const res = await fetch(`${REZ_AI.AUTONOMOUS}/status/${taskId}`);
  return res.json();
}
