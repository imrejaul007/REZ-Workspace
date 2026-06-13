import { Router } from 'express';
import guestTwinRoutes from './guest-twin.routes';
import roomTwinRoutes from './room-twin.routes';
import propertyTwinRoutes from './property-twin.routes';

const router = Router();

// Twin routes
router.use('/guest', guestTwinRoutes);
router.use('/room', roomTwinRoutes);
router.use('/property', propertyTwinRoutes);

export default router;
