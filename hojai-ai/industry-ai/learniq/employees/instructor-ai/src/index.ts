import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3041;

app.use(express.json());

// In-memory stores
const instructors: Map<string, any> = new Map();
const schedules: Map<string, any> = new Map();
const availability: Map<string, any> = new Map();

// Initialize sample instructors
const sampleInstructors = [
  { id: 'inst-1', firstName: 'Alice', lastName: 'Johnson', email: 'alice@university.edu', department: 'Computer Science', specialty: ['programming', 'algorithms'] },
  { id: 'inst-2', firstName: 'Bob', lastName: 'Williams', email: 'bob@university.edu', department: 'Computer Science', specialty: ['web', 'database'] },
  { id: 'inst-3', firstName: 'Carol', lastName: 'Davis', email: 'carol@university.edu', department: 'Data Science', specialty: ['machine learning', 'statistics'] }
];

sampleInstructors.forEach(i => {
  instructors.set(i.id, {
    ...i,
    name: `${i.firstName} ${i.lastName}`,
    status: 'active',
    courses: [],
    rating: 4.5,
    createdAt: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'instructor-ai', timestamp: new Date().toISOString() });
});

// Get all instructors
app.get('/api/instructors', (req: Request, res: Response) => {
  const { department, specialty, status } = req.query;
  let filtered = Array.from(instructors.values());

  if (department) {
    filtered = filtered.filter((i: any) => i.department === department);
  }
  if (specialty) {
    filtered = filtered.filter((i: any) => i.specialty.includes(specialty));
  }
  if (status) {
    filtered = filtered.filter((i: any) => i.status === status);
  }

  res.json({ success: true, count: filtered.length, data: filtered });
});

// Get instructor by ID
app.get('/api/instructors/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const instructor = instructors.get(id);

  if (!instructor) {
    res.status(404).json({ success: false, error: 'Instructor not found' });
    return;
  }

  // Get schedules
  const instructorSchedules = Array.from(schedules.values()).filter((s: any) => s.instructorId === id);
  res.json({ success: true, data: { ...instructor, schedules: instructorSchedules } });
});

// Create instructor
app.post('/api/instructors', (req: Request, res: Response) => {
  const { firstName, lastName, email, department, specialty, phone } = req.body;

  if (!firstName || !lastName || !email) {
    res.status(400).json({ success: false, error: 'firstName, lastName, and email are required' });
    return;
  }

  const instructor = {
    id: uuidv4(),
    firstName,
    lastName,
    name: `${firstName} ${lastName}`,
    email,
    phone: phone || '',
    department: department || 'General',
    specialty: specialty || [],
    status: 'active',
    courses: [],
    rating: 0,
    createdAt: new Date().toISOString()
  };

  instructors.set(instructor.id, instructor);
  res.status(201).json({ success: true, data: instructor });
});

// Update instructor
app.put('/api/instructors/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const instructor = instructors.get(id);

  if (!instructor) {
    res.status(404).json({ success: false, error: 'Instructor not found' });
    return;
  }

  const { firstName, lastName, department, specialty, phone, status } = req.body;

  if (firstName || lastName) {
    instructor.firstName = firstName || instructor.firstName;
    instructor.lastName = lastName || instructor.lastName;
    instructor.name = `${instructor.firstName} ${instructor.lastName}`;
  }
  if (department) instructor.department = department;
  if (specialty) instructor.specialty = specialty;
  if (phone !== undefined) instructor.phone = phone;
  if (status) instructor.status = status;

  instructor.updatedAt = new Date().toISOString();
  instructors.set(id, instructor);

  res.json({ success: true, data: instructor });
});

// Create schedule entry
app.post('/api/schedules', (req: Request, res: Response) => {
  const { instructorId, courseName, dayOfWeek, startTime, endTime, room, semester, year } = req.body;

  if (!instructorId || !courseName || !dayOfWeek || !startTime || !endTime) {
    res.status(400).json({ success: false, error: 'instructorId, courseName, dayOfWeek, startTime, and endTime are required' });
    return;
  }

  const instructor = instructors.get(instructorId);
  if (!instructor) {
    res.status(404).json({ success: false, error: 'Instructor not found' });
    return;
  }

  const schedule = {
    id: uuidv4(),
    instructorId,
    instructorName: instructor.name,
    courseName,
    dayOfWeek,
    startTime,
    endTime,
    room: room || '',
    semester: semester || 'fall',
    year: year || new Date().getFullYear(),
    status: 'scheduled',
    createdAt: new Date().toISOString()
  };

  schedules.set(schedule.id, schedule);

  // Add to instructor courses
  if (!instructor.courses.includes(courseName)) {
    instructor.courses.push(courseName);
    instructors.set(instructorId, instructor);
  }

  res.status(201).json({ success: true, data: schedule });
});

// Get all schedules
app.get('/api/schedules', (req: Request, res: Response) => {
  const { instructorId, dayOfWeek, semester, year } = req.query;
  let filtered = Array.from(schedules.values());

  if (instructorId) {
    filtered = filtered.filter((s: any) => s.instructorId === instructorId);
  }
  if (dayOfWeek) {
    filtered = filtered.filter((s: any) => s.dayOfWeek === dayOfWeek);
  }
  if (semester) {
    filtered = filtered.filter((s: any) => s.semester === semester);
  }
  if (year) {
    filtered = filtered.filter((s: any) => s.year === parseInt(year as string));
  }

  // Sort by day and start time
  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  filtered.sort((a: any, b: any) => {
    const dayDiff = dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });

  res.json({ success: true, count: filtered.length, data: filtered });
});

// Set availability
app.post('/api/availability', (req: Request, res: Response) => {
  const { instructorId, dayOfWeek, startTime, endTime, available } = req.body;

  if (!instructorId || !dayOfWeek) {
    res.status(400).json({ success: false, error: 'instructorId and dayOfWeek are required' });
    return;
  }

  const instructor = instructors.get(instructorId);
  if (!instructor) {
    res.status(404).json({ success: false, error: 'Instructor not found' });
    return;
  }

  const avail = {
    id: uuidv4(),
    instructorId,
    instructorName: instructor.name,
    dayOfWeek,
    startTime: startTime || '09:00',
    endTime: endTime || '17:00',
    available: available !== false,
    createdAt: new Date().toISOString()
  };

  availability.set(avail.id, avail);
  res.status(201).json({ success: true, data: avail });
});

// Get instructor availability
app.get('/api/availability/:instructorId', (req: Request, res: Response) => {
  const { instructorId } = req.params;
  const avail = Array.from(availability.values()).filter((a: any) => a.instructorId === instructorId);

  res.json({ success: true, count: avail.length, data: avail });
});

// Get instructor statistics
app.get('/api/stats', (_req: Request, res: Response) => {
  const allInstructors = Array.from(instructors.values());
  const allSchedules = Array.from(schedules.values());

  res.json({
    success: true,
    data: {
      totalInstructors: allInstructors.length,
      activeInstructors: allInstructors.filter((i: any) => i.status === 'active').length,
      totalSchedules: allSchedules.length,
      byDepartment: allInstructors.reduce((acc: any, i: any) => {
        acc[i.department] = (acc[i.department] || 0) + 1;
        return acc;
      }, {}),
      coursesPerInstructor: allInstructors.reduce((acc: any, i: any) => {
        acc[i.name] = i.courses.length;
        return acc;
      }, {})
    }
  });
});

app.listen(PORT, () => {
  console.log(`Instructor AI service running on port ${PORT}`);
});

export default app;