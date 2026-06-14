/**
 * REZ Intelligence Integration
 * Connect CorpPerks apps to REZ AI services
 */

const INTENT_API = process.env.INTENT_API || 'https://rez-intent-predictor.rezapp.com';
const PREDICTIVE_API = process.env.PREDICTIVE_API || 'https://rez-predictive-engine.rezapp.com';
const INSIGHTS_API = process.env.INSIGHTS_API || 'https://rez-insights-service.rezapp.com';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface JobMatchResult {
  jobId: string;
  candidateId: string;
  matchScore: number;
  skillGap: string[];
  interviewProbability: number;
  reasons: string[];
}

export interface WorkforceInsight {
  employeeId: string;
  retentionRisk: number;
  burnoutScore: number;
  performancePrediction: number;
  recommendations: string[];
}

export interface CareerPath {
  currentRole: string;
  suggestedRoles: {
    role: string;
    timeToTransition: string;
    skillsNeeded: string[];
    salaryImpact: string;
  }[];
}

// ─── Job Matching AI ──────────────────────────────────────────────────────────────

export async function matchCandidateToJob(
  candidateId: string,
  jobId: string
): Promise<JobMatchResult | null> {
  try {
    const response = await fetch(`${INTENT_API}/api/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId, jobId }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data;
  } catch (error) {
    logger.error('Job matching error:', error);
    return null;
  }
}

export async function getRecommendedJobsForCandidate(
  candidateId: string,
  limit: number = 10
): Promise<JobMatchResult[]> {
  try {
    const response = await fetch(
      `${INTENT_API}/api/recommend?candidateId=${candidateId}&limit=${limit}`
    );
    const data = await response.json();
    return data.jobs || [];
  } catch (error) {
    logger.error('Recommendations error:', error);
    return [];
  }
}

// ─── Workforce Intelligence ───────────────────────────────────────────────────────

export async function getEmployeeInsights(employeeId: string): Promise<WorkforceInsight | null> {
  try {
    const response = await fetch(`${PREDICTIVE_API}/api/workforce/${employeeId}`);
    const data = await response.json();
    return data.insights;
  } catch (error) {
    logger.error('Workforce insights error:', error);
    return null;
  }
}

export async function predictAttritionRisk(companyId: string): Promise<{
  employees: { employeeId: string; riskScore: number; factors: string[] }[];
} | null> {
  try {
    const response = await fetch(`${PREDICTIVE_API}/api/attrition?companyId=${companyId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    logger.error('Attrition prediction error:', error);
    return null;
  }
}

export async function detectBurnoutRisk(employeeId: string): Promise<{
  score: number;
  level: 'low' | 'medium' | 'high';
  factors: string[];
  recommendations: string[];
} | null> {
  try {
    const response = await fetch(`${PREDICTIVE_API}/api/burnout/${employeeId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    return null;
  }
}

// ─── Career Intelligence ──────────────────────────────────────────────────────────

export async function getCareerPath(
  currentSkills: string[],
  targetRole: string
): Promise<CareerPath | null> {
  try {
    const response = await fetch(`${INTENT_API}/api/career/path`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentSkills, targetRole }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return null;
  }
}

export async function analyzeSkillGap(
  candidateId: string,
  targetJobId: string
): Promise<{
  currentSkills: string[];
  missingSkills: string[];
  learningPath: string[];
  estimatedTime: string;
} | null> {
  try {
    const response = await fetch(`${INTENT_API}/api/skill-gap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId, targetJobId }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    return null;
  }
}

// ─── Business Insights ────────────────────────────────────────────────────────────

export async function getHiringInsights(companyId: string): Promise<{
  totalApplications: number;
  conversionRate: number;
  avgTimeToHire: number;
  topSources: string[];
  recommendations: string[];
} | null> {
  try {
    const response = await fetch(`${INSIGHTS_API}/api/hiring?companyId=${companyId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    return null;
  }
}

export async function getWorkforceAnalytics(companyId: string): Promise<{
  headcount: number;
  turnoverRate: number;
  productivityIndex: number;
  engagementScore: number;
  costPerEmployee: number;
  trends: { month: string; metric: string; value: number }[];
} | null> {
  try {
    const response = await fetch(`${INSIGHTS_API}/api/workforce?companyId=${companyId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    return null;
  }
}

// ─── AI Assistant (Natural Language) ─────────────────────────────────────────────

export async function askAI(
  question: string,
  context: 'hiring' | 'workforce' | 'career'
): Promise<string> {
  try {
    const response = await fetch(`${INSIGHTS_API}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, context }),
    });
    const data = await response.json();
    return data.answer || 'Unable to process your question.';
  } catch (error) {
    return 'AI service temporarily unavailable.';
  }
}
