import cors from 'cors';
import { Request, Response } from 'express';

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:4000',
  'http://localhost:9040',  // transport-os base
  'http://localhost:9044',  // khairmove-fleet
  'http://localhost:9045',  // khairmove-logistics
  'http://localhost:9046',  // dispatch
  'http://localhost:9050',  // twinos-hub
  'http://localhost:4082',  // genie
  'http://localhost:4091'   // twinos
];

export const corsMiddleware = cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow all origins in development
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // Log blocked CORS attempts
    if (process.env.NODE_ENV === 'production') {
      console.warn(`Blocked CORS request from: ${origin}`);
    }

    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-API-Key',
    'X-Request-ID',
    'X-Service-Name',
    'X-Tenant-ID'
  ],
  credentials: true,
  maxAge: 86400 // 24 hours
});

// Preflight handler
export const handlePreflight = (req: Request, res: Response): void => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Request-ID');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.status(204).send();
};
