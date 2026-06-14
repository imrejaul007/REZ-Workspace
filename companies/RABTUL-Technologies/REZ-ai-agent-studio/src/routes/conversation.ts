/**
 * AI Agent Studio - Conversation Routes
 */

import { Router } from 'express';
import mongoose from 'mongoose';
import { Conversation, Agent } from '../models';
import { agentService } from '../services/agentService';

const router = Router();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-agent-studio';

/**
 * GET /api/conversations - List conversations
 */
router.get('/', async (req, res) => {
  try {
    await mongoose.connect(MONGODB_URI);
    const { agentId, userId, status, limit = 50 } = req.query;

    const query: unknown = {};
    if (agentId) query.agentId = agentId;
    if (userId) query.userId = userId;
    if (status) query.status = status;

    const conversations = await Conversation.find(query)
      .populate('agentId', 'name type')
      .sort({ lastMessageAt: -1 })
      .limit(Number(limit));

    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/conversations/:id - Get conversation
 */
router.get('/:id', async (req, res) => {
  try {
    await mongoose.connect(MONGODB_URI);
    const conversation = await Conversation.findById(req.params.id)
      .populate('agentId', 'name type systemPrompt');

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ conversation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/conversations/:id/end - End conversation
 */
router.post('/:id/end', async (req, res) => {
  try {
    await mongoose.connect(MONGODB_URI);
    const { rating, feedback } = req.body;

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    await agentService.endConversation(conversation.sessionId, rating, feedback);

    const updated = await Conversation.findById(req.params.id);
    res.json({ conversation: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
