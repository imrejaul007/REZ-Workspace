import { Router } from 'express';
import ridersRouter from './riders';
import bikesRouter from './bikes';
import ridesRouter from './rides';
import groupsRouter from './groups';
import eventsRouter from './events';
import sosRouter from './sos';
import presenceRouter from './presence';
import memoriesRouter from './memories';

const router = Router();

// Mount routes
router.use('/riders', ridersRouter);
router.use('/bikes', bikesRouter);
router.use('/rides', ridesRouter);
router.use('/groups', groupsRouter);
router.use('/events', eventsRouter);
router.use('/sos', sosRouter);
router.use('/presence', presenceRouter);
router.use('/memories', memoriesRouter);

// Health check
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'rider-circle-api',
    timestamp: new Date().toISOString(),
  });
});

// Ready check (includes database)
router.get('/health/ready', async (_req, res) => {
  try {
    // Check MongoDB
    const mongoose = await import('mongoose');
    const dbState = mongoose.connection.readyState;

    if (dbState !== 1) {
      res.status(503).json({
        status: 'not_ready',
        database: 'disconnected',
      });
      return;
    }

    res.json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      status: 'error',
      message: 'Health check failed',
    });
  }
});

export default router;