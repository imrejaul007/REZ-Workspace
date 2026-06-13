const express = require('express');
const router = express.Router();

let tickets = [
  { id: '1', eventId: '1', type: 'vip', price: 300, sold: 500, available: 2000 },
  { id: '2', eventId: '1', type: 'standard', price: 150, sold: 8000, available: 7000 },
  { id: '3', eventId: '2', type: 'standard', price: 50, sold: 450, available: 50 },
  { id: '4', eventId: '3', type: 'vip', price: 250, sold: 1000, available: 4000 },
  { id: '5', eventId: '4', type: 'standard', price: 75, sold: 200, available: 0 }
];

// GET all tickets
router.get('/', (req, res) => {
  res.json(tickets);
});

// GET single ticket
router.get('/:id', (req, res) => {
  const ticket = tickets.find(t => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  res.json(ticket);
});

// POST new ticket
router.post('/', (req, res) => {
  const newTicket = {
    id: String(tickets.length + 1),
    eventId: req.body.eventId,
    type: req.body.type,
    price: req.body.price,
    sold: req.body.sold || 0,
    available: req.body.available || 0
  };
  tickets.push(newTicket);
  res.status(201).json(newTicket);
});

// PUT update ticket
router.put('/:id', (req, res) => {
  const index = tickets.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Ticket not found' });
  tickets[index] = { ...tickets[index], ...req.body };
  res.json(tickets[index]);
});

// DELETE ticket
router.delete('/:id', (req, res) => {
  const index = tickets.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Ticket not found' });
  tickets.splice(index, 1);
  res.json({ message: 'Ticket deleted successfully' });
});

module.exports = router;