import {
  TrustReport,
  TrustLevel,
  TrustFactor,
  CorpIdRecord,
  AppError,
} from '../types';
import { CorpIdProfileBridge, getCorpIdByProfileId } from './profileSyncService';
import { getVerificationStatus } from './verificationService';

/**
 * Trust Service
 *
 * Calculates trust scores and generates trust reports for profiles
 * based on verification status and CI scores
 */

// ============================================
// Trust Score Calculation
// ============================================

/**
 * Determine trust level from score
 */
function getTrustLevel(score: number): TrustLevel {
  if (score >= 800) return 'premium';
  if (score >= 600) return 'high';
  if (score >= 400) return 'medium';
  return 'low';
}

/**
 * Calculate trust score based on verification and CI score
 */
function calculateTrustScore(
  verificationOverall: boolean,
  ciScore: number,
  identityVerified: boolean,
  employmentVerified: boolean,
  skillsVerified: boolean,
  educationVerified: boolean
): { score: number; factors: TrustFactor[] } {
  const factors: TrustFactor[] = [];
  let totalWeight = 0;
  let weightedSum = 0;

  // Verification status contributes 40% to trust score
  const verificationWeight = 0.4;
  let verificationScore = 0;

  if (verificationOverall) {
    verificationScore = 100;
  } else {
    // Partial verification based on individual items
    const verifiedCount = [identityVerified, employmentVerified, skillsVerified, educationVerified].filter(Boolean)
      .length;
    verificationScore = (verifiedCount / 4) * 100;
  }

  weightedSum += verificationScore * verificationWeight;
  totalWeight += verificationWeight;

  factors.push({
    name: 'Verification Status',
    contribution: Math.round(verificationScore * verificationWeight),
    description: verificationOverall
      ? 'All verification checks passed'
      : `${Math.round(verificationScore)}% verification completed`,
    trend: verificationOverall ? 'up' : 'stable',
  });

  // CI Score contributes 60% to trust score (normalized from 0-1000 to 0-100)
  const ciScoreWeight = 0.6;
  const normalizedCIScore = ciScore / 10;

  weightedSum += normalizedCIScore * ciScoreWeight;
  totalWeight += ciScoreWeight;

  let ciTrend: 'up' | 'down' | 'stable' = 'stable';
  if (ciScore >= 700) ciTrend = 'up';
  else if (ciScore < 400) ciTrend = 'down';

  factors.push({
    name: 'CI Score',
    contribution: Math.round(normalizedCIScore * ciScoreWeight),
    description: `CI Score of ${ciScore} out of 1000`,
    trend: ciTrend,
  });

  // Individual verification factors
  if (identityVerified) {
    factors.push({
      name: 'Identity Verified',
      contribution: 10,
      description: 'Government ID verified',
      trend: 'up',
    });
  }

  if (employmentVerified) {
    factors.push({
      name: 'Employment Verified',
      contribution: 10,
      description: 'Employment history confirmed',
      trend: 'up',
    });
  }

  if (skillsVerified) {
    factors.push({
      name: 'Skills Verified',
      contribution: 5,
      description: 'Skills and competencies validated',
      trend: 'up',
    });
  }

  if (educationVerified) {
    factors.push({
      name: 'Education Verified',
      contribution: 5,
      description: 'Educational credentials confirmed',
      trend: 'up',
    });
  }

  const finalScore = Math.round(weightedSum / totalWeight);
  return { score: finalScore, factors };
}

/**
 * Generate trust recommendations based on current status
 */
function generateRecommendations(
  verificationOverall: boolean,
  ciScore: number,
  trustLevel: TrustLevel
): string[] {
  const recommendations: string[] = [];

  if (!verificationOverall) {
    recommendations.push('Complete all verification checks to increase trust score');
  }

  if (ciScore < 500) {
    recommendations.push('Focus on improving your CI score by completing projects on time');
  }

  if (ciScore < 700) {
    recommendations.push('Take more learning courses and earn certifications');
  }

  if (trustLevel === 'low') {
    recommendations.push('Start by verifying your identity and employment details');
    recommendations.push('Build your track record through consistent project delivery');
  }

  if (trustLevel === 'medium') {
    recommendations.push('Aim for full verification to unlock premium features');
    recommendations.push('Maintain high attendance and deadline adherence');
  }

  if (trustLevel === 'high') {
    recommendations.push('Keep up the great work! Maintain your high performance');
    recommendations.push('Continue learning and earning recognition from peers');
  }

  if (trustLevel === 'premium') {
    recommendations.push('You are a top performer! Consider mentoring others');
    recommendations.push('Share your knowledge through internal workshops');
  }

  // Ensure at least one recommendation
  if (recommendations.length === 0) {
    recommendations.push('Continue building your professional profile');
  }

  return recommendations;
}

/**
 * Generate complete trust report for a profile
 */
export async function generateTrustReport(profileId: string): Promise<TrustReport> {
  const corpIdRecord = await getCorpIdByProfileId(profileId);
  if (!corpIdRecord) {
    throw new AppError(404, 'RECORD_NOT_FOUND', `CorpID record not found for profile ${profileId}`);
  }

  const verification = corpIdRecord.verification;
  const ciScore = corpIdRecord.ciScore;

  // Calculate trust score
  const { score, factors } = calculateTrustScore(
    verification.overall,
    ciScore.overall,
    verification.identity.verified,
    verification.employment.verified,
    verification.skills.verified,
    verification.education.verified
  );

  const trustLevel = getTrustLevel(score);
  const recommendations = generateRecommendations(verification.overall, ciScore.overall, trustLevel);

  const trustReport: TrustReport = {
    score,
    level: trustLevel,
    factors,
    recommendations,
    generatedAt: new Date(),
  };

  // Update CorpID record with trust report
  await CorpIdProfileBridge.updateOne(
    { profileId },
    {
      $set: {
        trustReport,
        updatedAt: new Date(),
      },
    }
  );

  return trustReport;
}

/**
 * Get trust report for a profile (cached or fresh)
 */
export async function getTrustReport(profileId: string, forceRefresh = false): Promise<TrustReport> {
  const corpIdRecord = await getCorpIdByProfileId(profileId);
  if (!corpIdRecord) {
    throw new AppError(404, 'RECORD_NOT_FOUND', `CorpID record not found for profile ${profileId}`);
  }

  // Check if report needs refresh
  if (!forceRefresh && corpIdRecord.trustReport.score > 0) {
    const generatedAt = new Date(corpIdRecord.trustReport.generatedAt);
    const hoursSinceGeneration = (Date.now() - generatedAt.getTime()) / (1000 * 60 * 60);

    // Refresh if older than 24 hours
    if (hoursSinceGeneration < 24) {
      return corpIdRecord.trustReport;
    }
  }

  // Generate fresh report
  return generateTrustReport(profileId);
}

/**
 * Get trust summary for quick overview
 */
export async function getTrustSummary(profileId: string): Promise<{
  profileId: string;
  score: number;
  level: TrustLevel;
  verifiedCount: number;
  totalChecks: number;
  topFactor: string | null;
}> {
  const corpIdRecord = await getCorpIdByProfileId(profileId);
  if (!corpIdRecord) {
    throw new AppError(404, 'RECORD_NOT_FOUND', `CorpID record not found for profile ${profileId}`);
  }

  const verification = corpIdRecord.verification;
  const verifiedCount = [
    verification.identity.verified,
    verification.employment.verified,
    verification.skills.verified,
    verification.education.verified,
  ].filter(Boolean).length;

  // Find top contributing factor
  const factors = corpIdRecord.trustReport.factors;
  const topFactor = factors.length > 0 ? factors.sort((a, b) => b.contribution - a.contribution)[0]?.name || null : null;

  return {
    profileId,
    score: corpIdRecord.trustReport.score,
    level: corpIdRecord.trustReport.level,
    verifiedCount,
    totalChecks: 4,
    topFactor,
  };
}

/**
 * Get trust trends (comparing to previous reports)
 */
export async function getTrustTrends(profileId: string, days = 30): Promise<{
  current: TrustReport;
  change: number;
  trend: 'improving' | 'stable' | 'declining';
  factorChanges: Array<{
    factor: string;
    previousContribution: number;
    currentContribution: number;
    change: number;
  }>;
}> {
  const corpIdRecord = await getCorpIdByProfileId(profileId);
  if (!corpIdRecord) {
    throw new AppError(404, 'RECORD_NOT_FOUND', `CorpID record not found for profile ${profileId}`);
  }

  const current = corpIdRecord.trustReport;

  // In production, would query historical data from a separate collection
  // For now, simulate trend based on current score
  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  let change = 0;

  if (current.score >= 700) {
    trend = 'improving';
    change = 5;
  } else if (current.score < 400) {
    trend = 'declining';
    change = -5;
  }

  // Simulated factor changes
  const factorChanges = current.factors.map((factor) => ({
    factor: factor.name,
    previousContribution: Math.max(0, factor.contribution - 10),
    currentContribution: factor.contribution,
    change: 10,
  }));

  return {
    current,
    change,
    trend,
    factorChanges,
  };
}

/**
 * Compare trust scores between two profiles
 */
export async function compareTrustScores(profileId1: string, profileId2: string): Promise<{
  profile1: { profileId: string; score: number; level: TrustLevel };
  profile2: { profileId: string; score: number; level: TrustLevel };
  difference: number;
  winner: string | null;
}> {
  const [report1, report2] = await Promise.all([
    getTrustReport(profileId1),
    getTrustReport(profileId2),
  ]);

  const difference = report1.score - report2.score;
  const winner = difference > 0 ? profileId1 : difference < 0 ? profileId2 : null;

  return {
    profile1: {
      profileId: profileId1,
      score: report1.score,
      level: report1.level,
    },
    profile2: {
      profileId: profileId2,
      score: report2.score,
      level: report2.level,
    },
    difference: Math.abs(difference),
    winner,
  };
}

/**
 * Get trust leaderboard for a corporate
 */
export async function getTrustLeaderboard(
  corporateId: string,
  limit = 10
): Promise<Array<{
  rank: number;
  profileId: string;
  score: number;
  level: TrustLevel;
}>> {
  const records = await CorpIdProfileBridge.find({ corporateId })
    .sort({ 'trustReport.score': -1 })
    .limit(limit)
    .select('profileId trustReport');

  return records.map((record, index) => ({
    rank: index + 1,
    profileId: record.profileId,
    score: record.trustReport.score,
    level: record.trustReport.level,
  }));
}

/**
 * Get trust distribution for a corporate
 */
export async function getTrustDistribution(corporateId: string): Promise<{
  corporateId: string;
  total: number;
  distribution: Record<TrustLevel, number>;
  averageScore: number;
}> {
  const records = await CorpIdProfileBridge.find({ corporateId }).select('trustReport');

  const distribution: Record<TrustLevel, number> = {
    low: 0,
    medium: 0,
    high: 0,
    premium: 0,
  };

  let totalScore = 0;

  records.forEach((record) => {
    distribution[record.trustReport.level]++;
    totalScore += record.trustReport.score;
  });

  return {
    corporateId,
    total: records.length,
    distribution,
    averageScore: records.length > 0 ? Math.round(totalScore / records.length) : 0,
  };
}
