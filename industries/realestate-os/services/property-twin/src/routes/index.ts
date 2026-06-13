import { Router } from 'express';
import propertyTwinRoutes from './property-twin.routes';

const router = Router();

// Mount routes
router.use('/property', propertyTwinRoutes);

export default router;
