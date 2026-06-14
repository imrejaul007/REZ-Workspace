import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { teamRegistry } from '../index.js';

const router = express.Router();

/**
 * GET /api/teams
 * List all teams
 */
router.get('/', async (req, res) => {
  try {
    const { industry } = req.query;

    let teams = Array.from(teamRegistry.values());
    if (industry) teams = teams.filter(t => t.industry === industry);

    res.json({
      success: true,
      count: teams.length,
      teams
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/teams
 * Create a team
 */
router.post('/', async (req, res) => {
  try {
    const { name, industry, members = [], config = {} } = req.body;

    if (!name || !industry) {
      return res.status(400).json({
        success: false,
        error: 'Name and industry are required'
      });
    }

    const teamId = `team_${uuidv4()}`;
    const team = {
      id: teamId,
      name,
      industry,
      members,
      status: 'active',
      config,
      createdAt: new Date().toISOString()
    };

    teamRegistry.set(teamId, team);

    res.status(201).json({
      success: true,
      team
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/teams/:id
 * Get team details
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const team = teamRegistry.get(id);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    res.json({
      success: true,
      team
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/teams/:id/members
 * Add member to team
 */
router.post('/:id/members', async (req, res) => {
  try {
    const { id } = req.params;
    const { agentId, role } = req.body;

    const team = teamRegistry.get(id);
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    team.members.push({ agentId, role, addedAt: new Date().toISOString() });
    teamRegistry.set(id, team);

    res.json({
      success: true,
      team
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
