import { Router, Request, Response } from 'express';
import { CourseService } from '../services/course.service';
import { validateCreateCourse } from '../schemas/course.schema';

const router = Router();
const courseService = new CourseService(process.env.REDIS_URL);

export function getCourseRouter() {
  return router;
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const valid = validateCreateCourse(req.body);
    if (!valid) return res.status(400).json({ errors: validateCreateCourse.errors });
    const course = await courseService.createCourse(req.body);
    return res.status(201).json(course);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
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
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/:twinId', async (req: Request, res: Response) => {
  try {
    const course = await courseService.getCourse(req.params.twinId);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    return res.json(course);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.put('/:twinId', async (req: Request, res: Response) => {
  try {
    const course = await courseService.updateCourse(req.params.twinId, req.body);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    return res.json(course);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.delete('/:twinId', async (req: Request, res: Response) => {
  try {
    const deleted = await courseService.deleteCourse(req.params.twinId);
    if (!deleted) return res.status(404).json({ error: 'Course not found' });
    return res.status(204).send();
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/:twinId/modules', async (req: Request, res: Response) => {
  try {
    const course = await courseService.addModule(req.params.twinId, req.body);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    return res.json(course);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.post('/:twinId/enroll', async (req: Request, res: Response) => {
  try {
    const course = await courseService.enrollStudent(req.params.twinId);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    return res.json(course);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.post('/:twinId/instructors', async (req: Request, res: Response) => {
  try {
    const { type, teacherTwinId } = req.body;
    const course = await courseService.setInstructor(req.params.twinId, type || 'primary', teacherTwinId);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    return res.json(course);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.get('/:twinId/enrollment', async (req: Request, res: Response) => {
  try {
    const enrollment = await courseService.getCourseEnrollment(req.params.twinId);
    if (!enrollment) return res.status(404).json({ error: 'Course not found' });
    return res.json(enrollment);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/:twinId/content', async (req: Request, res: Response) => {
  try {
    const content = await courseService.getCourseContent(req.params.twinId);
    if (!content) return res.status(404).json({ error: 'Course not found' });
    return res.json(content);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export { courseService };