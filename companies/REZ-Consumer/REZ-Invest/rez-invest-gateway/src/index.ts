import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import winston from 'winston';
import { z } from 'zod';

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Express app
const app = express();
const PORT = process.env.PORT || 4800;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info({
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});

// Validation schemas
const loginSchema = z.object({
  phone: z.string().min(10).max(15),
  password: z.string().min(6),
});

const registerSchema = z.object({
  phone: z.string().min(10).max(15),
  password: z.string().min(6),
  name: z.string().min(2),
  email: z.string().email().optional(),
});

const verifyOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  otp: z.string().length(6),
});

// Mock user store (replace with RABTUL Auth integration)
const users = new Map<string, { id: string; phone: string; name: string }>();
const otpStore = new Map<string, string>();
const jwtStore = new Map<string, string>();

// JWT helper (replace with RABTUL Auth service)
// SECURITY: JWT_SECRET must be set in environment - no fallback allowed
function generateJWT(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  const payload = { userId, iat: Date.now() };
  return Buffer.from(JSON.stringify({ ...payload, secret })).toString('base64');
}

function verifyJWT(token: string): { userId: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    return decoded.userId ? { userId: decoded.userId } : null;
  } catch {
    return null;
  }
}

// Auth middleware
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(7);
  const decoded = verifyJWT(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  (req as any).userId = decoded.userId;
  next();
}

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-invest-gateway',
    timestamp: new Date().toISOString(),
  });
});

// Login endpoint
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    // Find user (mock - integrate with RABTUL Auth)
    const user = Array.from(users.values()).find((u) => u.phone === data.phone);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = generateJWT(user.id);

    logger.info(`User ${user.id} logged in successfully`);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register endpoint
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    // Check if user exists
    const existingUser = Array.from(users.values()).find((u) => u.phone === data.phone);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Create user
    const userId = `user_${Date.now()}`;
    const user = { id: userId, phone: data.phone, name: data.name };
    users.set(userId, user);

    // Generate OTP (mock - integrate with notification service)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(data.phone, otp);
    logger.info(`OTP for ${data.phone}: ${otp}`);

    res.json({
      success: true,
      message: 'Registration initiated. Please verify OTP.',
      userId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify OTP endpoint
app.post('/api/auth/verify-otp', async (req: Request, res: Response) => {
  try {
    const data = verifyOtpSchema.parse(req.body);

    const storedOtp = otpStore.get(data.phone);
    if (!storedOtp || storedOtp !== data.otp) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    // Clear OTP
    otpStore.delete(data.phone);

    // Generate JWT
    const user = Array.from(users.values()).find((u) => u.phone === data.phone);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const token = generateJWT(user.id);
    jwtStore.set(user.id, token);

    logger.info(`User ${user.id} verified successfully`);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    logger.error('OTP verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected route example
app.get('/api/auth/me', authMiddleware, (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const user = users.get(userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
    },
  });
});

// Service routes (proxy to other microservices)
app.use('/api/brokerage', authMiddleware, async (req: Request, res: Response) => {
  // Proxy to brokerage service
  res.json({
    service: 'brokerage',
    path: req.path,
    message: 'Proxy to rez-invest-brokerage:4801',
  });
});

app.use('/api/trading', authMiddleware, async (req: Request, res: Response) => {
  // Proxy to trading service
  res.json({
    service: 'trading',
    path: req.path,
    message: 'Proxy to rez-invest-trading:4802',
  });
});

app.use('/api/portfolio', authMiddleware, async (req: Request, res: Response) => {
  // Proxy to portfolio service
  res.json({
    service: 'portfolio',
    path: req.path,
    message: 'Proxy to rez-invest-portfolio:4803',
  });
});

app.use('/api/wallet', authMiddleware, async (req: Request, res: Response) => {
  // Proxy to wallet service
  res.json({
    service: 'wallet',
    path: req.path,
    message: 'Proxy to rez-invest-wallet:4804',
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-invest-gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
app.listen(PORT, () => {
  logger.info(`REZ-Invest Gateway running on port ${PORT}`);
});

export default app;
