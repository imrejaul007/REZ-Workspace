import { Router } from 'express';
import { propertyTwinController } from '../controllers/property-twin.controller';

const router = Router();

// Property Twin routes
router.post('/property', (req, res) => propertyTwinController.createPropertyTwin(req, res));
router.get('/property/:id', (req, res) => propertyTwinController.getPropertyTwin(req, res));
router.put('/property/:id', (req, res) => propertyTwinController.updatePropertyTwin(req, res));
router.post('/property/:id/venue', (req, res) => propertyTwinController.addVenue(req, res));
router.put('/property/:id/venue/:venueId', (req, res) => propertyTwinController.updateVenue(req, res));
router.delete('/property/:id/venue/:venueId', (req, res) => propertyTwinController.removeVenue(req, res));
router.post('/property/:id/revenue-center', (req, res) => propertyTwinController.addRevenueCenter(req, res));
router.put('/property/:id/stats', (req, res) => propertyTwinController.updateStats(req, res));
router.put('/property/:id/policies', (req, res) => propertyTwinController.updatePolicies(req, res));
router.get('/property/:id/summary', (req, res) => propertyTwinController.getPropertySummary(req, res));
router.get('/property/:id/revenue', (req, res) => propertyTwinController.getTotalRevenue(req, res));
router.get('/property/brand/:brand', (req, res) => propertyTwinController.getPropertiesByBrand(req, res));
router.get('/property/city/:city', (req, res) => propertyTwinController.getPropertiesByCity(req, res));

export default router;
