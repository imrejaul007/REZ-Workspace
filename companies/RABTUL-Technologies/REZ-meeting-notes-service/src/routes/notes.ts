/**
 * REZ Meeting Notes Service - Notes Routes
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { MeetingNoteModel, IActionItem } from '../models/MeetingNote.js';
import logger from '../utils/logger.js';

const router = Router();

const CreateNoteSchema = z.object({
  title: z.string().min(1).max(500),
  type: z.enum(['discovery', 'demo', 'negotiation', 'check_in', 'standup', 'brainstorm', 'other']).default('other'),
  scheduledAt: z.string().datetime().optional(),
  hostId: z.string().min(1),
  hostName: z.string().optional(),
  attendees: z.array(z.object({ id: z.string(), name: z.string(), email: z.string().optional(), role: z.string().optional() })).optional(),
  agenda: z.string().optional(),
  dealId: z.string().optional(),
  dealName: z.string().optional(),
  companyId: z.string().optional(),
  companyName: z.string().optional(),
});

const UpdateNoteSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  type: z.enum(['discovery', 'demo', 'negotiation', 'check_in', 'standup', 'brainstorm', 'other']).optional(),
  startedAt: z.string().datetime().optional(),
  endedAt: z.string().datetime().optional(),
  agenda: z.string().optional(),
  sections: z.array(z.object({ title: z.string(), content: z.string(), type: z.string() })).optional(),
  summary: z.string().optional(),
  keyDecisions: z.array(z.string()).optional(),
  questionsRaised: z.array(z.string()).optional(),
  actionItems: z.array(z.object({ id: z.string().optional(), title: z.string(), assigneeId: z.string().optional(), assigneeName: z.string().optional(), dueDate: z.string().datetime().optional(), completed: z.boolean().optional() })).optional(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
  sentimentScore: z.number().optional(),
  topics: z.array(z.string()).optional(),
  insights: z.array(z.string()).optional(),
  recordingUrl: z.string().optional(),
  transcriptId: z.string().optional(),
});

const NoteQuerySchema = z.object({
  dealId: z.string().optional(),
  companyId: z.string().optional(),
  hostId: z.string().optional(),
  type: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

// POST /api/v1/notes - Create note
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'Missing tenant ID' }); return; }
    const validated = CreateNoteSchema.parse(req.body);
    const note = await MeetingNoteModel.create({ ...validated, tenantId, noteId: `note_${uuidv4().slice(0, 8)}` });
    logger.info('Meeting note created', { tenantId, noteId: note.noteId });
    res.status(201).json({ success: true, data: { note } });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ success: false, error: 'Validation error', details: error.errors }); return; }
    logger.error('Failed to create note', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to create note' });
  }
});

// GET /api/v1/notes - List notes
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'Missing tenant ID' }); return; }
    const validated = NoteQuerySchema.parse(req.query);
    const query: any = { tenantId };
    if (validated.dealId) query.dealId = validated.dealId;
    if (validated.companyId) query.companyId = validated.companyId;
    if (validated.hostId) query.hostId = validated.hostId;
    if (validated.type) query.type = validated.type;
    if (validated.startDate || validated.endDate) {
      query.scheduledAt = {};
      if (validated.startDate) query.scheduledAt.$gte = new Date(validated.startDate);
      if (validated.endDate) query.scheduledAt.$lte = new Date(validated.endDate);
    }
    const [notes, total] = await Promise.all([
      MeetingNoteModel.find(query).sort({ scheduledAt: -1 }).skip(validated.offset).limit(validated.limit),
      MeetingNoteModel.countDocuments(query),
    ]);
    res.json({ success: true, data: { notes, pagination: { offset: validated.offset, limit: validated.limit, total, hasMore: validated.offset + notes.length < total } } });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ success: false, error: 'Validation error', details: error.errors }); return; }
    logger.error('Failed to list notes', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to list notes' });
  }
});

// GET /api/v1/notes/:noteId - Get note
router.get('/:noteId', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { noteId } = req.params;
    if (!tenantId) { res.status(400).json({ success: false, error: 'Missing tenant ID' }); return; }
    const note = await MeetingNoteModel.findOne({ tenantId, noteId });
    if (!note) { res.status(404).json({ success: false, error: 'Note not found' }); return; }
    res.json({ success: true, data: { note } });
  } catch (error) { logger.error('Failed to get note', { error: (error as Error).message }); res.status(500).json({ success: false, error: 'Failed to get note' }); }
});

// PATCH /api/v1/notes/:noteId - Update note
router.patch('/:noteId', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const userId = req.headers['x-user-id'] as string;
    const { noteId } = req.params;
    if (!tenantId) { res.status(400).json({ success: false, error: 'Missing tenant ID' }); return; }
    const validated = UpdateNoteSchema.parse(req.body);
    const note = await MeetingNoteModel.findOneAndUpdate({ tenantId, noteId }, { ...validated, lastEditedBy: userId, lastEditedAt: new Date() }, { new: true });
    if (!note) { res.status(404).json({ success: false, error: 'Note not found' }); return; }
    if (validated.startedAt) note.startedAt = new Date(validated.startedAt);
    if (validated.endedAt) note.endedAt = new Date(validated.endedAt);
    if (note.startedAt && note.endedAt) note.duration = Math.round((note.endedAt.getTime() - note.startedAt.getTime()) / 60000);
    if (validated.actionItems) note.actionItems = validated.actionItems.map(a => ({ id: a.id || uuidv4(), title: a.title, assigneeId: a.assigneeId, assigneeName: a.assigneeName, dueDate: a.dueDate ? new Date(a.dueDate) : undefined, completed: a.completed || false }));
    await note.save();
    logger.info('Meeting note updated', { tenantId, noteId });
    res.json({ success: true, data: { note } });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ success: false, error: 'Validation error', details: error.errors }); return; }
    logger.error('Failed to update note', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Failed to update note' });
  }
});

// POST /api/v1/notes/:noteId/action-items - Add action item
router.post('/:noteId/action-items', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { noteId } = req.params;
    const { title, assigneeId, assigneeName, dueDate } = req.body as { title: string; assigneeId?: string; assigneeName?: string; dueDate?: string };
    if (!tenantId) { res.status(400).json({ success: false, error: 'Missing tenant ID' }); return; }
    const note = await MeetingNoteModel.findOne({ tenantId, noteId });
    if (!note) { res.status(404).json({ success: false, error: 'Note not found' }); return; }
    const actionItem: IActionItem = { id: uuidv4(), title, assigneeId, assigneeName, dueDate: dueDate ? new Date(dueDate) : undefined, completed: false };
    note.actionItems.push(actionItem);
    await note.save();
    res.status(201).json({ success: true, data: { actionItem } });
  } catch (error) { logger.error('Failed to add action item', { error: (error as Error).message }); res.status(500).json({ success: false, error: 'Failed to add action item' }); }
});

// PATCH /api/v1/notes/:noteId/action-items/:actionItemId - Update action item
router.patch('/:noteId/action-items/:actionItemId', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { noteId, actionItemId } = req.params;
    const { completed, dueDate, title } = req.body as { completed?: boolean; dueDate?: string; title?: string };
    if (!tenantId) { res.status(400).json({ success: false, error: 'Missing tenant ID' }); return; }
    const note = await MeetingNoteModel.findOne({ tenantId, noteId });
    if (!note) { res.status(404).json({ success: false, error: 'Note not found' }); return; }
    const item = note.actionItems.find(a => a.id === actionItemId);
    if (!item) { res.status(404).json({ success: false, error: 'Action item not found' }); return; }
    if (completed !== undefined) { item.completed = completed; if (completed) item.completedAt = new Date(); }
    if (dueDate) item.dueDate = new Date(dueDate);
    if (title) item.title = title;
    await note.save();
    res.json({ success: true, data: { actionItem: item } });
  } catch (error) { logger.error('Failed to update action item', { error: (error as Error).message }); res.status(500).json({ success: false, error: 'Failed to update action item' }); }
});

// GET /api/v1/notes/deal/:dealId - Get notes by deal
router.get('/deal/:dealId', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { dealId } = req.params;
    if (!tenantId) { res.status(400).json({ success: false, error: 'Missing tenant ID' }); return; }
    const notes = await MeetingNoteModel.find({ tenantId, dealId }).sort({ scheduledAt: -1 });
    res.json({ success: true, data: { notes, count: notes.length } });
  } catch (error) { logger.error('Failed to get deal notes', { error: (error as Error).message }); res.status(500).json({ success: false, error: 'Failed to get deal notes' }); }
});

// GET /api/v1/notes/upcoming - Get upcoming meetings
router.get('/upcoming/list', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { res.status(400).json({ success: false, error: 'Missing tenant ID' }); return; }
    const notes = await MeetingNoteModel.find({ tenantId, scheduledAt: { $gte: new Date() } }).sort({ scheduledAt: 1 }).limit(10);
    res.json({ success: true, data: { notes, count: notes.length } });
  } catch (error) { logger.error('Failed to get upcoming', { error: (error as Error).message }); res.status(500).json({ success: false, error: 'Failed to get upcoming notes' }); }
});

export default router;
