import { Router, Request, Response } from 'express';
import { SafetyService } from '../services/safety.service';

const router = Router();
const safetyService = new SafetyService({
  get: (key: string, defaultValue?: string) => process.env[key] || defaultValue,
} as any);

// ===========================================
// EMERGENCY CONTACTS
// ===========================================

router.post('/contacts', async (req: Request, res: Response) => {
  try {
    const { userId, contact } = req.body;
    const result = await safetyService.addEmergencyContact(userId, contact);
    res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

router.get('/contacts/:userId', async (req: Request, res: Response) => {
  try {
    const contacts = await safetyService.getEmergencyContacts(req.params.userId);
    res.json({ success: true, contacts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// ===========================================
// TRIP SHARING
// ===========================================

router.post('/share', async (req: Request, res: Response) => {
  try {
    const { rideId, userId, contacts } = req.body;
    const share = await safetyService.shareTrip(rideId, userId, contacts);
    res.json({ success: true, share });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

router.get('/share/:shareId', async (req: Request, res: Response) => {
  try {
    const share = await safetyService.getTripShare(req.params.shareId);
    res.json({ success: true, share });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// ===========================================
// SOS
// ===========================================

router.post('/sos', async (req: Request, res: Response) => {
  try {
    const { rideId, userId, driverId, type, lat, lng } = req.body;
    const alert = await safetyService.triggerSOS(rideId, userId, driverId, type, lat, lng);
    res.json({ success: true, alert });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

router.patch('/sos/:alertId', async (req: Request, res: Response) => {
  try {
    const { status, notes } = req.body;
    const alert = await safetyService.updateSOSStatus(req.params.alertId, status, notes);
    res.json({ success: true, alert });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

router.get('/sos/ride/:rideId', async (req: Request, res: Response) => {
  try {
    const alert = await safetyService.getActiveSOSForRide(req.params.rideId);
    res.json({ success: true, alert });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

router.post('/incident', async (req: Request, res: Response) => {
  try {
    const { rideId, reporterId, type, description } = req.body;
    const result = await safetyService.reportIncident(rideId, reporterId, type, description);
    res.json({ success: true, incidentId: result.incidentId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

// ===========================================
// INSURANCE
// ===========================================

router.get('/insurance/:rideId', async (req: Request, res: Response) => {
  try {
    const insurance = await safetyService.getTripInsurance(req.params.rideId);
    res.json({ success: true, insurance });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

router.post('/claim', async (req: Request, res: Response) => {
  try {
    const { rideId, userId, claimType, description, documents } = req.body;
    const result = await safetyService.fileClaim(rideId, userId, claimType, description, documents);
    res.json({ success: true, claimId: result.claimId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
