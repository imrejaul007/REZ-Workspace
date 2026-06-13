/**
 * Automotive OS - Vehicles Routes
 */

const express = require('express');
const router = express.Router();

let vehicles = [
  { id: 'VEH-001', make: 'Toyota', model: 'Camry', year: 2024, vin: '1HGBH41JXMN109186', mileage: 0, status: 'new', price: 2800000, color: 'White' },
  { id: 'VEH-002', make: 'Honda', model: 'Civic', year: 2023, vin: '2HGBH41JXMN109187', mileage: 15000, status: 'used', price: 1800000, color: 'Black' }
];

router.get('/', (req, res) => {
  const { make, status, year } = req.query;
  let filtered = [...vehicles];
  if (make) filtered = filtered.filter(v => v.make === make);
  if (status) filtered = filtered.filter(v => v.status === status);
  if (year) filtered = filtered.filter(v => v.year === parseInt(year));
  res.json({ vehicles: filtered, count: filtered.length });
});

router.get('/:id', (req, res) => {
  const vehicle = vehicles.find(v => v.id === req.params.id);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
  res.json(vehicle);
});

router.post('/', (req, res) => {
  const { make, model, year, vin, price, color } = req.body;
  if (!make || !model || !vin) return res.status(400).json({ error: 'make, model, vin required' });
  const newVehicle = { id: `VEH-${Date.now()}`, make, model, year: year || 2024, vin, mileage: 0, status: 'new', price: price || 0, color: color || 'White' };
  vehicles.push(newVehicle);
  res.status(201).json(newVehicle);
});

router.patch('/:id/mileage', (req, res) => {
  const vehicle = vehicles.find(v => v.id === req.params.id);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
  vehicle.mileage = req.body.mileage;
  res.json(vehicle);
});

module.exports = router;