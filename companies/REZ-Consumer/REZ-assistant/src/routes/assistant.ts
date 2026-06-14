/**
 * REZ Assistant - Complete Assistant Service
 * Calendar, Tasks, Notes, Reminders, AI Chat
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

export const assistantRouter = Router();

// ============================================
// CALENDAR
// ============================================

const calendarEvents = new Map();

// Create event
assistantRouter.post('/calendar/events', asyncHandler(async (req: Request, res: Response) => {
  const { userId, title, description, startTime, endTime, location, attendees, recurrence, reminder } = req.body;

  if (!userId || !title || !startTime) {
    return res.status(400).json({ success: false, error: 'userId, title, startTime required' });
  }

  const event = {
    id: uuidv4(),
    userId,
    title,
    description,
    startTime: new Date(startTime),
    endTime: endTime ? new Date(endTime) : new Date(new Date(startTime).getTime() + 3600000),
    location,
    attendees: attendees || [],
    recurrence,
    reminder: reminder || 15,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  calendarEvents.set(event.id, event);

  res.json({ success: true, event });
}));

// Get events
assistantRouter.get('/calendar/events', asyncHandler(async (req: Request, res: Response) => {
  const { userId, startDate, endDate } = req.query;

  let events = Array.from(calendarEvents.values());

  if (userId) {
    events = events.filter((e: { userId: string }) => e.userId === userId);
  }

  if (startDate) {
    events = events.filter((e: { startTime: Date }) => new Date(e.startTime) >= new Date(startDate as string));
  }

  if (endDate) {
    events = events.filter((e: { startTime: Date }) => new Date(e.startTime) <= new Date(endDate as string));
  }

  res.json({ success: true, events, count: events.length });
}));

// Update event
assistantRouter.put('/calendar/events/:eventId', asyncHandler(async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const event = calendarEvents.get(eventId);

  if (!event) {
    return res.status(404).json({ success: false, error: 'Event not found' });
  }

  const updated = { ...event, ...req.body, updatedAt: new Date() };
  calendarEvents.set(eventId, updated);

  res.json({ success: true, event: updated });
}));

// Delete event
assistantRouter.delete('/calendar/events/:eventId', asyncHandler(async (req: Request, res: Response) => {
  const { eventId } = req.params;

  if (!calendarEvents.has(eventId)) {
    return res.status(404).json({ success: false, error: 'Event not found' });
  }

  calendarEvents.delete(eventId);
  res.json({ success: true, message: 'Event deleted' });
}));

// ============================================
// TASKS
// ============================================

const tasks = new Map();

// Create task
assistantRouter.post('/tasks', asyncHandler(async (req: Request, res: Response) => {
  const { userId, title, description, dueDate, priority, tags, project } = req.body;

  if (!userId || !title) {
    return res.status(400).json({ success: false, error: 'userId, title required' });
  }

  const task = {
    id: uuidv4(),
    userId,
    title,
    description,
    status: 'pending',
    priority: priority || 'medium',
    dueDate: dueDate ? new Date(dueDate) : null,
    tags: tags || [],
    project,
    subtasks: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  tasks.set(task.id, task);
  res.json({ success: true, task });
}));

// Get tasks
assistantRouter.get('/tasks', asyncHandler(async (req: Request, res: Response) => {
  const { userId, status, priority, project } = req.query;

  let taskList = Array.from(tasks.values());

  if (userId) taskList = taskList.filter((t: { userId: string }) => t.userId === userId);
  if (status) taskList = taskList.filter((t: { status: string }) => t.status === status);
  if (priority) taskList = taskList.filter((t: { priority: string }) => t.priority === priority);
  if (project) taskList = taskList.filter((t: { project: string }) => t.project === project);

  res.json({ success: true, tasks: taskList, count: taskList.length });
}));

// Update task
assistantRouter.put('/tasks/:taskId', asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const task = tasks.get(taskId);

  if (!task) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }

  const updated = { ...task, ...req.body, updatedAt: new Date() };
  tasks.set(taskId, updated);

  res.json({ success: true, task: updated });
}));

// Complete task
assistantRouter.post('/tasks/:taskId/complete', asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const task = tasks.get(taskId);

  if (!task) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }

  task.status = 'completed';
  task.completedAt = new Date();
  task.updatedAt = new Date();
  tasks.set(taskId, task);

  res.json({ success: true, task });
}));

// Delete task
assistantRouter.delete('/tasks/:taskId', asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;

  if (!tasks.has(taskId)) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }

  tasks.delete(taskId);
  res.json({ success: true, message: 'Task deleted' });
}));

// ============================================
// NOTES
// ============================================

const notes = new Map();

// Create note
assistantRouter.post('/notes', asyncHandler(async (req: Request, res: Response) => {
  const { userId, title, content, tags, category, color } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, error: 'userId required' });
  }

  const note = {
    id: uuidv4(),
    userId,
    title: title || 'Untitled',
    content: content || '',
    tags: tags || [],
    category: category || 'general',
    color: color || '#ffffff',
    pinned: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  notes.set(note.id, note);
  res.json({ success: true, note });
}));

// Get notes
assistantRouter.get('/notes', asyncHandler(async (req: Request, res: Response) => {
  const { userId, category, search } = req.query;

  let noteList = Array.from(notes.values());

  if (userId) noteList = noteList.filter((n: { userId: string }) => n.userId === userId);
  if (category) noteList = noteList.filter((n: { category: string }) => n.category === category);
  if (search) {
    const s = (search as string).toLowerCase();
    noteList = noteList.filter((n: { title: string; content: string }) =>
      n.title.toLowerCase().includes(s) ||
      n.content.toLowerCase().includes(s)
    );
  }

  res.json({ success: true, notes: noteList, count: noteList.length });
}));

// Update note
assistantRouter.put('/notes/:noteId', asyncHandler(async (req: Request, res: Response) => {
  const { noteId } = req.params;
  const note = notes.get(noteId);

  if (!note) {
    return res.status(404).json({ success: false, error: 'Note not found' });
  }

  const updated = { ...note, ...req.body, updatedAt: new Date() };
  notes.set(noteId, updated);

  res.json({ success: true, note: updated });
}));

// Delete note
assistantRouter.delete('/notes/:noteId', asyncHandler(async (req: Request, res: Response) => {
  const { noteId } = req.params;

  if (!notes.has(noteId)) {
    return res.status(404).json({ success: false, error: 'Note not found' });
  }

  notes.delete(noteId);
  res.json({ success: true, message: 'Note deleted' });
}));

// ============================================
// REMINDERS
// ============================================

const reminders = new Map();

// Create reminder
assistantRouter.post('/reminders', asyncHandler(async (req: Request, res: Response) => {
  const { userId, title, message, time, type, relatedId } = req.body;

  if (!userId || !title || !time) {
    return res.status(400).json({ success: false, error: 'userId, title, time required' });
  }

  const reminder = {
    id: uuidv4(),
    userId,
    title,
    message,
    time: new Date(time),
    type: type || 'once',
    relatedId,
    status: 'pending',
    createdAt: new Date()
  };

  reminders.set(reminder.id, reminder);
  res.json({ success: true, reminder });
}));

// Get reminders
assistantRouter.get('/reminders', asyncHandler(async (req: Request, res: Response) => {
  const { userId, status } = req.query;

  let reminderList = Array.from(reminders.values());

  if (userId) reminderList = reminderList.filter((r: { userId: string }) => r.userId === userId);
  if (status) reminderList = reminderList.filter((r: { status: string }) => r.status === status);

  res.json({ success: true, reminders: reminderList, count: reminderList.length });
}));

// Delete reminder
assistantRouter.delete('/reminders/:reminderId', asyncHandler(async (req: Request, res: Response) => {
  const { reminderId } = req.params;

  if (!reminders.has(reminderId)) {
    return res.status(404).json({ success: false, error: 'Reminder not found' });
  }

  reminders.delete(reminderId);
  res.json({ success: true, message: 'Reminder deleted' });
}));

// ============================================
// AI ASSISTANT
// ============================================

// Chat with assistant
assistantRouter.post('/chat', asyncHandler(async (req: Request, res: Response) => {
  const { userId, message, context } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ success: false, error: 'userId, message required' });
  }

  // Simple AI response logic (replace with actual AI)
  const responses = [
    "I understand. Let me help you with that.",
    "Based on your schedule, I recommend...",
    "I've noted that. Would you like me to create a reminder?",
    "I can help you manage your tasks. What would you like to do?",
    "Looking at your calendar, you have some time available."
  ];

  const response = responses[Math.floor(Math.random() * responses.length)];

  res.json({
    success: true,
    response: {
      message: response,
      timestamp: new Date(),
      type: 'assistant'
    }
  });
}));

// Get summary
assistantRouter.get('/summary/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const userTasks = Array.from(tasks.values()).filter((t: { userId: string }) => t.userId === userId);
  const userNotes = Array.from(notes.values()).filter((n: { userId: string }) => n.userId === userId);
  const userEvents = Array.from(calendarEvents.values()).filter((e: { userId: string }) => e.userId === userId);
  const userReminders = Array.from(reminders.values()).filter((r: { userId: string }) => r.userId === userId);

  res.json({
    success: true,
    summary: {
      tasks: {
        total: userTasks.length,
        pending: userTasks.filter((t: { status: string }) => t.status === 'pending').length,
        completed: userTasks.filter((t: { status: string }) => t.status === 'completed').length
      },
      notes: {
        total: userNotes.length
      },
      events: {
        total: userEvents.length,
        upcoming: userEvents.filter((e: { startTime: Date }) => new Date(e.startTime) > new Date()).length
      },
      reminders: {
        total: userReminders.length,
        pending: userReminders.filter((r: { status: string }) => r.status === 'pending').length
      }
    }
  });
}));

// Health check
assistantRouter.get('/health', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'ok',
    service: 'rez-assistant',
    stats: {
      events: calendarEvents.size,
      tasks: tasks.size,
      notes: notes.size,
      reminders: reminders.size
    }
  });
}));