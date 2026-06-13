import { Router, Request, Response } from 'express';
import { StudentService } from '../services/student.service';
import { validateCreateStudent, validateUpdateStudent } from '../schemas/student.schema';

const router = Router();
const studentService = new StudentService({
  redisUrl: process.env.REDIS_URL,
  memoryOSUrl: process.env.MEMORY_OS_URL,
  skillNetUrl: process.env.SKILLNET_URL,
  businessCopilotUrl: process.env.BUSINESS_COPILOT_URL
});

export function getStudentRouter(): Router {
  return router;
}

// Create student twin
router.post('/', async (req: Request, res: Response) => {
  try {
    const valid = validateCreateStudent(req.body);
    if (!valid) {
      return res.status(400).json({ errors: validateCreateStudent.errors });
    }

    const student = await studentService.createStudent(req.body);
    return res.status(201).json(student);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// List students with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.institutionId) filter.institutionId = req.query.institutionId;
    if (req.query.cohort) filter.cohort = req.query.cohort;
    if (req.query.minChurnRisk) filter.minChurnRisk = parseFloat(req.query.minChurnRisk as string);
    if (req.query.maxChurnRisk) filter.maxChurnRisk = parseFloat(req.query.maxChurnRisk as string);

    const students = await studentService.listStudents(filter);
    return res.json({ students, count: students.length });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Get student by twin ID
router.get('/:twinId', async (req: Request, res: Response) => {
  try {
    const student = await studentService.getStudent(req.params.twinId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    return res.json(student);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Update student
router.put('/:twinId', async (req: Request, res: Response) => {
  try {
    const valid = validateUpdateStudent(req.body);
    if (!valid) {
      return res.status(400).json({ errors: validateUpdateStudent.errors });
    }

    const student = await studentService.updateStudent(req.params.twinId, req.body);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    return res.json(student);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// Delete student
router.delete('/:twinId', async (req: Request, res: Response) => {
  try {
    const deleted = await studentService.deleteStudent(req.params.twinId);
    if (!deleted) {
      return res.status(404).json({ error: 'Student not found' });
    }
    return res.status(204).send();
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Update learning profile
router.patch('/:twinId/learning', async (req: Request, res: Response) => {
  try {
    const student = await studentService.updateLearningProfile(req.params.twinId, req.body);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    return res.json(student);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// Add skill proficiency
router.post('/:twinId/skills', async (req: Request, res: Response) => {
  try {
    const { skill, type } = req.body;
    if (!skill || !skill.skillId || !skill.name) {
      return res.status(400).json({ error: 'Invalid skill data' });
    }

    const student = await studentService.addSkillProficiency(
      req.params.twinId,
      skill,
      type || 'current'
    );
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    return res.json(student);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// Add skill gap
router.post('/:twinId/skill-gaps', async (req: Request, res: Response) => {
  try {
    const { skillId, name, severity, remediation, priority } = req.body;
    if (!skillId || !name) {
      return res.status(400).json({ error: 'Invalid skill gap data' });
    }

    const student = await studentService.addSkillGap(req.params.twinId, {
      skillId,
      name,
      severity: severity || 'medium',
      remediation: remediation || [],
      priority: priority || 5
    });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    return res.json(student);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// Update progress
router.patch('/:twinId/progress', async (req: Request, res: Response) => {
  try {
    const student = await studentService.updateProgress(req.params.twinId, req.body);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    return res.json(student);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// Update predictions
router.patch('/:twinId/predictions', async (req: Request, res: Response) => {
  try {
    const student = await studentService.updatePredictions(req.params.twinId, req.body);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    return res.json(student);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// Update engagement
router.patch('/:twinId/engagement', async (req: Request, res: Response) => {
  try {
    const student = await studentService.updateEngagement(req.params.twinId, req.body);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    return res.json(student);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// Update attendance
router.post('/:twinId/attendance', async (req: Request, res: Response) => {
  try {
    const { present, onTime } = req.body;
    const student = await studentService.updateAttendance(req.params.twinId, { present, onTime });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    return res.json(student);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// Enroll in course
router.post('/:twinId/enroll', async (req: Request, res: Response) => {
  try {
    const { courseTwinId } = req.body;
    if (!courseTwinId) {
      return res.status(400).json({ error: 'courseTwinId is required' });
    }

    const student = await studentService.enrollInCourse(req.params.twinId, courseTwinId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    return res.json(student);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// Complete course
router.post('/:twinId/complete', async (req: Request, res: Response) => {
  try {
    const { courseTwinId } = req.body;
    if (!courseTwinId) {
      return res.status(400).json({ error: 'courseTwinId is required' });
    }

    const student = await studentService.completeCourse(req.params.twinId, courseTwinId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    return res.json(student);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// Add scholarship
router.post('/:twinId/scholarships', async (req: Request, res: Response) => {
  try {
    const { id, name, amount, grantedAt, expiresAt, conditions } = req.body;
    if (!id || !name || amount === undefined) {
      return res.status(400).json({ error: 'Invalid scholarship data' });
    }

    const student = await studentService.addScholarship(req.params.twinId, {
      id,
      name,
      amount,
      grantedAt: grantedAt || new Date().toISOString(),
      expiresAt: expiresAt || '',
      conditions: conditions || []
    });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    return res.json(student);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// Add goal
router.post('/:twinId/goals', async (req: Request, res: Response) => {
  try {
    const { goal, type } = req.body;
    if (!goal || !goal.id || !goal.description) {
      return res.status(400).json({ error: 'Invalid goal data' });
    }

    const student = await studentService.addGoal(
      req.params.twinId,
      {
        id: goal.id,
        description: goal.description,
        targetDate: goal.targetDate || '',
        progress: goal.progress || 0,
        status: goal.status || 'not_started'
      },
      type || 'shortTerm'
    );
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    return res.json(student);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// Get at-risk students
router.get('/risks/at-risk', async (req: Request, res: Response) => {
  try {
    const threshold = parseFloat(req.query.threshold as string) || 0.5;
    const students = await studentService.getAtRiskStudents(threshold);
    return res.json({ students, count: students.length, threshold });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Get student insights
router.get('/:twinId/insights', async (req: Request, res: Response) => {
  try {
    const insights = await studentService.getStudentInsights(req.params.twinId);
    if (!insights) {
      return res.status(404).json({ error: 'Student not found' });
    }
    return res.json(insights);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Get student predictions
router.get('/:twinId/predictions', async (req: Request, res: Response) => {
  try {
    const student = await studentService.getStudent(req.params.twinId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    return res.json(student.predictions);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Get student skills
router.get('/:twinId/skills', async (req: Request, res: Response) => {
  try {
    const student = await studentService.getStudent(req.params.twinId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    return res.json(student.learning.skills);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Get student relationships
router.get('/:twinId/relationships', async (req: Request, res: Response) => {
  try {
    const student = await studentService.getStudent(req.params.twinId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    return res.json(student.relationships);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export { studentService };
