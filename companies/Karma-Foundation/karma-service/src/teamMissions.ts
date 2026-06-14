/**
 * Karma Team Missions & City Leaderboards
 *
 * Features:
 * - Team/group missions
 * - City/neighborhood competitions
 * - Community challenges
 * - Team rankings
 */

import express from 'express';

const router = express.Router();

// ============================================
// TYPES
// ============================================

interface Team {
  id: string;
  name: string;
  type: 'community' | 'corporate' | 'friends' | 'college';
  members: string[];
  karma_score: number;
  rank: number;
  city?: string;
  created_at: string;
}

interface TeamMission {
  id: string;
  name: string;
  description: string;
  type: 'cleanup' | 'planting' | 'donation' | 'volunteering' | 'awareness';
  target: number;
  progress: number;
  team_ids: string[];
  deadline: string;
  reward: { points: number; badge: string };
  status: 'active' | 'completed' | 'failed';
}

interface CityLeaderboard {
  city: string;
  teams: Team[];
  total_karma: number;
  active_missions: number;
  updated_at: string;
}

interface City {
  id: string;
  name: string;
  state?: string;
  country: string;
  karma_score: number;
  rank: number;
}

// In-memory stores
const teams = new Map<string, Team>();
const teamMissions = new Map<string, TeamMission>();
const cityLeaderboards = new Map<string, CityLeaderboard>();
const cities = new Map<string, City>();

// ============================================
// TEAM MANAGEMENT
// ============================================

/**
 * POST /api/karma/teams
 * Create a team
 */
router.post('/teams', async (req, res) => {
  const { name, type, members, city } = req.body;

  const team: Team = {
    id: `team_${Date.now()}`,
    name,
    type,
    members: members || [req.userId],
    karma_score: 0,
    rank: 0,
    city,
    created_at: new Date().toISOString()
  };

  teams.set(team.id, team);

  res.status(201).json({ team });
});

/**
 * GET /api/karma/teams
 * List teams
 */
router.get('/teams', async (req, res) => {
  const { type, city, sort } = req.query;

  let list = Array.from(teams.values());

  if (type) list = list.filter(t => t.type === type);
  if (city) list = list.filter(t => t.city === city);

  // Sort by karma
  list.sort((a, b) => b.karma_score - a.karma_score);

  // Update ranks
  list.forEach((t, i) => t.rank = i + 1);

  res.json({ teams: list });
});

/**
 * GET /api/karma/teams/:id
 * Get team details
 */
router.get('/teams/:id', async (req, res) => {
  const team = teams.get(req.params.id);

  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }

  // Get team missions
  const missions = Array.from(teamMissions.values())
    .filter(m => m.team_ids.includes(team.id));

  res.json({ team, missions });
});

/**
 * POST /api/karma/teams/:id/join
 * Join a team
 */
router.post('/teams/:id/join', async (req, res) => {
  const team = teams.get(req.params.id);

  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }

  const userId = req.userId;

  if (team.members.includes(userId)) {
    return res.status(400).json({ error: 'Already a member' });
  }

  team.members.push(userId);

  res.json({ success: true, team });
});

/**
 * POST /api/karma/teams/:id/leave
 * Leave a team
 */
router.post('/teams/:id/leave', async (req, res) => {
  const team = teams.get(req.params.id);

  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }

  team.members = team.members.filter(m => m !== req.userId);

  res.json({ success: true, team });
});

// ============================================
// TEAM MISSIONS
// ============================================

/**
 * POST /api/karma/team-missions
 * Create team mission
 */
router.post('/team-missions', async (req, res) => {
  const { name, description, type, target, team_ids, deadline, reward } = req.body;

  const mission: TeamMission = {
    id: `tmiss_${Date.now()}`,
    name,
    description,
    type,
    target,
    progress: 0,
    team_ids,
    deadline,
    reward,
    status: 'active'
  };

  teamMissions.set(mission.id, mission);

  res.status(201).json({ mission });
});

/**
 * GET /api/karma/team-missions
 * List active missions
 */
router.get('/team-missions', async (req, res) => {
  const { type, status, team_id } = req.query;

  let list = Array.from(teamMissions.values());

  if (type) list = list.filter(m => m.type === type);
  if (status) list = list.filter(m => m.status === status);
  if (team_id) list = list.filter(m => m.team_ids.includes(team_id as string));

  res.json({ missions: list });
});

/**
 * POST /api/karma/team-missions/:id/progress
 * Update mission progress
 */
router.post('/team-missions/:id/progress', async (req, res) => {
  const { increment, user_id } = req.body;

  const mission = teamMissions.get(req.params.id);

  if (!mission) {
    return res.status(404).json({ error: 'Mission not found' });
  }

  mission.progress += increment;

  // Check if completed
  if (mission.progress >= mission.target) {
    mission.status = 'completed';

    // Award all team members
    for (const teamId of mission.team_ids) {
      const team = teams.get(teamId);
      if (team) {
        team.karma_score += mission.reward.points;
      }
    }
  }

  res.json({ success: true, mission });
});

// ============================================
// CITY LEADERBOARDS
// ============================================

/**
 * GET /api/karma/cities
 * List all cities
 */
router.get('/cities', async (req, res) => {
  const { country, state } = req.query;

  let list = Array.from(cities.values());

  if (country) list = list.filter(c => c.country === country);
  if (state) list = list.filter(c => c.state === state);

  // Sort by karma
  list.sort((a, b) => b.karma_score - a.karma_score);

  // Update ranks
  list.forEach((c, i) => c.rank = i + 1);

  res.json({ cities: list });
});

/**
 * GET /api/karma/cities/:city/leaderboard
 * Get city leaderboard
 */
router.get('/cities/:city/leaderboard', async (req, res) => {
  const { city } = req.params;

  // Get or create leaderboard
  let leaderboard = cityLeaderboards.get(city);

  if (!leaderboard) {
    leaderboard = {
      city,
      teams: [],
      total_karma: 0,
      active_missions: 0,
      updated_at: new Date().toISOString()
    };
    cityLeaderboards.set(city, leaderboard);
  }

  // Get teams in this city
  const cityTeams = Array.from(teams.values())
    .filter(t => t.city === city)
    .sort((a, b) => b.karma_score - a.karma_score)
    .slice(0, 50);

  leaderboard.teams = cityTeams;
  leaderboard.total_karma = cityTeams.reduce((sum, t) => sum + t.karma_score, 0);

  res.json({ leaderboard });
});

/**
 * GET /api/karma/leaderboard/global
 * Global team leaderboard
 */
router.get('/leaderboard/global', async (req, res) => {
  const { limit = 100 } = req.query;

  const allTeams = Array.from(teams.values())
    .sort((a, b) => b.karma_score - a.karma_score)
    .slice(0, Number(limit));

  res.json({
    leaderboard: allTeams.map((t, i) => ({ ...t, rank: i + 1 })),
    total_teams: teams.size
  });
});

/**
 * GET /api/karma/leaderboard/cities
 * Cities competition leaderboard
 */
router.get('/leaderboard/cities', async (req, res) => {
  const allCities = Array.from(cities.values())
    .sort((a, b) => b.karma_score - a.karma_score);

  res.json({
    cities: allCities.map((c, i) => ({ ...c, rank: i + 1 })),
    total_cities: cities.size
  });
});

// ============================================
// CITY COMPETITIONS
// ============================================

/**
 * POST /api/karma/city-challenge
 * Start city vs city challenge
 */
router.post('/city-challenge', async (req, res) => {
  const { city1, city2, mission_type, duration_days } = req.body;

  const challenge = {
    id: `chal_${Date.now()}`,
    cities: [city1, city2],
    type: mission_type,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + duration_days * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active'
  };

  res.status(201).json({ challenge });
});

/**
 * GET /api/karma/city-challenges
 * List active challenges
 */
router.get('/city-challenges', async (req, res) => {
  const challenges = [];

  res.json({ challenges });
});

// ============================================
// NEIGHBORHOOD LEADERBOARDS
// ============================================

/**
 * GET /api/karma/neighborhood/:area
 * Get neighborhood leaderboard
 */
router.get('/neighborhood/:area', async (req, res) => {
  const { area } = req.params;

  const neighborhoodTeams = Array.from(teams.values())
    .filter(t => t.city?.includes(area))
    .sort((a, b) => b.karma_score - a.karma_score);

  res.json({
    area,
    teams: neighborhoodTeams.slice(0, 20),
    total_karma: neighborhoodTeams.reduce((sum, t) => sum + t.karma_score, 0)
  });
});

// ============================================
// COLLEGE/INSTITUTION LEADERBOARDS
// ============================================

/**
 * GET /api/karma/colleges
 * List colleges
 */
router.get('/colleges', async (req, res) => {
  const collegeTeams = Array.from(teams.values())
    .filter(t => t.type === 'college')
    .sort((a, b) => b.karma_score - a.karma_score);

  res.json({
    colleges: collegeTeams.map((t, i) => ({ ...t, rank: i + 1 }))
  });
});

// ============================================
// HELPERS
// ============================================

function calculateTeamKarma(team: Team): number {
  return team.members.length * 100; // Simplified
}

export default router;
