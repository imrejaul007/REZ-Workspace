import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true });

export interface Resource {
  id: string;
  name: string;
  type: 'pdf' | 'video' | 'link' | 'file';
  url: string;
}

export interface Lesson {
  id: string;
  title: string;
  duration: number;
  type: 'video' | 'text' | 'interactive';
}

export interface Quiz {
  id: string;
  title: string;
  questionsCount: number;
  duration: number;
}

export interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  maxScore: number;
}

export interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
  quizzes: Quiz[];
  assignments: Assignment[];
  duration: number;
}

export interface Discount {
  type: 'percentage' | 'fixed';
  value: number;
  code?: string;
  validUntil?: string;
}

export interface Schedule {
  dayOfWeek: number[];
  startTime: string;
  endTime: string;
}

export interface CourseTwin {
  twinId: string;
  courseId: string;
  createdAt: string;
  updatedAt: string;

  identity: {
    title: string;
    description: string;
    code: string;
    category: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    language: string;
    thumbnail: string;
  };

  content: {
    modules: Module[];
    totalDuration: number;
    lessonsCount: number;
    assignmentsCount: number;
    quizzesCount: number;
    resources: Resource[];
  };

  outcomes: {
    skills: { skillId: string; name: string; level: string }[];
    competencies: string[];
    certifications: string[];
    learningObjectives: string[];
  };

  prerequisites: {
    required: string[];
    recommended: string[];
    minimumAge: number;
    priorKnowledge: string[];
  };

  enrollment: {
    capacity: number;
    enrolled: number;
    waitlist: number;
    completionRate: number;
    avgScore: number;
    avgRating: number;
  };

  instructors: {
    primary: string;
    secondary: string[];
    teachingAssistants: string[];
  };

  pricing: {
    basePrice: number;
    currency: string;
    discounts: Discount[];
    paymentPlans: string[];
  };

  delivery: {
    format: 'online' | 'offline' | 'hybrid';
    schedule: Schedule;
    duration: { weeks: number; sessionsPerWeek: number; minutesPerSession: number };
    recordings: boolean;
    materials: string[];
  };

  relationships: {
    institutionId: string;
    curriculumId: string;
    programId: string;
    linkedCourses: string[];
  };

  metadata: {
    status: 'draft' | 'published' | 'archived';
    publishedAt?: string;
    lastUpdated: string;
    tags: string[];
  };
}

export const createCourseSchema = {
  type: 'object',
  required: ['identity', 'metadata'],
  properties: {
    identity: {
      type: 'object',
      required: ['title', 'code'],
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        code: { type: 'string' },
        category: { type: 'string' },
        level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
        language: { type: 'string' },
        thumbnail: { type: 'string' }
      }
    },
    metadata: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { type: 'string', enum: ['draft', 'published', 'archived'] },
        tags: { type: 'array', items: { type: 'string' }}
      }
    }
  }
};

export const validateCreateCourse = ajv.compile(createCourseSchema);