import express from 'express';
import cors from 'cors';
import onboardingRoutes from './routes/onboarding';

const app = express();
const PORT = process.env.PORT || 4032;

// ============================================================================
// Middleware
// ============================================================================

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-store-onboarding',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// API Routes
// ============================================================================

app.use('/api/onboarding', onboardingRoutes);

// ============================================================================
// Error Handling
// ============================================================================

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
  });
});

// ============================================================================
// Start Server
// ============================================================================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 ReZ Store Onboarding Server                          ║
║                                                           ║
║   Server running on port ${PORT}                             ║
║   Health check: http://localhost:${PORT}/health             ║
║   API base: http://localhost:${PORT}/api/onboarding          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
