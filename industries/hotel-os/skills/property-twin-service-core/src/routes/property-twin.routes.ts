import { Router } from 'express';
import { propertyTwinController } from '../controllers/property-twin.controller';

const router = Router();

// Property Twin routes
router.post('/', propertyTwinController.createPropertyTwin.bind(propertyTwinController));
router.get('/:id', propertyTwinController.getPropertyTwin.bind(propertyTwinController));
router.post('/:id/venues', propertyTwinController.addVenue.bind(propertyTwinController));
router.put('/:id/venues', propertyTwinController.updateVenue.bind(propertyTwinController));
router.put('/:id/revenue', propertyTwinController.updateRevenue.bind(propertyTwinController));
router.put('/:id/inventory', propertyTwinController.updateInventory.bind(propertyTwinController));
router.put('/:id/staff', propertyTwinController.updateStaff.bind(propertyTwinController));
router.put('/:id/settings', propertyTwinController.updateSettings.bind(propertyTwinController));
router.get('/:id/performance', propertyTwinController.getPerformanceSummary.bind(propertyTwinController));
router.delete('/:id', propertyTwinController.deletePropertyTwin.bind(propertyTwinController));

export default router;
