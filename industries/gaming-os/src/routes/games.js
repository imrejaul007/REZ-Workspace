const express = require('express');
const router = express.Router();

let games = [
  { id: '1', name: 'League of Legends', genre: 'MOBA', platform: 'PC', rating: 4.5, players: 15000000 },
  { id: '2', name: 'Fortnite', genre: 'Battle Royale', platform: 'Multi', rating: 4.3, players: 12500000 },
  { id: '3', name: 'Valorant', genre: 'FPS', platform: 'PC', rating: 4.6, players: 8500000 }
];

// GET all games
router.get('/', (req, res) => {
  res.json(games);
});

// GET single game
router.get('/:id', (req, res) => {
  const game = games.find(g => g.id === req.params.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  res.json(game);
});

// POST new game
router.post('/', (req, res) => {
  const newGame = {
    id: String(games.length + 1),
    name: req.body.name,
    genre: req.body.genre,
    platform: req.body.platform,
    rating: req.body.rating || 0,
    players: req.body.players || 0
  };
  games.push(newGame);
  res.status(201).json(newGame);
});

// PUT update game
router.put('/:id', (req, res) => {
  const index = games.findIndex(g => g.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Game not found' });
  games[index] = { ...games[index], ...req.body };
  res.json(games[index]);
});

// DELETE game
router.delete('/:id', (req, res) => {
  const index = games.findIndex(g => g.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Game not found' });
  games.splice(index, 1);
  res.json({ message: 'Game deleted successfully' });
});

module.exports = router;