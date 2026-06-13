const express = require('express');
const router = express.Router();

let players = [
  { id: '1', name: 'Virat Sharma', teamId: '1', position: 'batsman', stats: { runs: 450, average: 56.2, strikeRate: 142 } },
  { id: '2', name: 'Rohit Das', teamId: '2', position: 'captain', stats: { runs: 520, average: 65.0, strikeRate: 138 } },
  { id: '3', name: 'Jasprit Bumrah', teamId: '1', position: 'bowler', stats: { wickets: 25, economy: 7.2, overs: 45 } },
  { id: '4', name: 'MS Dhoni', teamId: '4', position: 'wicketkeeper', stats: { runs: 380, average: 47.5, stumpings: 15 } }
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
    teamId: req.body.teamId,
    position: req.body.position,
    stats: req.body.stats || {}
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