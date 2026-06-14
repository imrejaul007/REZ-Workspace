import { logger } from '../../shared/logger';
/**
 * RisaCare LMS Service
 * Port: 4744 - Learning Management System for healthcare training
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const PORT = process.env.PORT || 4744;
const app: Express = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

// Types
interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number; // minutes
  modules: Module[];
  enrollmentCount: number;
  rating: number;
  createdBy: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
}

interface Module {
  id: string;
  title: string;
  type: 'video' | 'text' | 'quiz' | 'assignment';
  content: string;
  duration: number;
  order: number;
}

interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  progress: number; // percentage
  status: 'not_started' | 'in_progress' | 'completed';
  startedAt: Date;
  completedAt?: Date;
  lastAccessedAt: Date;
}

interface Assessment {
  id: string;
  courseId: string;
  title: string;
  questions: Question[];
  passingScore: number;
  timeLimit?: number; // minutes
}

interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer: string | number;
  points: number;
}

interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  issuedAt: Date;
  certificateNumber: string;
}

// In-memory storage
const courses: Map<string, Course> = new Map();
const enrollments: Map<string, Enrollment> = new Map();
const assessments: Map<string, Assessment> = new Map();
const certificates: Map<string, Certificate> = new Map();
const userProgress: Map<string, { courseId: string; moduleId: string; completed: boolean }[]> = new Map();

// Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'lms', version: '1.0.0' });
});

// ==================== COURSES ====================

app.post('/api/courses', (req: Request, res: Response) => {
  const { title, description, category, duration, modules, createdBy } = req.body;

  if (!title || !category) {
    return res.status(400).json({ error: 'title and category are required' });
  }

  const course: Course = {
    id: uuidv4(),
    title,
    description: description || '',
    category,
    duration: duration || 0,
    modules: modules || [],
    enrollmentCount: 0,
    rating: 0,
    createdBy: createdBy || 'system',
    status: 'draft',
    createdAt: new Date()
  };

  courses.set(course.id, course);
  res.status(201).json({ course });
});

app.get('/api/courses', (req: Request, res: Response) => {
  const { category, status, search } = req.query;
  let courseList = Array.from(courses.values());

  if (category) {
    courseList = courseList.filter(c => c.category === category);
  }
  if (status) {
    courseList = courseList.filter(c => c.status === status);
  }
  if (search) {
    const query = (search as string).toLowerCase();
    courseList = courseList.filter(c =>
      c.title.toLowerCase().includes(query) ||
      c.description.toLowerCase().includes(query)
    );
  }

  res.json({ courses: courseList, count: courseList.length });
});

app.get('/api/courses/:id', (req: Request, res: Response) => {
  const course = courses.get(req.params.id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }
  res.json({ course });
});

app.put('/api/courses/:id', (req: Request, res: Response) => {
  const course = courses.get(req.params.id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const { title, description, modules, status } = req.body;

  if (title) course.title = title;
  if (description) course.description = description;
  if (modules) course.modules = modules;
  if (status) course.status = status;

  courses.set(course.id, course);
  res.json({ course });
});

app.delete('/api/courses/:id', (req: Request, res: Response) => {
  const deleted = courses.delete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Course not found' });
  }
  res.json({ success: true });
});

// ==================== ENROLLMENTS ====================

app.post('/api/enroll', (req: Request, res: Response) => {
  const { userId, courseId } = req.body;

  if (!userId || !courseId) {
    return res.status(400).json({ error: 'userId and courseId are required' });
  }

  const course = courses.get(courseId);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  // Check if already enrolled
  const existing = Array.from(enrollments.values())
    .find(e => e.userId === userId && e.courseId === courseId);
  if (existing) {
    return res.status(400).json({ error: 'Already enrolled', enrollment: existing });
  }

  const enrollment: Enrollment = {
    id: uuidv4(),
    userId,
    courseId,
    progress: 0,
    status: 'not_started',
    startedAt: new Date(),
    lastAccessedAt: new Date()
  };

  enrollments.set(enrollment.id, enrollment);

  // Update course enrollment count
  course.enrollmentCount++;
  courses.set(course.id, course);

  res.status(201).json({ enrollment });
});

app.get('/api/enrollments/user/:userId', (req: Request, res: Response) => {
  const userEnrollments = Array.from(enrollments.values())
    .filter(e => e.userId === req.params.userId)
    .map(e => {
      const course = courses.get(e.courseId);
      return { ...e, course };
    });

  res.json({ enrollments: userEnrollments, count: userEnrollments.length });
});

app.get('/api/enrollments/course/:courseId', (req: Request, res: Response) => {
  const courseEnrollments = Array.from(enrollments.values())
    .filter(e => e.courseId === req.params.courseId);

  res.json({ enrollments: courseEnrollments, count: courseEnrollments.length });
});

app.put('/api/enrollments/:id/progress', (req: Request, res: Response) => {
  const enrollment = enrollments.get(req.params.id);
  if (!enrollment) {
    return res.status(404).json({ error: 'Enrollment not found' });
  }

  const { moduleId, completed } = req.body;

  // Track module progress
  const progressKey = `${enrollment.userId}-${enrollment.courseId}`;
  if (!userProgress.has(progressKey)) {
    userProgress.set(progressKey, []);
  }

  const progress = userProgress.get(progressKey)!;
  const existingIndex = progress.findIndex(p => p.moduleId === moduleId);

  if (existingIndex >= 0) {
    progress[existingIndex].completed = completed || true;
  } else {
    progress.push({ courseId: enrollment.courseId, moduleId, completed: completed || true });
  }

  // Calculate overall progress
  const course = courses.get(enrollment.courseId);
  if (course && course.modules.length > 0) {
    const completedModules = progress.filter(p => p.completed).length;
    enrollment.progress = Math.round((completedModules / course.modules.length) * 100);
    enrollment.lastAccessedAt = new Date();

    if (enrollment.progress === 100) {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
    } else if (enrollment.progress > 0) {
      enrollment.status = 'in_progress';
    }
  }

  enrollments.set(enrollment.id, enrollment);
  res.json({ enrollment });
});

// ==================== ASSESSMENTS ====================

app.post('/api/assessments', (req: Request, res: Response) => {
  const { courseId, title, questions, passingScore, timeLimit } = req.body;

  if (!courseId || !title || !questions) {
    return res.status(400).json({ error: 'courseId, title, and questions are required' });
  }

  const assessment: Assessment = {
    id: uuidv4(),
    courseId,
    title,
    questions,
    passingScore: passingScore || 70,
    timeLimit
  };

  assessments.set(assessment.id, assessment);
  res.status(201).json({ assessment });
});

app.get('/api/assessments/:id', (req: Request, res: Response) => {
  const assessment = assessments.get(req.params.id);
  if (!assessment) {
    return res.status(404).json({ error: 'Assessment not found' });
  }
  res.json({ assessment });
});

app.post('/api/assessments/:id/submit', (req: Request, res: Response) => {
  const assessment = assessments.get(req.params.id);
  if (!assessment) {
    return res.status(404).json({ error: 'Assessment not found' });
  }

  const { userId, answers } = req.body;

  // Calculate score
  let earnedPoints = 0;
  let totalPoints = 0;

  for (const question of assessment.questions) {
    totalPoints += question.points;
    const userAnswer = answers[question.id];
    if (userAnswer === question.correctAnswer) {
      earnedPoints += question.points;
    }
  }

  const scorePercent = totalPoints > 0 ? (earnedPoints / totalPoints * 100) : 0;
  const passed = scorePercent >= assessment.passingScore;

  res.json({
    score: earnedPoints,
    totalPoints,
    percentage: scorePercent.toFixed(1) + '%',
    passed,
    message: passed ? 'Congratulations! You passed.' : 'You did not pass. Please try again.'
  });
});

// ==================== CERTIFICATES ====================

app.post('/api/certificates/issue', (req: Request, res: Response) => {
  const { userId, courseId } = req.body;

  const enrollment = Array.from(enrollments.values())
    .find(e => e.userId === userId && e.courseId === courseId);

  if (!enrollment || enrollment.status !== 'completed') {
    return res.status(400).json({ error: 'Course not completed' });
  }

  // Check if certificate already exists
  const existing = Array.from(certificates.values())
    .find(c => c.userId === userId && c.courseId === courseId);
  if (existing) {
    return res.json({ certificate: existing, message: 'Certificate already issued' });
  }

  const certificate: Certificate = {
    id: uuidv4(),
    userId,
    courseId,
    issuedAt: new Date(),
    certificateNumber: `CERT-${Date.now().toString(36).toUpperCase()}`
  };

  certificates.set(certificate.id, certificate);
  res.status(201).json({ certificate });
});

app.get('/api/certificates/:id', (req: Request, res: Response) => {
  const certificate = certificates.get(req.params.id);
  if (!certificate) {
    return res.status(404).json({ error: 'Certificate not found' });
  }

  const course = courses.get(certificate.courseId);
  res.json({ certificate, course });
});

app.get('/api/certificates/user/:userId', (req: Request, res: Response) => {
  const userCerts = Array.from(certificates.values())
    .filter(c => c.userId === req.params.userId)
    .map(c => {
      const course = courses.get(c.courseId);
      return { ...c, course };
    });

  res.json({ certificates: userCerts, count: userCerts.length });
});

// ==================== STATISTICS ====================

app.get('/api/stats', (_req: Request, res: Response) => {
  res.json({
    totalCourses: courses.size,
    publishedCourses: Array.from(courses.values()).filter(c => c.status === 'published').length,
    totalEnrollments: enrollments.size,
    completedEnrollments: Array.from(enrollments.values()).filter(e => e.status === 'completed').length,
    totalCertificates: certificates.size,
    avgProgress: enrollments.size ?
      Array.from(enrollments.values()).reduce((sum, e) => sum + e.progress, 0) / enrollments.size : 0
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  logger.info(`RisaCare LMS Service running on port ${PORT}`);
});

export default app;