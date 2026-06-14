import { z } from 'zod';

// Types
export interface EngagementScore {
  memberId: string;
  overallScore: number; // 0-100
  components: {
    frequency: number;
    recency: number;
    variety: number;
    social: number;
  };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  insights: string[];
  recommendations: string[];
}

export interface ChurnPrediction {
  memberId: string;
  churnProbability: number; // 0-1
  riskFactors: {
    factor: string;
    weight: number;
    description: string;
  }[];
  protectiveFactors: {
    factor: string;
    weight: number;
    description: string;
  }[];
  recommendedActions: string[];
  confidence: number;
}

export interface MemberActivityMetrics {
  memberId: string;
  period: string;
  totalVisits: number;
  totalMinutes: number;
  workoutsCompleted: number;
  classesAttended: number;
  favoriteWorkoutTypes: string[];
  peakActivityDays: string[];
  peakActivityHours: number[];
  streakDays: number;
  improvementRate: number; // positive or negative percentage
}

const MemberActivitySchema = z.object({
  memberId: z.string(),
  checkIns: z.array(z.object({
    timestamp: z.string(),
    duration: z.number(),
    workoutType: z.string().optional(),
    classId: z.string().optional()
  })),
  membershipStartDate: z.string(),
  lastVisitDate: z.string(),
  classHistory: z.array(z.object({
    classId: z.string(),
    className: z.string(),
    instructor: z.string(),
    attendedAt: z.string()
  })).optional(),
  referrals: z.array(z.object({
    referredMemberId: z.string(),
    referredAt: z.string()
  })).optional(),
  feedback: z.array(z.object({
    rating: z.number().min(1).max(5),
    submittedAt: z.string()
  })).optional()
});

export type MemberActivity = z.infer<typeof MemberActivitySchema>;

export class MemberInsightsService {
  // Engagement scoring weights
  private readonly ENGAGEMENT_WEIGHTS = {
    frequency: 0.35,
    recency: 0.25,
    variety: 0.20,
    social: 0.20
  };

  // Churn risk thresholds
  private readonly CHURN_THRESHOLDS = {
    high: 0.7,
    medium: 0.4,
    low: 0.2
  };

  async calculateEngagementScore(activity: MemberActivity): Promise<EngagementScore> {
    try {
      const validated = MemberActivitySchema.parse(activity);
      const now = new Date();
      const lastVisit = new Date(validated.lastVisitDate);

      // Calculate days since last visit
      const daysSinceVisit = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));

      // Frequency component (visits per week over last 4 weeks)
      const recentCheckIns = validated.checkIns.filter(c => {
        const checkInDate = new Date(c.timestamp);
        const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
        return checkInDate >= fourWeeksAgo;
      });
      const weeklyFrequency = recentCheckIns.length / 4;
      const frequencyScore = Math.min(weeklyFrequency / 4 * 100, 100); // Max 4 visits/week = 100

      // Recency component
      let recencyScore = 100;
      if (daysSinceVisit <= 3) recencyScore = 100;
      else if (daysSinceVisit <= 7) recencyScore = 80;
      else if (daysSinceVisit <= 14) recencyScore = 60;
      else if (daysSinceVisit <= 30) recencyScore = 40;
      else recencyScore = 20;

      // Variety component (diverse workout types attended)
      const workoutTypes = new Set<string>();
      validated.checkIns.forEach(c => {
        if (c.workoutType) workoutTypes.add(c.workoutType);
      });
      validated.classHistory?.forEach(c => {
        if (c.className) workoutTypes.add(c.className);
      });
      const varietyScore = Math.min(workoutTypes.size * 20, 100);

      // Social component (referrals + interactions)
      let socialScore = 0;
      if (validated.referrals && validated.referrals.length > 0) {
        socialScore += Math.min(validated.referrals.length * 25, 50);
      }
      if (validated.feedback && validated.feedback.length > 0) {
        const avgRating = validated.feedback.reduce((sum, f) => sum + f.rating, 0) / validated.feedback.length;
        socialScore += (avgRating / 5) * 50;
      }

      // Calculate overall score
      const overallScore = Math.round(
        frequencyScore * this.ENGAGEMENT_WEIGHTS.frequency +
        recencyScore * this.ENGAGEMENT_WEIGHTS.recency +
        varietyScore * this.ENGAGEMENT_WEIGHTS.variety +
        socialScore * this.ENGAGEMENT_WEIGHTS.social
      );

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      if (overallScore >= 70) riskLevel = 'low';
      else if (overallScore >= 50) riskLevel = 'medium';
      else if (overallScore >= 25) riskLevel = 'high';
      else riskLevel = 'critical';

      // Generate insights
      const insights: string[] = [];
      if (frequencyScore < 50) insights.push('Visit frequency below recommended levels');
      if (recencyScore < 50) insights.push('Recent inactivity detected');
      if (varietyScore < 40) insights.push('Workout variety could be improved');
      if (socialScore < 30) insights.push('Low social engagement with the community');
      if (overallScore >= 70) insights.push('Highly engaged member');

      // Generate recommendations
      const recommendations: string[] = [];
      if (frequencyScore < 50) recommendations.push('Send personalized check-in message with workout motivation');
      if (varietyScore < 40) recommendations.push('Recommend trying new class types to increase variety');
      if (socialScore < 30) recommendations.push('Invite to member community events or refer-a-friend program');
      if (recencyScore < 50) recommendations.push('Consider offering re-engagement incentive');

      return {
        memberId: validated.memberId,
        overallScore,
        components: {
          frequency: Math.round(frequencyScore),
          recency: Math.round(recencyScore),
          variety: Math.round(varietyScore),
          social: Math.round(socialScore)
        },
        riskLevel,
        insights,
        recommendations
      };
    } catch (error) {
      throw new Error(`Failed to calculate engagement score: ${error}`);
    }
  }

  async predictChurn(activity: MemberActivity): Promise<ChurnPrediction> {
    try {
      const validated = MemberActivitySchema.parse(activity);
      const now = new Date();
      const lastVisit = new Date(validated.lastVisitDate);
      const membershipStart = new Date(validated.membershipStartDate);

      // Calculate membership duration in months
      const membershipMonths = (now.getTime() - membershipStart.getTime()) / (1000 * 60 * 60 * 24 * 30);

      const daysSinceVisit = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));

      // Risk factors
      const riskFactors: ChurnPrediction['riskFactors'] = [];
      let riskScore = 0;

      // Extended inactivity
      if (daysSinceVisit > 14) {
        const weight = Math.min(daysSinceVisit / 60, 0.5);
        riskScore += weight * 0.4;
        riskFactors.push({
          factor: 'Extended Inactivity',
          weight: Math.round(weight * 100),
          description: `No visit in ${daysSinceVisit} days`
        });
      }

      // New member at risk
      if (membershipMonths < 3 && daysSinceVisit > 7) {
        riskScore += 0.3;
        riskFactors.push({
          factor: 'Early Attrition Risk',
          weight: 30,
          description: 'New member showing early signs of disengagement'
        });
      }

      // Declining engagement pattern
      const checkInsByWeek = this.groupCheckInsByWeek(validated.checkIns);
      if (checkInsByWeek.length >= 4) {
        const recentAvg = (checkInsByWeek[0] + checkInsByWeek[1]) / 2;
        const olderAvg = (checkInsByWeek[checkInsByWeek.length - 2] + checkInsByWeek[checkInsByWeek.length - 1]) / 2;
        if (recentAvg < olderAvg * 0.5) {
          riskScore += 0.2;
          riskFactors.push({
            factor: 'Declining Engagement',
            weight: 20,
            description: 'Visit frequency has decreased significantly'
          });
        }
      }

      // Low feedback scores
      if (validated.feedback && validated.feedback.length >= 2) {
        const recentFeedback = validated.feedback.slice(-3);
        const avgRating = recentFeedback.reduce((sum, f) => sum + f.rating, 0) / recentFeedback.length;
        if (avgRating < 3) {
          riskScore += 0.15;
          riskFactors.push({
            factor: 'Low Satisfaction',
            weight: 15,
            description: `Recent average rating: ${avgRating.toFixed(1)}/5`
          });
        }
      }

      // Protective factors
      const protectiveFactors: ChurnPrediction['protectiveFactors'] = [];
      let protectionScore = 0;

      // Long-term member
      if (membershipMonths > 12) {
        protectionScore += 0.25;
        protectiveFactors.push({
          factor: 'Long-term Member',
          weight: 25,
          description: `${Math.round(membershipMonths)} months of membership`
        });
      }

      // Active recent engagement
      if (daysSinceVisit <= 3) {
        protectionScore += 0.3;
        protectiveFactors.push({
          factor: 'Recent Activity',
          weight: 30,
          description: 'Visited within the last 3 days'
        });
      }

      // Social connections
      if (validated.referrals && validated.referrals.length >= 2) {
        protectionScore += 0.2;
        protectiveFactors.push({
          factor: 'Social Advocate',
          weight: 20,
          description: 'Has referred multiple members'
        });
      }

      // High satisfaction
      if (validated.feedback && validated.feedback.length >= 1) {
        const avgRating = validated.feedback.reduce((sum, f) => sum + f.rating, 0) / validated.feedback.length;
        if (avgRating >= 4) {
          protectionScore += 0.25;
          protectiveFactors.push({
            factor: 'High Satisfaction',
            weight: 25,
            description: `Average rating: ${avgRating.toFixed(1)}/5`
          });
        }
      }

      // Calculate final probability
      const baseProbability = 0.5;
      const churnProbability = Math.max(0, Math.min(1,
        baseProbability + riskScore - protectionScore
      ));

      // Calculate confidence based on data availability
      const dataPoints = validated.checkIns.length +
        (validated.feedback?.length || 0) +
        (validated.referrals?.length || 0);
      const confidence = Math.min(dataPoints / 20, 1);

      // Recommended actions
      const recommendedActions: string[] = [];
      if (churnProbability > this.CHURN_THRESHOLDS.medium) {
        recommendedActions.push('Send personalized re-engagement offer');
        recommendedActions.push('Assign member to retention-focused outreach');
      }
      if (daysSinceVisit > 14) {
        recommendedActions.push('Schedule a check-in call');
        recommendedActions.push('Offer complimentary session or class access');
      }
      if (membershipMonths < 3) {
        recommendedActions.push('Provide additional onboarding support');
        recommendedActions.push('Connect with dedicated member success manager');
      }
      if (riskScore > protectionScore) {
        recommendedActions.push('Review and address service gaps');
      }

      return {
        memberId: validated.memberId,
        churnProbability: Math.round(churnProbability * 100) / 100,
        riskFactors,
        protectiveFactors,
        recommendedActions,
        confidence: Math.round(confidence * 100) / 100
      };
    } catch (error) {
      throw new Error(`Failed to predict churn: ${error}`);
    }
  }

  async getActivityMetrics(activity: MemberActivity): Promise<MemberActivityMetrics> {
    try {
      const validated = MemberActivitySchema.parse(activity);
      const now = new Date();

      // Calculate total metrics
      const totalVisits = validated.checkIns.length;
      const totalMinutes = validated.checkIns.reduce((sum, c) => sum + c.duration, 0);

      // Workouts completed (any visit with duration > 30 min)
      const workoutsCompleted = validated.checkIns.filter(c => c.duration >= 30).length;

      // Classes attended
      const classesAttended = validated.classHistory?.length || 0;

      // Favorite workout types
      const typeCounts: Record<string, number> = {};
      validated.checkIns.forEach(c => {
        if (c.workoutType) {
          typeCounts[c.workoutType] = (typeCounts[c.workoutType] || 0) + 1;
        }
      });
      validated.classHistory?.forEach(c => {
        typeCounts[c.className] = (typeCounts[c.className] || 0) + 1;
      });
      const favoriteWorkoutTypes = Object.entries(typeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([type]) => type);

      // Peak activity days
      const dayCounts: Record<string, number> = {};
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      validated.checkIns.forEach(c => {
        const day = dayNames[new Date(c.timestamp).getDay()];
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      });
      const peakActivityDays = Object.entries(dayCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([day]) => day);

      // Peak activity hours
      const hourCounts: Record<number, number> = {};
      validated.checkIns.forEach(c => {
        const hour = new Date(c.timestamp).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      const peakActivityHours = Object.entries(hourCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([hour]) => parseInt(hour));

      // Calculate streak
      const streakDays = this.calculateStreak(validated.checkIns.map(c => new Date(c.timestamp)));

      // Improvement rate (compare last 2 weeks to previous 2 weeks)
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
      const lastTwoWeeks = validated.checkIns.filter(c => {
        const date = new Date(c.timestamp);
        return date >= twoWeeksAgo && date <= now;
      }).length;
      const previousTwoWeeks = validated.checkIns.filter(c => {
        const date = new Date(c.timestamp);
        return date >= fourWeeksAgo && date < twoWeeksAgo;
      }).length;

      const improvementRate = previousTwoWeeks > 0
        ? ((lastTwoWeeks - previousTwoWeeks) / previousTwoWeeks) * 100
        : lastTwoWeeks > 0 ? 100 : 0;

      return {
        memberId: validated.memberId,
        period: `${fourWeeksAgo.toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]}`,
        totalVisits,
        totalMinutes,
        workoutsCompleted,
        classesAttended,
        favoriteWorkoutTypes,
        peakActivityDays,
        peakActivityHours,
        streakDays,
        improvementRate: Math.round(improvementRate * 10) / 10
      };
    } catch (error) {
      throw new Error(`Failed to calculate activity metrics: ${error}`);
    }
  }

  private groupCheckInsByWeek(checkIns: MemberActivity['checkIns']): number[] {
    const now = new Date();
    const weeks: number[] = [];

    for (let i = 0; i < 8; i++) {
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

      const count = checkIns.filter(c => {
        const date = new Date(c.timestamp);
        return date >= weekStart && date < weekEnd;
      }).length;

      weeks.unshift(count);
    }

    return weeks;
  }

  private calculateStreak(dates: Date[]): number {
    if (dates.length === 0) return 0;

    const sortedDates = dates
      .map(d => new Date(d.toDateString()))
      .filter((d, i, arr) => arr.findIndex(x => x.getTime() === d.getTime()) === i)
      .sort((a, b) => b.getTime() - a.getTime());

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if there's a visit today or yesterday
    const daysSinceLast = Math.floor((today.getTime() - sortedDates[0].getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLast > 1) return 0;

    let streak = 1;
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const diff = Math.floor((sortedDates[i].getTime() - sortedDates[i + 1].getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }
}

export const memberInsightsService = new MemberInsightsService();
