/**
 * REZ Housekeeping - Task Management
 * Port: 4021
 *
 * Housekeeping tasks and room status
 */

import express from 'express';
import cors from 'cors';
import winston from 'winston';

const app = express();
const PORT = process.env.PORT || 4021;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

app.use(cors());
app.use(express.json());

const tasks: Map<string, any> = new Map();

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'rez-housekeeping', port: PORT });
});

// Create task
app.post('/tasks', (req, res) => {
  const { roomId, type, priority = 'normal', instructions } = req.body;
  const id = `task_${Date.now()}`;
  const task = { id, roomId, type, priority, status: 'pending', instructions, createdAt: new Date() };
  tasks.set(id, task);
  logger.info('Task created', { id, roomId });
  res.json(task);
});

// Get tasks
app.get('/tasks', (req, res) => {
  const { status, roomId } = req.query;
  let all = Array.from(tasks.values());
  if (status) all = all.filter(t => t.status === status);
  if (roomId) all = all.filter(t => t.roomId === roomId);
  res.json({ tasks: all });
});

// Update task
app.patch('/tasks/:id', (req, res) => {
  const task = tasks.get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  Object.assign(task, req.body);
  res.json(task);
});

app.listen(PORT, () => {
  logger.info(`REZ Housekeeping running on port ${PORT}`);
});

export { app };