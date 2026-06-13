import { Router, Request, Response } from 'express';
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
