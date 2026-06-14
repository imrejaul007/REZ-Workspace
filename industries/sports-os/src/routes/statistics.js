const express = require('express');
const router = express.Router();

let statistics = [
  { id: '1', playerId: '2', matchId: '1', runs: 85, balls: 50, fours: 10, sixes: 3, wicketTaken: 0 },
  { id: '2', playerId: '1', matchId: '1', runs: 72, balls: 45, fours: 8, sixes: 2, wicketTaken: 0 },
  { id: '3', playerId: '3', matchId: '1', runs: 0, balls: 5, fours: 0, sixes: 0, wicketTaken: 3 }
];

// GET all statistics
router.get('/', (req, res) => {
  res.json(statistics);
});

// GET single statistics
router.get('/:id', (req, res) => {
  const stat = statistics.find(s => s.id === req.params.id);
  if (!stat) return res.status(404).json({ error: 'Statistics not found' });
  res.json(stat);
});

// POST new statistics
router.post('/', (req, res) => {
  const newStat = {
    id: String(statistics.length + 1),
    playerId: req.body.playerId,
    matchId: req.body.matchId,
    runs: req.body.runs || 0,
    balls: req.body.balls || 0,
    fours: req.body.fours || 0,
    sixes: req.body.sixes || 0,
    wicketTaken: req.body.wicketTaken || 0
  };
  statistics.push(newStat);
  res.status(201).json(newStat);
});

// PUT update statistics
router.put('/:id', (req, res) => {
  const index = statistics.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Statistics not found' });
  statistics[index] = { ...statistics[index], ...req.body };
  res.json(statistics[index]);
});

// DELETE statistics
router.delete('/:id', (req, res) => {
  const index = statistics.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Statistics not found' });
  statistics.splice(index, 1);
  res.json({ message: 'Statistics deleted successfully' });
});

module.exports = router;