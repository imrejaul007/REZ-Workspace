import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3040;

app.use(express.json());

// In-memory stores
const students: Map<string, any> = new Map();
const enrollments: Map<string, any> = new Map();
const courses: Map<string, any> = new Map();

// Initialize sample courses
const sampleCourses = [
  { id: 'course-1', name: 'Introduction to Programming', code: 'CS101', credits: 3, capacity: 30 },
  { id: 'course-2', name: 'Data Structures', code: 'CS201', credits: 4, capacity: 25 },
  { id: 'course-3', name: 'Web Development', code: 'WD301', credits: 3, capacity: 20 },
  { id: 'course-4', name: 'Machine Learning', code: 'ML401', credits: 4, capacity: 15 }
];

sampleCourses.forEach(c => courses.set(c.id, c));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'enrollment-ai', timestamp: new Date().toISOString() });
});

// Get all courses
app.get('/api/courses', (_req: Request, res: Response) => {
  const courseList = Array.from(courses.values());
  res.json({ success: true, count: courseList.length, data: courseList });
});

// Create course
app.post('/api/courses', (req: Request, res: Response) => {
  const { name, code, credits, capacity, description } = req.body;

  if (!name || !code) {
    res.status(400).json({ success: false, error: 'name and code are required' });
    return;
  }

  const course = {
    id: uuidv4(),
    name,
    code,
    credits: credits || 3,
    capacity: capacity || 30,
    description: description || '',
    enrolledCount: 0,
    status: 'active',
    createdAt: new Date().toISOString()
  };

  courses.set(course.id, course);
  res.status(201).json({ success: true, data: course });
});

// Register student
app.post('/api/students', (req: Request, res: Response) => {
  const { firstName, lastName, email, phone, dateOfBirth, address } = req.body;

  if (!firstName || !lastName || !email) {
    res.status(400).json({ success: false, error: 'firstName, lastName, and email are required' });
    return;
  }

  // Check for duplicate email
  const existing = Array.from(students.values()).find((s: any) => s.email === email);
  if (existing) {
    res.status(400).json({ success: false, error: 'Student with this email already exists' });
    return;
  }

  const student = {
    id: uuidv4(),
    firstName,
    lastName,
    name: `${firstName} ${lastName}`,
    email,
    phone: phone || '',
    dateOfBirth: dateOfBirth || null,
    address: address || {},
    status: 'active',
    enrollmentDate: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  students.set(student.id, student);
  res.status(201).json({ success: true, data: student });
});

// Get all students
app.get('/api/students', (req: Request, res: Response) => {
  const { status, search } = req.query;
  let filtered = Array.from(students.values());

  if (status) {
    filtered = filtered.filter((s: any) => s.status === status);
  }
  if (search) {
    const searchLower = (search as string).toLowerCase();
    filtered = filtered.filter((s: any) =>
      s.name.toLowerCase().includes(searchLower) ||
      s.email.toLowerCase().includes(searchLower)
    );
  }

  res.json({ success: true, count: filtered.length, data: filtered });
});

// Get student by ID
app.get('/api/students/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const student = students.get(id);

  if (!student) {
    res.status(404).json({ success: false, error: 'Student not found' });
    return;
  }

  // Get enrollments
  const studentEnrollments = Array.from(enrollments.values()).filter((e: any) => e.studentId === id);
  res.json({ success: true, data: { ...student, enrollments: studentEnrollments } });
});

// Enroll student in course
app.post('/api/enrollments', (req: Request, res: Response) => {
  const { studentId, courseId, semester, year, enrollmentType } = req.body;

  if (!studentId || !courseId) {
    res.status(400).json({ success: false, error: 'studentId and courseId are required' });
    return;
  }

  const student = students.get(studentId);
  if (!student) {
    res.status(404).json({ success: false, error: 'Student not found' });
    return;
  }

  const course = courses.get(courseId);
  if (!course) {
    res.status(404).json({ success: false, error: 'Course not found' });
    return;
  }

  // Check if already enrolled
  const existing = Array.from(enrollments.values()).find(
    (e: any) => e.studentId === studentId && e.courseId === courseId && e.status !== 'dropped'
  );
  if (existing) {
    res.status(400).json({ success: false, error: 'Student is already enrolled in this course' });
    return;
  }

  // Check capacity
  const courseEnrollments = Array.from(enrollments.values()).filter(
    (e: any) => e.courseId === courseId && e.status !== 'dropped'
  );
  if (courseEnrollments.length >= course.capacity) {
    res.status(400).json({ success: false, error: 'Course is at full capacity' });
    return;
  }

  const enrollment = {
    id: uuidv4(),
    studentId,
    studentName: student.name,
    courseId,
    courseName: course.name,
    courseCode: course.code,
    semester: semester || 'fall',
    year: year || new Date().getFullYear(),
    enrollmentType: enrollmentType || 'regular',
    status: 'enrolled',
    grade: null,
    enrolledAt: new Date().toISOString()
  };

  enrollments.set(enrollment.id, enrollment);

  // Update course enrolled count
  course.enrolledCount = courseEnrollments.length + 1;
  courses.set(courseId, course);

  res.status(201).json({ success: true, data: enrollment });
});

// Get all enrollments
app.get('/api/enrollments', (req: Request, res: Response) => {
  const { studentId, courseId, status, semester, year } = req.query;
  let filtered = Array.from(enrollments.values());

  if (studentId) {
    filtered = filtered.filter((e: any) => e.studentId === studentId);
  }
  if (courseId) {
    filtered = filtered.filter((e: any) => e.courseId === courseId);
  }
  if (status) {
    filtered = filtered.filter((e: any) => e.status === status);
  }
  if (semester) {
    filtered = filtered.filter((e: any) => e.semester === semester);
  }
  if (year) {
    filtered = filtered.filter((e: any) => e.year === parseInt(year as string));
  }

  res.json({ success: true, count: filtered.length, data: filtered });
});

// Update enrollment (drop, withdraw, complete)
app.patch('/api/enrollments/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, grade } = req.body;

  const enrollment = enrollments.get(id);
  if (!enrollment) {
    res.status(404).json({ success: false, error: 'Enrollment not found' });
    return;
  }

  if (status) {
    enrollment.status = status;
    if (status === 'completed' && grade) {
      enrollment.grade = grade;
    }
  }
  if (grade !== undefined) {
    enrollment.grade = grade;
  }

  enrollment.updatedAt = new Date().toISOString();
  enrollments.set(id, enrollment);

  // Update course count if dropped
  if (status === 'dropped' || status === 'withdrawn') {
    const course = courses.get(enrollment.courseId);
    if (course && course.enrolledCount > 0) {
      course.enrolledCount -= 1;
      courses.set(enrollment.courseId, course);
    }
  }

  res.json({ success: true, data: enrollment });
});

// Get enrollment statistics
app.get('/api/stats', (_req: Request, res: Response) => {
  const allEnrollments = Array.from(enrollments.values());

  res.json({
    success: true,
    data: {
      totalStudents: students.size,
      activeStudents: students.valuesArray().filter((s: any) => s.status === 'active').length,
      totalEnrollments: allEnrollments.length,
      activeEnrollments: allEnrollments.filter((e: any) => e.status === 'enrolled').length,
      completedEnrollments: allEnrollments.filter((e: any) => e.status === 'completed').length,
      byCourse: allEnrollments.reduce((acc: any, e: any) => {
        acc[e.courseName] = (acc[e.courseName] || 0) + 1;
        return acc;
      }, {}),
      averageGrade: allEnrollments
        .filter((e: any) => e.grade !== null)
        .reduce((sum: number, e: any) => sum + parseFloat(e.grade), 0) /
        allEnrollments.filter((e: any) => e.grade !== null).length || 0
    }
  });
});

app.listen(PORT, () => {
  console.log(`Enrollment AI service running on port ${PORT}`);
});

export default app;