/**
 * AI Agent Studio - Agent Routes
 */

import { Router } from 'express';
import mongoose from 'mongoose';
import { Agent, Conversation } from '../models';
import { agentService } from '../services/agentService';

const router = Router();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-agent-studio';

// ============================================
// AGENTS
// ============================================

/**
 * GET /api/agents - List agents
 */
router.get('/', async (req, res) => {
  try {
    await mongoose.connect(MONGODB_URI);
    const { userId, type, status, limit = 50 } = req.query;

    const query: unknown = {};
    if (userId) query.userId = userId;
    if (type) query.type = type;
    if (status) query.status = status;

    const agents = await Agent.find(query)
      .select('-trainingData -knowledgeBase')
      .sort({ updatedAt: -1 })
      .limit(Number(limit));

    res.json({ agents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/agents/:id - Get agent
 */
router.get('/:id', async (req, res) => {
  try {
    await mongoose.connect(MONGODB_URI);
    const agent = await Agent.findById(req.params.id)
      .select('-trainingData');

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json({ agent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/agents - Create agent
 */
router.post('/', async (req, res) => {
  try {
    await mongoose.connect(MONGODB_URI);
    const { name, description, userId, type, systemPrompt, personality, capabilities } = req.body;

    const agent = await Agent.create({
      name,
      description,
      userId,
      type: type || 'custom',
      systemPrompt: systemPrompt || 'You are a helpful assistant.',
      personality: personality || { tone: 'friendly', emoji: true },
      capabilities: capabilities || [],
    });

    res.status(201).json({ agent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/agents/:id - Update agent
 */
router.put('/:id', async (req, res) => {
  try {
    await mongoose.connect(MONGODB_URI);
    const agent = await Agent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const updates = req.body;
    Object.assign(agent, updates);
    await agent.save();

    res.json({ agent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/agents/:id/message - Send message to agent
 */
router.post('/:id/message', async (req, res) => {
  try {
    await mongoose.connect(MONGODB_URI);
    const { message, sessionId, userId, channel } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    const result = await agentService.sendMessage(
      req.params.id,
      message,
      { sessionId, userId, channel }
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/agents/:id/activate - Activate agent
 */
router.post('/:id/activate', async (req, res) => {
  try {
    await mongoose.connect(MONGODB_URI);
    const agent = await Agent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    agent.status = 'active';
    await agent.save();

    res.json({ agent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/agents/:id/pause - Pause agent
 */
router.post('/:id/pause', async (req, res) => {
  try {
    await mongoose.connect(MONGODB_URI);
    const agent = await Agent.findById(req.params.id);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    agent.status = 'paused';
    await agent.save();

    res.json({ agent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/agents/:id - Delete agent
 */
router.delete('/:id', async (req, res) => {
  try {
    await mongoose.connect(MONGODB_URI);
    await Agent.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
