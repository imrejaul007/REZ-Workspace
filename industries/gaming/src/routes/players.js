const express = require('express');
const router = express.Router();

let players = [
  { id: '1', name: 'ProGamer123', username: 'PG123', level: 85, xp: 125000, achievements: ['Champion', 'SpeedRunner'] },
  { id: '2', name: 'ElitePlayer', username: 'ELITE', level: 92, xp: 180000, achievements: ['Legend', 'Champion', 'Master'] },
  { id: '3', name: 'CasualGamer', username: 'CASUAL', level: 45, xp: 45000, achievements: ['Beginner'] }
];

// GET all players
router.get('/', (req, res) => {
  res.json(players);
});

// GET single player
router.get('/:id', (req, res) => {
  const player = players.find(p => p.id === req.params.id);
  if (!player) return res.status(404).json({ error: 'Player not found' });
  res.json(player);
});

// POST new player
router.post('/', (req, res) => {
  const newPlayer = {
    id: String(players.length + 1),
    name: req.body.name,
    username: req.body.username,
    level: req.body.level || 1,
    xp: req.body.xp || 0,
    achievements: req.body.achievements || []
  };
  players.push(newPlayer);
  res.status(201).json(newPlayer);
});

// PUT update player
router.put('/:id', (req, res) => {
  const index = players.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Player not found' });
  players[index] = { ...players[index], ...req.body };
  res.json(players[index]);
});

// DELETE player
router.delete('/:id', (req, res) => {
  const index = players.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Player not found' });
  players.splice(index, 1);
  res.json({ message: 'Player deleted successfully' });
});

module.exports = router;