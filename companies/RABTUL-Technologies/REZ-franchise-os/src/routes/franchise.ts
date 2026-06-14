import { Router, Request, Response } from 'express';
import franchiseService from '../services/franchise.service';

const router = Router();

// Franchise routes
router.post('/franchises', (req: Request, res: Response) => {
  try {
    const franchise = franchiseService.createFranchise(req.body);
    res.status(201).json(franchise);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create franchise', details: (error as Error).message });
  }
});

router.get('/franchises', (req: Request, res: Response) => {
  const { status, brand, type } = req.query;
  const franchises = franchiseService.getAllFranchises({
    status: status as string,
    brand: brand as string,
    type: type as string
  });
  res.json({ franchises });
});

router.get('/franchises/:id', (req: Request, res: Response) => {
  const franchise = franchiseService.getFranchise(req.params.id);
  if (!franchise) {
    return res.status(404).json({ error: 'Franchise not found' });
  }
  res.json(franchise);
});

router.put('/franchises/:id', (req: Request, res: Response) => {
  const updated = franchiseService.updateFranchise(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Franchise not found' });
  }
  res.json(updated);
});

router.delete('/franchises/:id', (req: Request, res: Response) => {
  const deleted = franchiseService.deleteFranchise(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Franchise not found' });
  }
  res.json({ message: 'Franchise deleted' });
});

// Location routes
router.post('/franchises/:id/locations', (req: Request, res: Response) => {
  const location = franchiseService.addLocation(req.params.id, req.body);
  if (!location) {
    return res.status(404).json({ error: 'Franchise not found' });
  }
  res.status(201).json(location);
});

router.get('/franchises/:franchiseId/locations', (req: Request, res: Response) => {
  const locations = franchiseService.getLocationsByFranchise(req.params.franchiseId);
  res.json({ locations });
});

router.get('/locations/:id', (req: Request, res: Response) => {
  const location = franchiseService.getLocation(req.params.id);
  if (!location) {
    return res.status(404).json({ error: 'Location not found' });
  }
  res.json(location);
});

router.put('/locations/:id', (req: Request, res: Response) => {
  const updated = franchiseService.updateLocation(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Location not found' });
  }
  res.json(updated);
});

// Performance routes
router.post('/performance', (req: Request, res: Response) => {
  const performance = franchiseService.recordPerformance(req.body);
  res.status(201).json(performance);
});

router.get('/franchises/:id/performance', (req: Request, res: Response) => {
  const { period } = req.query;
  const performance = franchiseService.getPerformance(req.params.id, period as string);
  res.json({ performance });
});

router.get('/locations/:id/performance', (req: Request, res: Response) => {
  const performance = franchiseService.getPerformanceByLocation(req.params.id);
  res.json({ performance });
});

// Royalty routes
router.post('/royalties', (req: Request, res: Response) => {
  const payment = franchiseService.createRoyaltyPayment(req.body);
  res.status(201).json(payment);
});

router.get('/franchises/:id/royalties', (req: Request, res: Response) => {
  const payments = franchiseService.getRoyaltyPayments(req.params.id);
  res.json({ payments });
});

router.patch('/royalties/:id', (req: Request, res: Response) => {
  const { status, paidDate } = req.body;
  const updated = franchiseService.updateRoyaltyStatus(req.params.id, status, paidDate);
  if (!updated) {
    return res.status(404).json({ error: 'Royalty payment not found' });
  }
  res.json(updated);
});

// Stats
router.get('/stats', (req: Request, res: Response) => {
  res.json(franchiseService.getStats());
});

export default router;
