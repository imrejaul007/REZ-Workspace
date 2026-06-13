const express = require('express');
const router = express.Router();

// GET analytics overview
router.get('/', (req, res) => {
  res.json({
    totalTeams: 8,
    totalPlayers: 120,
    totalMatches: 60,
    totalVenues: 12,
    leagueStandings: { team1: 10, team2: 9, team3: 8 },
    averageAttendance: 28000,
    totalRevenue: 250000000
  });
});

// GET player analytics
router.get('/players', (req, res) => {
  res.json({
    topScorers: [
      { player: 'Rohit Das', runs: 520 },
      { player: 'Virat Sharma', runs: 450 },
      { player: 'Shubman Gill', runs: 420 }
    ],
    topWicketTakers: [
      { player: 'Jasprit Bumrah', wickets: 25 },
      { player: 'Mohammed Shami', wickets: 22 }
    ],
    averageBattingStrike: 138,
    averageBowlingEconomy: 7.8
  });
});

// GET match analytics
router.get('/matches', (req, res) => {
  res.json({
    totalMatches: 60,
    completedMatches: 45,
    totalRunsScored: 12500,
    averageScore: 278,
    highestScore: 245,
    mostCommonResult: 'home_win',
    winRateHome: 0.58
  });
});

module.exports = router;