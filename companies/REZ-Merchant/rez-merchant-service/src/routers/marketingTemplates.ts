/**
 * Marketing templates domain router.
 */
import { Router } from 'express';
import marketingTemplatesRoutes from '../routes/marketingTemplates';

const router = Router();

router.use('/marketing/templates', marketingTemplatesRoutes);

export default router;
