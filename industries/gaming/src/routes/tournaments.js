const express = require('express');
const router = express.Router();

let tournaments = [
  { id: '1', name: 'World Championship 2024', gameId: '1', prize: 5000000, status: 'upcoming', participants: 128 },
  { id: '2', name: 'Spring Cup', gameId: '3', prize: 100000, status: 'ongoing', participants: 64 },
  { id: '3', name: 'Amateur League', gameId: '2', prize: 25000, status: 'completed', participants: 256 }
];

// GET all tournaments
router.get('/', (req, res) => {
  res.json(tournaments);
});

// GET single tournament
router.get('/:id', (req, res) => {
  const tournament = tournaments.find(t => t.id === req.params.id);
  if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
  res.json(tournament);
});

// POST new tournament
router.post('/', (req, res) => {
  const newTournament = {
    id: String(tournaments.length + 1),
    name: req.body.name,
    gameId: req.body.gameId,
    prize: req.body.prize,
    status: req.body.status || 'upcoming',
    participants: req.body.participants || 0
  };
  tournaments.push(newTournament);
  res.status(201).json(newTournament);
});

// PUT update tournament
router.put('/:id', (req, res) => {
  const index = tournaments.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Tournament not found' });
  tournaments[index] = { ...tournaments[index], ...req.body };
  res.json(tournaments[index]);
});

// DELETE tournament
router.delete('/:id', (req, res) => {
  const index = tournaments.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Tournament not found' });
  tournaments.splice(index, 1);
  res.json({ message: 'Tournament deleted successfully' });
});

module.exports = router;