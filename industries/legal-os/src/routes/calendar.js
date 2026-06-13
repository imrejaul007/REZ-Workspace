/**
 * Legal OS - Calendar Management Routes
 */

const express = require('express');
const router = express.Router();

// In-memory calendar storage
let events = [
  {
    id: 'event-001',
    title: 'Court Hearing',
    type: 'court',
    caseId: 'case-001',
    startTime: '2024-03-15T09:00:00Z',
    endTime: '2024-03-15T11:00:00Z',
    location: 'Courtroom 3',
    attendees: ['attorney-001', 'client-001'],
    reminder: true,
    status: 'scheduled',
    createdAt: new Date().toISOString()
  }
];

// GET /api/calendar - List all events
router.get('/', (req, res) => {
  const { caseId, type, startDate, endDate } = req.query;
  let filtered = [...events];

  if (caseId) filtered = filtered.filter(e => e.caseId === caseId);
  if (type) filtered = filtered.filter(e => e.type === type);
  if (startDate) filtered = filtered.filter(e => e.startTime >= startDate);
  if (endDate) filtered = filtered.filter(e => e.endTime <= endDate);

  res.json({ events: filtered, count: filtered.length });
});

// GET /api/calendar/:id - Get event by ID
router.get('/:id', (req, res) => {
  const event = events.find(e => e.id === req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

// POST /api/calendar - Create new event
router.post('/', (req, res) => {
  const { title, type, caseId, startTime, endTime, location, attendees } = req.body;

  if (!title || !startTime) {
    return res.status(400).json({ error: 'title and startTime are required' });
  }

  const newEvent = {
    id: `event-${Date.now()}`,
    title,
    type: type || 'general',
    caseId: caseId || null,
    startTime,
    endTime: endTime || startTime,
    location: location || null,
    attendees: attendees || [],
    reminder: true,
    status: 'scheduled',
    createdAt: new Date().toISOString()
  };

  events.push(newEvent);
  res.status(201).json(newEvent);
});

// PUT /api/calendar/:id - Update event
router.put('/:id', (req, res) => {
  const index = events.findIndex(e => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Event not found' });

  events[index] = { ...events[index], ...req.body, updatedAt: new Date().toISOString() };
  res.json(events[index]);
});

// DELETE /api/calendar/:id - Delete event
router.delete('/:id', (req, res) => {
  const index = events.findIndex(e => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Event not found' });

  events.splice(index, 1);
  res.json({ message: 'Event deleted successfully' });
});

// GET /api/calendar/upcoming - Get upcoming events
router.get('/upcoming/list', (req, res) => {
  const now = new Date().toISOString();
  const upcoming = events.filter(e => e.startTime >= now).sort((a, b) => a.startTime.localeCompare(b.startTime));

  res.json({ events: upcoming, count: upcoming.length });
});

module.exports = router;