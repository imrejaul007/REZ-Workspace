const express = require('express');
const router = express.Router();

let leaderboards = [
  { id: '1', gameId: '1', period: 'season', rankings: [{ rank: 1, playerId: 'P001', score: 2500 }, { rank: 2, playerId: 'P002', score: 2400 }] },
  { id: '2', gameId: '3', period: 'monthly', rankings: [{ rank: 1, playerId: 'P003', score: 1850 }, { rank: 2, playerId: 'P004', score: 1800 }] }
];

// GET all leaderboards
router.get('/', (req, res) => {
  res.json(leaderboards);
});

// GET single leaderboard
router.get('/:id', (req, res) => {
  const leaderboard = leaderboards.find(l => l.id === req.params.id);
  if (!leaderboard) return res.status(404).json({ error: 'Leaderboard not found' });
  res.json(leaderboard);
});

// GET leaderboards by game
router.get('/game/:gameId', (req, res) => {
  const gameLeaderboards = leaderboards.filter(l => l.gameId === req.params.gameId);
  res.json(gameLeaderboards);
});

// POST new leaderboard
router.post('/', (req, res) => {
  const newLeaderboard = {
    id: String(leaderboards.length + 1),
    gameId: req.body.gameId,
    period: req.body.period,
    rankings: req.body.rankings || []
  };
  leaderboards.push(newLeaderboard);
  res.status(201).json(newLeaderboard);
});

// PUT update leaderboard
router.put('/:id', (req, res) => {
  const index = leaderboards.findIndex(l => l.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Leaderboard not found' });
  leaderboards[index] = { ...leaderboards[index], ...req.body };
  res.json(leaderboards[index]);
});

// DELETE leaderboard
router.delete('/:id', (req, res) => {
  const index = leaderboards.findIndex(l => l.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Leaderboard not found' });
  leaderboards.splice(index, 1);
  res.json({ message: 'Leaderboard deleted successfully' });
});

module.exports = router;