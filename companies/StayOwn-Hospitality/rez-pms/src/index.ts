/**
 * REZ PMS - Property Management System
 * Port: 4031
 *
 * Room management, assignments, status
 */

import express from 'express';
import cors from 'cors';
import winston from 'winston';

const app = express();
const PORT = process.env.PORT || 4031;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

app.use(cors());
app.use(express.json());

// In-memory room data
const rooms: Map<string, any> = new Map([
  ['101', { id: '101', type: 'deluxe', status: 'occupied', floor: 1 }],
  ['102', { id: '102', type: 'standard', status: 'available', floor: 1 }],
  ['201', { id: '201', type: 'suite', status: 'occupied', floor: 2 }],
]);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'rez-pms', port: PORT });
});

// Get room
app.get('/rooms/:roomId', (req, res) => {
  const room = rooms.get(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room);
});

// Update room status
app.patch('/rooms/:roomId/status', (req, res) => {
  const { status } = req.body;
  const room = rooms.get(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  room.status = status;
  res.json(room);
});

// Get all rooms
app.get('/rooms', (req, res) => {
  const allRooms = Array.from(rooms.values());
  res.json({ rooms: allRooms, count: allRooms.length });
});

app.listen(PORT, () => {
  logger.info(`REZ PMS running on port ${PORT}`);
});

export { app };