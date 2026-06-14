import { Router, Request, Response } from 'express';
import { Ticket } from '../models/ticket.model';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const ticket = new Ticket({ ticketId: `TKT_${Date.now()}`, ...req.body });
  await ticket.save();
  res.json({ success: true, ticket });
});

router.get('/', async (req: Request, res: Response) => {
  const { userId, status } = req.query;
  const query: any = {};
  if (userId) query.userId = userId;
  if (status) query.status = status;
  const tickets = await Ticket.find(query).sort({ createdAt: -1 });
  res.json({ success: true, tickets });
});

router.get('/:ticketId', async (req: Request, res: Response) => {
  const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
  res.json({ success: !!ticket, ticket });
});

router.patch('/:ticketId/assign', async (req: Request, res: Response) => {
  const { agentId } = req.body;
  const ticket = await Ticket.findOneAndUpdate(
    { ticketId: req.params.ticketId },
    { assignedTo: agentId, status: 'pending' },
    { new: true }
  );
  res.json({ success: true, ticket });
});

router.patch('/:ticketId/resolve', async (req: Request, res: Response) => {
  const { resolution } = req.body;
  const ticket = await Ticket.findOneAndUpdate(
    { ticketId: req.params.ticketId },
    { status: 'resolved', resolution },
    { new: true }
  );
  res.json({ success: true, ticket });
});

export default router;
