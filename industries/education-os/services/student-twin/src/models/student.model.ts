import { v4 as uuidv4 } from 'uuid';
import {
  StudentTwin,
  SkillProficiency,
  SkillGap,
  LearningPreferences,
  Goal,
  Guardian,
  Scholarship
} from '../schemas/student.schema';

export class StudentModel {
  /**
   * Create a new student twin with default values
   */
  static createStudent(data: {
    identity: StudentTwin['identity'];
    metadata: StudentTwin['metadata'];
    studentId?: string;
  }): StudentTwin {
    const now = new Date().toISOString();
    const twinId = `student_${uuidv4()}`;

    return {
      twinId,
      studentId: data.studentId || uuidv4(),
      createdAt: now,
      updatedAt: now,
      identity: {
        name: {
          first: data.identity.name.first,
          last: data.identity.name.last,
          display: data.identity.name.display || `${data.identity.name.first} ${data.identity.name.last}`
        },
        contact: {
          email: data.identity.contact.email,
          phone: data.identity.contact.phone,
          countryCode: data.identity.contact.countryCode || '+91'
        },
        demographics: data.identity.demographics || {
          dateOfBirth: '',
          gender: '',
          location: { city: '', state: '', country: '' }
        },
        guardian: data.identity.guardian || {
          name: '',
          phone: '',
          email: '',
          relationship: ''
        },
        verified: data.identity.verified || false,
        trustScore: data.identity.trustScore || 50
      },
      learning: {
        profile: {
          learningStyle: 'visual',
          pace: 'moderate',
          preferences: this.createDefaultLearningPreferences()
        },
        skills: {
          current: [],
          demonstrated: [],
          required: [],
          gaps: []
        },
        progress: {
          coursesEnrolled: 0,
          coursesCompleted: 0,
          overallCompletionRate: 0,
          avgScore: 0,
          totalLearningHours: 0
        }
      },
      behavior: {
        engagement: {
          avgSessionDuration: 0,
          preferredTimeSlots: [],
          weeklyActiveDays: [],
          completionRate: 0,
          engagementScore: 50
        },
        patterns: {
          peakPerformanceTime: '10:00',
          struggleSignals: [],
          motivationTriggers: [],
          preferredPeers: []
        },
        attendance: {
          rate: 1.0,
          punctuality: 1.0,
          patterns: []
        }
      },
      assessment: {
        scores: {
          quizzes: [],
          assignments: [],
          exams: [],
          overall: 0,
          trend: 'stable' as const
        },
        strengths: [],
        areasForImprovement: [],
        competencyLevels: {}
      },
      predictions: {
        churnRisk: 0,
        successProbability: 0.5,
        completionProbability: 0.5,
        placementReadiness: {
          score: 0,
          skillsMatched: 0,
          skillsGap: 0,
          recommendedPath: []
        },
        nextMilestone: null,
        recommendedInterventions: []
      },
      goals: {
        shortTerm: [],
        longTerm: [],
        skillTargets: [],
        desiredCredentials: []
      },
      relationships: {
        institutionId: null,
        enrolledCourses: [],
        teachers: [],
        peers: [],
        guardians: [],
        alumniMentor: null
      },
      financial: {
        walletBalance: 0,
        scholarships: [],
        outstandingFees: 0,
        paymentPlan: null,
        rewardsPoints: 0
      },
      metadata: {
        source: data.metadata.source,
        enrollmentDate: data.metadata.enrollmentDate,
        cohort: data.metadata.cohort || '',
        status: data.metadata.status || 'active'
      }
    };
  }

  static createDefaultLearningPreferences(): LearningPreferences {
    return {
      format: ['video', 'text'],
      duration: 30,
      breaks: 5,
      language: 'en'
    };
  }

  /**
   * Update student twin with partial updates
   */
  static updateStudent(
    student: StudentTwin,
    updates: Partial<StudentTwin>
  ): StudentTwin {
    return {
      ...student,
      ...updates,
      twinId: student.twinId,
      studentId: student.studentId,
      createdAt: student.createdAt,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Update learning profile
   */
  static updateLearningProfile(
    student: StudentTwin,
    updates: {
      learningStyle?: StudentTwin['learning']['profile']['learningStyle'];
      pace?: StudentTwin['learning']['profile']['pace'];
      preferences?: Partial<LearningPreferences>;
    }
  ): StudentTwin {
    return {
      ...student,
      learning: {
        ...student.learning,
        profile: {
          ...student.learning.profile,
          ...updates,
          preferences: updates.preferences
            ? { ...student.learning.profile.preferences, ...updates.preferences }
            : student.learning.profile.preferences
        }
      },
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Add a skill proficiency
   */
  static addSkillProficiency(
    student: StudentTwin,
    skill: SkillProficiency,
    type: 'current' | 'demonstrated' | 'required'
  ): StudentTwin {
    const skills = [...student.learning.skills[type]];
    const existingIndex = skills.findIndex(s => s.skillId === skill.skillId);

    if (existingIndex >= 0) {
      skills[existingIndex] = skill;
    } else {
      skills.push(skill);
    }

    return {
      ...student,
      learning: {
        ...student.learning,
        skills: {
          ...student.learning.skills,
          [type]: skills
        }
      },
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Add a skill gap
   */
  static addSkillGap(student: StudentTwin, gap: SkillGap): StudentTwin {
    const gaps = [...student.learning.skills.gaps];
    const existingIndex = gaps.findIndex(g => g.skillId === gap.skillId);

    if (existingIndex >= 0) {
      gaps[existingIndex] = gap;
    } else {
      gaps.push(gap);
    }

    return {
      ...student,
      learning: {
        ...student.learning,
        skills: {
          ...student.learning.skills,
          gaps
        }
      }
    };
  }

  /**
   * Update progress metrics
   */
  static updateProgress(
    student: StudentTwin,
    progress: {
      coursesEnrolled?: number;
      coursesCompleted?: number;
      avgScore?: number;
      totalLearningHours?: number;
    }
  ): StudentTwin {
    const updatedProgress = {
      ...student.learning.progress,
      ...progress
    };

    // Recalculate completion rate
    if (updatedProgress.coursesEnrolled > 0) {
      updatedProgress.overallCompletionRate =
        updatedProgress.coursesCompleted / updatedProgress.coursesEnrolled;
    }

    return {
      ...student,
      learning: {
        ...student.learning,
        progress: updatedProgress
      },
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Update predictions
   */
  static updatePredictions(
    student: StudentTwin,
    predictions: Partial<StudentTwin['predictions']>
  ): StudentTwin {
    return {
      ...student,
      predictions: {
        ...student.predictions,
        ...predictions
      },
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Update engagement metrics
   */
  static updateEngagement(
    student: StudentTwin,
    engagement: Partial<StudentTwin['behavior']['engagement']>
  ): StudentTwin {
    return {
      ...student,
      behavior: {
        ...student.behavior,
        engagement: {
          ...student.behavior.engagement,
          ...engagement
        }
      },
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Update attendance
   */
  static updateAttendance(
    student: StudentTwin,
    attendance: {
      present?: boolean;
      onTime?: boolean;
    }
  ): StudentTwin {
    const currentAttendance = student.behavior.attendance;
    const totalRecords = currentAttendance.patterns.length;

    // Calculate new rates
    const presentCount = currentAttendance.patterns.filter(p => p === 'present').length +
      (attendance.present ? 1 : 0);
    const onTimeCount = currentAttendance.patterns.filter(p => p === 'on_time').length +
      (attendance.onTime ? 1 : 0);

    const newRate = totalRecords > 0 ? presentCount / (totalRecords + 1) : 1;
    const newPunctuality = totalRecords > 0 ? onTimeCount / (totalRecords + 1) : 1;

    return {
      ...student,
      behavior: {
        ...student.behavior,
        attendance: {
          rate: newRate,
          punctuality: newPunctuality,
          patterns: [...currentAttendance.patterns, attendance.present ? 'present' : 'absent']
        }
      },
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Add scholarship
   */
  static addScholarship(student: StudentTwin, scholarship: Scholarship): StudentTwin {
    return {
      ...student,
      financial: {
        ...student.financial,
        scholarships: [...student.financial.scholarships, scholarship]
      },
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Enroll in course
   */
  static enrollInCourse(student: StudentTwin, courseTwinId: string): StudentTwin {
    if (student.relationships.enrolledCourses.includes(courseTwinId)) {
      return student;
    }

    return {
      ...student,
      relationships: {
        ...student.relationships,
        enrolledCourses: [...student.relationships.enrolledCourses, courseTwinId]
      },
      learning: {
        ...student.learning,
        progress: {
          ...student.learning.progress,
          coursesEnrolled: student.learning.progress.coursesEnrolled + 1
        }
      },
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Complete course
   */
  static completeCourse(student: StudentTwin, courseTwinId: string): StudentTwin {
    return {
      ...student,
      relationships: {
        ...student.relationships,
        enrolledCourses: student.relationships.enrolledCourses.filter(id => id !== courseTwinId)
      },
      learning: {
        ...student.learning,
        progress: {
          ...student.learning.progress,
          coursesCompleted: student.learning.progress.coursesCompleted + 1,
          overallCompletionRate: (student.learning.progress.coursesCompleted + 1) /
            (student.learning.progress.coursesEnrolled || 1)
        }
      },
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Add goal
   */
  static addGoal(
    student: StudentTwin,
    goal: Goal,
    type: 'shortTerm' | 'longTerm'
  ): StudentTwin {
    return {
      ...student,
      goals: {
        ...student.goals,
        [type]: [...student.goals[type], goal]
      },
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Update goal status
   */
  static updateGoalStatus(
    student: StudentTwin,
    goalId: string,
    status: Goal['status'],
    progress?: number
  ): StudentTwin {
    const updateGoal = (goals: Goal[]): Goal[] => {
      return goals.map(g => {
        if (g.id === goalId) {
          return {
            ...g,
            status,
            progress: progress !== undefined ? progress : g.progress
          };
        }
        return g;
      });
    };

    return {
      ...student,
      goals: {
        shortTerm: updateGoal(student.goals.shortTerm),
        longTerm: updateGoal(student.goals.longTerm),
        skillTargets: student.goals.skillTargets,
        desiredCredentials: student.goals.desiredCredentials
      },
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Calculate churn risk
   */
  static calculateChurnRisk(student: StudentTwin): number {
    let risk = 0;

    // Low engagement increases risk
    if (student.behavior.engagement.engagementScore < 30) risk += 0.3;
    if (student.behavior.engagement.completionRate < 0.5) risk += 0.2;

    // Low attendance increases risk
    if (student.behavior.attendance.rate < 0.7) risk += 0.2;

    // Financial issues
    if (student.financial.outstandingFees > 0) risk += 0.1;

    // Declining grades
    if (student.assessment.scores.trend === 'declining') risk += 0.15;

    // High skill gaps
    if (student.learning.skills.gaps.length > 5) risk += 0.1;

    return Math.min(1, risk);
  }

  /**
   * Calculate success probability
   */
  static calculateSuccessProbability(student: StudentTwin): number {
    let probability = 0.5;

    // Positive factors
    if (student.behavior.engagement.engagementScore > 70) probability += 0.15;
    if (student.behavior.attendance.rate > 0.9) probability += 0.1;
    if (student.assessment.scores.overall > 75) probability += 0.15;
    if (student.learning.skills.demonstrated.length > 5) probability += 0.1;

    // Negative factors
    if (student.learning.skills.gaps.length > 3) probability -= 0.1;
    if (student.predictions.churnRisk > 0.5) probability -= 0.15;

    return Math.max(0, Math.min(1, probability));
  }
}
