import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import dotenv from 'dotenv';
import returnRoutes from './routes/returns';
import { authMiddleware, rateLimitMiddleware, requestIdMiddleware, errorHandler, ALLOWED_ORIGINS } from './middleware/auth';

dotenv.config();

const app = express();

// Middleware
app.use(requestIdMiddleware);
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(rateLimitMiddleware);

// Routes
app.use('/api/returns', authMiddleware, returnRoutes);

// Health
app.get('/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'healthy',
    service: 'return-service',
    mongodb: mongoStatus,
  });
});

// Error handler
app.use(errorHandler);

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_returns';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 4031;

app.listen(PORT, () => {
  console.log(`Return Service running on port ${PORT}`);
});

export default app;
