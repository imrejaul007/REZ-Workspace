#!/usr/bin/env python3
"""
Generate remaining Education OS twin services
"""
import os

BASE_PATH = "/Users/rejaulkarim/Documents/RTMN/industries/education-os/services"

def create_package_json(name, description):
    return f'''{{
  "name": "{name}",
  "version": "1.0.0",
  "description": "{description}",
  "main": "dist/index.js",
  "scripts": {{
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "test": "jest"
  }},
  "dependencies": {{
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "redis": "^5.0.0",
    "ajv": "^8.12.0",
    "uuid": "^9.0.0",
    "winston": "^3.11.0",
    "axios": "^1.6.0"
  }},
  "devDependencies": {{
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "@types/uuid": "^9.0.7",
    "typescript": "^5.3.0",
    "ts-node": "^10.9.2",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11",
    "ts-jest": "^29.1.1"
  }}
}}
'''

def create_tsconfig():
    return '''{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
'''

def create_teacher_twin():
    return '''import Ajv from 'ajv';

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
            degrees: { type: 'array', items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                institution: { type: 'string' },
                year: { type: 'number' }
              }
            }},
            certifications: { type: 'array', items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                issuer: { type: 'string' }
              }
            }},
            awards: { type: 'array', items: { type: 'string' }}
          }
        },
        verified: { type: 'boolean' },
        trustScore: { type: 'number', minimum: 0, maximum: 100 }
      }
    },
    expertise: {
      type: 'object',
      properties: {
        subjects: { type: 'array', items: { type: 'object' }},
        methodologies: { type: 'array', items: { type: 'string' }},
        languages: { type: 'array', items: { type: 'string' }},
        tools: { type: 'array', items: { type: 'string' }},
        specializations: { type: 'array', items: { type: 'string' }}
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
export const validateUpdateTeacher = ajv.compile({
  type: 'object',
  properties: {
    identity: { type: 'object' },
    expertise: { type: 'object' },
    teaching: { type: 'object' },
    performance: { type: 'object' },
    metadata: { type: 'object' }
  }
});
''', '''import { v4 as uuidv4 } from 'uuid';
import { TeacherTwin } from '../schemas/teacher.schema';

export class TeacherModel {
  static createTeacher(data: {
    identity: TeacherTwin['identity'];
    metadata: TeacherTwin['metadata'];
    employeeId?: string;
  }): TeacherTwin {
    const now = new Date().toISOString();
    const twinId = `teacher_${uuidv4()}`;

    return {
      twinId,
      employeeId: data.employeeId || uuidv4(),
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
          phone: data.identity.contact.phone
        },
        credentials: data.identity.credentials || { degrees: [], certifications: [], awards: [] },
        verified: data.identity.verified || false,
        trustScore: data.identity.trustScore || 50
      },
      expertise: {
        subjects: [],
        methodologies: [],
        languages: ['English'],
        tools: [],
        specializations: []
      },
      teaching: {
        style: {
          approach: 'lecture',
          communication: 'formal',
          assessment: 'continuous'
        },
        metrics: {
          avgRating: 0,
          totalStudents: 0,
          completionRate: 0,
          avgClassSize: 0,
          yearsExperience: 0
        },
        availability: {
          schedule: {},
          timezone: 'UTC',
          preferredSlots: []
        }
      },
      performance: {
        studentOutcomes: { avgScore: 0, improvementRate: 0, passRate: 0 },
        engagement: { avgAttendance: 0, studentSatisfaction: 0, parentFeedback: 0 },
        professional: { workshopsAttended: 0, certificationsEarned: 0, peerReviews: 0 }
      },
      relationships: {
        institutionId: '',
        courses: [],
        students: [],
        colleagues: [],
        department: ''
      },
      financial: {
        walletBalance: 0,
        salary: [],
        pendingPayments: 0,
        rating: 0
      },
      metadata: {
        hireDate: data.metadata.hireDate,
        status: data.metadata.status,
        type: data.metadata.type
      }
    };
  }

  static updateTeacher(teacher: TeacherTwin, updates: Partial<TeacherTwin>): TeacherTwin {
    return {
      ...teacher,
      ...updates,
      twinId: teacher.twinId,
      employeeId: teacher.employeeId,
      createdAt: teacher.createdAt,
      updatedAt: new Date().toISOString()
    };
  }

  static addSubjectExpertise(teacher: TeacherTwin, subject: TeacherTwin['expertise']['subjects'][0]): TeacherTwin {
    const subjects = [...teacher.expertise.subjects];
    const existingIndex = subjects.findIndex(s => s.subjectId === subject.subjectId);
    if (existingIndex >= 0) {
      subjects[existingIndex] = subject;
    } else {
      subjects.push(subject);
    }
    return {
      ...teacher,
      expertise: { ...teacher.expertise, subjects },
      updatedAt: new Date().toISOString()
    };
  }

  static updateMetrics(teacher: TeacherTwin, metrics: Partial<TeacherTwin['teaching']['metrics']>): TeacherTwin {
    return {
      ...teacher,
      teaching: {
        ...teacher.teaching,
        metrics: { ...teacher.teaching.metrics, ...metrics }
      },
      updatedAt: new Date().toISOString()
    };
  }

  static addStudent(teacher: TeacherTwin, studentTwinId: string): TeacherTwin {
    if (teacher.relationships.students.includes(studentTwinId)) {
      return teacher;
    }
    return {
      ...teacher,
      relationships: {
        ...teacher.relationships,
        students: [...teacher.relationships.students, studentTwinId]
      },
      updatedAt: new Date().toISOString()
    };
  }

  static addCourse(teacher: TeacherTwin, courseTwinId: string): TeacherTwin {
    if (teacher.relationships.courses.includes(courseTwinId)) {
      return teacher;
    }
    return {
      ...teacher,
      relationships: {
        ...teacher.relationships,
        courses: [...teacher.relationships.courses, courseTwinId]
      },
      updatedAt: new Date().toISOString()
    };
  }

  static updatePerformance(teacher: TeacherTwin, performance: Partial<TeacherTwin['performance']>): TeacherTwin {
    return {
      ...teacher,
      performance: {
        studentOutcomes: { ...teacher.performance.studentOutcomes, ...performance.studentOutcomes },
        engagement: { ...teacher.performance.engagement, ...performance.engagement },
        professional: { ...teacher.performance.professional, ...performance.professional }
      },
      updatedAt: new Date().toISOString()
    };
  }
}
''', '''import { TeacherTwin } from '../schemas/teacher.schema';
import { TeacherModel } from '../models/teacher.model';
import Redis from 'redis';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

export class TeacherService {
  private redisClient: Redis.RedisType | null = null;
  private teachers: Map<string, TeacherTwin> = new Map();

  constructor(redisUrl?: string) {
    if (redisUrl) {
      this.redisClient = Redis.createClient({ url: redisUrl });
    }
  }

  async initialize(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.connect();
    }
    logger.info('Teacher twin service initialized');
  }

  async createTeacher(data: { identity: TeacherTwin['identity']; metadata: TeacherTwin['metadata'] }): Promise<TeacherTwin> {
    const existing = await this.findTeacherByEmail(data.identity.contact.email);
    if (existing) {
      throw new Error(`Teacher with email ${data.identity.contact.email} already exists`);
    }
    const teacher = TeacherModel.createTeacher(data);
    await this.saveTeacher(teacher);
    logger.info(`Created teacher twin: ${teacher.twinId}`);
    return teacher;
  }

  async getTeacher(twinId: string): Promise<TeacherTwin | null> {
    const cached = await this.getFromCache(twinId);
    if (cached) return cached;
    const teacher = this.teachers.get(twinId);
    if (teacher) {
      await this.setCache(twinId, teacher);
      return teacher;
    }
    return null;
  }

  async findTeacherByEmail(email: string): Promise<TeacherTwin | null> {
    for (const teacher of this.teachers.values()) {
      if (teacher.identity.contact.email === email) return teacher;
    }
    return null;
  }

  async updateTeacher(twinId: string, updates: Partial<TeacherTwin>): Promise<TeacherTwin | null> {
    const teacher = await this.getTeacher(twinId);
    if (!teacher) return null;
    const updated = TeacherModel.updateTeacher(teacher, updates);
    await this.saveTeacher(updated);
    logger.info(`Updated teacher twin: ${twinId}`);
    return updated;
  }

  async deleteTeacher(twinId: string): Promise<boolean> {
    const existed = this.teachers.has(twinId);
    if (existed) {
      this.teachers.delete(twinId);
      await this.invalidateCache(twinId);
    }
    return existed;
  }

  async listTeachers(filter?: { status?: string; institutionId?: string; department?: string }): Promise<TeacherTwin[]> {
    let teachers = Array.from(this.teachers.values());
    if (filter?.status) teachers = teachers.filter(t => t.metadata.status === filter.status);
    if (filter?.institutionId) teachers = teachers.filter(t => t.relationships.institutionId === filter.institutionId);
    if (filter?.department) teachers = teachers.filter(t => t.relationships.department === filter.department);
    return teachers;
  }

  async addSubjectExpertise(twinId: string, subject: TeacherTwin['expertise']['subjects'][0]): Promise<TeacherTwin | null> {
    const teacher = await this.getTeacher(twinId);
    if (!teacher) return null;
    const updated = TeacherModel.addSubjectExpertise(teacher, subject);
    await this.saveTeacher(updated);
    return updated;
  }

  async addStudent(twinId: string, studentTwinId: string): Promise<TeacherTwin | null> {
    const teacher = await this.getTeacher(twinId);
    if (!teacher) return null;
    const updated = TeacherModel.addStudent(teacher, studentTwinId);
    await this.saveTeacher(updated);
    return updated;
  }

  async addCourse(twinId: string, courseTwinId: string): Promise<TeacherTwin | null> {
    const teacher = await this.getTeacher(twinId);
    if (!teacher) return null;
    const updated = TeacherModel.addCourse(teacher, courseTwinId);
    await this.saveTeacher(updated);
    return updated;
  }

  async getTeacherPerformance(twinId: string): Promise<TeacherTwin['performance'] | null> {
    const teacher = await this.getTeacher(twinId);
    return teacher ? teacher.performance : null;
  }

  private async saveTeacher(teacher: TeacherTwin): Promise<void> {
    this.teachers.set(teacher.twinId, teacher);
    await this.setCache(teacher.twinId, teacher);
  }

  private async getFromCache(twinId: string): Promise<TeacherTwin | null> {
    if (!this.redisClient) return null;
    try {
      const cached = await this.redisClient.get(`teacher:${twinId}`);
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  }

  private async setCache(twinId: string, teacher: TeacherTwin): Promise<void> {
    if (!this.redisClient) return;
    try {
      await this.redisClient.setEx(`teacher:${twinId}`, 3600, JSON.stringify(teacher));
    } catch { logger.error('Cache write error'); }
  }

  private async invalidateCache(twinId: string): Promise<void> {
    if (!this.redisClient) return;
    try { await this.redisClient.del(`teacher:${twinId}`); } catch {}
  }

  async close(): Promise<void> {
    if (this.redisClient) await this.redisClient.quit();
  }
}
''', '''import { Router, Request, Response } from 'express';
import { TeacherService } from '../services/teacher.service';
import { validateCreateTeacher } from '../schemas/teacher.schema';

const router = Router();
const teacherService = new TeacherService(process.env.REDIS_URL);

export function getTeacherRouter() { return router; }

router.post('/', async (req: Request, res: Response) => {
  try {
    const valid = validateCreateTeacher(req.body);
    if (!valid) return res.status(400).json({ errors: validateCreateTeacher.errors });
    const teacher = await teacherService.createTeacher(req.body);
    return res.status(201).json(teacher);
  } catch (error: any) { return res.status(400).json({ error: error.message }); }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.institutionId) filter.institutionId = req.query.institutionId;
    if (req.query.department) filter.department = req.query.department;
    const teachers = await teacherService.listTeachers(filter);
    return res.json({ teachers, count: teachers.length });
  } catch (error: any) { return res.status(500).json({ error: error.message }); }
});

router.get('/:twinId', async (req: Request, res: Response) => {
  try {
    const teacher = await teacherService.getTeacher(req.params.twinId);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    return res.json(teacher);
  } catch (error: any) { return res.status(500).json({ error: error.message }); }
});

router.put('/:twinId', async (req: Request, res: Response) => {
  try {
    const teacher = await teacherService.updateTeacher(req.params.twinId, req.body);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    return res.json(teacher);
  } catch (error: any) { return res.status(400).json({ error: error.message }); }
});

router.delete('/:twinId', async (req: Request, res: Response) => {
  try {
    const deleted = await teacherService.deleteTeacher(req.params.twinId);
    if (!deleted) return res.status(404).json({ error: 'Teacher not found' });
    return res.status(204).send();
  } catch (error: any) { return res.status(500).json({ error: error.message }); }
});

router.post('/:twinId/subjects', async (req: Request, res: Response) => {
  try {
    const teacher = await teacherService.addSubjectExpertise(req.params.twinId, req.body);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    return res.json(teacher);
  } catch (error: any) { return res.status(400).json({ error: error.message }); }
});

router.post('/:twinId/students', async (req: Request, res: Response) => {
  try {
    const { studentTwinId } = req.body;
    const teacher = await teacherService.addStudent(req.params.twinId, studentTwinId);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    return res.json(teacher);
  } catch (error: any) { return res.status(400).json({ error: error.message }); }
});

router.post('/:twinId/courses', async (req: Request, res: Response) => {
  try {
    const { courseTwinId } = req.body;
    const teacher = await teacherService.addCourse(req.params.twinId, courseTwinId);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    return res.json(teacher);
  } catch (error: any) { return res.status(400).json({ error: error.message }); }
});

router.get('/:twinId/performance', async (req: Request, res: Response) => {
  try {
    const performance = await teacherService.getTeacherPerformance(req.params.twinId);
    if (!performance) return res.status(404).json({ error: 'Teacher not found' });
    return res.json(performance);
  } catch (error: any) { return res.status(500).json({ error: error.message }); }
});

export { teacherService };
''', '''import express from 'express';
import { getTeacherRouter } from './routes/teacher.routes';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const app = express();
const PORT = process.env.TEACHER_TWIN_PORT || 4552;

app.use(express.json());
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'teacher-twin', timestamp: new Date().toISOString() });
});
app.use('/api/v1/teachers', getTeacherRouter());
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, () => logger.info(`Teacher twin service running on port ${PORT}`));
process.on('SIGTERM', () => { logger.info('Shutting down'); server.close(() => process.exit(0)); });
process.on('SIGINT', () => { logger.info('Shutting down'); server.close(() => process.exit(0)); });

export { app };
''')

def create_course_twin():
    return '''import Ajv from 'ajv';

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
''', '''import { v4 as uuidv4 } from 'uuid';
import { CourseTwin } from '../schemas/course.schema';

export class CourseModel {
  static createCourse(data: { identity: CourseTwin['identity']; metadata: CourseTwin['metadata'] }): CourseTwin {
    const now = new Date().toISOString();
    const twinId = `course_${uuidv4()}`;
    return {
      twinId,
      courseId: uuidv4(),
      createdAt: now,
      updatedAt: now,
      identity: {
        title: data.identity.title,
        description: data.identity.description || '',
        code: data.identity.code,
        category: data.identity.category || '',
        level: data.identity.level || 'beginner',
        language: data.identity.language || 'en',
        thumbnail: data.identity.thumbnail || ''
      },
      content: {
        modules: [],
        totalDuration: 0,
        lessonsCount: 0,
        assignmentsCount: 0,
        quizzesCount: 0,
        resources: []
      },
      outcomes: {
        skills: [],
        competencies: [],
        certifications: [],
        learningObjectives: []
      },
      prerequisites: {
        required: [],
        recommended: [],
        minimumAge: 0,
        priorKnowledge: []
      },
      enrollment: {
        capacity: 100,
        enrolled: 0,
        waitlist: 0,
        completionRate: 0,
        avgScore: 0,
        avgRating: 0
      },
      instructors: {
        primary: '',
        secondary: [],
        teachingAssistants: []
      },
      pricing: {
        basePrice: 0,
        currency: 'INR',
        discounts: [],
        paymentPlans: []
      },
      delivery: {
        format: 'online',
        schedule: { dayOfWeek: [], startTime: '', endTime: '' },
        duration: { weeks: 0, sessionsPerWeek: 0, minutesPerSession: 0 },
        recordings: false,
        materials: []
      },
      relationships: {
        institutionId: '',
        curriculumId: '',
        programId: '',
        linkedCourses: []
      },
      metadata: {
        status: data.metadata.status || 'draft',
        lastUpdated: now,
        tags: data.metadata.tags || []
      }
    };
  }

  static updateCourse(course: CourseTwin, updates: Partial<CourseTwin>): CourseTwin {
    return { ...course, ...updates, twinId: course.twinId, courseId: course.courseId, updatedAt: new Date().toISOString() };
  }

  static addModule(course: CourseTwin, module: CourseTwin['content']['modules'][0]): CourseTwin {
    return {
      ...course,
      content: {
        ...course.content,
        modules: [...course.content.modules, module],
        lessonsCount: course.content.lessonsCount + module.lessons.length,
        assignmentsCount: course.content.assignmentsCount + module.assignments.length,
        quizzesCount: course.content.quizzesCount + module.quizzes.length
      },
      updatedAt: new Date().toISOString()
    };
  }

  static enrollStudent(course: CourseTwin): CourseTwin {
    if (course.enrollment.enrolled >= course.enrollment.capacity) {
      return { ...course, enrollment: { ...course.enrollment, waitlist: course.enrollment.waitlist + 1 } };
    }
    return { ...course, enrollment: { ...course.enrollment, enrolled: course.enrollment.enrolled + 1 }, updatedAt: new Date().toISOString() };
  }

  static completeEnrollment(course: CourseTwin): CourseTwin {
    return { ...course, enrollment: { ...course.enrollment, waitlist: Math.max(0, course.enrollment.waitlist - 1) } };
  }

  static updateEnrollmentMetrics(course: CourseTwin, metrics: { completionRate?: number; avgScore?: number; avgRating?: number }): CourseTwin {
    return { ...course, enrollment: { ...course.enrollment, ...metrics }, updatedAt: new Date().toISOString() };
  }
}
''', '''import { CourseTwin } from '../schemas/course.schema';
import { CourseModel } from '../models/course.model';
import Redis from 'redis';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info', format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

export class CourseService {
  private redisClient: Redis.RedisType | null = null;
  private courses: Map<string, CourseTwin> = new Map();

  constructor(redisUrl?: string) {
    if (redisUrl) this.redisClient = Redis.createClient({ url: redisUrl });
  }

  async initialize(): Promise<void> {
    if (this.redisClient) await this.redisClient.connect();
    logger.info('Course twin service initialized');
  }

  async createCourse(data: { identity: CourseTwin['identity']; metadata: CourseTwin['metadata'] }): Promise<CourseTwin> {
    const course = CourseModel.createCourse(data);
    await this.saveCourse(course);
    logger.info(`Created course twin: ${course.twinId}`);
    return course;
  }

  async getCourse(twinId: string): Promise<CourseTwin | null> {
    const cached = await this.getFromCache(twinId);
    if (cached) return cached;
    const course = this.courses.get(twinId);
    if (course) { await this.setCache(twinId, course); return course; }
    return null;
  }

  async getCourseByCode(code: string): Promise<CourseTwin | null> {
    for (const course of this.courses.values()) {
      if (course.identity.code === code) return course;
    }
    return null;
  }

  async updateCourse(twinId: string, updates: Partial<CourseTwin>): Promise<CourseTwin | null> {
    const course = await this.getCourse(twinId);
    if (!course) return null;
    const updated = CourseModel.updateCourse(course, updates);
    await this.saveCourse(updated);
    return updated;
  }

  async deleteCourse(twinId: string): Promise<boolean> {
    const existed = this.courses.has(twinId);
    if (existed) { this.courses.delete(twinId); await this.invalidateCache(twinId); }
    return existed;
  }

  async listCourses(filter?: { status?: string; category?: string; level?: string; institutionId?: string }): Promise<CourseTwin[]> {
    let courses = Array.from(this.courses.values());
    if (filter?.status) courses = courses.filter(c => c.metadata.status === filter.status);
    if (filter?.category) courses = courses.filter(c => c.identity.category === filter.category);
    if (filter?.level) courses = courses.filter(c => c.identity.level === filter.level);
    if (filter?.institutionId) courses = courses.filter(c => c.relationships.institutionId === filter.institutionId);
    return courses;
  }

  async addModule(twinId: string, module: CourseTwin['content']['modules'][0]): Promise<CourseTwin | null> {
    const course = await this.getCourse(twinId);
    if (!course) return null;
    const updated = CourseModel.addModule(course, module);
    await this.saveCourse(updated);
    return updated;
  }

  async enrollStudent(twinId: string): Promise<CourseTwin | null> {
    const course = await this.getCourse(twinId);
    if (!course) return null;
    const updated = CourseModel.enrollStudent(course);
    await this.saveCourse(updated);
    return updated;
  }

  async getCourseEnrollment(twinId: string): Promise<CourseTwin['enrollment'] | null> {
    const course = await this.getCourse(twinId);
    return course ? course.enrollment : null;
  }

  private async saveCourse(course: CourseTwin): Promise<void> {
    this.courses.set(course.twinId, course);
    await this.setCache(course.twinId, course);
  }

  private async getFromCache(twinId: string): Promise<CourseTwin | null> {
    if (!this.redisClient) return null;
    try { const cached = await this.redisClient.get(`course:${twinId}`); return cached ? JSON.parse(cached) : null; } catch { return null; }
  }

  private async setCache(twinId: string, course: CourseTwin): Promise<void> {
    if (!this.redisClient) return;
    try { await this.redisClient.setEx(`course:${twinId}`, 3600, JSON.stringify(course)); } catch {}
  }

  private async invalidateCache(twinId: string): Promise<void> {
    if (!this.redisClient) return;
    try { await this.redisClient.del(`course:${twinId}`); } catch {}
  }

  async close(): Promise<void> { if (this.redisClient) await this.redisClient.quit(); }
}
''', '''import { Router, Request, Response } from 'express';
import { CourseService } from '../services/course.service';
import { validateCreateCourse } from '../schemas/course.schema';

const router = Router();
const courseService = new CourseService(process.env.REDIS_URL);

export function getCourseRouter() { return router; }

router.post('/', async (req: Request, res: Response) => {
  try {
    const valid = validateCreateCourse(req.body);
    if (!valid) return res.status(400).json({ errors: validateCreateCourse.errors });
    const course = await courseService.createCourse(req.body);
    return res.status(201).json(course);
  } catch (error: any) { return res.status(400).json({ error: error.message }); }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.level) filter.level = req.query.level;
    if (req.query.institutionId) filter.institutionId = req.query.institutionId;
    const courses = await courseService.listCourses(filter);
    return res.json({ courses, count: courses.length });
  } catch (error: any) { return res.status(500).json({ error: error.message }); }
});

router.get('/:twinId', async (req: Request, res: Response) => {
  try {
    const course = await courseService.getCourse(req.params.twinId);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    return res.json(course);
  } catch (error: any) { return res.status(500).json({ error: error.message }); }
});

router.put('/:twinId', async (req: Request, res: Response) => {
  try {
    const course = await courseService.updateCourse(req.params.twinId, req.body);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    return res.json(course);
  } catch (error: any) { return res.status(400).json({ error: error.message }); }
});

router.delete('/:twinId', async (req: Request, res: Response) => {
  try {
    const deleted = await courseService.deleteCourse(req.params.twinId);
    if (!deleted) return res.status(404).json({ error: 'Course not found' });
    return res.status(204).send();
  } catch (error: any) { return res.status(500).json({ error: error.message }); }
});

router.post('/:twinId/modules', async (req: Request, res: Response) => {
  try {
    const course = await courseService.addModule(req.params.twinId, req.body);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    return res.json(course);
  } catch (error: any) { return res.status(400).json({ error: error.message }); }
});

router.post('/:twinId/enroll', async (req: Request, res: Response) => {
  try {
    const course = await courseService.enrollStudent(req.params.twinId);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    return res.json(course);
  } catch (error: any) { return res.status(400).json({ error: error.message }); }
});

router.get('/:twinId/enrollment', async (req: Request, res: Response) => {
  try {
    const enrollment = await courseService.getCourseEnrollment(req.params.twinId);
    if (!enrollment) return res.status(404).json({ error: 'Course not found' });
    return res.json(enrollment);
  } catch (error: any) { return res.status(500).json({ error: error.message }); }
});

export { courseService };
''', '''import express from 'express';
import { getCourseRouter } from './routes/course.routes';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info', format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const app = express();
const PORT = process.env.COURSE_TWIN_PORT || 4553;

app.use(express.json());
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'course-twin', timestamp: new Date().toISOString() }));
app.use('/api/v1/courses', getCourseRouter());
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack }); res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, () => logger.info(`Course twin service running on port ${PORT}`));
process.on('SIGTERM', () => { server.close(() => process.exit(0)); });
process.on('SIGINT', () => { server.close(() => process.exit(0)); });

export { app };
''')

def create_institution_twin():
    return '''import Ajv from 'ajv';
const ajv = new Ajv({ allErrors: true });

export interface Address { street: string; city: string; state: string; zipCode: string; country: string; }
export interface Accreditation { body: string; year: number; validUntil?: string; }
export interface Department { id: string; name: string; headId: string; staffCount: number; }
export interface Program { id: string; name: string; type: 'academic' | 'vocational' | 'corporate'; duration: number; }
export interface Facility { id: string; name: string; type: string; capacity: number; }

export interface InstitutionTwin {
  twinId: string; merchantId: string; createdAt: string; updatedAt: string;
  identity: {
    name: { legal: string; display: string; acronym: string; };
    type: 'school' | 'college' | 'university' | 'training_center' | 'corporate';
    contact: { address: Address; phone: string; email: string; website: string; };
    accreditations: Accreditation[]; established: string;
  };
  structure: { departments: Department[]; programs: Program[]; facilities: Facility[]; policies: string[]; };
  people: {
    students: { total: number; active: number; byLevel: Record<string, number>; };
    staff: { total: number; teachers: number; admin: number; support: number; };
    leadership: { principal: string; heads: Record<string, string>; };
  };
  programs: { academic: Program[]; vocational: Program[]; corporate: Program[]; online: Program[]; };
  performance: {
    studentOutcomes: { avgGPA: number; passRate: number; graduationRate: number; placementRate: number; };
    reputation: { brandPulseScore: number; reviewsCount: number; avgRating: number; ranking: number; };
    financial: { revenue: number; expenses: number; scholarships: number; enrollmentRevenue: number; };
  };
  integrations: { erp: string | null; lms: string | null; payment: string | null; communication: string[]; };
  relationships: { partners: string[]; employers: string[]; vendors: string[]; alumni: string[]; };
  financial: { walletBalance: number; revenueShare: number; pendingPayouts: number; };
  metadata: { createdAt: string; status: 'active' | 'inactive' | 'suspended'; tier: 'basic' | 'professional' | 'enterprise'; };
}

export const createInstitutionSchema = {
  type: 'object', required: ['identity', 'metadata'],
  properties: {
    identity: {
      type: 'object', required: ['name', 'type', 'contact'],
      properties: {
        name: { type: 'object', properties: { legal: { type: 'string' }, display: { type: 'string' }, acronym: { type: 'string' } } },
        type: { type: 'string', enum: ['school', 'college', 'university', 'training_center', 'corporate'] },
        contact: { type: 'object', properties: { address: { type: 'object' }, phone: { type: 'string' }, email: { type: 'string' }, website: { type: 'string' } } },
        accreditations: { type: 'array', items: { type: 'object' } }, established: { type: 'string' }
      }
    },
    metadata: { type: 'object', properties: { status: { type: 'string', enum: ['active', 'inactive', 'suspended'] }, tier: { type: 'string', enum: ['basic', 'professional', 'enterprise'] } } }
  }
};
export const validateCreateInstitution = ajv.compile(createInstitutionSchema);
''', '''import { v4 as uuidv4 } from 'uuid';
import { InstitutionTwin } from '../schemas/institution.schema';

export class InstitutionModel {
  static createInstitution(data: { identity: InstitutionTwin['identity']; metadata: InstitutionTwin['metadata'] }): InstitutionTwin {
    const now = new Date().toISOString();
    return {
      twinId: `institution_${uuidv4()}`,
      merchantId: uuidv4(),
      createdAt: now, updatedAt: now,
      identity: {
        name: { legal: data.identity.name.legal, display: data.identity.name.display || data.identity.name.legal, acronym: data.identity.name.acronym || '' },
        type: data.identity.type, contact: data.identity.contact || { address: { street: '', city: '', state: '', zipCode: '', country: '' }, phone: '', email: '', website: '' },
        accreditations: data.identity.accreditations || [], established: data.identity.established || ''
      },
      structure: { departments: [], programs: [], facilities: [], policies: [] },
      people: { students: { total: 0, active: 0, byLevel: {} }, staff: { total: 0, teachers: 0, admin: 0, support: 0 }, leadership: { principal: '', heads: {} } },
      programs: { academic: [], vocational: [], corporate: [], online: [] },
      performance: { studentOutcomes: { avgGPA: 0, passRate: 0, graduationRate: 0, placementRate: 0 }, reputation: { brandPulseScore: 0, reviewsCount: 0, avgRating: 0, ranking: 0 }, financial: { revenue: 0, expenses: 0, scholarships: 0, enrollmentRevenue: 0 } },
      integrations: { erp: null, lms: null, payment: null, communication: [] },
      relationships: { partners: [], employers: [], vendors: [], alumni: [] },
      financial: { walletBalance: 0, revenueShare: 0, pendingPayouts: 0 },
      metadata: { createdAt: now, status: data.metadata.status || 'active', tier: data.metadata.tier || 'basic' }
    };
  }

  static updateInstitution(inst: InstitutionTwin, updates: Partial<InstitutionTwin>): InstitutionTwin {
    return { ...inst, ...updates, twinId: inst.twinId, merchantId: inst.merchantId, createdAt: inst.createdAt, updatedAt: new Date().toISOString() };
  }

  static addStudent(inst: InstitutionTwin): InstitutionTwin {
    return { ...inst, people: { ...inst.people, students: { ...inst.people.students, total: inst.people.students.total + 1, active: inst.people.students.active + 1 } }, updatedAt: new Date().toISOString() };
  }

  static updatePerformance(inst: InstitutionTwin, perf: Partial<InstitutionTwin['performance']>): InstitutionTwin {
    return { ...inst, performance: { studentOutcomes: { ...inst.performance.studentOutcomes, ...perf.studentOutcomes }, reputation: { ...inst.performance.reputation, ...perf.reputation }, financial: { ...inst.performance.financial, ...perf.financial } }, updatedAt: new Date().toISOString() };
  }

  static addDepartment(inst: InstitutionTwin, dept: InstitutionTwin['structure']['departments'][0]): InstitutionTwin {
    return { ...inst, structure: { ...inst.structure, departments: [...inst.structure.departments, dept] }, updatedAt: new Date().toISOString() };
  }
}
''', '''import { InstitutionTwin } from '../schemas/institution.schema';
import { InstitutionModel } from '../models/institution.model';
import Redis from 'redis';
import winston from 'winston';

const logger = winston.createLogger({ level: 'info', format: winston.format.combine(winston.format.timestamp(), winston.format.json()), transports: [new winston.transports.Console()] });

export class InstitutionService {
  private redisClient: Redis.RedisType | null = null;
  private institutions: Map<string, InstitutionTwin> = new Map();

  constructor(redisUrl?: string) { if (redisUrl) this.redisClient = Redis.createClient({ url: redisUrl }); }

  async initialize(): Promise<void> { if (this.redisClient) await this.redisClient.connect(); logger.info('Institution twin service initialized'); }

  async createInstitution(data: { identity: InstitutionTwin['identity']; metadata: InstitutionTwin['metadata'] }): Promise<InstitutionTwin> {
    const inst = InstitutionModel.createInstitution(data);
    await this.saveInstitution(inst);
    logger.info(`Created institution twin: ${inst.twinId}`);
    return inst;
  }

  async getInstitution(twinId: string): Promise<InstitutionTwin | null> {
    const cached = await this.getFromCache(twinId);
    if (cached) return cached;
    const inst = this.institutions.get(twinId);
    if (inst) { await this.setCache(twinId, inst); return inst; }
    return null;
  }

  async updateInstitution(twinId: string, updates: Partial<InstitutionTwin>): Promise<InstitutionTwin | null> {
    const inst = await this.getInstitution(twinId);
    if (!inst) return null;
    const updated = InstitutionModel.updateInstitution(inst, updates);
    await this.saveInstitution(updated);
    return updated;
  }

  async deleteInstitution(twinId: string): Promise<boolean> {
    const existed = this.institutions.has(twinId);
    if (existed) { this.institutions.delete(twinId); await this.invalidateCache(twinId); }
    return existed;
  }

  async listInstitutions(filter?: { status?: string; type?: string }): Promise<InstitutionTwin[]> {
    let insts = Array.from(this.institutions.values());
    if (filter?.status) insts = insts.filter(i => i.metadata.status === filter.status);
    if (filter?.type) insts = insts.filter(i => i.identity.type === filter.type);
    return insts;
  }

  async addDepartment(twinId: string, dept: InstitutionTwin['structure']['departments'][0]): Promise<InstitutionTwin | null> {
    const inst = await this.getInstitution(twinId);
    if (!inst) return null;
    const updated = InstitutionModel.addDepartment(inst, dept);
    await this.saveInstitution(updated);
    return updated;
  }

  async getInstitutionPerformance(twinId: string): Promise<InstitutionTwin['performance'] | null> {
    const inst = await this.getInstitution(twinId);
    return inst ? inst.performance : null;
  }

  private async saveInstitution(inst: InstitutionTwin): Promise<void> {
    this.institutions.set(inst.twinId, inst);
    await this.setCache(inst.twinId, inst);
  }

  private async getFromCache(twinId: string): Promise<InstitutionTwin | null> {
    if (!this.redisClient) return null;
    try { const cached = await this.redisClient.get(`institution:${twinId}`); return cached ? JSON.parse(cached) : null; } catch { return null; }
  }

  private async setCache(twinId: string, inst: InstitutionTwin): Promise<void> {
    if (!this.redisClient) return;
    try { await this.redisClient.setEx(`institution:${twinId}`, 3600, JSON.stringify(inst)); } catch {}
  }

  private async invalidateCache(twinId: string): Promise<void> {
    if (!this.redisClient) return;
    try { await this.redisClient.del(`institution:${twinId}`); } catch {}
  }

  async close(): Promise<void> { if (this.redisClient) await this.redisClient.quit(); }
}
''', '''import { Router, Request, Response } from 'express';
import { InstitutionService } from '../services/institution.service';
import { validateCreateInstitution } from '../schemas/institution.schema';

const router = Router();
const institutionService = new InstitutionService(process.env.REDIS_URL);

export function getInstitutionRouter() { return router; }

router.post('/', async (req: Request, res: Response) => {
  try {
    const valid = validateCreateInstitution(req.body);
    if (!valid) return res.status(400).json({ errors: validateCreateInstitution.errors });
    const inst = await institutionService.createInstitution(req.body);
    return res.status(201).json(inst);
  } catch (error: any) { return res.status(400).json({ error: error.message }); }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;
    const institutions = await institutionService.listInstitutions(filter);
    return res.json({ institutions, count: institutions.length });
  } catch (error: any) { return res.status(500).json({ error: error.message }); }
});

router.get('/:twinId', async (req: Request, res: Response) => {
  try {
    const inst = await institutionService.getInstitution(req.params.twinId);
    if (!inst) return res.status(404).json({ error: 'Institution not found' });
    return res.json(inst);
  } catch (error: any) { return res.status(500).json({ error: error.message }); }
});

router.put('/:twinId', async (req: Request, res: Response) => {
  try {
    const inst = await institutionService.updateInstitution(req.params.twinId, req.body);
    if (!inst) return res.status(404).json({ error: 'Institution not found' });
    return res.json(inst);
  } catch (error: any) { return res.status(400).json({ error: error.message }); }
});

router.delete('/:twinId', async (req: Request, res: Response) => {
  try {
    const deleted = await institutionService.deleteInstitution(req.params.twinId);
    if (!deleted) return res.status(404).json({ error: 'Institution not found' });
    return res.status(204).send();
  } catch (error: any) { return res.status(500).json({ error: error.message }); }
});

router.post('/:twinId/departments', async (req: Request, res: Response) => {
  try {
    const inst = await institutionService.addDepartment(req.params.twinId, req.body);
    if (!inst) return res.status(404).json({ error: 'Institution not found' });
    return res.json(inst);
  } catch (error: any) { return res.status(400).json({ error: error.message }); }
});

router.get('/:twinId/performance', async (req: Request, res: Response) => {
  try {
    const perf = await institutionService.getInstitutionPerformance(req.params.twinId);
    if (!perf) return res.status(404).json({ error: 'Institution not found' });
    return res.json(perf);
  } catch (error: any) { return res.status(500).json({ error: error.message }); }
});

export { institutionService };
''', '''import express from 'express';
import { getInstitutionRouter } from './routes/institution.routes';
import winston from 'winston';

const logger = winston.createLogger({ level: 'info', format: winston.format.combine(winston.format.timestamp(), winston.format.json()), transports: [new winston.transports.Console()] });

const app = express();
const PORT = process.env.INSTITUTION_TWIN_PORT || 4554;

app.use(express.json());
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'institution-twin', timestamp: new Date().toISOString() }));
app.use('/api/v1/institutions', getInstitutionRouter());
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => { logger.error(`Error: ${err.message}`, { stack: err.stack }); res.status(500).json({ error: 'Internal server error' }); });

const server = app.listen(PORT, () => logger.info(`Institution twin service running on port ${PORT}`));
process.on('SIGTERM', () => { server.close(() => process.exit(0)); });
process.on('SIGINT', () => { server.close(() => process.exit(0)); });

export { app };
''')

def create_curriculum_twin():
    return '''import Ajv from 'ajv';
const ajv = new Ajv({ allErrors: true });

export interface Skill { id: string; name: string; description: string; category: string; level: 'awareness' | 'proficiency' | 'mastery'; assessmentCriteria: string[]; relatedSkills: string[]; industryRelevance: number; }
export interface Competency { id: string; name: string; description: string; required: boolean; assessedBy: string[]; }
export interface CertificationStandard { id: string; name: string; issuer: string; validity: number; }
export interface Stage { order: number; name: string; skills: string[]; courses: string[]; duration: number; assessment: string; }
export interface LearningPathway { id: string; name: string; description: string; duration: number; stages: Stage[]; exitCriteria: string[]; credentials: string[]; }

export interface CurriculumTwin {
  twinId: string; curriculumId: string; createdAt: string; updatedAt: string;
  identity: { name: string; description: string; framework: string; version: string; issuingBody: string; };
  skills: { core: Skill[]; elective: Skill[]; emerging: Skill[]; transversal: Skill[]; };
  competencies: { required: Competency[]; recommended: Competency[]; assessed: string[]; };
  pathways: { academic: LearningPathway | null; vocational: LearningPathway | null; professional: LearningPathway | null; continuous: LearningPathway | null; };
  standards: { certifications: CertificationStandard[]; regulatory: string[]; industry: string[]; };
  relationships: { institutionId: string; courses: string[]; skillsFramework: string; employers: string[]; };
  metadata: { status: 'draft' | 'active' | 'archived'; effectiveFrom: string; reviewCycle: number; lastReviewed: string; };
}

export const createCurriculumSchema = {
  type: 'object', required: ['identity', 'metadata'],
  properties: {
    identity: { type: 'object', required: ['name'], properties: { name: { type: 'string' }, description: { type: 'string' }, framework: { type: 'string' }, version: { type: 'string' }, issuingBody: { type: 'string' } } },
    metadata: { type: 'object', properties: { status: { type: 'string', enum: ['draft', 'active', 'archived'] }, effectiveFrom: { type: 'string' }, reviewCycle: { type: 'number' } } }
  }
};
export const validateCreateCurriculum = ajv.compile(createCurriculumSchema);
''', '''import { v4 as uuidv4 } from 'uuid';
import { CurriculumTwin } from '../schemas/curriculum.schema';

export class CurriculumModel {
  static createCurriculum(data: { identity: CurriculumTwin['identity']; metadata: CurriculumTwin['metadata'] }): CurriculumTwin {
    const now = new Date().toISOString();
    return {
      twinId: `curriculum_${uuidv4()}`,
      curriculumId: uuidv4(),
      createdAt: now, updatedAt: now,
      identity: { name: data.identity.name, description: data.identity.description || '', framework: data.identity.framework || '', version: data.identity.version || '1.0', issuingBody: data.identity.issuingBody || '' },
      skills: { core: [], elective: [], emerging: [], transversal: [] },
      competencies: { required: [], recommended: [], assessed: [] },
      pathways: { academic: null, vocational: null, professional: null, continuous: null },
      standards: { certifications: [], regulatory: [], industry: [] },
      relationships: { institutionId: '', courses: [], skillsFramework: '', employers: [] },
      metadata: { status: data.metadata.status || 'draft', effectiveFrom: data.metadata.effectiveFrom || now, reviewCycle: data.metadata.reviewCycle || 12, lastReviewed: now }
    };
  }

  static updateCurriculum(curr: CurriculumTwin, updates: Partial<CurriculumTwin>): CurriculumTwin {
    return { ...curr, ...updates, twinId: curr.twinId, curriculumId: curr.curriculumId, createdAt: curr.createdAt, updatedAt: new Date().toISOString() };
  }

  static addSkill(curr: CurriculumTwin, skill: CurriculumTwin['skills']['core'][0], type: 'core' | 'elective' | 'emerging' | 'transversal'): CurriculumTwin {
    return { ...curr, skills: { ...curr.skills, [type]: [...curr.skills[type], skill] }, updatedAt: new Date().toISOString() };
  }

  static setPathway(curr: CurriculumTwin, pathwayType: 'academic' | 'vocational' | 'professional' | 'continuous', pathway: CurriculumTwin['pathways']['academic']): CurriculumTwin {
    return { ...curr, pathways: { ...curr.pathways, [pathwayType]: pathway }, updatedAt: new Date().toISOString() };
  }

  static addCompetency(curr: CurriculumTwin, competency: CurriculumTwin['competencies']['required'][0], type: 'required' | 'recommended'): CurriculumTwin {
    const competencies = type === 'required' ? curr.competencies.required : curr.competencies.recommended;
    const updated = [...competencies, competency];
    return { ...curr, competencies: { ...curr.competencies, [type]: updated } };
  }
}
''', '''import { CurriculumTwin } from '../schemas/curriculum.schema';
import { CurriculumModel } from '../models/curriculum.model';
import Redis from 'redis';
import winston from 'winston';

const logger = winston.createLogger({ level: 'info', format: winston.format.combine(winston.format.timestamp(), winston.format.json()), transports: [new winston.transports.Console()] });

export class CurriculumService {
  private redisClient: Redis.RedisType | null = null;
  private curricula: Map<string, CurriculumTwin> = new Map();

  constructor(redisUrl?: string) { if (redisUrl) this.redisClient = Redis.createClient({ url: redisUrl }); }

  async initialize(): Promise<void> { if (this.redisClient) await this.redisClient.connect(); logger.info('Curriculum twin service initialized'); }

  async createCurriculum(data: { identity: CurriculumTwin['identity']; metadata: CurriculumTwin['metadata'] }): Promise<CurriculumTwin> {
    const curr = CurriculumModel.createCurriculum(data);
    await this.saveCurriculum(curr);
    logger.info(`Created curriculum twin: ${curr.twinId}`);
    return curr;
  }

  async getCurriculum(twinId: string): Promise<CurriculumTwin | null> {
    const cached = await this.getFromCache(twinId);
    if (cached) return cached;
    const curr = this.curricula.get(twinId);
    if (curr) { await this.setCache(twinId, curr); return curr; }
    return null;
  }

  async updateCurriculum(twinId: string, updates: Partial<CurriculumTwin>): Promise<CurriculumTwin | null> {
    const curr = await this.getCurriculum(twinId);
    if (!curr) return null;
    const updated = CurriculumModel.updateCurriculum(curr, updates);
    await this.saveCurriculum(updated);
    return updated;
  }

  async deleteCurriculum(twinId: string): Promise<boolean> {
    const existed = this.curricula.has(twinId);
    if (existed) { this.curricula.delete(twinId); await this.invalidateCache(twinId); }
    return existed;
  }

  async listCurricula(filter?: { status?: string; framework?: string }): Promise<CurriculumTwin[]> {
    let curricula = Array.from(this.curricula.values());
    if (filter?.status) curricula = curricula.filter(c => c.metadata.status === filter.status);
    if (filter?.framework) curricula = curricula.filter(c => c.identity.framework === filter.framework);
    return curricula;
  }

  async addSkill(twinId: string, skill: CurriculumTwin['skills']['core'][0], type: 'core' | 'elective' | 'emerging' | 'transversal'): Promise<CurriculumTwin | null> {
    const curr = await this.getCurriculum(twinId);
    if (!curr) return null;
    const updated = CurriculumModel.addSkill(curr, skill, type);
    await this.saveCurriculum(updated);
    return updated;
  }

  async getSkillsSummary(twinId: string): Promise<{ core: number; elective: number; emerging: number; transversal: number; total: number } | null> {
    const curr = await this.getCurriculum(twinId);
    if (!curr) return null;
    return { core: curr.skills.core.length, elective: curr.skills.elective.length, emerging: curr.skills.emerging.length, transversal: curr.skills.transversal.length, total: curr.skills.core.length + curr.skills.elective.length + curr.skills.emerging.length + curr.skills.transversal.length };
  }

  private async saveCurriculum(curr: CurriculumTwin): Promise<void> {
    this.curricula.set(curr.twinId, curr);
    await this.setCache(curr.twinId, curr);
  }

  private async getFromCache(twinId: string): Promise<CurriculumTwin | null> {
    if (!this.redisClient) return null;
    try { const cached = await this.redisClient.get(`curriculum:${twinId}`); return cached ? JSON.parse(cached) : null; } catch { return null; }
  }

  private async setCache(twinId: string, curr: CurriculumTwin): Promise<void> {
    if (!this.redisClient) return;
    try { await this.redisClient.setEx(`curriculum:${twinId}`, 3600, JSON.stringify(curr)); } catch {}
  }

  private async invalidateCache(twinId: string): Promise<void> {
    if (!this.redisClient) return;
    try { await this.redisClient.del(`curriculum:${twinId}`); } catch {}
  }

  async close(): Promise<void> { if (this.redisClient) await this.redisClient.quit(); }
}
''', '''import { Router, Request, Response } from 'express';
import { CurriculumService } from '../services/curriculum.service';
import { validateCreateCurriculum } from '../schemas/curriculum.schema';

const router = Router();
const curriculumService = new CurriculumService(process.env.REDIS_URL);

export function getCurriculumRouter() { return router; }

router.post('/', async (req: Request, res: Response) => {
  try {
    const valid = validateCreateCurriculum(req.body);
    if (!valid) return res.status(400).json({ errors: validateCreateCurriculum.errors });
    const curr = await curriculumService.createCurriculum(req.body);
    return res.status(201).json(curr);
  } catch (error: any) { return res.status(400).json({ error: error.message }); }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.framework) filter.framework = req.query.framework;
    const curricula = await curriculumService.listCurricula(filter);
    return res.json({ curricula, count: curricula.length });
  } catch (error: any) { return res.status(500).json({ error: error.message }); }
});

router.get('/:twinId', async (req: Request, res: Response) => {
  try {
    const curr = await curriculumService.getCurriculum(req.params.twinId);
    if (!curr) return res.status(404).json({ error: 'Curriculum not found' });
    return res.json(curr);
  } catch (error: any) { return res.status(500).json({ error: error.message }); }
});

router.put('/:twinId', async (req: Request, res: Response) => {
  try {
    const curr = await curriculumService.updateCurriculum(req.params.twinId, req.body);
    if (!curr) return res.status(404).json({ error: 'Curriculum not found' });
    return res.json(curr);
  } catch (error: any) { return res.status(400).json({ error: error.message }); }
});

router.delete('/:twinId', async (req: Request, res: Response) => {
  try {
    const deleted = await curriculumService.deleteCurriculum(req.params.twinId);
    if (!deleted) return res.status(404).json({ error: 'Curriculum not found' });
    return res.status(204).send();
  } catch (error: any) { return res.status(500).json({ error: error.message }); }
});

router.post('/:twinId/skills', async (req: Request, res: Response) => {
  try {
    const { skill, type } = req.body;
    const curr = await curriculumService.addSkill(req.params.twinId, skill, type || 'core');
    if (!curr) return res.status(404).json({ error: 'Curriculum not found' });
    return res.json(curr);
  } catch (error: any) { return res.status(400).json({ error: error.message }); }
});

router.get('/:twinId/skills-summary', async (req: Request, res: Response) => {
  try {
    const summary = await curriculumService.getSkillsSummary(req.params.twinId);
    if (!summary) return res.status(404).json({ error: 'Curriculum not found' });
    return res.json(summary);
  } catch (error: any) { return res.status(500).json({ error: error.message }); }
});

export { curriculumService };
''', '''import express from 'express';
import { getCurriculumRouter } from './routes/curriculum.routes';
import winston from 'winston';

const logger = winston.createLogger({ level: 'info', format: winston.format.combine(winston.format.timestamp(), winston.format.json()), transports: [new winston.transports.Console()] });

const app = express();
const PORT = process.env.CURRICULUM_TWIN_PORT || 4555;

app.use(express.json());
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'curriculum-twin', timestamp: new Date().toISOString() }));
app.use('/api/v1/curricula', getCurriculumRouter());
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => { logger.error(`Error: ${err.message}`, { stack: err.stack }); res.status(500).json({ error: 'Internal server error' }); });

const server = app.listen(PORT, () => logger.info(`Curriculum twin service running on port ${PORT}`));
process.on('SIGTERM', () => { server.close(() => process.exit(0)); });
process.on('SIGINT', () => { server.close(() => process.exit(0)); });

export { app };
''')

def create_twin_files(twin_name, files):
    base_path = f"{BASE_PATH}/{twin_name}"
    for file_path, content in files.items():
        full_path = f"{base_path}/{file_path}"
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, 'w') as f:
            f.write(content)
        print(f"Created: {full_path}")

def main():
    print("Generating Teacher Twin...")
    create_twin_files('teacher-twin', {
        'package.json': create_package_json('teacher-twin', 'Digital twin for teacher profile and teaching analytics'),
        'tsconfig.json': create_tsconfig(),
        'src/schemas/teacher.schema.ts': create_teacher_twin()[0],
        'src/models/teacher.model.ts': create_teacher_twin()[1],
        'src/services/teacher.service.ts': create_teacher_twin()[2],
        'src/routes/teacher.routes.ts': create_teacher_twin()[3],
        'src/index.ts': create_teacher_twin()[4],
    })

    print("Generating Course Twin...")
    create_twin_files('course-twin', {
        'package.json': create_package_json('course-twin', 'Digital twin for course content and enrollment tracking'),
        'tsconfig.json': create_tsconfig(),
        'src/schemas/course.schema.ts': create_course_twin()[0],
        'src/models/course.model.ts': create_course_twin()[1],
        'src/services/course.service.ts': create_course_twin()[2],
        'src/routes/course.routes.ts': create_course_twin()[3],
        'src/index.ts': create_course_twin()[4],
    })

    print("Generating Institution Twin...")
    create_twin_files('institution-twin', {
        'package.json': create_package_json('institution-twin', 'Digital twin for institution profile and analytics'),
        'tsconfig.json': create_tsconfig(),
        'src/schemas/institution.schema.ts': create_institution_twin()[0],
        'src/models/institution.model.ts': create_institution_twin()[1],
        'src/services/institution.service.ts': create_institution_twin()[2],
        'src/routes/institution.routes.ts': create_institution_twin()[3],
        'src/index.ts': create_institution_twin()[4],
    })

    print("Generating Curriculum Twin...")
    create_twin_files('curriculum-twin', {
        'package.json': create_package_json('curriculum-twin', 'Digital twin for curriculum and skill mapping'),
        'tsconfig.json': create_tsconfig(),
        'src/schemas/curriculum.schema.ts': create_curriculum_twin()[0],
        'src/models/curriculum.model.ts': create_curriculum_twin()[1],
        'src/services/curriculum.service.ts': create_curriculum_twin()[2],
        'src/routes/curriculum.routes.ts': create_curriculum_twin()[3],
        'src/index.ts': create_curriculum_twin()[4],
    })

    print("All twin services generated successfully!")

if __name__ == '__main__':
    main()
