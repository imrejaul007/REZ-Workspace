const express = require('express');
const router = express.Router();

let matches = [
  { id: '1', homeTeamId: '1', awayTeamId: '2', date: '2024-06-15', score: '185/6 vs 190/4', status: 'completed', winner: 'away' },
  { id: '2', homeTeamId: '3', awayTeamId: '4', date: '2024-06-16', score: 'pending', status: 'scheduled', winner: null },
  { id: '3', homeTeamId: '2', awayTeamId: '4', date: '2024-06-17', score: '200/3 vs 195/8', status: 'completed', winner: 'home' },
  { id: '4', homeTeamId: '1', awayTeamId: '3', date: '2024-06-18', score: 'pending', status: 'scheduled', winner: null }
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
    homeTeamId: req.body.homeTeamId,
    awayTeamId: req.body.awayTeamId,
    date: req.body.date,
    score: req.body.score || 'pending',
    status: req.body.status || 'scheduled',
    winner: req.body.winner || null
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