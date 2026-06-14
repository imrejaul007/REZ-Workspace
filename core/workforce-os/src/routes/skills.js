import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { skillsLibrary } from '../index.js';

const router = express.Router();

/**
 * GET /api/skills
 * List all skills
 */
router.get('/', async (req, res) => {
  try {
    const { industry, category } = req.query;

    let skills = Array.from(skillsLibrary.values());
    if (industry) skills = skills.filter(s => s.industry === industry);
    if (category) skills = skills.filter(s => s.category === category);

    res.json({
      success: true,
      count: skills.length,
      skills
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/skills
 * Create a skill
 */
router.post('/', async (req, res) => {
  try {
    const { name, category, industry, level = 1, config = {} } = req.body;

    if (!name || !category) {
      return res.status(400).json({
        success: false,
        error: 'Name and category are required'
      });
    }

    const skillId = `skill_${uuidv4()}`;
    const skill = {
      id: skillId,
      name,
      category,
      industry: industry || 'universal',
      level,
      config,
      createdAt: new Date().toISOString()
    };

    skillsLibrary.set(skillId, skill);

    res.status(201).json({
      success: true,
      skill
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
