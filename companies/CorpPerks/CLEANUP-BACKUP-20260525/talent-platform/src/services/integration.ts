/**
 * Talent Platform - External Service Integrations
 * Connects to REZ Profile Service and Career Graph
 */

import axios from 'axios';

// Service URLs
const PROFILE_SERVICE_URL = process.env.PROFILE_SERVICE_URL || 'http://localhost:4001';
const CAREER_GRAPH_URL = process.env.CAREER_GRAPH_URL || 'http://localhost:4055';
const INTENT_GRAPH_URL = process.env.INTENT_GRAPH_URL || 'http://localhost:3001';

// ─── Profile Service Integration ─────────────────────────────────────────────────

export interface PersonaResponse {
  primaryPersona: string;
  secondaryPersonas: string[];
  activePersona: string;
  personas: Record<string, any>;
  studentExtension?: any;
  employeeExtension?: any;
}

export async function getPersonas(userId: string): Promise<PersonaResponse | null> {
  try {
    const response = await axios.get(`${PROFILE_SERVICE_URL}/api/personas/${userId}`);
    return response.data.data;
  } catch (error) {
    logger.error('Error fetching personas:', error);
    return null;
  }
}

export async function activatePersona(
  userId: string,
  persona: string,
  verificationData?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await axios.post(`${PROFILE_SERVICE_URL}/api/personas/activate`, {
      persona,
      verificationData,
    });
    return response.data;
  } catch (error: any) {
    return { success: false, error: error.response?.data?.error || 'Failed to activate persona' };
  }
}

export async function updatePersonaExtension(
  userId: string,
  persona: string,
  data: any
): Promise<{ success: boolean; error?: string }> {
  try {
    await axios.patch(`${PROFILE_SERVICE_URL}/api/personas/extension`, {
      persona,
      data,
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.error || 'Failed to update extension' };
  }
}

// ─── Career Graph Integration ──────────────────────────────────────────────────

export interface CareerData {
  userId: string;
  careerProfile: {
    education: any[];
    experience: any[];
    skills: any[];
    certifications: any[];
    internships: any[];
    projects: any[];
  };
  preferences: any;
  derived: {
    totalExperience: number;
    skillScore: number;
    overallScore: number;
    topSkills: string[];
  };
}

export async function getCareerGraph(userId: string): Promise<CareerData | null> {
  try {
    const response = await axios.get(`${CAREER_GRAPH_URL}/api/career/${userId}`);
    return response.data.data;
  } catch (error) {
    logger.error('Error fetching career graph:', error);
    return null;
  }
}

export async function addSkill(
  userId: string,
  skill: { name: string; level?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    await axios.post(`${CAREER_GRAPH_URL}/api/career/${userId}/skills`, skill);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.error || 'Failed to add skill' };
  }
}

export async function addInternship(
  userId: string,
  internship: any
): Promise<{ success: boolean; error?: string }> {
  try {
    await axios.post(`${CAREER_GRAPH_URL}/api/career/${userId}/internships`, internship);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.error || 'Failed to add internship' };
  }
}

export async function getCareerAnalytics(userId: string): Promise<any | null> {
  try {
    const response = await axios.get(`${CAREER_GRAPH_URL}/api/career/${userId}/analytics`);
    return response.data.data;
  } catch (error) {
    logger.error('Error fetching career analytics:', error);
    return null;
  }
}

// ─── Intent Graph Integration ──────────────────────────────────────────────────

export async function captureJobIntent(
  userId: string,
  intentData: { roles?: string[]; skills?: string[]; location?: string[] }
): Promise<void> {
  try {
    await axios.post(`${INTENT_GRAPH_URL}/api/intent/capture`, {
      userId,
      type: 'job_search',
      data: intentData,
    });
  } catch (error) {
    logger.error('Error capturing job intent:', error);
  }
}

// ─── Skill Matching ─────────────────────────────────────────────────────────────

export async function findMatchingCandidates(
  skills: string[]
): Promise<{ userId: string; matchScore: number }[]> {
  try {
    const response = await axios.get(
      `${CAREER_GRAPH_URL}/api/career/search/skills?skills=${skills.join(',')}`
    );
    return response.data.data || [];
  } catch (error) {
    logger.error('Error finding matching candidates:', error);
    return [];
  }
}

// ─── Profile Strength Calculator ─────────────────────────────────────────────

export function calculateProfileStrength(careerData: CareerData): number {
  let score = 0;

  // Education (max 20 points)
  if (careerData.careerProfile.education?.length > 0) {
    score += 20;
  }

  // Experience (max 20 points)
  if (careerData.careerProfile.experience?.length > 0) {
    score += 20;
  }

  // Skills (max 25 points)
  const skillCount = careerData.careerProfile.skills?.length || 0;
  score += Math.min(25, skillCount * 3);

  // Certifications (max 15 points)
  const certCount = careerData.careerProfile.certifications?.length || 0;
  score += Math.min(15, certCount * 5);

  // Projects (max 10 points)
  const projectCount = careerData.careerProfile.projects?.length || 0;
  score += Math.min(10, projectCount * 5);

  // Internships (max 10 points)
  const internshipCount = careerData.careerProfile.internships?.length || 0;
  score += Math.min(10, internshipCount * 5);

  return Math.min(100, score);
}
