import { Router } from 'express';
import { logger } from '../../utils/logger';

const router = Router();

// Webhook trigger (external URL to trigger workflows)
router.post('/webhook/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    logger.info(`Webhook received for workflow ${workflowId}`);

    // In production, this would trigger the workflow engine
    res.json({
      success: true,
      message: 'Webhook received',
      workflowId,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// List available triggers
router.get('/types', (req, res) => {
  res.json({
    success: true,
    data: [
      { type: 'scheduled', label: 'Scheduled', icon: 'clock' },
      { type: 'webhook', label: 'Webhook', icon: 'webhook' },
      { type: 'event', label: 'Event', icon: 'event' },
      { type: 'manual', label: 'Manual', icon: 'play' }
    ]
  });
});

export { router as triggerRoutes };
