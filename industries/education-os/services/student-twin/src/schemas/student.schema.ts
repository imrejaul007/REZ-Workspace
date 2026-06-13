import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true });

// Skill proficiency interface
export interface SkillProficiency {
  skillId: string;
  name: string;
  level: number; // 0-100
  lastAssessed: string;
  evidence: string[];
}

// Skill gap interface
export interface SkillGap {
  skillId: string;
  name: string;
  severity: 'low' | 'medium' | 'high';
  remediation: string[];
  priority: number;
}

// Learning style preferences
export interface LearningPreferences {
  format: ('video' | 'text' | 'interactive' | 'hands-on')[];
  duration: number;
  breaks: number;
  language: string;
}

// Behavior patterns
export interface BehaviorPatterns {
  peakPerformanceTime: string;
  struggleSignals: string[];
  motivationTriggers: string[];
  preferredPeers: string[];
}

// Assessment scores
export interface QuizScore {
  quizId: string;
  score: number;
  maxScore: number;
  completedAt: string;
  timeSpent: number;
}

export interface AssignmentScore {
  assignmentId: string;
  score: number;
  maxScore: number;
  submittedAt: string;
}

export interface ExamScore {
  examId: string;
  score: number;
  maxScore: number;
  completedAt: string;
}

// Goal interface
export interface Goal {
  id: string;
  description: string;
  targetDate: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'achieved' | 'abandoned';
}

// Scholarship interface
export interface Scholarship {
  id: string;
  name: string;
  amount: number;
  grantedAt: string;
  expiresAt: string;
  conditions: string[];
}

// Guardian information
export interface Guardian {
  name: string;
  phone: string;
  email: string;
  relationship: string;
}

// Location information
export interface Location {
  city: string;
  state: string;
  country: string;
}

// Student Twin main interface
export interface StudentTwin {
  // Core identifiers
  twinId: string;
  studentId: string;
  createdAt: string;
  updatedAt: string;

  // Identity section
  identity: {
    name: {
      first: string;
      last: string;
      display: string;
    };
    contact: {
      email: string;
      phone: string;
      countryCode: string;
    };
    demographics: {
      dateOfBirth: string;
      gender: string;
      location: Location;
    };
    guardian: Guardian;
    verified: boolean;
    trustScore: number;
  };

  // Learning profile (from MemoryOS)
  learning: {
    profile: {
      learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
      pace: 'slow' | 'moderate' | 'fast';
      preferences: LearningPreferences;
    };
    skills: {
      current: SkillProficiency[];
      demonstrated: SkillProficiency[];
      required: SkillProficiency[];
      gaps: SkillGap[];
    };
    progress: {
      coursesEnrolled: number;
      coursesCompleted: number;
      overallCompletionRate: number;
      avgScore: number;
      totalLearningHours: number;
    };
  };

  // Behavior patterns
  behavior: {
    engagement: {
      avgSessionDuration: number;
      preferredTimeSlots: string[];
      weeklyActiveDays: number[];
      completionRate: number;
      engagementScore: number;
    };
    patterns: BehaviorPatterns;
    attendance: {
      rate: number;
      punctuality: number;
      patterns: string[];
    };
  };

  // Assessment data
  assessment: {
    scores: {
      quizzes: QuizScore[];
      assignments: AssignmentScore[];
      exams: ExamScore[];
      overall: number;
      trend: 'improving' | 'stable' | 'declining';
    };
    strengths: string[];
    areasForImprovement: string[];
    competencyLevels: Record<string, 'beginner' | 'intermediate' | 'advanced' | 'mastered'>;
  };

  // AI Predictions
  predictions: {
    churnRisk: number;
    successProbability: number;
    completionProbability: number;
    placementReadiness: {
      score: number;
      skillsMatched: number;
      skillsGap: number;
      recommendedPath: string[];
    };
    nextMilestone: string | null;
    recommendedInterventions: string[];
  };

  // Goals
  goals: {
    shortTerm: Goal[];
    longTerm: Goal[];
    skillTargets: SkillProficiency[];
    desiredCredentials: string[];
  };

  // Relationships
  relationships: {
    institutionId: string | null;
    enrolledCourses: string[];
    teachers: string[];
    peers: string[];
    guardians: string[];
    alumniMentor: string | null;
  };

  // Financial status
  financial: {
    walletBalance: number;
    scholarships: Scholarship[];
    outstandingFees: number;
    paymentPlan: string | null;
    rewardsPoints: number;
  };

  // Metadata
  metadata: {
    source: 'direct' | 'ota' | 'corporate' | 'referral';
    enrollmentDate: string;
    cohort: string;
    status: 'active' | 'inactive' | 'graduated' | 'dropped';
  };
}

// Validation schemas
export const createStudentSchema = {
  type: 'object',
  required: ['identity', 'metadata'],
  properties: {
    identity: {
      type: 'object',
      required: ['name', 'contact'],
      properties: {
        name: {
          type: 'object',
          required: ['first', 'last'],
          properties: {
            first: { type: 'string', minLength: 1 },
            last: { type: 'string', minLength: 1 },
            display: { type: 'string' }
          }
        },
        contact: {
          type: 'object',
          required: ['email', 'phone'],
          properties: {
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', pattern: '^\\+?[1-9]\\d{1,14}$' },
            countryCode: { type: 'string', default: '+91' }
          }
        },
        demographics: {
          type: 'object',
          properties: {
            dateOfBirth: { type: 'string', format: 'date' },
            gender: { type: 'string' },
            location: {
              type: 'object',
              properties: {
                city: { type: 'string' },
                state: { type: 'string' },
                country: { type: 'string' }
              }
            }
          }
        },
        guardian: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string', format: 'email' },
            relationship: { type: 'string' }
          }
        },
        verified: { type: 'boolean', default: false },
        trustScore: { type: 'number', minimum: 0, maximum: 100, default: 50 }
      }
    },
    metadata: {
      type: 'object',
      required: ['source', 'enrollmentDate'],
      properties: {
        source: { type: 'string', enum: ['direct', 'ota', 'corporate', 'referral'] },
        enrollmentDate: { type: 'string', format: 'date-time' },
        cohort: { type: 'string' },
        status: { type: 'string', enum: ['active', 'inactive', 'graduated', 'dropped'], default: 'active' }
      }
    }
  },
  additionalProperties: true
};

export const updateStudentSchema = {
  type: 'object',
  properties: {
    identity: {
      type: 'object',
      properties: {
        name: {
          type: 'object',
          properties: {
            first: { type: 'string', minLength: 1 },
            last: { type: 'string', minLength: 1 },
            display: { type: 'string' }
          }
        },
        contact: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            countryCode: { type: 'string' }
          }
        },
        guardian: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string', format: 'email' },
            relationship: { type: 'string' }
          }
        },
        verified: { type: 'boolean' },
        trustScore: { type: 'number', minimum: 0, maximum: 100 }
      }
    },
    learning: {
      type: 'object',
      properties: {
        profile: {
          type: 'object',
          properties: {
            learningStyle: { type: 'string', enum: ['visual', 'auditory', 'kinesthetic', 'reading'] },
            pace: { type: 'string', enum: ['slow', 'moderate', 'fast'] },
            preferences: {
              type: 'object',
              properties: {
                format: {
                  type: 'array',
                  items: { type: 'string', enum: ['video', 'text', 'interactive', 'hands-on'] }
                },
                duration: { type: 'number' },
                breaks: { type: 'number' },
                language: { type: 'string' }
              }
            }
          }
        },
        progress: {
          type: 'object',
          properties: {
            coursesEnrolled: { type: 'number' },
            coursesCompleted: { type: 'number' },
            overallCompletionRate: { type: 'number' },
            avgScore: { type: 'number' },
            totalLearningHours: { type: 'number' }
          }
        }
      }
    },
    behavior: {
      type: 'object',
      properties: {
        engagement: {
          type: 'object',
          properties: {
            avgSessionDuration: { type: 'number' },
            preferredTimeSlots: { type: 'array', items: { type: 'string' } },
            weeklyActiveDays: { type: 'array', items: { type: 'number' } },
            completionRate: { type: 'number' },
            engagementScore: { type: 'number' }
          }
        },
        attendance: {
          type: 'object',
          properties: {
            rate: { type: 'number' },
            punctuality: { type: 'number' },
            patterns: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    },
    assessment: {
      type: 'object',
      properties: {
        scores: {
          type: 'object',
          properties: {
            overall: { type: 'number' },
            trend: { type: 'string', enum: ['improving', 'stable', 'declining'] }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        areasForImprovement: { type: 'array', items: { type: 'string' } }
      }
    },
    predictions: {
      type: 'object',
      properties: {
        churnRisk: { type: 'number', minimum: 0, maximum: 1 },
        successProbability: { type: 'number', minimum: 0, maximum: 1 },
        completionProbability: { type: 'number', minimum: 0, maximum: 1 }
      }
    },
    metadata: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['active', 'inactive', 'graduated', 'dropped'] },
        cohort: { type: 'string' }
      }
    },
    relationships: {
      type: 'object',
      properties: {
        institutionId: { type: ['string', 'null'] },
        enrolledCourses: { type: 'array', items: { type: 'string' } },
        teachers: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  additionalProperties: false
};

// Compile validators
export const validateCreateStudent = ajv.compile(createStudentSchema);
export const validateUpdateStudent = ajv.compile(updateStudentSchema);
