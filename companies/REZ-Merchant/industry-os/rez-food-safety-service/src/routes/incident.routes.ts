/**
 * Food Incident Routes
 */

import { Router, Request, Response } from 'express';
import { FoodIncident } from '../models';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { merchantId, restaurantId, type, severity, description, affectedItems, immediateAction, reportedBy } = req.body;
    const incident = new FoodIncident({
      merchantId,
      restaurantId,
      incidentId: `INC${Date.now()}`,
      type,
      severity,
      description,
      affectedItems,
      immediateAction,
      reportedBy,
      status: 'open',
    });
    await incident.save();
    res.status(201).json({ success: true, data: incident });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to report incident' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const { restaurantId, status, severity } = req.query;
    const query: unknown = {};
    if (restaurantId) query.restaurantId = restaurantId;
    if (status) query.status = status;
    if (severity) query.severity = severity;
    const incidents = await FoodIncident.find(query).sort({ reportedAt: -1 });
    res.json({ success: true, data: incidents });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch incidents' });
  }
});

router.get('/:incidentId', async (req: Request, res: Response) => {
  try {
    const incident = await FoodIncident.findOne({ incidentId: req.params.incidentId });
    if (!incident) {
      res.status(404).json({ success: false, error: 'Incident not found' });
      return;
    }
    res.json({ success: true, data: incident });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch incident' });
  }
});

router.patch('/:incidentId/status', async (req: Request, res: Response) => {
  try {
    const { status, rootCause, correctiveAction, resolvedBy } = req.body;
    const update: unknown = { status };
    if (rootCause) update.rootCause = rootCause;
    if (correctiveAction) update.correctiveAction = correctiveAction;
    if (status === 'resolved') {
      update.resolvedAt = new Date();
      update.resolvedBy = resolvedBy;
    }
    const incident = await FoodIncident.findOneAndUpdate(
      { incidentId: req.params.incidentId },
      update,
      { new: true }
    );
    if (!incident) {
      res.status(404).json({ success: false, error: 'Incident not found' });
      return;
    }
    res.json({ success: true, data: incident });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update incident' });
  }
});

router.post('/:incidentId/escalate', async (req: Request, res: Response) => {
  try {
    const { escalatedTo } = req.body;
    const incident = await FoodIncident.findOneAndUpdate(
      { incidentId: req.params.incidentId },
      { status: 'escalated', escalatedTo },
      { new: true }
    );
    if (!incident) {
      res.status(404).json({ success: false, error: 'Incident not found' });
      return;
    }
    res.json({ success: true, data: incident });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to escalate' });
  }
});

router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.query;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const incidents = await FoodIncident.find({ restaurantId, reportedAt: { $gte: thirtyDaysAgo } });
    const byType = incidents.reduce((acc, i) => {
      acc[i.type] = (acc[i.type] || 0) + 1;
      return acc;
    }, {});
    const bySeverity = incidents.reduce((acc, i) => {
      acc[i.severity] = (acc[i.severity] || 0) + 1;
      return acc;
    }, {});
    const open = incidents.filter((i) => i.status === 'open').length;
    const resolved = incidents.filter((i) => i.status === 'resolved').length;
    res.json({ success: true, data: { total: incidents.length, open, resolved, byType, bySeverity } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

export { router as incidentRoutes };
