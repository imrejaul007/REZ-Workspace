/**
 * Transport OS - Vehicles Routes
 */

const express = require('express');
const router = express.Router();

let vehicles = [
  { id: 'VEH-001', plateNumber: 'ABC-1234', type: 'sedan', model: 'Toyota Camry', year: 2023, mileage: 15000, status: 'active', driverId: 'DRV-001' },
  { id: 'VEH-002', plateNumber: 'XYZ-5678', type: 'suv', model: 'Honda CRV', year: 2024, mileage: 5000, status: 'active', driverId: 'DRV-002' }
];

router.get('/', (req, res) => {
  const { type, status } = req.query;
  let filtered = [...vehicles];
  if (type) filtered = filtered.filter(v => v.type === type);
  if (status) filtered = filtered.filter(v => v.status === status);
  res.json({ vehicles: filtered, count: filtered.length });
});

router.get('/:id', (req, res) => {
  const vehicle = vehicles.find(v => v.id === req.params.id);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
  res.json(vehicle);
});

router.post('/', (req, res) => {
  const { plateNumber, type, model, year } = req.body;
  if (!plateNumber || !type) return res.status(400).json({ error: 'plateNumber and type required' });
  const newVehicle = { id: `VEH-${Date.now()}`, plateNumber, type, model: model || '', year: year || 2024, mileage: 0, status: 'active', driverId: null };
  vehicles.push(newVehicle);
  res.status(201).json(newVehicle);
});

router.patch('/:id/status', (req, res) => {
  const vehicle = vehicles.find(v => v.id === req.params.id);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
  vehicle.status = req.body.status;
  res.json(vehicle);
});

module.exports = router;