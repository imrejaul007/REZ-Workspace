// ============================================================================
// SUTAR Marketplace - Main Entry Point
// ============================================================================

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4250;
const START_TIME = Date.now();

export type ServiceStatus = 'active' | 'inactive' | 'pending';
export type ReviewRating = 1 | 2 | 3 | 4 | 5;

export interface Service {
  id: string;
  name: string;
  description: string;
  provider: string;
  category: string;
  price: number;
  currency: string;
  rating: number;
  reviewCount: number;
  status: ServiceStatus;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  serviceId: string;
  userId: string;
  rating: ReviewRating;
  comment: string;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  requestId?: string;
}

const services = new Map<string, Service>();
const reviews = new Map<string, Review[]>();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'] }));
app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { success: false, error: 'Too many requests' } });
app.use('/api/', limiter);

app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) || uuidv4();
  res.setHeader('X-Request-ID', requestId);
  (req as any).requestId = requestId;
  next();
});

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => console.log(JSON.stringify({ timestamp: new Date().toISOString(), method: req.method, path: req.path, status: res.statusCode, duration: Date.now() - start })));
  next();
});

const apiResponse = <T>(success: boolean, data?: T, error?: string, requestId?: string): ApiResponse<T> => ({ success, data, error, timestamp: new Date().toISOString(), requestId });

// Health
app.get('/health', (_req: Request, res: Response) => res.json(apiResponse(true, { status: 'healthy', service: 'sutar-marketplace', version: '1.0.0', uptime: Math.floor((Date.now() - START_TIME) / 1000) })));
app.get('/health/ready', (_req: Request, res: Response) => res.json(apiResponse(true, { ready: true })));
app.get('/health/live', (_req: Request, res: Response) => res.json(apiResponse(true, { alive: true })));

// Services
app.post('/api/v1/services', (req: Request, res: Response) => {
  try {
    const { name, description, provider, category, price, currency, tags } = req.body;
    if (!name || !provider || !category) {
      res.status(400).json(apiResponse(false, undefined, 'Missing required fields'));
      return;
    }
    const service: Service = {
      id: `service-${uuidv4()}`,
      name, description: description || '', provider, category,
      price: price || 0,
      currency: currency || 'INR',
      rating: 5.0,
      reviewCount: 0,
      status: 'active',
      tags: tags || [],
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    services.set(service.id, service);
    reviews.set(service.id, []);
    console.log(`[MARKETPLACE] Added service: ${service.id}`);
    res.status(201).json(apiResponse(true, service, undefined, (req as any).requestId));
  } catch (error) {
    res.status(500).json(apiResponse(false, undefined, String(error), (req as any).requestId));
  }
});

app.get('/api/v1/services', (req: Request, res: Response) => {
  const { category, status, search, limit = 50, offset = 0 } = req.query;
  let result = Array.from(services.values());
  if (status) result = result.filter(s => s.status === status);
  if (category) result = result.filter(s => s.category === category);
  if (search) {
    const searchLower = String(search).toLowerCase();
    result = result.filter(s => s.name.toLowerCase().includes(searchLower) || s.description.toLowerCase().includes(searchLower));
  }
  result.sort((a, b) => b.rating - a.rating);
  const total = result.length;
  result = result.slice(Number(offset), Number(offset) + Number(limit));
  res.json(apiResponse(true, { services: result, total, limit: Number(limit), offset: Number(offset) }));
});

app.get('/api/v1/services/:id', (req: Request, res: Response) => {
  const service = services.get(req.params.id);
  if (!service) { res.status(404).json(apiResponse(false, undefined, 'Service not found')); return; }
  res.json(apiResponse(true, { service, reviews: reviews.get(service.id) || [] }));
});

// Reviews
app.post('/api/v1/services/:id/reviews', (req: Request, res: Response) => {
  const service = services.get(req.params.id);
  if (!service) { res.status(404).json(apiResponse(false, undefined, 'Service not found')); return; }
  const { userId, rating, comment } = req.body;
  if (!userId || !rating) { res.status(400).json(apiResponse(false, undefined, 'userId and rating required')); return; }
  const review: Review = { id: `review-${uuidv4()}`, serviceId: service.id, userId, rating, comment: comment || '', createdAt: new Date().toISOString() };
  const serviceReviews = reviews.get(service.id) || [];
  serviceReviews.push(review);
  reviews.set(service.id, serviceReviews);
  // Update service rating
  const avgRating = serviceReviews.reduce((sum, r) => sum + r.rating, 0) / serviceReviews.length;
  service.rating = Math.round(avgRating * 10) / 10;
  service.reviewCount = serviceReviews.length;
  services.set(service.id, service);
  res.status(201).json(apiResponse(true, review, undefined, (req as any).requestId));
});

app.use((_req: Request, res: Response) => res.status(404).json(apiResponse(false, undefined, 'Not found')));
app.use((err: Error, _req: Request, res: Response) => res.status(500).json(apiResponse(false, undefined, err.message)));

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

app.listen(PORT, () => console.log(`\nSUTAR MARKETPLACE running on port ${PORT}\n`));

export default app;
