/**
 * REZ Intelligence Integration for CareerOS
 *
 * Connects CareerOS to the REZ Intelligence platform for:
 * - Intent prediction
 * - Career recommendations
 * - Skill gap analysis
 * - Job matching
 * - Salary benchmarking
 */

const REZ_INTELLIGENCE_URL = process.env.REZ_INTELLIGENCE_URL || 'http://localhost:4018';
const REZ_INTELLIGENCE_API_KEY = process.env.REZ_INTELLIGENCE_API_KEY || '';

interface IntelligenceRequest {
  userId: string;
  signal?: string;
  context?: Record<string, unknown>;
}

interface IntelligenceResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

async function callRezIntelligence(endpoint: string, body: IntelligenceRequest): Promise<IntelligenceResponse> {
  try {
    const response = await fetch(`${REZ_INTELLIGENCE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': REZ_INTELLIGENCE_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`REZ Intelligence API error: ${response.status}`);
    }

    return { success: true, data: await response.json() };
  } catch (error) {
    logger.error('REZ Intelligence error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Intent Prediction - Understand user's career intent
export async function predictCareerIntent(userId: string, context?: {
  skills?: string[];
  experience?: number;
  targetRole?: string;
}): Promise<IntelligenceResponse> {
  return callRezIntelligence('/api/intent/predict', {
    userId,
    signal: 'career_navigation',
    context,
  });
}

// Career Path Recommendations
export async function getCareerPathRecommendations(userId: string, params: {
  currentRole: string;
  targetRole: string;
  skills: string[];
}): Promise<IntelligenceResponse> {
  return callRezIntelligence('/api/recommendations/career-path', {
    userId,
    context: params,
  });
}

// Resume Analysis - ATS optimization
export async function analyzeResume(userId: string, resumeText: string): Promise<IntelligenceResponse> {
  return callRezIntelligence('/api/analyze/resume', {
    userId,
    signal: 'resume_upload',
    context: { resumeText },
  });
}

// Interview Question Generation
export async function generateInterviewQuestions(userId: string, params: {
  role: string;
  difficulty: 'easy' | 'medium' | 'hard';
  types: ('behavioral' | 'technical' | 'system-design')[];
}): Promise<IntelligenceResponse> {
  return callRezIntelligence('/api/generate/interview-questions', {
    userId,
    signal: 'interview_prep',
    context: params,
  });
}

// Skill Gap Analysis
export async function analyzeSkillGap(userId: string, params: {
  currentSkills: string[];
  targetRole: string;
}): Promise<IntelligenceResponse> {
  return callRezIntelligence('/api/analyze/skill-gap', {
    userId,
    signal: 'skill_gap_analysis',
    context: params,
  });
}

// Job Matching
export async function matchJobs(userId: string, params: {
  skills: string[];
  experience: number;
  location?: string;
  salary?: { min: number; max: number };
}): Promise<IntelligenceResponse> {
  return callRezIntelligence('/api/match/jobs', {
    userId,
    signal: 'job_search',
    context: params,
  });
}

// Salary Benchmarking
export async function getSalaryBenchmark(params: {
  role: string;
  location: string;
  experience: number;
  skills?: string[];
}): Promise<IntelligenceResponse> {
  return callRezIntelligence('/api/benchmark/salary', {
    userId: 'anonymous',
    signal: 'salary_research',
    context: params,
  });
}

// Interview Feedback Analysis
export async function analyzeInterviewFeedback(userId: string, params: {
  question: string;
  answer: string;
  role: string;
}): Promise<IntelligenceResponse> {
  return callRezIntelligence('/api/analyze/interview-feedback', {
    userId,
    signal: 'interview_response',
    context: params,
  });
}

// Hyperlocal Service Matching (for marketplace)
export async function matchLocalServices(params: {
  location: { lat: number; lng: number };
  skillsNeeded: string[];
  budget?: number;
}): Promise<IntelligenceResponse> {
  return callRezIntelligence('/api/match/local-services', {
    userId: 'anonymous',
    signal: 'local_service_search',
    context: params,
  });
}

// Event/Opportunity Recommendations
export async function getOpportunityRecommendations(userId: string, params: {
  interests: string[];
  educationLevel?: string;
  location?: string;
}): Promise<IntelligenceResponse> {
  return callRezIntelligence('/api/recommendations/opportunities', {
    userId,
    signal: 'opportunity_discovery',
    context: params,
  });
}

// Send career event to intelligence pipeline
export async function sendCareerEvent(userId: string, event: {
  type: 'resume_view' | 'job_apply' | 'interview_complete' | 'skill_update' | 'career_path_view';
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await callRezIntelligence('/api/events/career', {
    userId,
    signal: event.type,
    context: event.metadata,
  });
}
