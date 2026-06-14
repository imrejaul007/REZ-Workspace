/**
 * Staff & Team domain router.
 *
 * Note: teamRoutes is mounted at '/' because the route file handles its own
 * /team/* and /team-public/* path prefixes internally.
 */
import { Router } from 'express';
import teamRoutes from '../routes/team';
import teamPublicRoutes from '../routes/teamPublic';
import staffShiftsRoutes from '../routes/staffShifts';
import shiftGapBridgeRoutes from '../routes/shiftGapBridge';

const router = Router();

// team routes handle /team/* and /team-public/* internally
router.use('/', teamRoutes);
router.use('/team-public', teamPublicRoutes);
router.use('/staff-shifts', staffShiftsRoutes);
router.use('/shift-gap-bridge', shiftGapBridgeRoutes);

export default router;
