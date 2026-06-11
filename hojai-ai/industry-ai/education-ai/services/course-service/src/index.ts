/**
 * Course Service
 * Industry: Education
 * Role: Course management, scheduling, content delivery, curriculum management
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const app = express();
const PORT = process.env.PORT || 4071;

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
interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  department: string;
  credits: number;
  level: 'undergraduate' | 'graduate' | 'professional';
  instructor: string;
  schedule: Schedule;
  capacity: number;
  enrolledCount: number;
  prerequisites: string[];
  learningOutcomes: string[];
  materials: CourseMaterial[];
  assessments: Assessment[];
  status: 'draft' | 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

interface Schedule {
  days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[];
  startTime: string;
  endTime: string;
  location: string;
  type: 'lecture' | 'lab' | 'seminar' | 'online' | 'hybrid';
}

interface CourseMaterial {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'link' | 'reading' | 'assignment';
  url: string;
  order: number;
  required: boolean;
}

interface Assessment {
  id: string;
  title: string;
  type: 'quiz' | 'exam' | 'assignment' | 'project' | 'participation';
  weight: number;
  dueDate?: Date;
  maxPoints: number;
}

interface Syllabus {
  id: string;
  courseId: string;
  weekPlans: WeekPlan[];
  gradingPolicy: GradingPolicy;
  policies: string[];
}

interface WeekPlan {
  week: number;
  topic: string;
  objectives: string[];
  readings: string[];
  activities: string[];
}

interface GradingPolicy {
  gradingScale: Record<string, { min: number; max: number; grade: string }>;
  components: { name: string; weight: number }[];
  policies: string[];
}

interface CourseSection {
  id: string;
  courseId: string;
  sectionNumber: string;
  instructor: string;
  schedule: Schedule;
  capacity: number;
  enrolledCount: number;
  ta?: string;
}

// In-memory storage
const courses = new Map<string, Course>();
const syllabi = new Map<string, Syllabus>();
const sections = new Map<string, CourseSection>();

// Seed initial courses
function seedCourses() {
  const initialCourses: Course[] = [
    {
      id: uuidv4(),
      code: 'CS101',
      name: 'Introduction to Computer Science',
      description: 'Foundational concepts in computer science including algorithms, data structures, and programming basics.',
      department: 'Computer Science',
      credits: 3,
      level: 'undergraduate',
      instructor: 'Dr. Smith',
      schedule: {
        days: ['Monday', 'Wednesday', 'Friday'],
        startTime: '09:00',
        endTime: '10:00',
        location: 'Room 101',
        type: 'lecture'
      },
      capacity: 30,
      enrolledCount: 0,
      prerequisites: [],
      learningOutcomes: [
        'Understand fundamental programming concepts',
        'Write basic algorithms in Python',
        'Analyze time and space complexity'
      ],
      materials: [],
      assessments: [],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      code: 'MATH201',
      name: 'Calculus II',
      description: 'Continuation of Calculus I, covering integration techniques, sequences, and series.',
      department: 'Mathematics',
      credits: 4,
      level: 'undergraduate',
      instructor: 'Dr. Johnson',
      schedule: {
        days: ['Tuesday', 'Thursday'],
        startTime: '11:00',
        endTime: '12:30',
        location: 'Room 205',
        type: 'lecture'
      },
      capacity: 25,
      enrolledCount: 0,
      prerequisites: ['MATH101'],
      learningOutcomes: [
        'Master integration techniques',
        'Understand infinite series convergence',
        'Apply calculus to real-world problems'
      ],
      materials: [],
      assessments: [],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  initialCourses.forEach(course => {
    courses.set(course.id, course);
  });

  logger.info(`Seeded ${initialCourses.length} initial courses`);
}

seedCourses();

// Routes

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'course-service',
    version: '1.0.0'
  });
});

// Course CRUD
app.post('/api/courses', (req: Request, res: Response) => {
  try {
    const {
      code, name, description, department, credits,
      level, instructor, schedule, capacity, prerequisites
    } = req.body;

    if (!code || !name || !department || !credits) {
      return res.status(400).json({ error: 'Code, name, department, and credits are required' });
    }

    const id = uuidv4();
    const course: Course = {
      id,
      code,
      name,
      description: description || '',
      department,
      credits,
      level: level || 'undergraduate',
      instructor: instructor || '',
      schedule: schedule || {
        days: ['Monday', 'Wednesday'],
        startTime: '09:00',
        endTime: '10:00',
        location: 'TBD',
        type: 'lecture'
      },
      capacity: capacity || 30,
      enrolledCount: 0,
      prerequisites: prerequisites || [],
      learningOutcomes: [],
      materials: [],
      assessments: [],
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    courses.set(id, course);
    logger.info(`Course created: ${code} - ${name}`);

    res.status(201).json(course);
  } catch (error) {
    logger.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

app.get('/api/courses', (req: Request, res: Response) => {
  const { department, level, status } = req.query;

  let result = Array.from(courses.values());

  if (department) {
    result = result.filter(c => c.department === department);
  }
  if (level) {
    result = result.filter(c => c.level === level);
  }
  if (status) {
    result = result.filter(c => c.status === status);
  }

  res.json(result);
});

app.get('/api/courses/:id', (req: Request, res: Response) => {
  const course = courses.get(req.params.id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }
  res.json(course);
});

app.put('/api/courses/:id', (req: Request, res: Response) => {
  try {
    const course = courses.get(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const updates = req.body;
    Object.assign(course, updates, { updatedAt: new Date() });
    courses.set(course.id, course);

    logger.info(`Course updated: ${course.code}`);

    res.json(course);
  } catch (error) {
    logger.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

app.delete('/api/courses/:id', (req: Request, res: Response) => {
  const course = courses.get(req.params.id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  course.status = 'archived';
  courses.set(course.id, course);

  logger.info(`Course archived: ${course.code}`);

  res.json({ success: true, message: 'Course archived' });
});

// Course Materials
app.post('/api/courses/:id/materials', (req: Request, res: Response) => {
  try {
    const course = courses.get(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const { title, type, url, required } = req.body;

    if (!title || !type || !url) {
      return res.status(400).json({ error: 'Title, type, and URL are required' });
    }

    const material: CourseMaterial = {
      id: uuidv4(),
      title,
      type,
      url,
      order: course.materials.length + 1,
      required: required !== false
    };

    course.materials.push(material);
    course.updatedAt = new Date();
    courses.set(course.id, course);

    res.status(201).json(material);
  } catch (error) {
    logger.error('Error adding material:', error);
    res.status(500).json({ error: 'Failed to add material' });
  }
});

app.get('/api/courses/:id/materials', (req: Request, res: Response) => {
  const course = courses.get(req.params.id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }
  res.json(course.materials);
});

// Course Assessments
app.post('/api/courses/:id/assessments', (req: Request, res: Response) => {
  try {
    const course = courses.get(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const { title, type, weight, dueDate, maxPoints } = req.body;

    if (!title || !type || weight === undefined) {
      return res.status(400).json({ error: 'Title, type, and weight are required' });
    }

    const assessment: Assessment = {
      id: uuidv4(),
      title,
      type,
      weight,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      maxPoints: maxPoints || 100
    };

    course.assessments.push(assessment);
    course.updatedAt = new Date();
    courses.set(course.id, course);

    res.status(201).json(assessment);
  } catch (error) {
    logger.error('Error adding assessment:', error);
    res.status(500).json({ error: 'Failed to add assessment' });
  }
});

app.get('/api/courses/:id/assessments', (req: Request, res: Response) => {
  const course = courses.get(req.params.id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }
  res.json(course.assessments);
});

// Learning Outcomes
app.post('/api/courses/:id/outcomes', (req: Request, res: Response) => {
  try {
    const course = courses.get(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const { outcome } = req.body;
    if (!outcome) {
      return res.status(400).json({ error: 'Learning outcome is required' });
    }

    course.learningOutcomes.push(outcome);
    course.updatedAt = new Date();
    courses.set(course.id, course);

    res.json({ success: true, outcomes: course.learningOutcomes });
  } catch (error) {
    logger.error('Error adding outcome:', error);
    res.status(500).json({ error: 'Failed to add outcome' });
  }
});

// Syllabus Management
app.post('/api/courses/:id/syllabus', (req: Request, res: Response) => {
  try {
    const course = courses.get(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const { weekPlans, gradingPolicy, policies } = req.body;

    const syllabus: Syllabus = {
      id: uuidv4(),
      courseId: course.id,
      weekPlans: weekPlans || [],
      gradingPolicy: gradingPolicy || {
        gradingScale: {
          'A': { min: 90, max: 100, grade: 'A' },
          'B': { min: 80, max: 89, grade: 'B' },
          'C': { min: 70, max: 79, grade: 'C' },
          'D': { min: 60, max: 69, grade: 'D' },
          'F': { min: 0, max: 59, grade: 'F' }
        },
        components: [
          { name: 'Exams', weight: 40 },
          { name: 'Assignments', weight: 30 },
          { name: 'Projects', weight: 20 },
          { name: 'Participation', weight: 10 }
        ],
        policies: ['Attendance is mandatory', 'Late submissions penalized 10% per day']
      },
      policies: policies || [
        'Academic integrity policy applies',
        'Office hours: Monday 2-4pm, Wednesday 2-4pm'
      ]
    };

    syllabi.set(syllabus.id, syllabus);
    logger.info(`Syllabus created for course ${course.code}`);

    res.status(201).json(syllabus);
  } catch (error) {
    logger.error('Error creating syllabus:', error);
    res.status(500).json({ error: 'Failed to create syllabus' });
  }
});

app.get('/api/courses/:id/syllabus', (req: Request, res: Response) => {
  const syllabus = Array.from(syllabi.values())
    .find(s => s.courseId === req.params.id);

  if (!syllabus) {
    return res.status(404).json({ error: 'Syllabus not found' });
  }
  res.json(syllabus);
});

// Section Management
app.post('/api/courses/:id/sections', (req: Request, res: Response) => {
  try {
    const course = courses.get(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const { sectionNumber, instructor, schedule, capacity, ta } = req.body;

    if (!sectionNumber || !instructor) {
      return res.status(400).json({ error: 'Section number and instructor are required' });
    }

    const section: CourseSection = {
      id: uuidv4(),
      courseId: course.id,
      sectionNumber,
      instructor,
      schedule: schedule || course.schedule,
      capacity: capacity || course.capacity,
      enrolledCount: 0,
      ta
    };

    sections.set(section.id, section);
    logger.info(`Section ${sectionNumber} created for course ${course.code}`);

    res.status(201).json(section);
  } catch (error) {
    logger.error('Error creating section:', error);
    res.status(500).json({ error: 'Failed to create section' });
  }
});

app.get('/api/courses/:id/sections', (req: Request, res: Response) => {
  const courseSections = Array.from(sections.values())
    .filter(s => s.courseId === req.params.id);
  res.json(courseSections);
});

// Search
app.get('/api/search', (req: Request, res: Response) => {
  const { q, department, level } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  let results = Array.from(courses.values()).filter(course => {
    const searchStr = `${course.code} ${course.name} ${course.description}`.toLowerCase();
    return searchStr.includes(q.toString().toLowerCase());
  });

  if (department) {
    results = results.filter(c => c.department === department);
  }
  if (level) {
    results = results.filter(c => c.level === level);
  }

  res.json(results);
});

// Statistics
app.get('/api/stats', (req: Request, res: Response) => {
  const allCourses = Array.from(courses.values());
  const departments = [...new Set(allCourses.map(c => c.department))];

  res.json({
    totalCourses: allCourses.length,
    activeCourses: allCourses.filter(c => c.status === 'active').length,
    archivedCourses: allCourses.filter(c => c.status === 'archived').length,
    byDepartment: departments.map(d => ({
      department: d,
      count: allCourses.filter(c => c.department === d).length
    })),
    byLevel: {
      undergraduate: allCourses.filter(c => c.level === 'undergraduate').length,
      graduate: allCourses.filter(c => c.level === 'graduate').length,
      professional: allCourses.filter(c => c.level === 'professional').length
    },
    totalSections: sections.size,
    averageCapacity: allCourses.length > 0
      ? Math.round(allCourses.reduce((sum, c) => sum + c.capacity, 0) / allCourses.length)
      : 0
  });
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`Course Service running on port ${PORT}`);
  logger.info('Role: Course Management & Curriculum');
  logger.info('Endpoints:');
  logger.info('  - POST /api/courses - Create course');
  logger.info('  - GET /api/courses - List courses');
  logger.info('  - GET /api/courses/:id - Get course');
  logger.info('  - PUT /api/courses/:id - Update course');
  logger.info('  - POST /api/courses/:id/materials - Add material');
  logger.info('  - POST /api/courses/:id/assessments - Add assessment');
  logger.info('  - POST /api/courses/:id/syllabus - Create syllabus');
  logger.info('  - POST /api/courses/:id/sections - Create section');
  logger.info('  - GET /api/search - Search courses');
  logger.info('  - GET /api/stats - Get statistics');
});

export default app;
