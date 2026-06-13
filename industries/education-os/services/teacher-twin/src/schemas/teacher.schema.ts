import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true });

export interface Degree {
  id: string;
  name: string;
  institution: string;
  year: number;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  validUntil?: string;
}

export interface SubjectExpertise {
  subjectId: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'expert';
  yearsTeaching: number;
  certifications: string[];
}

export interface WeeklySchedule {
  [day: string]: {
    start: string;
    end: string;
    subject: string;
  }[];
}

export interface SalaryComponent {
  type: 'base' | 'allowance' | 'bonus';
  amount: number;
  currency: string;
}

export interface TeacherTwin {
  twinId: string;
  employeeId: string;
  createdAt: string;
  updatedAt: string;

  identity: {
    name: {
      first: string;
      last: string;
      display: string;
    };
    contact: {
      email: string;
      phone: string;
    };
    credentials: {
      degrees: Degree[];
      certifications: Certification[];
      awards: string[];
    };
    verified: boolean;
    trustScore: number;
  };

  expertise: {
    subjects: SubjectExpertise[];
    methodologies: string[];
    languages: string[];
    tools: string[];
    specializations: string[];
  };

  teaching: {
    style: {
      approach: 'lecture' | 'discussion' | 'project-based' | 'flipped';
      communication: 'formal' | 'casual' | 'encouraging';
      assessment: 'formative' | 'summative' | 'continuous';
    };
    metrics: {
      avgRating: number;
      totalStudents: number;
      completionRate: number;
      avgClassSize: number;
      yearsExperience: number;
    };
    availability: {
      schedule: WeeklySchedule;
      timezone: string;
      preferredSlots: string[];
    };
  };

  performance: {
    studentOutcomes: {
      avgScore: number;
      improvementRate: number;
      passRate: number;
    };
    engagement: {
      avgAttendance: number;
      studentSatisfaction: number;
      parentFeedback: number;
    };
    professional: {
      workshopsAttended: number;
      certificationsEarned: number;
      peerReviews: number;
    };
  };

  relationships: {
    institutionId: string;
    courses: string[];
    students: string[];
    colleagues: string[];
    department: string;
  };

  financial: {
    walletBalance: number;
    salary: SalaryComponent[];
    pendingPayments: number;
    rating: number;
  };

  metadata: {
    hireDate: string;
    status: 'active' | 'inactive' | 'on_leave';
    type: 'full_time' | 'part_time' | 'adjunct';
  };
}

export const createTeacherSchema = {
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
            first: { type: 'string' },
            last: { type: 'string' },
            display: { type: 'string' }
          }
        },
        contact: {
          type: 'object',
          required: ['email', 'phone'],
          properties: {
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' }
          }
        },
        credentials: {
          type: 'object',
          properties: {
            degrees: { type: 'array' },
            certifications: { type: 'array' },
            awards: { type: 'array', items: { type: 'string' }}
          }
        },
        verified: { type: 'boolean' },
        trustScore: { type: 'number', minimum: 0, maximum: 100 }
      }
    },
    metadata: {
      type: 'object',
      required: ['hireDate', 'status', 'type'],
      properties: {
        hireDate: { type: 'string', format: 'date-time' },
        status: { type: 'string', enum: ['active', 'inactive', 'on_leave'] },
        type: { type: 'string', enum: ['full_time', 'part_time', 'adjunct'] }
      }
    }
  }
};

export const validateCreateTeacher = ajv.compile(createTeacherSchema);
