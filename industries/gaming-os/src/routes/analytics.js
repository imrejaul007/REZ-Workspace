const express = require('express');
const router = express.Router();

// GET analytics overview
router.get('/', (req, res) => {
  res.json({
    totalPlayers: 50000000,
    activePlayers: 15000000,
    matchesPlayedToday: 2500000,
    peakConcurrentPlayers: 8500000,
    revenue: {
      daily: 2500000,
      monthly: 75000000
    },
    popularGames: ['League of Legends', 'Fortnite', 'Valorant'],
    averageMatchDuration: '25 minutes'
  });
});

// GET player analytics
router.get('/players', (req, res) => {
  res.json({
    totalPlayers: 50000000,
    newPlayersToday: 150000,
    retentionRate: 0.65,
    averageSessionDuration: '45 minutes',
    averageLevel: 35,
    topAchievements: ['Champion', 'Legend', 'Master']
  });
});

// GET tournament analytics
router.get('/tournaments', (req, res) => {
  res.json({
    totalTournaments: 1250,
    activeTournaments: 45,
    totalPrizePool: 25000000,
    averageParticipants: 128,
    completionRate: 0.92
  });
});

module.exports = router;