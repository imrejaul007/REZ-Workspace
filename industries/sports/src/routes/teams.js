const express = require('express');
const router = express.Router();

let teams = [
  { id: '1', name: 'Mumbai Warriors', sport: 'cricket', league: 'IPL', rank: 3, wins: 8, losses: 4 },
  { id: '2', name: 'Delhi Dynamite', sport: 'cricket', league: 'IPL', rank: 1, wins: 10, losses: 2 },
  { id: '3', name: 'Bangalore Royals', sport: 'cricket', league: 'IPL', rank: 5, wins: 6, losses: 6 },
  { id: '4', name: 'Chennai Kings', sport: 'cricket', league: 'IPL', rank: 2, wins: 9, losses: 3 }
];

// GET all teams
router.get('/', (req, res) => {
  res.json(teams);
});

// GET single team
router.get('/:id', (req, res) => {
  const team = teams.find(t => t.id === req.params.id);
  if (!team) return res.status(404).json({ error: 'Team not found' });
  res.json(team);
});

// POST new team
router.post('/', (req, res) => {
  const newTeam = {
    id: String(teams.length + 1),
    name: req.body.name,
    sport: req.body.sport,
    league: req.body.league,
    rank: req.body.rank || 0,
    wins: req.body.wins || 0,
    losses: req.body.losses || 0
  };
  teams.push(newTeam);
  res.status(201).json(newTeam);
});

// PUT update team
router.put('/:id', (req, res) => {
  const index = teams.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Team not found' });
  teams[index] = { ...teams[index], ...req.body };
  res.json(teams[index]);
});

// DELETE team
router.delete('/:id', (req, res) => {
  const index = teams.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Team not found' });
  teams.splice(index, 1);
  res.json({ message: 'Team deleted successfully' });
});

module.exports = router;