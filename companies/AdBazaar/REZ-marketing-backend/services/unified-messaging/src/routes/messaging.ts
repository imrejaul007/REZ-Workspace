/**
 * Core Messaging Routes
 */

import { Router } from 'express';
import { Message } from '../types';

const router = Router();
const messages: Map<string, Message> = new Map();

router.get('/', (req, res) => {
  res.json({ success: true, data: Array.from(messages.values()) });
});

router.post('/', async (req, res) => {
  const message: Message = {
    id: `msg_${Date.now()}`,
    ...req.body,
    status: 'queued',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  messages.set(message.id, message);
  res.json({ success: true, data: message });
});

router.get('/:id', (req, res) => {
  const message = messages.get(req.params.id);
  if (!message) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, data: message });
});

router.patch('/:id/status', (req, res) => {
  const message = messages.get(req.params.id);
  if (!message) return res.status(404).json({ success: false, error: 'Not found' });
  message.status = req.body.status;
  message.updatedAt = new Date();
  messages.set(message.id, message);
  res.json({ success: true, data: message });
});

export default router;
