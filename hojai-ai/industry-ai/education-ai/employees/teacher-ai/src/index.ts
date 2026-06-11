/**
 * Teacher AI Agent
 * Industry: Education
 * Role: Manages teaching, lesson planning, grading, and student engagement
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import http from 'http';

const app = express();
const PORT = 4052;
const COURSE_SERVICE_URL = 'http://localhost:4051';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

app.use(cors());
app.use(express.json());

// Types
interface LessonPlan {
  id: string;
  courseId: string;
  topic: string;
  objectives: string[];
  activities: string[];
  materials: string[];
  duration: number;
  createdAt: Date;
}

interface Grade {
  id: string;
  studentId: string;
  assignmentId: string;
  points: number;
  maxPoints: number;
  feedback: string;
  gradedAt: Date;
}

interface Quiz {
  id: string;
  courseId: string;
  title: string;
  questions: QuizQuestion[];
  timeLimit: number;
  passingScore: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  points: number;
}

interface AttendanceRecord {
  id: string;
  courseId: string;
  date: string;
  present: string[];
  absent: string[];
}

// In-memory storage
const lessonPlans = new Map<string, LessonPlan>();
const grades = new Map<string, Grade>();
const quizzes = new Map<string, Quiz>();
const attendanceRecords = new Map<string, AttendanceRecord>();

// Helper functions
async function callCourseService(method: string, path: string, body?: object): Promise<any> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4051,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function generateLessonPlan(courseId: string, topic: string): LessonPlan {
  const id = uuidv4();
  const plan: LessonPlan = {
    id,
    courseId,
    topic,
    objectives: [
      `Understand the fundamental concepts of ${topic}`,
      `Apply ${topic} principles to real-world scenarios`,
      `Analyze and evaluate ${topic} applications`
    ],
    activities: [
      'Interactive lecture with visual aids',
      'Group discussion on key concepts',
      'Hands-on practice exercises',
      'Q&A session to clarify doubts'
    ],
    materials: [
      'Textbook chapter on ' + topic,
      'Supplementary reading materials',
      'Online resource links',
      'Practice worksheets'
    ],
    duration: 90,
    createdAt: new Date()
  };

  lessonPlans.set(id, plan);
  return plan;
}

function calculateLetterGrade(percentage: number): string {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

function generateQuiz(courseId: string, topic: string, numQuestions: number = 5): Quiz {
  const id = uuidv4();
  const questions: QuizQuestion[] = [];

  for (let i = 0; i < numQuestions; i++) {
    questions.push({
      id: uuidv4(),
      question: `Question ${i + 1}: What is the primary purpose of ${topic}?`,
      options: [
        `Option A: Application of ${topic}`,
        `Option B: Theory behind ${topic}`,
        `Option C: History of ${topic}`,
        `Option D: All of the above`
      ],
      correctAnswer: 3,
      points: 20
    });
  }

  const quiz: Quiz = {
    id,
    courseId,
    title: `${topic} Assessment Quiz`,
    questions,
    timeLimit: 30,
    passingScore: 70
  };

  quizzes.set(id, quiz);
  return quiz;
}

// Routes

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    agent: 'teacher-ai',
    role: 'Teaching & Instruction',
    version: '1.0.0'
  });
});

// Lesson Plan routes
app.post('/api/lesson-plans', (req: Request, res: Response) => {
  try {
    const { courseId, topic } = req.body;

    if (!courseId || !topic) {
      return res.status(400).json({ error: 'Course ID and topic are required' });
    }

    const plan = generateLessonPlan(courseId, topic);
    logger.info(`Lesson plan generated for topic: ${topic}`);

    res.status(201).json(plan);
  } catch (error) {
    logger.error('Error generating lesson plan:', error);
    res.status(500).json({ error: 'Failed to generate lesson plan' });
  }
});

app.get('/api/lesson-plans', (req: Request, res: Response) => {
  const plans = Array.from(lessonPlans.values());
  res.json(plans);
});

app.get('/api/lesson-plans/:id', (req: Request, res: Response) => {
  const plan = lessonPlans.get(req.params.id);
  if (!plan) {
    return res.status(404).json({ error: 'Lesson plan not found' });
  }
  res.json(plan);
});

app.get('/api/courses/:courseId/lesson-plans', (req: Request, res: Response) => {
  const plans = Array.from(lessonPlans.values())
    .filter(p => p.courseId === req.params.courseId);
  res.json(plans);
});

// Grading routes
app.post('/api/grades', (req: Request, res: Response) => {
  try {
    const { studentId, assignmentId, points, maxPoints, feedback } = req.body;

    if (!studentId || !assignmentId || points === undefined) {
      return res.status(400).json({ error: 'Student ID, assignment ID, and points are required' });
    }

    const id = uuidv4();
    const grade: Grade = {
      id,
      studentId,
      assignmentId,
      points,
      maxPoints: maxPoints || 100,
      feedback: feedback || 'Good work!',
      gradedAt: new Date()
    };

    grades.set(id, grade);
    logger.info(`Grade recorded for student ${studentId}: ${points}/${maxPoints || 100}`);

    res.status(201).json(grade);
  } catch (error) {
    logger.error('Error recording grade:', error);
    res.status(500).json({ error: 'Failed to record grade' });
  }
});

app.get('/api/grades', (req: Request, res: Response) => {
  const gradeList = Array.from(grades.values());
  res.json(gradeList);
});

app.get('/api/students/:studentId/grades', (req: Request, res: Response) => {
  const studentGrades = Array.from(grades.values())
    .filter(g => g.studentId === req.params.studentId);

  const totalPoints = studentGrades.reduce((sum, g) => sum + g.points, 0);
  const totalMax = studentGrades.reduce((sum, g) => sum + g.maxPoints, 0);
  const percentage = totalMax > 0 ? Math.round((totalPoints / totalMax) * 100) : 0;

  res.json({
    grades: studentGrades,
    average: percentage,
    letterGrade: calculateLetterGrade(percentage)
  });
});

app.get('/api/courses/:courseId/grades', (req: Request, res: Response) => {
  const courseGrades = Array.from(grades.values())
    .filter(g => g.assignmentId.includes(req.params.courseId) || true);
  res.json(courseGrades);
});

// Quiz routes
app.post('/api/quizzes', (req: Request, res: Response) => {
  try {
    const { courseId, topic, numQuestions } = req.body;

    if (!courseId || !topic) {
      return res.status(400).json({ error: 'Course ID and topic are required' });
    }

    const quiz = generateQuiz(courseId, topic, numQuestions || 5);
    logger.info(`Quiz generated for course ${courseId}: ${topic}`);

    res.status(201).json(quiz);
  } catch (error) {
    logger.error('Error generating quiz:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

app.get('/api/quizzes/:id', (req: Request, res: Response) => {
  const quiz = quizzes.get(req.params.id);
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }
  res.json(quiz);
});

app.post('/api/quizzes/:id/grade', (req: Request, res: Response) => {
  try {
    const quiz = quizzes.get(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const { answers } = req.body;
    if (!answers) {
      return res.status(400).json({ error: 'Answers are required' });
    }

    let totalScore = 0;
    let maxScore = 0;

    quiz.questions.forEach((q, index) => {
      maxScore += q.points;
      if (answers[index] === q.correctAnswer) {
        totalScore += q.points;
      }
    });

    const percentage = Math.round((totalScore / maxScore) * 100);
    const passed = percentage >= quiz.passingScore;

    res.json({
      quizId: quiz.id,
      score: totalScore,
      maxScore,
      percentage,
      passed,
      letterGrade: calculateLetterGrade(percentage),
      feedback: passed ? 'Great job!' : 'Keep studying and try again.'
    });
  } catch (error) {
    logger.error('Error grading quiz:', error);
    res.status(500).json({ error: 'Failed to grade quiz' });
  }
});

// Attendance routes
app.post('/api/attendance', (req: Request, res: Response) => {
  try {
    const { courseId, date, present, absent } = req.body;

    if (!courseId || !date) {
      return res.status(400).json({ error: 'Course ID and date are required' });
    }

    const id = uuidv4();
    const record: AttendanceRecord = {
      id,
      courseId,
      date,
      present: present || [],
      absent: absent || []
    };

    attendanceRecords.set(id, record);
    logger.info(`Attendance recorded for course ${courseId} on ${date}`);

    res.status(201).json(record);
  } catch (error) {
    logger.error('Error recording attendance:', error);
    res.status(500).json({ error: 'Failed to record attendance' });
  }
});

app.get('/api/attendance', (req: Request, res: Response) => {
  const records = Array.from(attendanceRecords.values());
  res.json(records);
});

app.get('/api/courses/:courseId/attendance', (req: Request, res: Response) => {
  const records = Array.from(attendanceRecords.values())
    .filter(r => r.courseId === req.params.courseId);
  res.json(records);
});

// Teaching insights
app.get('/api/insights', (req: Request, res: Response) => {
  const allPlans = Array.from(lessonPlans.values());
  const allGrades = Array.from(grades.values());
  const allQuizzes = Array.from(quizzes.values());

  res.json({
    lessonPlansCreated: allPlans.length,
    gradesRecorded: allGrades.length,
    quizzesGenerated: allQuizzes.length,
    averageGrade: calculateAverageGrade(allGrades),
    topTopics: allPlans.map(p => p.topic).slice(0, 5)
  });
});

function calculateAverageGrade(gradeList: Grade[]): number {
  if (gradeList.length === 0) return 0;
  const total = gradeList.reduce((sum, g) => sum + (g.points / g.maxPoints) * 100, 0);
  return Math.round((total / gradeList.length) * 10) / 10;
}

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`Teacher AI agent running on port ${PORT}`);
  logger.info('Role: Teaching & Instruction Management');
  logger.info('Endpoints:');
  logger.info('  - POST /api/lesson-plans - Generate lesson plan');
  logger.info('  - POST /api/grades - Record grade');
  logger.info('  - GET /api/students/:id/grades - Get student grades');
  logger.info('  - POST /api/quizzes - Generate quiz');
  logger.info('  - POST /api/quizzes/:id/grade - Grade quiz');
  logger.info('  - POST /api/attendance - Record attendance');
});

export default app;
