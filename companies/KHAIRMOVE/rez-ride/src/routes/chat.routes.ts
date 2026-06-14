import { Router, Request, Response } from 'express';
import { ChatService } from '../services/chat.service';

const router = Router();
const chat = new ChatService();

router.post('/', async (req: Request, res: Response) => {
  const { conversationId, message } = req.body;
  const msg = await chat.sendMessage(conversationId, message);
  res.json({ success: true, message: msg });
});

router.get('/:conversationId', async (req: Request, res: Response) => {
  const conv = await chat.getConversation(req.params.conversationId);
  res.json({ success: true, conversation: conv });
});

router.patch('/:conversationId/read', async (req: Request, res: Response) => {
  const { userId } = req.body;
  await chat.markRead(req.params.conversationId, userId);
  res.json({ success: true });
});

export default router;
