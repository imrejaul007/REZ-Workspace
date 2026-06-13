/**
 * Transport OS - Drivers Routes
 */

const express = require('express');
const router = express.Router();

let drivers = [
  { id: 'DRV-001', name: 'Mike Johnson', phone: '9876543210', licenseNumber: 'DL-123456', vehicleId: 'VEH-001', rating: 4.8, trips: 150, status: 'active' },
  { id: 'DRV-002', name: 'Sarah Williams', phone: '9876543211', licenseNumber: 'DL-789012', vehicleId: 'VEH-002', rating: 4.9, trips: 200, status: 'active' }
];

router.get('/', (req, res) => {
  const { status } = req.query;
  let filtered = [...drivers];
  if (status) filtered = filtered.filter(d => d.status === status);
  res.json({ drivers: filtered, count: filtered.length });
});

router.get('/:id', (req, res) => {
  const driver = drivers.find(d => d.id === req.params.id);
  if (!driver) return res.status(404).json({ error: 'Driver not found' });
  res.json(driver);
});

router.post('/', (req, res) => {
  const { name, phone, licenseNumber } = req.body;
  if (!name || !licenseNumber) return res.status(400).json({ error: 'name and licenseNumber required' });
  const newDriver = { id: `DRV-${Date.now()}`, name, phone: phone || null, licenseNumber, vehicleId: null, rating: 0, trips: 0, status: 'active' };
  drivers.push(newDriver);
  res.status(201).json(newDriver);
});

module.exports = router;