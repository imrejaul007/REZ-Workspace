import axios from 'axios';
import {
  CIScore,
  CIScoreFactors,
  RABTULProfile,
  CorpIdRecord,
  AppError,
} from '../types';
import { CorpIdProfileBridge, getCorpIdByProfileId } from './profileSyncService';

/**
 * CI Score Service
 *
 * Calculates and retrieves the Composite Index (CI) Score for an employee
 * based on their RABTUL Profile data:
 * - Attendance → Reliability score
 * - Projects → Delivery score
 * - Learning → Growth score
 * - Recognition → Collaboration score
 */

// ============================================
// RABTUL Profile Service Client
// ============================================

async function fetchRABTULProfile(profileId: string): Promise<RABTULProfile> {
  const profileServiceUrl = process.env.RABTUL_PROFILE_SERVICE_URL || 'http://localhost:4002';

  try {
    const response = await axios.get<RABTULProfile>(
      `${profileServiceUrl}/api/profiles/${profileId}`,
      {
        headers: {
          'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN,
        },
        timeout: 5000,
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new AppError(404, 'PROFILE_NOT_FOUND', `Profile ${profileId} not found`);
    }
    throw new AppError(503, 'SERVICE_UNAVAILABLE', 'RABTUL Profile service unavailable');
  }
}

// ============================================
// CI Score Calculation
// ============================================

/**
 * Calculate Reliability Score based on attendance
 */
function calculateReliabilityScore(attendance?: RABTULProfile['attendance']): number {
  if (!attendance || attendance.length === 0) {
    return 200; // Default neutral score
  }

  const totalDays = attendance.length;
  const presentDays = attendance.filter((a) => a.status === 'present' || a.status === 'late').length;
  const lateDays = attendance.filter((a) => a.status === 'late').length;

  const attendanceRate = presentDays / totalDays;
  const punctualityRate = (totalDays - lateDays) / totalDays;

  // Reliability = 50% attendance + 50% punctuality, scaled to 1000
  const reliability = (attendanceRate * 0.5 + punctualityRate * 0.5) * 1000;

  return Math.round(Math.min(1000, Math.max(0, reliability)));
}

/**
 * Calculate Delivery Score based on project completion
 */
function calculateDeliveryScore(projects?: RABTULProfile['projects']): { score: number; deadlineAdherence: number } {
  if (!projects || projects.length === 0) {
    return { score: 200, deadlineAdherence: 0 };
  }

  const completedProjects = projects.filter((p) => p.status === 'completed');
  const completionRate = completedProjects.length / projects.length;

  // Deadline adherence among completed projects
  const deadlineAdherence = completedProjects.filter((p) => p.deadlinesMet).length / Math.max(1, completedProjects.length);

  // Average completion percentage
  const avgCompletion = projects.reduce((sum, p) => sum + p.completionPercentage, 0) / projects.length;

  // Delivery = 40% completion rate + 40% avg completion + 20% deadline adherence
  const delivery = (completionRate * 0.4 + avgCompletion / 100 * 0.4 + deadlineAdherence * 0.2) * 1000;

  return {
    score: Math.round(Math.min(1000, Math.max(0, delivery))),
    deadlineAdherence: Math.round(deadlineAdherence * 100),
  };
}

/**
 * Calculate Growth Score based on learning
 */
function calculateGrowthScore(learning?: RABTULProfile['learning']): { score: number; certificationCount: number } {
  if (!learning || learning.length === 0) {
    return { score: 200, certificationCount: 0 };
  }

  const totalHours = learning.reduce((sum, l) => sum + l.hoursSpent, 0);
  const certificationCount = learning.filter((l) => l.certificationEarned).length;
  const completedCourses = learning.filter((l) => l.completedAt).length;

  // Hours normalized (max 500 hours = 100% of hours component)
  const hoursScore = Math.min(1, totalHours / 500) * 0.4;
  // Completion rate (40% of score)
  const completionScore = (completedCourses / learning.length) * 0.4;
  // Certifications (20% of score)
  const certScore = Math.min(1, certificationCount / 10) * 0.2;

  const growth = (hoursScore + completionScore + certScore) * 1000;

  return {
    score: Math.round(Math.min(1000, Math.max(0, growth))),
    certificationCount,
  };
}

/**
 * Calculate Collaboration Score based on recognition
 */
function calculateCollaborationScore(recognition?: RABTULProfile['recognition']): {
  score: number;
  peerRecognitionCount: number;
  teamContributionScore: number;
} {
  if (!recognition || recognition.length === 0) {
    return { score: 200, peerRecognitionCount: 0, teamContributionScore: 0 };
  }

  const peerRecognitions = recognition.filter((r) => r.type === 'peer');
  const managerRecognitions = recognition.filter((r) => r.type === 'manager');
  const teamRecognitions = recognition.filter((r) => r.type === 'team');

  const peerRecognitionCount = peerRecognitions.length;
  const totalPoints = recognition.reduce((sum, r) => sum + r.points, 0);

  // Peer recognition weighted 50%, manager 30%, team 20%
  const peerScore = Math.min(1, peerRecognitions.length / 20) * 0.5;
  const managerScore = Math.min(1, managerRecognitions.length / 10) * 0.3;
  const teamScore = Math.min(1, teamRecognitions.length / 5) * 0.2;

  // Points normalized (max 500 points = 100%)
  const pointsScore = Math.min(1, totalPoints / 500) * 0.3;
  const recognitionScore = (peerScore + managerScore + teamScore) * 0.7;

  const collaboration = (recognitionScore + pointsScore) * 1000;

  return {
    score: Math.round(Math.min(1000, Math.max(0, collaboration))),
    peerRecognitionCount,
    teamContributionScore: Math.round(Math.min(100, totalPoints / 10)),
  };
}

/**
 * Calculate overall CI Score from component scores
 */
function calculateOverallCIScore(reliability: number, delivery: number, growth: number, collaboration: number): number {
  // Weights: Reliability 30%, Delivery 30%, Growth 20%, Collaboration 20%
  const overall = reliability * 0.3 + delivery * 0.3 + growth * 0.2 + collaboration * 0.2;
  return Math.round(Math.min(1000, Math.max(0, overall)));
}

/**
 * Calculate complete CI Score for a profile
 */
export async function calculateCIScore(profileId: string): Promise<CIScore> {
  // Fetch RABTUL Profile data
  const profile = await fetchRABTULProfile(profileId);

  // Calculate component scores
  const reliability = calculateReliabilityScore(profile.attendance);
  const { score: delivery, deadlineAdherence } = calculateDeliveryScore(profile.projects);
  const { score: growth, certificationCount } = calculateGrowthScore(profile.learning);
  const { score: collaboration, peerRecognitionCount, teamContributionScore } = calculateCollaborationScore(profile.recognition);

  // Calculate attendance rate and punctuality for factors
  const attendanceRate = profile.attendance
    ? profile.attendance.filter((a) => a.status === 'present' || a.status === 'late').length / profile.attendance.length
    : 0;
  const punctualityRate = profile.attendance
    ? (profile.attendance.length - profile.attendance.filter((a) => a.status === 'late').length) / profile.attendance.length
    : 0;

  // Calculate project completion rate for factors
  const projectCompletionRate = profile.projects
    ? (profile.projects.filter((p) => p.status === 'completed').length / profile.projects.length) * 100
    : 0;

  // Calculate total learning hours
  const learningHours = profile.learning
    ? profile.learning.reduce((sum, l) => sum + l.hoursSpent, 0)
    : 0;

  // Build CI Score factors
  const factors: CIScoreFactors = {
    attendanceRate: Math.round(attendanceRate * 100),
    punctualityRate: Math.round(punctualityRate * 100),
    projectCompletionRate: Math.round(projectCompletionRate),
    deadlineAdherence,
    learningHours,
    certificationCount,
    peerRecognitionCount,
    teamContributionScore,
  };

  // Calculate overall score
  const overall = calculateOverallCIScore(reliability, delivery, growth, collaboration);

  return {
    overall,
    reliability,
    delivery,
    growth,
    collaboration,
    factors,
    lastCalculated: new Date(),
  };
}

/**
 * Update CI Score in the CorpID record
 */
export async function updateCIScoreInRecord(profileId: string, ciScore: CIScore): Promise<void> {
  await CorpIdProfileBridge.updateOne(
    { profileId },
    {
      $set: {
        ciScore,
        updatedAt: new Date(),
      },
    }
  );
}

/**
 * Get CI Score for a profile (from cache or calculate)
 */
export async function getCIScoreForProfile(profileId: string, forceRefresh = false): Promise<CIScore> {
  // Check if CorpID record exists
  const corpIdRecord = await getCorpIdByProfileId(profileId);

  if (corpIdRecord && !forceRefresh) {
    // Check if score was calculated recently (within 24 hours)
    const lastCalculated = new Date(corpIdRecord.ciScore.lastCalculated);
    const hoursSinceCalculation = (Date.now() - lastCalculated.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCalculation < 24 && corpIdRecord.ciScore.overall > 0) {
      return corpIdRecord.ciScore;
    }
  }

  // Calculate fresh CI Score
  const ciScore = await calculateCIScore(profileId);

  // Update in record if exists
  if (corpIdRecord) {
    await updateCIScoreInRecord(profileId, ciScore);
  }

  return ciScore;
}

/**
 * Get CI Score breakdown with explanations
 */
export async function getCIScoreBreakdown(profileId: string): Promise<{
  ciScore: CIScore;
  breakdown: {
    reliability: { score: number; description: string; maxScore: number };
    delivery: { score: number; description: string; maxScore: number };
    growth: { score: number; description: string; maxScore: number };
    collaboration: { score: number; description: string; maxScore: number };
  };
  percentile?: number;
}> {
  const ciScore = await getCIScoreForProfile(profileId);

  const breakdown = {
    reliability: {
      score: ciScore.reliability,
      description: 'Based on attendance rate and punctuality',
      maxScore: 1000,
    },
    delivery: {
      score: ciScore.delivery,
      description: 'Based on project completion and deadline adherence',
      maxScore: 1000,
    },
    growth: {
      score: ciScore.growth,
      description: 'Based on learning hours and certifications',
      maxScore: 1000,
    },
    collaboration: {
      score: ciScore.collaboration,
      description: 'Based on peer and manager recognition',
      maxScore: 1000,
    },
  };

  // Calculate percentile (would need aggregate data in production)
  // For now, estimate based on score ranges
  let percentile: number | undefined;
  if (ciScore.overall >= 800) percentile = 95;
  else if (ciScore.overall >= 700) percentile = 80;
  else if (ciScore.overall >= 600) percentile = 60;
  else if (ciScore.overall >= 500) percentile = 40;
  else if (ciScore.overall >= 400) percentile = 20;
  else percentile = 5;

  return { ciScore, breakdown, percentile };
}

/**
 * Get CI Score trends (comparing to previous calculations)
 */
export async function getCIScoreTrends(profileId: string, days = 30): Promise<{
  current: CIScore;
  previous?: CIScore;
  trend: 'improving' | 'stable' | 'declining';
  change: number;
}> {
  const corpIdRecord = await getCorpIdByProfileId(profileId);

  if (!corpIdRecord) {
    throw new AppError(404, 'RECORD_NOT_FOUND', `CorpID record not found for profile ${profileId}`);
  }

  const current = corpIdRecord.ciScore;

  // In production, would query historical data from a separate collection
  // For now, return current with simulated trend
  const trend = current.overall >= 600 ? 'improving' : current.overall >= 400 ? 'stable' : 'declining';
  const change = 0; // Would be calculated from historical data

  return {
    current,
    trend,
    change,
  };
}
