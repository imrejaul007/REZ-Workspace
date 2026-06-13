const express = require('express');
const router = express.Router();

let matches = [
  { id: '1', gameId: '1', player1Id: 'P001', player2Id: 'P002', result: 'P001', date: '2024-06-10' },
  { id: '2', gameId: '3', player1Id: 'P003', player2Id: 'P004', result: 'P003', date: '2024-06-11' },
  { id: '3', gameId: '2', player1Id: 'P005', player2Id: 'P006', result: 'draw', date: '2024-06-12' }
];

// GET all matches
router.get('/', (req, res) => {
  res.json(matches);
});

// GET single match
router.get('/:id', (req, res) => {
  const match = matches.find(m => m.id === req.params.id);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  res.json(match);
});

// POST new match
router.post('/', (req, res) => {
  const newMatch = {
    id: String(matches.length + 1),
    gameId: req.body.gameId,
    player1Id: req.body.player1Id,
    player2Id: req.body.player2Id,
    result: req.body.result,
    date: req.body.date
  };
  matches.push(newMatch);
  res.status(201).json(newMatch);
});

// PUT update match
router.put('/:id', (req, res) => {
  const index = matches.findIndex(m => m.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Match not found' });
  matches[index] = { ...matches[index], ...req.body };
  res.json(matches[index]);
});

// DELETE match
router.delete('/:id', (req, res) => {
  const index = matches.findIndex(m => m.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Match not found' });
  matches.splice(index, 1);
  res.json({ message: 'Match deleted successfully' });
});

module.exports = router;