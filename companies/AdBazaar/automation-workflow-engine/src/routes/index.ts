import { Router } from 'express';
import workflowRoutes from './workflowRoutes';
import executionRoutes from './executionRoutes';

const router = Router();

router.use('/workflows', workflowRoutes);
router.use('/executions', executionRoutes);

export default router;