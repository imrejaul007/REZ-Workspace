/**
 * Training AI Agent - Port 4019
 * Learning paths, courses, certifications
 */

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Course catalog
const courses: Map<string, any> = new Map([
  ['course_1', { id: 'course_1', title: 'Leadership 101', category: 'leadership', duration: 480, difficulty: 'intermediate' }],
  ['course_2', { id: 'course_2', title: 'OKR Framework', category: 'strategy', duration: 240, difficulty: 'beginner' }],
  ['course_3', { id: 'course_3', title: 'AI Fundamentals', category: 'technology', duration: 360, difficulty: 'beginner' }],
  ['course_4', { id: 'course_4', title: 'Communication Skills', category: 'soft-skills', duration: 300, difficulty: 'beginner' }],
  ['course_5', { id: 'course_5', title: 'Advanced React', category: 'technology', duration: 600, difficulty: 'advanced' }],
]);

// User enrollments
const enrollments: Map<string, any> = new Map();

// Learning paths
const learningPaths: Map<string, any> = new Map([
  ['path_1', {
    id: 'path_1',
    name: 'Manager Track',
    courses: ['course_1', 'course_2'],
    duration: 720,
    level: 'leadership',
  }],
  ['path_2', {
    id: 'path_2',
    name: 'Tech Lead Track',
    courses: ['course_5', 'course_3'],
    duration: 960,
    level: 'technology',
  }],
]);

// Health
app.get('/health', (_, res) => res.json({ status: 'ok', agent: 'training', port: 4019 }));

// Get courses
app.get('/courses', (req, res) => {
  const category = req.query.category as string;

  let courseList = Array.from(courses.values());
  if (category) {
    courseList = courseList.filter(c => c.category === category);
  }

  res.json({ courses: courseList });
});

// Enroll in course
app.post('/enroll', (req, res) => {
  const { employeeId, courseId } = req.body;

  const course = courses.get(courseId);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  const enrollmentId = `enroll_${Date.now()}`;
  const enrollment = {
    id: enrollmentId,
    employeeId,
    courseId,
    courseTitle: course.title,
    status: 'in_progress',
    progress: 0,
    startedAt: new Date(),
    completedAt: null,
    certificate: null,
  };

  enrollments.set(enrollmentId, enrollment);

  res.json({ enrollment });
});

// Update progress
app.put('/enrollment/:id', (req, res) => {
  const enrollment = enrollments.get(req.params.id);
  if (!enrollment) {
    return res.status(404).json({ error: 'Enrollment not found' });
  }

  const { progress, status } = req.body;

  if (progress !== undefined) {
    enrollment.progress = Math.min(100, Math.max(0, progress));
    if (enrollment.progress >= 100) {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
      enrollment.certificate = {
        id: `cert_${Date.now()}`,
        issuedAt: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      };
    }
  }

  if (status) enrollment.status = status;

  res.json({ enrollment });
});

// Get employee learning
app.get('/learning/:employeeId', (req, res) => {
  const employeeEnrollments = Array.from(enrollments.values())
    .filter(e => e.employeeId === req.params.employeeId);

  const stats = {
    enrolled: employeeEnrollments.length,
    inProgress: employeeEnrollments.filter(e => e.status === 'in_progress').length,
    completed: employeeEnrollments.filter(e => e.status === 'completed').length,
    certificates: employeeEnrollments.filter(e => e.certificate).length,
    totalHours: employeeEnrollments
      .filter(e => e.status === 'completed')
      .reduce((sum, e) => {
        const course = courses.get(e.courseId);
        return sum + (course?.duration || 0);
      }, 0),
  };

  res.json({ enrollments: employeeEnrollments, stats });
});

// AI course recommendations
app.post('/recommend', (req, res) => {
  const { employeeId, department, goals } = req.body;

  // Simulated recommendations
  const recommendations = [
    {
      course: Array.from(courses.values())[0],
      reason: 'Based on your leadership goals',
      matchScore: 92,
    },
    {
      course: Array.from(courses.values())[2],
      reason: 'Recommended for your role',
      matchScore: 88,
    },
    {
      course: Array.from(courses.values())[3],
      reason: 'Popular in your team',
      matchScore: 85,
    },
  ];

  res.json({ recommendations });
});

// Get learning paths
app.get('/paths', (_, res) => {
  res.json({ paths: Array.from(learningPaths.values()) });
});

// Enroll in learning path
app.post('/paths/:id/enroll', (req, res) => {
  const { employeeId } = req.body;

  const path = learningPaths.get(req.params.id);
  if (!path) {
    return res.status(404).json({ error: 'Learning path not found' });
  }

  const courseEnrollments = path.courses.map(courseId => {
    const enrollmentId = `enroll_${Date.now()}_${courseId}`;
    const course = courses.get(courseId);

    const enrollment = {
      id: enrollmentId,
      employeeId,
      courseId,
      courseTitle: course?.title,
      status: 'in_progress',
      progress: 0,
      startedAt: new Date(),
    };

    enrollments.set(enrollmentId, enrollment);
    return enrollment;
  });

  res.json({
    path,
    enrollments: courseEnrollments,
    message: `Enrolled in ${path.name}`,
  });
});

const PORT = 4019;
app.listen(PORT, () => logger.info(`Training Agent running on port ${PORT}`));
