import cors from 'cors';

const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];

export const corsMiddleware = cors({
  origin: (origin: string | undefined, callback: (err: Error | null, origins?: string[]) => void) => {
    if (!origin) {
      callback(null, ['*']);
      return;
    }

    if (corsOrigins.includes(origin) || corsOrigins.includes('*')) {
      callback(null, [origin]);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID']
});