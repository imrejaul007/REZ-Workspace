import { Router, Request, Response } from 'express';
import { InstitutionService } from '../services/institution.service';
import { validateCreateInstitution } from '../schemas/institution.schema';

const router = Router();
const institutionService = new InstitutionService(process.env.REDIS_URL);

export function getInstitutionRouter() {
  return router;
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const valid = validateCreateInstitution(req.body);
    if (!valid) return res.status(400).json({ errors: validateCreateInstitution.errors });
    const inst = await institutionService.createInstitution(req.body);
    return res.status(201).json(inst);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;
    const institutions = await institutionService.listInstitutions(filter);
    return res.json({ institutions, count: institutions.length });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/:twinId', async (req: Request, res: Response) => {
  try {
    const inst = await institutionService.getInstitution(req.params.twinId);
    if (!inst) return res.status(404).json({ error: 'Institution not found' });
    return res.json(inst);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.put('/:twinId', async (req: Request, res: Response) => {
  try {
    const inst = await institutionService.updateInstitution(req.params.twinId, req.body);
    if (!inst) return res.status(404).json({ error: 'Institution not found' });
    return res.json(inst);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.delete('/:twinId', async (req: Request, res: Response) => {
  try {
    const deleted = await institutionService.deleteInstitution(req.params.twinId);
    if (!deleted) return res.status(404).json({ error: 'Institution not found' });
    return res.status(204).send();
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/:twinId/students', async (req: Request, res: Response) => {
  try {
    const inst = await institutionService.addStudent(req.params.twinId);
    if (!inst) return res.status(404).json({ error: 'Institution not found' });
    return res.json(inst);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.post('/:twinId/teachers', async (req: Request, res: Response) => {
  try {
    const inst = await institutionService.addTeacher(req.params.twinId);
    if (!inst) return res.status(404).json({ error: 'Institution not found' });
    return res.json(inst);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.post('/:twinId/departments', async (req: Request, res: Response) => {
  try {
    const inst = await institutionService.addDepartment(req.params.twinId, req.body);
    if (!inst) return res.status(404).json({ error: 'Institution not found' });
    return res.json(inst);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.post('/:twinId/programs', async (req: Request, res: Response) => {
  try {
    const { program, category } = req.body;
    const inst = await institutionService.addProgram(req.params.twinId, program, category || 'academic');
    if (!inst) return res.status(404).json({ error: 'Institution not found' });
    return res.json(inst);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.patch('/:twinId/performance', async (req: Request, res: Response) => {
  try {
    const inst = await institutionService.updatePerformance(req.params.twinId, req.body);
    if (!inst) return res.status(404).json({ error: 'Institution not found' });
    return res.json(inst);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.patch('/:twinId/integrations', async (req: Request, res: Response) => {
  try {
    const { type, url } = req.body;
    const inst = await institutionService.setIntegration(req.params.twinId, type, url);
    if (!inst) return res.status(404).json({ error: 'Institution not found' });
    return res.json(inst);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.get('/:twinId/performance', async (req: Request, res: Response) => {
  try {
    const perf = await institutionService.getInstitutionPerformance(req.params.twinId);
    if (!perf) return res.status(404).json({ error: 'Institution not found' });
    return res.json(perf);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/:twinId/people', async (req: Request, res: Response) => {
  try {
    const people = await institutionService.getInstitutionPeople(req.params.twinId);
    if (!people) return res.status(404).json({ error: 'Institution not found' });
    return res.json(people);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export { institutionService };