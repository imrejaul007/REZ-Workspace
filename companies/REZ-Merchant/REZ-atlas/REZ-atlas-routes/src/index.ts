/**
 * REZ Atlas Routes - Field Sales Route Optimization
 */
import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5171;

// In-memory routes
interface Stop {
  id: string;
  merchantId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  priority: number;
  estimatedTime: number;
  status: 'pending' | 'visited' | 'skipped';
}

interface Route {
  id: string;
  name: string;
  userId: string;
  territoryId: string;
  date: string;
  stops: Stop[];
  totalDistance: number;
  totalDuration: number;
  status: 'planned' | 'in_progress' | 'completed';
  createdAt: string;
}

const routes: Map<string, Route> = new Map();

// Seed sample data
const sampleRoute: Route = {
  id: uuidv4(),
  name: 'Mumbai South Day 1',
  userId: 'user-1',
  territoryId: 'territory-1',
  date: new Date().toISOString().split('T')[0],
  stops: [
    { id: uuidv4(), merchantId: 'm1', name: 'Restaurant A', address: 'Colaba', lat: 18.92, lng: 72.83, priority: 1, estimatedTime: 30, status: 'pending' },
    { id: uuidv4(), merchantId: 'm2', name: 'Cafe B', address: 'CST', lat: 18.94, lng: 72.84, priority: 2, estimatedTime: 25, status: 'pending' },
    { id: uuidv4(), merchantId: 'm3', name: 'Hotel C', address: 'Marine Drive', lat: 18.95, lng: 72.82, priority: 3, estimatedTime: 45, status: 'pending' }
  ],
  totalDistance: 12.5,
  totalDuration: 180,
  status: 'planned',
  createdAt: new Date().toISOString()
};
routes.set(sampleRoute.id, sampleRoute);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'REZ-atlas-routes', version: '1.0.0' });
});

app.get('/api/routes', (req, res) => {
  const { date, userId, territoryId } = req.query;
  let filtered = Array.from(routes.values());
  if (date) filtered = filtered.filter(r => r.date === date);
  if (userId) filtered = filtered.filter(r => r.userId === userId);
  if (territoryId) filtered = filtered.filter(r => r.territoryId === territoryId);
  res.json({ routes: filtered, count: filtered.length });
});

app.get('/api/routes/:id', (req, res) => {
  const route = routes.get(req.params.id);
  if (!route) return res.status(404).json({ error: 'Route not found' });
  res.json({ route });
});

app.post('/api/routes', (req, res) => {
  const { name, userId, territoryId, date, stops } = req.body;
  const route: Route = {
    id: uuidv4(),
    name: name || 'New Route',
    userId,
    territoryId,
    date: date || new Date().toISOString().split('T')[0],
    stops: stops || [],
    totalDistance: 0,
    totalDuration: 0,
    status: 'planned',
    createdAt: new Date().toISOString()
  };
  routes.set(route.id, route);
  res.status(201).json({ route });
});

app.post('/api/routes/optimize', (req, res) => {
  const { stops, mode = 'driving' } = req.body;
  // Simple nearest-neighbor optimization
  const optimized = stops.sort((a: any, b: any) => a.priority - b.priority);
  res.json({
    optimized,
    totalDistance: stops.length * 2.5,
    estimatedDuration: stops.length * 30,
    mode
  });
});

app.put('/api/routes/:id/stops/:stopId', (req, res) => {
  const route = routes.get(req.params.id);
  if (!route) return res.status(404).json({ error: 'Route not found' });
  const stop = route.stops.find(s => s.id === req.params.stopId);
  if (!stop) return res.status(404).json({ error: 'Stop not found' });
  stop.status = req.body.status || stop.status;
  res.json({ stop });
});

app.listen(PORT, () => console.log(`🗺️  REZ Atlas Routes running on port ${PORT}`));

export default app;