import cors from 'cors';
import { Request, Response, NextFunction } from 'express';

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:4000',
  'http://localhost:4010',
  'http://localhost:4011',
  'http://localhost:4013',
  'http://localhost:4014',
  'http://localhost:4022',
  'http://localhost:4058',
  'http://localhost:4060',
  'http://localhost:4082',
  'http://localhost:4091'
];

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
  credentials: true,
  maxAge: 86400
});

export const handlePreflight = (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Request-ID');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.sendStatus(204);
};
