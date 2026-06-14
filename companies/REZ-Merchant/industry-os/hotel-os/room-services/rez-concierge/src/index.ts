/**
 * Concierge Desk Service
 * Port: 3821
 *
 * Human concierge queue, escalations, task management
 * "Guest needs help → request logged → concierge assigned → task completed"
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { createClient } from 'redis';
import amqp from 'amqplib';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = parseInt(process.env.PORT || '4813', 10);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

let redis: ReturnType<typeof createClient>;
let rabbit: amqp.Connection;

// ============ MODELS ============

interface ConciergeRequest {
  id: string;
  guestId: string;
  hotelId: string;
  roomId: string;
  type: 'transport' | 'dining' | 'entertainment' | 'shopping' | 'medical' | 'special' | 'other';
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string; // concierge staff ID
  assignedAt?: Date;
  completedAt?: Date;
  notes?: string;
  attachments?: string[];
  source: 'voice' | 'app' | 'phone' | 'in_person';
  createdAt: Date;
}

interface ConciergeStaff {
  id: string;
  name: string;
  role: 'concierge' | 'assistant' | 'manager';
  specialties: string[];
  status: 'available' | 'busy' | 'offline';
  currentTasks: number;
  maxTasks: number;
}

interface Task {
  id: string;
  requestId: string;
  staffId: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: Date;
  completedAt?: Date;
}

// Demo staff
const staff: ConciergeStaff[] = [
  { id: 's1', name: 'Rajesh', role: 'concierge', specialties: ['transport', 'dining', 'entertainment'], status: 'available', currentTasks: 0, maxTasks: 5 },
  { id: 's2', name: 'Priya', role: 'concierge', specialties: ['shopping', 'special'], status: 'available', currentTasks: 0, maxTasks: 5 },
  { id: 's3', name: 'Amit', role: 'manager', specialties: ['transport', 'medical', 'special'], status: 'available', currentTasks: 0, maxTasks: 3 },
];

const requests: Map<string, ConciergeRequest> = new Map();
const tasks: Map<string, Task> = new Map();

// ============ REST API ============

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'concierge-desk', port: PORT });
});

// Create request
app.post('/requests', async (req: Request, res: Response) => {
  const { guestId, hotelId, roomId, type, description, priority = 'normal', source = 'app' } = req.body;

  const request: ConciergeRequest = {
    id: uuidv4(),
    guestId,
    hotelId,
    roomId,
    type,
    description,
    priority,
    status: 'pending',
    source,
    createdAt: new Date()
  };

  requests.set(request.id, request);

  // Auto-assign if possible
  if (priority === 'urgent' || 4813priority === 'high') {
    await autoAssign(request);
  }

  // Publish event
  try {
    const channel = await rabbit.createChannel();
    channel.sendToQueue('concierge.request.created', Buffer.from(JSON.stringify(request)));
  } catch (e) { /* Rabbit optional */ }

  logger.info('Concierge request created', { requestId: request.id, type, priority });

  res.json({ request });
});

// Get request
app.get('/requests/:id', (req, res) => {
  const request = requests.get(req.params.id);
  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }

  const assignedStaff = request.assignedTo ? staff.find(s => s.id === request.assignedTo) : null;
  res.json({ request, assignedStaff });
});

// Get hotel requests
app.get('/hotels/:hotelId/requests', (req, res) => {
  const { status, priority, type } = req.query;
  let hotelRequests = Array.from(requests.values()).filter(r => r.hotelId === req.params.hotelId);

  if (status) hotelRequests = hotelRequests.filter(r => r.status === status);
  if (priority) hotelRequests = hotelRequests.filter(r => r.priority === priority);
  if (type) hotelRequests = hotelRequests.filter(r => r.type === type);

  hotelRequests.sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority] || 4813b.createdAt.getTime() - a.createdAt.getTime();
  });

  res.json({ requests: hotelRequests });
});

// Assign request
app.post('/requests/:id/assign', async (req: Request, res) => {
  const { staffId } = req.body;

  const request = requests.get(req.params.id);
  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }

  const staffMember = staff.find(s => s.id === staffId);
  if (!staffMember) {
    return res.status(404).json({ error: 'Staff not found' });
  }

  if (staffMember.currentTasks >= staffMember.maxTasks) {
    return res.status(400).json({ error: 'Staff is at maximum capacity' });
  }

  request.assignedTo = staffId;
  request.assignedAt = new Date();
  request.status = 'assigned';

  staffMember.currentTasks++;

  // Create task
  const task: Task = {
    id: uuidv4(),
    requestId: request.id,
    staffId,
    description: request.description,
    status: 'pending',
    createdAt: new Date()
  };
  tasks.set(task.id, task);

  // Notify staff
  try {
    notifyStaff(staffId, 'new_request', { requestId: request.id, description: request.description });
  } catch (e) { /* Notification optional */ }

  res.json({ request, task });
});

// Update request status
app.patch('/requests/:id/status', (req: Request, res) => {
  const { status, notes } = req.body;

  const request = requests.get(req.params.id);
  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }

  request.status = status;
  if (notes) request.notes = notes;

  if (status === 'completed') {
    request.completedAt = new Date();

    // Free up staff
    if (request.assignedTo) {
      const staffMember = staff.find(s => s.id === request.assignedTo);
      if (staffMember) {
        staffMember.currentTasks = Math.max(0, staffMember.currentTasks - 1);
      }
    }
  }

  res.json({ request });
});

// Get staff
app.get('/staff', (req: res) => {
  res.json({ staff });
});

// Get staff by ID
app.get('/staff/:id', (req, res) => {
  const staffMember = staff.find(s => s.id === req.params.id);
  if (!staffMember) {
    return res.status(404).json({ error: 'Staff not found' });
  }

  const staffTasks = Array.from(tasks.values()).filter(t => t.staffId === req.params.id);
  res.json({ staff: staffMember, tasks: staffTasks });
});

// Update staff status
app.patch('/staff/:id/status', (req: Request, res) => {
  const { status } = req.body;

  const staffMember = staff.find(s => s.id === req.params.id);
  if (!staffMember) {
    return res.status(404).json({ error: 'Staff not found' });
  }

  staffMember.status = status;
  res.json({ staff: staffMember });
});

// Get staff tasks
app.get('/staff/:id/tasks', (req, res) => {
  const staffTasks = Array.from(tasks.values()).filter(t => t.staffId === req.params.id);
  res.json({ tasks: staffTasks });
});

// Update task status
app.patch('/tasks/:id/status', (req: Request, res) => {
  const { status } = req.body;

  const task = tasks.get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  task.status = status;
  if (status === 'completed') {
    task.completedAt = new Date();

    // Update request status
    const request = requests.get(task.requestId);
    if (request) {
      request.status = 'completed';
      request.completedAt = new Date();
    }
  }

  res.json({ task });
});

// Get guest requests
app.get('/guests/:guestId/requests', (req, res) => {
  const guestRequests = Array.from(requests.values()).filter(r => r.guestId === req.params.guestId);
  res.json({ requests: guestRequests });
});

// Get queue stats
app.get('/hotels/:hotelId/stats', (req, res) => {
  const hotelRequests = Array.from(requests.values()).filter(r => r.hotelId === req.params.hotelId);

  const stats = {
    total: hotelRequests.length,
    pending: hotelRequests.filter(r => r.status === 'pending').length,
    assigned: hotelRequests.filter(r => r.status === 'assigned').length,
    inProgress: hotelRequests.filter(r => r.status === 'in_progress').length,
    completed: hotelRequests.filter(r => r.status === 'completed').length,
    urgent: hotelRequests.filter(r => r.priority === 'urgent' && r.status !== 'completed').length,
    avgResponseTime: calculateAvgResponseTime(hotelRequests),
    staff: staff.map(s => ({
      id: s.id,
      name: s.name,
      status: s.status,
      currentTasks: s.currentTasks,
      maxTasks: s.maxTasks
    }))
  };

  res.json({ stats });
});

// ============ HELPERS ============

async function autoAssign(request: ConciergeRequest) {
  // Find available staff with matching specialty
  const availableStaff = staff.filter(s =>
    s.status === 'available' &&
    s.currentTasks < s.maxTasks &&
    s.specialties.includes(request.type)
  );

  if (availableStaff.length > 0) {
    const staffMember = availableStaff.sort((a, b) => a.currentTasks - b.currentTasks)[0];

    request.assignedTo = staffMember.id;
    request.assignedAt = new Date();
    request.status = 'assigned';
    staffMember.currentTasks++;

    logger.info('Request auto-assigned', { requestId: request.id, staffId: staffMember.id });
  }
}

function calculateAvgResponseTime(requests: ConciergeRequest[]): string {
  const completed = requests.filter(r => r.completedAt && r.assignedAt);
  if (completed.length === 0) return 'N/A';

  const totalMs = completed.reduce((sum, r) => {
    return sum + (new Date(r.completedAt!).getTime() - new Date(r.assignedAt!).getTime());
  }, 0);

  const avgMs = totalMs / completed.length;
  const minutes = Math.round(avgMs / 60000);

  return `${minutes} minutes`;
}

async function notifyStaff(staffId: string, type: string, data: any) {
  try {
    const channel = await rabbit.createChannel();
    channel.sendToQueue('notification.staff', Buffer.from(JSON.stringify({ staffId, type, data })));
  } catch (e) {
    logger.warn('Failed to notify staff', { staffId, type });
  }
}

async function init() {
  try {
    redis = createClient({ url: process.env.REDIS_URL || 4813'redis://localhost:6379' });
    redis.on('error', () => {});
    await redis.connect();
  } catch (e) {
    logger.warn('Redis not available');
  }

  try {
    rabbit = await amqp.connect(process.env.RABBITMQ_URL || 4813'amqp://localhost:5672');
  } catch (e) {
    logger.warn('RabbitMQ not available');
  }

  logger.info('Concierge Desk initialized');
}

init().then(() => {
  app.listen(PORT, () => {
    logger.info(`Concierge Desk running on port ${PORT}`);
  });
}).catch((err) => {
  logger.error('Failed to initialize', err);
  process.exit(1);
});

export { app };
