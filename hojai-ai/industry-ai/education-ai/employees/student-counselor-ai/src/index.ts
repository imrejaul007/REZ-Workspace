/**
 * Student Counselor AI Agent
 * Industry: Education
 * Role: Academic advising, career guidance, student support services
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const app = express();
const PORT = 4053;

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
interface StudentProfile {
  id: string;
  name: string;
  email: string;
  gradeLevel: string;
  interests: string[];
  strengths: string[];
  areasForImprovement: string[];
  careerGoals: string;
  gpa: number;
  createdAt: Date;
}

interface AcademicPlan {
  id: string;
  studentId: string;
  semester: string;
  recommendedCourses: string[];
  studyGoals: string[];
  supportServices: string[];
  milestones: Milestone[];
  createdAt: Date;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  completed: boolean;
}

interface Appointment {
  id: string;
  studentId: string;
  counselorId: string;
  date: Date;
  type: 'academic' | 'career' | 'personal' | 'financial';
  status: 'scheduled' | 'completed' | 'cancelled';
  notes: string;
}

interface CareerPath {
  id: string;
  name: string;
  requiredSkills: string[];
  education: string;
  averageSalary: string;
  growthProspects: string;
  relatedIndustries: string[];
}

interface Intervention {
  id: string;
  studentId: string;
  type: 'academic' | 'behavioral' | 'attendance';
  description: string;
  recommendedActions: string[];
  status: 'pending' | 'inProgress' | 'resolved';
  createdAt: Date;
}

// In-memory storage
const profiles = new Map<string, StudentProfile>();
const academicPlans = new Map<string, AcademicPlan>();
const appointments = new Map<string, Appointment>();
const interventions = new Map<string, Intervention>();

const careerPaths: CareerPath[] = [
  {
    id: '1',
    name: 'Software Engineering',
    requiredSkills: ['Programming', 'Problem Solving', 'System Design', 'Collaboration'],
    education: "Bachelor's in Computer Science",
    averageSalary: '$80,000 - $150,000',
    growthProspects: 'Very High',
    relatedIndustries: ['Technology', 'Finance', 'Healthcare', 'Gaming']
  },
  {
    id: '2',
    name: 'Data Science',
    requiredSkills: ['Statistics', 'Machine Learning', 'Python', 'Data Visualization'],
    education: "Bachelor's/Master's in Data Science or related field",
    averageSalary: '$95,000 - $160,000',
    growthProspects: 'Very High',
    relatedIndustries: ['Technology', 'Finance', 'Healthcare', 'Retail']
  },
  {
    id: '3',
    name: 'Healthcare Administration',
    requiredSkills: ['Leadership', 'Healthcare Regulations', 'Communication', 'Analytical'],
    education: "Bachelor's/Master's in Healthcare Administration",
    averageSalary: '$70,000 - $120,000',
    growthProspects: 'High',
    relatedIndustries: ['Healthcare', 'Government', 'Insurance']
  }
];

// Helper functions
function calculateGPA(grades: number[]): number {
  if (grades.length === 0) return 0;
  const sum = grades.reduce((a, b) => a + b, 0);
  return Math.round((sum / grades.length) * 100) / 100;
}

function generateAcademicPlan(studentId: string, semester: string): AcademicPlan {
  const id = uuidv4();
  const plan: AcademicPlan = {
    id,
    studentId,
    semester,
    recommendedCourses: [
      'Introduction to Major Requirements',
      'General Education Elective',
      'Math/Science Foundation',
      'Communication Skills'
    ],
    studyGoals: [
      'Maintain minimum 3.0 GPA',
      'Attend all scheduled classes',
      'Complete assignments on time',
      'Utilize office hours weekly'
    ],
    supportServices: [
      'Tutoring Center',
      'Writing Lab',
      'Academic Workshops',
      'Study Groups'
    ],
    milestones: [
      {
        id: uuidv4(),
        title: 'Course Registration',
        description: 'Register for next semester courses',
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        completed: false
      },
      {
        id: uuidv4(),
        title: 'Midterm Review',
        description: 'Review midterm grades and adjust study strategies',
        targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        completed: false
      }
    ],
    createdAt: new Date()
  };

  academicPlans.set(id, plan);
  return plan;
}

function assessRiskLevel(profile: StudentProfile): 'low' | 'medium' | 'high' {
  if (profile.gpa >= 3.0) return 'low';
  if (profile.gpa >= 2.0) return 'medium';
  return 'high';
}

function recommendInterventions(profile: StudentProfile): Intervention {
  const id = uuidv4();
  const type = profile.gpa < 2.0 ? 'academic' : 'behavioral';
  const recommendedActions: string[] = [];

  if (profile.gpa < 2.0) {
    recommendedActions.push('Schedule tutoring sessions');
    recommendedActions.push('Meet with academic advisor weekly');
    recommendedActions.push('Consider reducing course load');
  }

  if (profile.areasForImprovement.length > 0) {
    recommendedActions.push(`Focus on: ${profile.areasForImprovement.join(', ')}`);
  }

  const intervention: Intervention = {
    id,
    studentId: profile.id,
    type,
    description: `Academic intervention for ${profile.name}`,
    recommendedActions,
    status: 'pending',
    createdAt: new Date()
  };

  interventions.set(id, intervention);
  return intervention;
}

// Routes

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    agent: 'student-counselor-ai',
    role: 'Academic Advising & Student Support',
    version: '1.0.0'
  });
});

// Student Profile routes
app.post('/api/profiles', (req: Request, res: Response) => {
  try {
    const { name, email, gradeLevel, interests, careerGoals } = req.body;

    if (!name || !email || !gradeLevel) {
      return res.status(400).json({ error: 'Name, email, and grade level are required' });
    }

    const id = uuidv4();
    const profile: StudentProfile = {
      id,
      name,
      email,
      gradeLevel,
      interests: interests || [],
      strengths: [],
      areasForImprovement: [],
      careerGoals: careerGoals || '',
      gpa: 0,
      createdAt: new Date()
    };

    profiles.set(id, profile);
    logger.info(`Student profile created: ${name}`);

    res.status(201).json(profile);
  } catch (error) {
    logger.error('Error creating profile:', error);
    res.status(500).json({ error: 'Failed to create profile' });
  }
});

app.get('/api/profiles', (req: Request, res: Response) => {
  res.json(Array.from(profiles.values()));
});

app.get('/api/profiles/:id', (req: Request, res: Response) => {
  const profile = profiles.get(req.params.id);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  res.json(profile);
});

app.put('/api/profiles/:id', (req: Request, res: Response) => {
  try {
    const profile = profiles.get(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const updates = req.body;
    Object.assign(profile, updates);
    profiles.set(profile.id, profile);

    res.json(profile);
  } catch (error) {
    logger.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.post('/api/profiles/:id/assess', (req: Request, res: Response) => {
  try {
    const profile = profiles.get(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const { strengths, areasForImprovement, gpa } = req.body;

    if (strengths) profile.strengths = strengths;
    if (areasForImprovement) profile.areasForImprovement = areasForImprovement;
    if (gpa !== undefined) profile.gpa = gpa;

    profiles.set(profile.id, profile);

    const riskLevel = assessRiskLevel(profile);
    let intervention = null;

    if (riskLevel === 'high' || riskLevel === 'medium') {
      intervention = recommendInterventions(profile);
    }

    res.json({
      profile,
      riskLevel,
      intervention,
      recommendations: generateRecommendations(profile)
    });
  } catch (error) {
    logger.error('Error assessing profile:', error);
    res.status(500).json({ error: 'Failed to assess profile' });
  }
});

function generateRecommendations(profile: StudentProfile): string[] {
  const recommendations: string[] = [];

  if (profile.gpa < 3.0) {
    recommendations.push('Consider joining a study group');
    recommendations.push('Utilize professor office hours');
  }

  if (profile.interests.length > 0) {
    recommendations.push(`Explore extracurricular activities related to: ${profile.interests.join(', ')}`);
  }

  if (profile.careerGoals) {
    recommendations.push(`Research career paths aligned with: ${profile.careerGoals}`);
  }

  return recommendations;
}

// Academic Plan routes
app.post('/api/academic-plans', (req: Request, res: Response) => {
  try {
    const { studentId, semester } = req.body;

    if (!studentId || !semester) {
      return res.status(400).json({ error: 'Student ID and semester are required' });
    }

    const plan = generateAcademicPlan(studentId, semester);
    logger.info(`Academic plan created for student ${studentId}`);

    res.status(201).json(plan);
  } catch (error) {
    logger.error('Error creating academic plan:', error);
    res.status(500).json({ error: 'Failed to create academic plan' });
  }
});

app.get('/api/academic-plans', (req: Request, res: Response) => {
  res.json(Array.from(academicPlans.values()));
});

app.get('/api/students/:studentId/academic-plans', (req: Request, res: Response) => {
  const plans = Array.from(academicPlans.values())
    .filter(p => p.studentId === req.params.studentId);
  res.json(plans);
});

app.put('/api/academic-plans/:id/milestones/:milestoneId', (req: Request, res: Response) => {
  try {
    const plan = academicPlans.get(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'Academic plan not found' });
    }

    const milestone = plan.milestones.find(m => m.id === req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    milestone.completed = true;
    academicPlans.set(plan.id, plan);

    res.json({ success: true, milestone });
  } catch (error) {
    logger.error('Error updating milestone:', error);
    res.status(500).json({ error: 'Failed to update milestone' });
  }
});

// Appointment routes
app.post('/api/appointments', (req: Request, res: Response) => {
  try {
    const { studentId, counselorId, date, type } = req.body;

    if (!studentId || !date || !type) {
      return res.status(400).json({ error: 'Student ID, date, and type are required' });
    }

    const id = uuidv4();
    const appointment: Appointment = {
      id,
      studentId,
      counselorId: counselorId || 'default-counselor',
      date: new Date(date),
      type,
      status: 'scheduled',
      notes: ''
    };

    appointments.set(id, appointment);
    logger.info(`Appointment scheduled for student ${studentId}`);

    res.status(201).json(appointment);
  } catch (error) {
    logger.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

app.get('/api/appointments', (req: Request, res: Response) => {
  res.json(Array.from(appointments.values()));
});

app.get('/api/students/:studentId/appointments', (req: Request, res: Response) => {
  const studentAppointments = Array.from(appointments.values())
    .filter(a => a.studentId === req.params.studentId);
  res.json(studentAppointments);
});

app.put('/api/appointments/:id', (req: Request, res: Response) => {
  try {
    const appointment = appointments.get(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const { status, notes } = req.body;
    if (status) appointment.status = status;
    if (notes) appointment.notes = notes;

    appointments.set(appointment.id, appointment);

    res.json(appointment);
  } catch (error) {
    logger.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// Career Guidance routes
app.get('/api/career-paths', (req: Request, res: Response) => {
  res.json(careerPaths);
});

app.get('/api/career-paths/:id', (req: Request, res: Response) => {
  const path = careerPaths.find(p => p.id === req.params.id);
  if (!path) {
    return res.status(404).json({ error: 'Career path not found' });
  }
  res.json(path);
});

app.post('/api/career-match', (req: Request, res: Response) => {
  try {
    const { skills, interests } = req.body;

    const matchedPaths = careerPaths.filter(path => {
      const skillMatch = skills?.some((skill: string) =>
        path.requiredSkills.some(rs => rs.toLowerCase().includes(skill.toLowerCase()))
      );
      const interestMatch = interests?.some((interest: string) =>
        path.relatedIndustries.some(ri => ri.toLowerCase().includes(interest.toLowerCase()))
      );
      return skillMatch || interestMatch || true;
    });

    res.json({
      matchedCareerPaths: matchedPaths,
      matchCount: matchedPaths.length
    });
  } catch (error) {
    logger.error('Error matching careers:', error);
    res.status(500).json({ error: 'Failed to match careers' });
  }
});

// Intervention routes
app.get('/api/interventions', (req: Request, res: Response) => {
  res.json(Array.from(interventions.values()));
});

app.get('/api/students/:studentId/interventions', (req: Request, res: Response) => {
  const studentInterventions = Array.from(interventions.values())
    .filter(i => i.studentId === req.params.studentId);
  res.json(studentInterventions);
});

app.put('/api/interventions/:id', (req: Request, res: Response) => {
  try {
    const intervention = interventions.get(req.params.id);
    if (!intervention) {
      return res.status(404).json({ error: 'Intervention not found' });
    }

    const { status } = req.body;
    if (status) {
      intervention.status = status;
      interventions.set(intervention.id, intervention);
    }

    res.json(intervention);
  } catch (error) {
    logger.error('Error updating intervention:', error);
    res.status(500).json({ error: 'Failed to update intervention' });
  }
});

// Dashboard/Stats
app.get('/api/dashboard', (req: Request, res: Response) => {
  const allProfiles = Array.from(profiles.values());
  const allInterventions = Array.from(interventions.values());
  const allAppointments = Array.from(appointments.values());

  const atRiskStudents = allProfiles.filter(p => assessRiskLevel(p) !== 'low').length;
  const pendingInterventions = allInterventions.filter(i => i.status === 'pending').length;

  res.json({
    totalStudents: allProfiles.length,
    atRiskStudents,
    pendingInterventions,
    scheduledAppointments: allAppointments.filter(a => a.status === 'scheduled').length,
    completedAppointments: allAppointments.filter(a => a.status === 'completed').length,
    averageGPA: calculateAverageGPA(allProfiles),
    riskDistribution: {
      low: allProfiles.filter(p => assessRiskLevel(p) === 'low').length,
      medium: allProfiles.filter(p => assessRiskLevel(p) === 'medium').length,
      high: allProfiles.filter(p => assessRiskLevel(p) === 'high').length
    }
  });
});

function calculateAverageGPA(profileList: StudentProfile[]): number {
  if (profileList.length === 0) return 0;
  const sum = profileList.reduce((acc, p) => acc + p.gpa, 0);
  return Math.round((sum / profileList.length) * 100) / 100;
}

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`Student Counselor AI agent running on port ${PORT}`);
  logger.info('Role: Academic Advising & Student Support');
  logger.info('Endpoints:');
  logger.info('  - POST /api/profiles - Create student profile');
  logger.info('  - POST /api/profiles/:id/assess - Assess student risk');
  logger.info('  - POST /api/academic-plans - Create academic plan');
  logger.info('  - POST /api/appointments - Schedule appointment');
  logger.info('  - GET /api/career-paths - Get career paths');
  logger.info('  - POST /api/career-match - Match careers to student');
  logger.info('  - GET /api/dashboard - Get counseling dashboard');
});

export default app;
