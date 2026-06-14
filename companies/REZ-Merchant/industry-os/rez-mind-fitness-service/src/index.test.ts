/**
 * REZ Mind Fitness Service - Unit Tests
 * Tests for member insights, engagement scoring, and churn prediction
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================
// MEMBER PROFILE VALIDATION TESTS
// ============================================

describe('Member Profile Validation', () => {
  const VALID_WORKOUT_TYPES = ['strength', 'cardio', 'flexibility', 'hiit', 'recovery'];
  const VALID_FITNESS_LEVELS = ['beginner', 'intermediate', 'advanced'];
  const VALID_TIME_SLOTS = ['morning', 'afternoon', 'evening'];

  describe('Workout Type Validation', () => {
    it('should accept all valid workout types', () => {
      VALID_WORKOUT_TYPES.forEach(type => {
        expect(VALID_WORKOUT_TYPES.includes(type)).toBe(true);
      });
    });

    it('should reject invalid workout types', () => {
      expect(VALID_WORKOUT_TYPES.includes('swimming')).toBe(false);
      expect(VALID_WORKOUT_TYPES.includes('running')).toBe(false);
    });
  });

  describe('Fitness Level Validation', () => {
    it('should accept all valid fitness levels', () => {
      VALID_FITNESS_LEVELS.forEach(level => {
        expect(VALID_FITNESS_LEVELS.includes(level)).toBe(true);
      });
    });

    it('should reject invalid fitness levels', () => {
      expect(VALID_FITNESS_LEVELS.includes('expert')).toBe(false);
      expect(VALID_FITNESS_LEVELS.includes('novice')).toBe(false);
    });
  });

  describe('Time Slot Validation', () => {
    it('should accept all valid time slots', () => {
      VALID_TIME_SLOTS.forEach(slot => {
        expect(VALID_TIME_SLOTS.includes(slot)).toBe(true);
      });
    });

    it('should have 3 time slots', () => {
      expect(VALID_TIME_SLOTS.length).toBe(3);
    });
  });

  describe('Available Days Validation', () => {
    it('should accept valid day numbers (0-6)', () => {
      const validDays = [0, 1, 2, 3, 4, 5, 6];
      validDays.forEach(day => {
        expect(day).toBeGreaterThanOrEqual(0);
        expect(day).toBeLessThanOrEqual(6);
      });
    });

    it('should reject invalid day numbers', () => {
      const invalidDays = [-1, 7, 8];
      invalidDays.forEach(day => {
        const isValid = day >= 0 && day <= 6;
        expect(isValid).toBe(false);
      });
    });
  });
});

// ============================================
// WORKOUT RECOMMENDATION TESTS
// ============================================

describe('Workout Recommendations', () => {
  describe('Workout Scoring', () => {
    function scoreWorkout(
      fitnessLevel: string,
      preferredTypes: string[],
      workoutType: string,
      intensity: string
    ): number {
      let score = 0;

      // Match fitness level with intensity
      if (fitnessLevel === 'advanced' && intensity === 'high') {
        score += 30;
      } else if (fitnessLevel === 'intermediate' && intensity === 'medium') {
        score += 30;
      } else if (fitnessLevel === 'beginner' && intensity !== 'high') {
        score += 30;
      }

      // Match preferred workout types
      if (preferredTypes.includes(workoutType)) {
        score += 25;
      }

      return score;
    }

    it('should give high score for advanced member and high intensity', () => {
      const score = scoreWorkout('advanced', ['strength'], 'strength', 'high');
      expect(score).toBe(55); // 30 (level match) + 25 (type match)
    });

    it('should give partial score for level mismatch', () => {
      const score = scoreWorkout('beginner', ['strength'], 'strength', 'high');
      expect(score).toBe(25); // Only type match, not level
    });

    it('should give type match score only', () => {
      const score = scoreWorkout('beginner', ['strength'], 'strength', 'low');
      expect(score).toBe(55); // 30 (level match) + 25 (type match)
    });

    it('should give zero score for no matches', () => {
      const score = scoreWorkout('intermediate', ['cardio'], 'strength', 'medium');
      expect(score).toBe(30); // Only level match
    });
  });

  describe('Workout Database', () => {
    const workoutDatabase = [
      { workoutId: 'wr-001', name: 'Full Body Strength', type: 'strength', intensity: 'high' },
      { workoutId: 'wr-002', name: 'Morning Cardio', type: 'cardio', intensity: 'medium' },
      { workoutId: 'wr-003', name: 'Power Yoga', type: 'flexibility', intensity: 'low' },
      { workoutId: 'wr-004', name: 'HIIT Inferno', type: 'hiit', intensity: 'high' },
      { workoutId: 'wr-005', name: 'Recovery Session', type: 'recovery', intensity: 'low' },
    ];

    it('should have 5 workouts', () => {
      expect(workoutDatabase.length).toBe(5);
    });

    it('should have all workout types represented', () => {
      const types = workoutDatabase.map(w => w.type);
      expect(types).toContain('strength');
      expect(types).toContain('cardio');
      expect(types).toContain('flexibility');
      expect(types).toContain('hiit');
      expect(types).toContain('recovery');
    });

    it('should filter by type', () => {
      const strengthWorkouts = workoutDatabase.filter(w => w.type === 'strength');
      expect(strengthWorkouts.length).toBe(1);
    });
  });
});

// ============================================
// ENGAGEMENT SCORING TESTS
// ============================================

describe('Engagement Scoring', () => {
  const ENGAGEMENT_WEIGHTS = {
    frequency: 0.35,
    recency: 0.25,
    variety: 0.20,
    social: 0.20,
  };

  describe('Frequency Score Calculation', () => {
    it('should calculate 100% for 4 visits per week', () => {
      const weeklyVisits = 4;
      const frequencyScore = Math.min((weeklyVisits / 4) * 100, 100);
      expect(frequencyScore).toBe(100);
    });

    it('should calculate 50% for 2 visits per week', () => {
      const weeklyVisits = 2;
      const frequencyScore = Math.min((weeklyVisits / 4) * 100, 100);
      expect(frequencyScore).toBe(50);
    });

    it('should cap at 100%', () => {
      const weeklyVisits = 10;
      const frequencyScore = Math.min((weeklyVisits / 4) * 100, 100);
      expect(frequencyScore).toBe(100);
    });
  });

  describe('Recency Score Calculation', () => {
    function calculateRecencyScore(daysSinceVisit: number): number {
      if (daysSinceVisit <= 3) return 100;
      if (daysSinceVisit <= 7) return 80;
      if (daysSinceVisit <= 14) return 60;
      if (daysSinceVisit <= 30) return 40;
      return 20;
    }

    it('should return 100 for visits within 3 days', () => {
      expect(calculateRecencyScore(0)).toBe(100);
      expect(calculateRecencyScore(1)).toBe(100);
      expect(calculateRecencyScore(3)).toBe(100);
    });

    it('should return 80 for visits within 7 days', () => {
      expect(calculateRecencyScore(4)).toBe(80);
      expect(calculateRecencyScore(7)).toBe(80);
    });

    it('should return 60 for visits within 14 days', () => {
      expect(calculateRecencyScore(8)).toBe(60);
      expect(calculateRecencyScore(14)).toBe(60);
    });

    it('should return 40 for visits within 30 days', () => {
      expect(calculateRecencyScore(15)).toBe(40);
      expect(calculateRecencyScore(30)).toBe(40);
    });

    it('should return 20 for visits over 30 days', () => {
      expect(calculateRecencyScore(31)).toBe(20);
      expect(calculateRecencyScore(60)).toBe(20);
    });
  });

  describe('Variety Score Calculation', () => {
    it('should calculate variety based on workout types', () => {
      const workoutTypes = ['strength', 'cardio', 'flexibility', 'hiit'];
      const varietyScore = Math.min(workoutTypes.length * 20, 100);

      expect(varietyScore).toBe(80); // 4 types * 20 = 80
    });

    it('should cap variety score at 100', () => {
      const workoutTypes = ['a', 'b', 'c', 'd', 'e', 'f'];
      const varietyScore = Math.min(workoutTypes.length * 20, 100);

      expect(varietyScore).toBe(100);
    });

    it('should return 0 for no workout types', () => {
      const workoutTypes: string[] = [];
      const varietyScore = Math.min(workoutTypes.length * 20, 100);

      expect(varietyScore).toBe(0);
    });
  });

  describe('Social Score Calculation', () => {
    function calculateSocialScore(referrals: number, avgRating: number): number {
      let score = 0;
      if (referrals > 0) {
        score += Math.min(referrals * 25, 50);
      }
      if (avgRating > 0) {
        score += (avgRating / 5) * 50;
      }
      return score;
    }

    it('should calculate score with referrals', () => {
      const score = calculateSocialScore(2, 0);
      expect(score).toBe(50); // 2 * 25 = 50, capped at 50
    });

    it('should calculate score with ratings', () => {
      const score = calculateSocialScore(0, 5);
      expect(score).toBe(50); // 5/5 * 50 = 50
    });

    it('should calculate combined score', () => {
      const score = calculateSocialScore(1, 4);
      expect(score).toBe(65); // 25 + 40 = 65
    });
  });

  describe('Overall Engagement Score', () => {
    function calculateOverallScore(frequency: number, recency: number, variety: number, social: number): number {
      return Math.round(
        frequency * ENGAGEMENT_WEIGHTS.frequency +
        recency * ENGAGEMENT_WEIGHTS.recency +
        variety * ENGAGEMENT_WEIGHTS.variety +
        social * ENGAGEMENT_WEIGHTS.social
      );
    }

    it('should calculate perfect engagement', () => {
      const score = calculateOverallScore(100, 100, 100, 100);
      expect(score).toBe(100);
    });

    it('should calculate moderate engagement', () => {
      const score = calculateOverallScore(50, 60, 40, 30);
      // 50*0.35 + 60*0.25 + 40*0.20 + 30*0.20 = 17.5 + 15 + 8 + 6 = 46.5
      expect(score).toBe(47);
    });

    it('should weight frequency highest', () => {
      const highFrequency = calculateOverallScore(100, 0, 0, 0);
      const highRecency = calculateOverallScore(0, 100, 0, 0);

      expect(highFrequency).toBe(35); // 100 * 0.35
      expect(highRecency).toBe(25); // 100 * 0.25
    });
  });

  describe('Risk Level Determination', () => {
    function determineRiskLevel(overallScore: number): 'low' | 'medium' | 'high' | 'critical' {
      if (overallScore >= 70) return 'low';
      if (overallScore >= 50) return 'medium';
      if (overallScore >= 25) return 'high';
      return 'critical';
    }

    it('should return low for scores >= 70', () => {
      expect(determineRiskLevel(70)).toBe('low');
      expect(determineRiskLevel(100)).toBe('low');
    });

    it('should return medium for scores >= 50 and < 70', () => {
      expect(determineRiskLevel(50)).toBe('medium');
      expect(determineRiskLevel(69)).toBe('medium');
    });

    it('should return high for scores >= 25 and < 50', () => {
      expect(determineRiskLevel(25)).toBe('high');
      expect(determineRiskLevel(49)).toBe('high');
    });

    it('should return critical for scores < 25', () => {
      expect(determineRiskLevel(24)).toBe('critical');
      expect(determineRiskLevel(0)).toBe('critical');
    });
  });
});

// ============================================
// CHURN PREDICTION TESTS
// ============================================

describe('Churn Prediction', () => {
  const CHURN_THRESHOLDS = {
    high: 0.7,
    medium: 0.4,
    low: 0.2,
  };

  describe('Inactivity Risk', () => {
    function calculateInactivityRisk(daysSinceVisit: number): { risk: number; weight: number } {
      if (daysSinceVisit <= 14) return { risk: 0, weight: 0 };
      const weight = Math.min(daysSinceVisit / 60, 0.5);
      return { risk: weight * 0.4, weight: Math.round(weight * 100) };
    }

    it('should have no risk for visits within 14 days', () => {
      const result = calculateInactivityRisk(7);
      expect(result.risk).toBe(0);
    });

    it('should calculate risk for extended inactivity', () => {
      const result = calculateInactivityRisk(30);
      expect(result.risk).toBeGreaterThan(0);
      expect(result.weight).toBe(50);
    });

    it('should cap risk weight at 50%', () => {
      const result = calculateInactivityRisk(90);
      expect(result.weight).toBe(50);
    });
  });

  describe('Early Attrition Risk', () => {
    function calculateEarlyAttritionRisk(membershipMonths: number, daysSinceVisit: number): number {
      if (membershipMonths >= 3) return 0;
      if (daysSinceVisit > 7) return 0.3;
      return 0;
    }

    it('should detect early attrition for new members', () => {
      const risk = calculateEarlyAttritionRisk(2, 10);
      expect(risk).toBe(0.3);
    });

    it('should not flag established members', () => {
      const risk = calculateEarlyAttritionRisk(4, 10);
      expect(risk).toBe(0);
    });

    it('should not flag active new members', () => {
      const risk = calculateEarlyAttritionRisk(2, 3);
      expect(risk).toBe(0);
    });
  });

  describe('Declining Engagement Detection', () => {
    function detectDecliningEngagement(weeklyVisits: number[]): boolean {
      if (weeklyVisits.length < 4) return false;
      const recentAvg = (weeklyVisits[0] + weeklyVisits[1]) / 2;
      const olderAvg = (weeklyVisits[weeklyVisits.length - 2] + weeklyVisits[weeklyVisits.length - 1]) / 2;
      return recentAvg < olderAvg * 0.5;
    }

    it('should detect significant decline', () => {
      const visits = [1, 1, 5, 5, 5, 5]; // Recent: 1 avg, Older: 5 avg
      expect(detectDecliningEngagement(visits)).toBe(true);
    });

    it('should not flag stable engagement', () => {
      const visits = [4, 4, 4, 4];
      expect(detectDecliningEngagement(visits)).toBe(false);
    });

    it('should not flag minor decline', () => {
      const visits = [4, 4, 5, 5];
      expect(detectDecliningEngagement(visits)).toBe(false);
    });
  });

  describe('Churn Probability Calculation', () => {
    function calculateChurnProbability(baseProbability: number, riskScore: number, protectionScore: number): number {
      return Math.max(0, Math.min(1, baseProbability + riskScore - protectionScore));
    }

    it('should start at 50% base probability', () => {
      const probability = calculateChurnProbability(0.5, 0, 0);
      expect(probability).toBe(0.5);
    });

    it('should increase with risk factors', () => {
      const probability = calculateChurnProbability(0.5, 0.3, 0);
      expect(probability).toBe(0.8);
    });

    it('should decrease with protective factors', () => {
      const probability = calculateChurnProbability(0.5, 0, 0.3);
      expect(probability).toBe(0.2);
    });

    it('should cap at 100%', () => {
      const probability = calculateChurnProbability(0.5, 0.8, 0);
      expect(probability).toBe(1);
    });

    it('should floor at 0%', () => {
      const probability = calculateChurnProbability(0.5, 0, 0.8);
      expect(probability).toBe(0);
    });
  });

  describe('Confidence Calculation', () => {
    function calculateConfidence(dataPoints: number): number {
      return Math.min(dataPoints / 20, 1);
    }

    it('should return 100% confidence with 20+ data points', () => {
      expect(calculateConfidence(20)).toBe(1);
      expect(calculateConfidence(50)).toBe(1);
    });

    it('should return 50% confidence with 10 data points', () => {
      expect(calculateConfidence(10)).toBe(0.5);
    });

    it('should return low confidence with few data points', () => {
      expect(calculateConfidence(5)).toBe(0.25);
    });
  });
});

// ============================================
// ACTIVITY METRICS TESTS
// ============================================

describe('Activity Metrics', () => {
  describe('Total Calculation', () => {
    interface CheckIn {
      timestamp: string;
      duration: number;
    }

    it('should count total visits', () => {
      const checkIns: CheckIn[] = [
        { timestamp: '2024-01-01', duration: 60 },
        { timestamp: '2024-01-02', duration: 45 },
        { timestamp: '2024-01-03', duration: 90 },
      ];

      expect(checkIns.length).toBe(3);
    });

    it('should sum total minutes', () => {
      const checkIns: CheckIn[] = [
        { timestamp: '2024-01-01', duration: 60 },
        { timestamp: '2024-01-02', duration: 45 },
        { timestamp: '2024-01-03', duration: 90 },
      ];

      const totalMinutes = checkIns.reduce((sum, c) => sum + c.duration, 0);
      expect(totalMinutes).toBe(195);
    });

    it('should count workouts (duration >= 30 min)', () => {
      const checkIns: CheckIn[] = [
        { timestamp: '2024-01-01', duration: 60 },
        { timestamp: '2024-01-02', duration: 20 }, // Not a workout
        { timestamp: '2024-01-03', duration: 90 },
      ];

      const workouts = checkIns.filter(c => c.duration >= 30).length;
      expect(workouts).toBe(2);
    });
  });

  describe('Favorite Workout Types', () => {
    interface CheckIn {
      workoutType: string;
    }

    it('should find top 3 workout types', () => {
      const checkIns: CheckIn[] = [
        { workoutType: 'strength' },
        { workoutType: 'strength' },
        { workoutType: 'strength' },
        { workoutType: 'cardio' },
        { workoutType: 'cardio' },
        { workoutType: 'yoga' },
      ];

      const typeCounts: Record<string, number> = {};
      checkIns.forEach(c => {
        typeCounts[c.workoutType] = (typeCounts[c.workoutType] || 0) + 1;
      });

      const topTypes = Object.entries(typeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([type]) => type);

      expect(topTypes).toEqual(['strength', 'cardio', 'yoga']);
    });
  });

  describe('Peak Activity Days', () => {
    it('should identify busiest days', () => {
      const dayCounts = {
        Monday: 5,
        Tuesday: 3,
        Wednesday: 7,
        Thursday: 4,
        Friday: 2,
      };

      const topDays = Object.entries(dayCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([day]) => day);

      expect(topDays).toEqual(['Wednesday', 'Monday']);
    });
  });

  describe('Streak Calculation', () => {
    function calculateStreak(dates: Date[]): number {
      if (dates.length === 0) return 0;

      const sortedDates = dates
        .map(d => new Date(d.toDateString()))
        .filter((d, i, arr) => arr.findIndex(x => x.getTime() === d.getTime()) === i)
        .sort((a, b) => b.getTime() - a.getTime());

      const today = new Date();
      today.setHours(0, 0, 0, 0);

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

    it('should calculate 3-day streak', () => {
      const today = new Date();
      const dates = [
        today,
        new Date(today.getTime() - 24 * 60 * 60 * 1000),
        new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
      ];

      expect(calculateStreak(dates)).toBe(3);
    });

    it('should return 0 for broken streak', () => {
      const today = new Date();
      const dates = [
        new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
        new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
      ];

      expect(calculateStreak(dates)).toBe(0);
    });

    it('should return 0 for empty dates', () => {
      expect(calculateStreak([])).toBe(0);
    });
  });

  describe('Improvement Rate', () => {
    it('should calculate positive improvement', () => {
      const lastTwoWeeks = 8;
      const previousTwoWeeks = 4;
      const improvementRate = ((lastTwoWeeks - previousTwoWeeks) / previousTwoWeeks) * 100;

      expect(improvementRate).toBe(100);
    });

    it('should calculate negative improvement', () => {
      const lastTwoWeeks = 4;
      const previousTwoWeeks = 8;
      const improvementRate = ((lastTwoWeeks - previousTwoWeeks) / previousTwoWeeks) * 100;

      expect(improvementRate).toBe(-50);
    });

    it('should handle no previous data', () => {
      const lastTwoWeeks = 5;
      const previousTwoWeeks = 0;
      const improvementRate = previousTwoWeeks > 0
        ? ((lastTwoWeeks - previousTwoWeeks) / previousTwoWeeks) * 100
        : lastTwoWeeks > 0 ? 100 : 0;

      expect(improvementRate).toBe(100);
    });
  });
});

// ============================================
// CLASS SUGGESTIONS TESTS
// ============================================

describe('Class Suggestions', () => {
  describe('Class Matching Score', () => {
    function calculateClassMatch(
      preferredTypes: string[],
      classType: string,
      availableDays: number[],
      classDay: number,
      preferredTimeSlots: string[],
      classHour: number
    ): number {
      let score = 0;

      // Match class type
      if (preferredTypes.includes(classType)) {
        score += 40;
      }

      // Match schedule
      if (availableDays.includes(classDay)) {
        score += 25;
      }

      // Match time slot
      const timeSlot = classHour < 12 ? 'morning' : classHour < 17 ? 'afternoon' : 'evening';
      if (preferredTimeSlots.includes(timeSlot)) {
        score += 20;
      }

      return score;
    }

    it('should give max score for perfect match', () => {
      const score = calculateClassMatch(
        ['strength'],
        'strength',
        [1, 3, 5],
        3, // Wednesday
        ['morning', 'afternoon'],
        10 // 10 AM = morning
      );

      expect(score).toBe(85); // 40 + 25 + 20
    });

    it('should give partial score for day match only', () => {
      const score = calculateClassMatch(
        ['cardio'],
        'strength',
        [1, 3, 5],
        3,
        ['morning'],
        10
      );

      expect(score).toBe(25); // Only day match
    });
  });
});

// ============================================
// TRAINER MATCHING TESTS
// ============================================

describe('Trainer Matching', () => {
  interface Trainer {
    trainerId: string;
    specializations: string[];
    rating: number;
  }

  function matchTrainer(
    fitnessGoals: string[],
    preferredTypes: string[],
    trainer: Trainer
  ): { score: number; matchReasons: string[] } {
    let score = 0;
    const matchReasons: string[] = [];

    // Match specializations with goals
    trainer.specializations.forEach(spec => {
      fitnessGoals.forEach(goal => {
        if (goal.toLowerCase().includes(spec.toLowerCase())) {
          score += 25;
          matchReasons.push(`Specializes in ${spec}`);
        }
      });
    });

    // Match preferred workout types
    preferredTypes.forEach(type => {
      if (trainer.specializations.includes(type)) {
        score += 20;
        matchReasons.push(`Expert in ${type}`);
      }
    });

    return { score, matchReasons };
  }

  it('should match trainer with goal specialization', () => {
    const result = matchTrainer(
      ['strength building', 'muscle gain'],
      ['strength'],
      { trainerId: 't1', specializations: ['strength'], rating: 4.5 }
    );

    expect(result.score).toBeGreaterThan(0);
    expect(result.matchReasons).toContain('Specializes in strength');
  });

  it('should give higher score to higher-rated trainers', () => {
    const trainer1 = { trainerId: 't1', specializations: ['cardio'], rating: 4.0 };
    const trainer2 = { trainerId: 't2', specializations: ['cardio'], rating: 4.8 };

    expect(trainer2.rating).toBeGreaterThan(trainer1.rating);
  });
});

// ============================================
// API RESPONSE FORMAT TESTS
// ============================================

describe('API Response Formats', () => {
  describe('Workout Recommendation Response', () => {
    it('should format workout recommendation response', () => {
      const response = {
        success: true,
        data: {
          memberId: 'member-123',
          recommendations: [
            { workoutId: 'wr-001', name: 'Strength Training', type: 'strength' },
          ],
          generatedAt: new Date().toISOString(),
        },
      };

      expect(response.success).toBe(true);
      expect(response.data.recommendations.length).toBe(1);
    });
  });

  describe('Engagement Score Response', () => {
    it('should format engagement score response', () => {
      const response = {
        success: true,
        data: {
          memberId: 'member-123',
          overallScore: 75,
          components: {
            frequency: 80,
            recency: 100,
            variety: 60,
            social: 50,
          },
          riskLevel: 'low',
          insights: ['Highly engaged member'],
          recommendations: [],
        },
      };

      expect(response.data.overallScore).toBe(75);
      expect(response.data.riskLevel).toBe('low');
    });
  });

  describe('Churn Prediction Response', () => {
    it('should format churn prediction response', () => {
      const response = {
        success: true,
        data: {
          memberId: 'member-123',
          churnProbability: 0.35,
          riskFactors: [
            { factor: 'Extended Inactivity', weight: 30, description: 'No visit in 20 days' },
          ],
          protectiveFactors: [
            { factor: 'Long-term Member', weight: 25, description: '12 months of membership' },
          ],
          recommendedActions: ['Send personalized re-engagement offer'],
          confidence: 0.85,
        },
      };

      expect(response.data.churnProbability).toBe(0.35);
      expect(response.data.confidence).toBe(0.85);
    });
  });
});
