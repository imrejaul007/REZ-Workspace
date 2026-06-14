const express = require('express');
const router = express.Router();

let cards = [
  { id: '1', customerId: '1', type: 'credit', limit: 100000, balance: 25000 },
  { id: '2', customerId: '1', type: 'debit', limit: 50000, balance: 15000 },
  { id: '3', customerId: '2', type: 'credit', limit: 200000, balance: 45000 },
  { id: '4', customerId: '3', type: 'credit', limit: 75000, balance: 0 }
];

// GET all cards
router.get('/', (req, res) => {
  res.json(cards);
});

// GET single card
router.get('/:id', (req, res) => {
  const card = cards.find(c => c.id === req.params.id);
  if (!card) return res.status(404).json({ error: 'Card not found' });
  res.json(card);
});

// POST new card
router.post('/', (req, res) => {
  const newCard = {
    id: String(cards.length + 1),
    customerId: req.body.customerId,
    type: req.body.type,
    limit: req.body.limit || 0,
    balance: req.body.balance || 0
  };
  cards.push(newCard);
  res.status(201).json(newCard);
});

// PUT update card
router.put('/:id', (req, res) => {
  const index = cards.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Card not found' });
  cards[index] = { ...cards[index], ...req.body };
  res.json(cards[index]);
});

// DELETE card
router.delete('/:id', (req, res) => {
  const index = cards.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Card not found' });
  cards.splice(index, 1);
  res.json({ message: 'Card deleted successfully' });
});

module.exports = router;