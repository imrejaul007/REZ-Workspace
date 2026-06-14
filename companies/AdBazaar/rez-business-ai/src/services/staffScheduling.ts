/**
 * REZ Business AI - Staff Scheduling
 * Optimize staff based on demand
 */

const express = require('express');
const router = express.Router();
const { randomInt } = require('crypto');

// In-memory storage
const schedules = new Map();
const staff = new Map();

// ============== STAFF ==============

router.get('/staff', (req, res) => {
  const { merchantId } = req.query;
  let list = Array.from(staff.values());
  if (merchantId) {
    list = list.filter(s => s.merchantId === merchantId);
  }
  res.json({ staff: list });
});

router.post('/staff', (req, res) => {
  const { merchantId, name, role, availability } = req.body;
  const id = 'staff_' + Date.now();
  const member = {
    id,
    merchantId,
    name,
    role,
    availability,
    hoursThisWeek: 0,
    costPerHour: 200,
  };
  staff.set(id, member);
  res.json({ success: true, staff: member });
});

// ============== SCHEDULING ==============

// Generate optimal schedule
router.post('/schedule/generate', (req, res) => {
  const { merchantId, date } = req.body;

  // Mock generated schedule
  const schedule = {
    date: date || new Date().toISOString().split('T')[0],
    shifts: [
      { time: '9:00-14:00', staff: ['staff_1'], coverage: 85 },
      { time: '14:00-18:00', staff: ['staff_1', 'staff_2'], coverage: 100 },
      { time: '18:00-22:00', staff: ['staff_2', 'staff_3'], coverage: 95 },
    ],
    totalHours: 13,
    estimatedCost: 2600,
    coverageScore: 93,
  };

  schedules.set(`${merchantId}_${date}`, schedule);
  res.json({ success: true, schedule });
});

// Get schedule
router.get('/schedule', (req, res) => {
  const { merchantId, date } = req.query;
  const key = `${merchantId}_${date}`;
  const schedule = schedules.get(key);

  if (!schedule) {
    return res.json({
      date,
      shifts: [],
      totalHours: 0,
      estimatedCost: 0,
    });
  }

  res.json(schedule);
});

// Optimize schedule
router.post('/schedule/optimize', (req, res) => {
  const { merchantId, targetCoverage, budget } = req.body;

  res.json({
    currentCost: 2600,
    optimizedCost: 2400,
    savings: 200,
    changes: [
      { shift: '9:00-14:00', action: 'reduce', reason: 'Low demand period' },
      { shift: '18:00-22:00', action: 'add', reason: 'Peak hours need coverage' },
    ],
    coverage: 95,
  });
});

// ============== FORECAST ==============

router.get('/forecast/:merchantId', (req, res) => {
  const { days = 7 } = req.query;
  const forecasts = [];

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    forecasts.push({
      date: date.toISOString().split('T')[0],
      predictedDemand: 80 + randomInt(0, 40),
      recommendedStaff: 3 + randomInt(0, 2),
      estimatedCost: 2500 + randomInt(0, 1000),
    });
  }

  res.json({ forecasts });
});

module.exports = router;
