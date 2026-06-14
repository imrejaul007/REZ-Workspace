import { Router, Request, Response } from 'express';
import { createConnector, getConnector, updateConnector, deleteConnector, listConnectors, runSync, getSyncJobs } from '../services/connector.service';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  const { name, type, config } = req.body;
  if (!name || !type) return res.status(400).json({ success: false, error: 'name and type required' });
  const c = createConnector(name, type, config || {});
  res.status(201).json({ success: true, data: c });
});

router.get('/', (_req, res) => { res.json({ success: true, data: listConnectors() }); });
router.get('/:id', (req, res) => { const c = getConnector(req.params.id); return c ? res.json({ success: true, data: c }) : res.status(404).json({ success: false, error: 'Not found' }); });
router.patch('/:id', (req, res) => { const c = updateConnector(req.params.id, req.body); return c ? res.json({ success: true, data: c }) : res.status(404).json({ success: false, error: 'Not found' }); });
router.delete('/:id', (req, res) => { deleteConnector(req.params.id); res.json({ success: true }); });
router.post('/:id/sync', (req, res) => { runSync(req.params.id).then(j => res.json({ success: true, data: j })); });
router.get('/:id/syncs', (req, res) => { res.json({ success: true, data: getSyncJobs(req.params.id) }); });

export default router;
