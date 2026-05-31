import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
// Routes
import chatRoutes from './routes/chat.js';
import supportRoutes from './routes/support.js';
import commerceRoutes from './routes/commerce.js';
import ordersRoutes from './routes/orders.js';
// Services
import { unifiedBrain } from './services/unifiedBrain.js';
// Auth utilities
import { login, register, refreshAccessToken, successResponse, errorResponse, LoginSchema } from './middleware/auth.js';
// ============================================================================
// CONFIG
// ============================================================================
const PORT = parseInt(process.env.PORT || '4850', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hojai_unified_platform';
// ============================================================================
// EXPRESS APP
// ============================================================================
const app = express();
const httpServer = createServer(app);
// Socket.IO for real-time updates
const io = new SocketIO(httpServer, {
    cors: { origin: '*', credentials: true }
});
// ============================================================================
// MIDDLEWARE
// ============================================================================
// Security
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
// CORS
app.use(cors({
    origin: process.env.CORS_ORIGINS?.split(',') || '*',
    credentials: true
}));
// Compression
app.use(compression());
// Logging
app.use(morgan('combined'));
// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// Rate limiting
const limiter = rateLimit({ windowMs: 900000, max: 100 });
app.use('/api/', limiter);
// Request ID
app.use((req, res, next) => {
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${uuidv4()}`;
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
});
// ============================================================================
// HEALTH CHECKS
// ============================================================================
app.get('/health', async (req, res) => {
    const checks = {
        service: 'hojai-unified-platform',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        dependencies: {
            mongodb: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy'
        }
    };
    const allHealthy = Object.values(checks.dependencies).every(s => s === 'healthy');
    res.status(allHealthy ? 200 : 503).json(checks);
});
app.get('/health/live', (req, res) => {
    res.json({ status: 'alive', service: 'hojai-unified-platform' });
});
app.get('/health/ready', async (req, res) => {
    const mongo = mongoose.connection.readyState === 1;
    const ready = mongo;
    res.status(ready ? 200 : 503).json({
        status: ready ? 'ready' : 'not_ready',
        mongodb: mongo ? 'connected' : 'disconnected'
    });
});
// ============================================================================
// INFO ENDPOINTS
// ============================================================================
app.get('/api/info', (req, res) => {
    res.json({
        name: 'HOJAI Unified Platform',
        version: '1.0.0',
        tagline: 'WhatsApp + Support + Commerce - All in One',
        features: [
            'WhatsApp Business API Integration',
            'Multi-channel Support (WhatsApp, Instagram, Web, SMS, Email)',
            'AI-powered Chat Bot',
            'Support Ticket System',
            'Product Catalog',
            'Shopping Cart',
            'Order Management',
            'Payment Processing',
            'Real-time Analytics'
        ],
        modules: {
            chat: '/api/chat',
            support: '/api/support',
            commerce: '/api/commerce',
            orders: '/api/orders'
        },
        channels: ['whatsapp', 'instagram', 'webchat', 'sms', 'email']
    });
});
app.get('/api/channels', (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 'whatsapp', name: 'WhatsApp', icon: '💬', status: 'active' },
            { id: 'instagram', name: 'Instagram', icon: '📸', status: 'active' },
            { id: 'webchat', name: 'Web Chat', icon: '💭', status: 'active' },
            { id: 'sms', name: 'SMS', icon: '📱', status: 'active' },
            { id: 'email', name: 'Email', icon: '📧', status: 'active' }
        ]
    });
});
// ============================================================================
// AUTH ROUTES
// ============================================================================
// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const validated = LoginSchema.parse(req.body);
        const result = await login(validated.email, validated.password, validated.tenantId);
        if (!result) {
            return errorResponse(res, 'Invalid credentials', 401);
        }
        successResponse(res, result);
    }
    catch (error) {
        if (error instanceof Error && error.message === 'Invalid input') {
            return errorResponse(res, 'Invalid email or password format', 400);
        }
        errorResponse(res, error);
    }
});
// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, name, tenantId, role } = req.body;
        const result = await register({ email, password, name, tenantId, role });
        successResponse(res, result, 201);
    }
    catch (error) {
        if (error instanceof Error && error.message === 'User already exists') {
            return errorResponse(res, 'User already exists', 409);
        }
        errorResponse(res, error);
    }
});
// Refresh token
app.post('/api/auth/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const result = await refreshAccessToken(refreshToken);
        if (!result) {
            return errorResponse(res, 'Invalid or expired refresh token', 401);
        }
        successResponse(res, result);
    }
    catch (error) {
        errorResponse(res, error);
    }
});
// ============================================================================
// API ROUTES
// ============================================================================
// Chat routes (WhatsApp + Web Chat)
app.use('/api/chat', chatRoutes);
// Support routes (Ticket System)
app.use('/api/support', supportRoutes);
// Commerce routes (Products + Cart)
app.use('/api/commerce', commerceRoutes);
// Order routes (Order Management)
app.use('/api/orders', ordersRoutes);
// ============================================================================
// AI BRAIN ENDPOINT
// ============================================================================
app.post('/api/brain/process', async (req, res) => {
    try {
        const { message, context } = req.body;
        if (!message) {
            return errorResponse(res, 'Message is required', 400);
        }
        const result = await unifiedBrain.processMessage(message, context || {
            conversationId: 'unknown',
            tenantId: 'default',
            customerId: 'anonymous',
            channel: 'webchat',
            recentMessages: []
        });
        // Get suggestions
        const suggestions = unifiedBrain.getSuggestions(context || {
            conversationId: 'unknown',
            tenantId: 'default',
            customerId: 'anonymous',
            channel: 'webchat',
            recentMessages: []
        });
        successResponse(res, {
            ...result,
            suggestions
        });
    }
    catch (error) {
        errorResponse(res, error);
    }
});
app.get('/api/brain/suggestions', async (req, res) => {
    try {
        const context = {
            conversationId: req.query.conversationId || 'unknown',
            tenantId: req.query.tenantId || 'default',
            customerId: req.query.customerId || 'anonymous',
            channel: req.query.channel || 'webchat',
            recentMessages: []
        };
        const suggestions = unifiedBrain.getSuggestions(context);
        successResponse(res, { suggestions });
    }
    catch (error) {
        errorResponse(res, error);
    }
});
// ============================================================================
// SOCKET.IO EVENTS
// ============================================================================
io.on('connection', (socket) => {
    console.log('[Socket] Client connected:', socket.id);
    // Agent login
    socket.on('agent:login', ({ agentId, tenantId }) => {
        socket.join(`tenant:${tenantId}`);
        socket.join(`agent:${agentId}`);
        console.log(`[Socket] Agent ${agentId} logged in for tenant ${tenantId}`);
        socket.emit('agent:logged_in', { success: true });
    });
    // Join conversation room
    socket.on('conversation:join', ({ conversationId }) => {
        socket.join(`conversation:${conversationId}`);
        console.log(`[Socket] Client joined conversation ${conversationId}`);
    });
    // Leave conversation room
    socket.on('conversation:leave', ({ conversationId }) => {
        socket.leave(`conversation:${conversationId}`);
    });
    // New message
    socket.on('message:new', (data) => {
        console.log('[Socket] New message in conversation:', data.conversationId);
        io.to(`conversation:${data.conversationId}`).emit('message:received', data);
    });
    // Typing indicators
    socket.on('typing:start', ({ conversationId, agentId }) => {
        socket.to(`conversation:${conversationId}`).emit('typing:started', { agentId });
    });
    socket.on('typing:stop', ({ conversationId, agentId }) => {
        socket.to(`conversation:${conversationId}`).emit('typing:stopped', { agentId });
    });
    // Agent status updates
    socket.on('agent:status', ({ agentId, status }) => {
        io.emit('agent:status_changed', { agentId, status });
    });
    // Order updates
    socket.on('order:subscribe', ({ orderId }) => {
        socket.join(`order:${orderId}`);
    });
    socket.on('order:unsubscribe', ({ orderId }) => {
        socket.leave(`order:${orderId}`);
    });
    // Disconnect
    socket.on('disconnect', () => {
        console.log('[Socket] Client disconnected:', socket.id);
    });
});
// Helper function to emit order updates
export function emitOrderUpdate(orderId, update) {
    io.to(`order:${orderId}`).emit('order:updated', update);
}
// Helper function to emit conversation updates
export function emitConversationUpdate(conversationId, update) {
    io.to(`conversation:${conversationId}`).emit('conversation:updated', update);
}
// ============================================================================
// ERROR HANDLERS
// ============================================================================
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.path,
        requestId: req.requestId
    });
});
// Error handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
    console.error('[Error]', {
        requestId: req.requestId,
        path: req.path,
        method: req.method,
        error: err.message,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    });
    res.status(statusCode).json({
        success: false,
        error: message,
        requestId: req.requestId
    });
});
// ============================================================================
// STARTUP
// ============================================================================
async function initializeServices() {
    console.log('[Startup] Initializing services...');
    // Connect to MongoDB
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('[MongoDB] Connected to', MONGODB_URI);
    }
    catch (error) {
        console.warn('[MongoDB] Connection failed, continuing without MongoDB:', error);
    }
    // Initialize Unified Brain
    await unifiedBrain.initialize();
    console.log('[UnifiedBrain] Initialized');
    console.log('[Startup] All services initialized');
}
async function startServer() {
    await initializeServices();
    // Start HTTP server
    httpServer.listen(PORT, () => {
        console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    HOJAI UNIFIED PLATFORM - ALL IN ONE                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  Port:       ${PORT}                                                          ║
║  WebSocket:  ws://localhost:${PORT}                                          ║
║  Health:     http://localhost:${PORT}/health                                  ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  CHANNELS:   WhatsApp | Instagram | Web Chat | SMS | Email                  ║
║  FEATURES:   Chat Bot | Support Tickets | Products | Cart | Orders           ║
║  MODULES:    /api/chat | /api/support | /api/commerce | /api/orders          ║
╚═══════════════════════════════════════════════════════════════════════════════╝
    `);
    });
}
// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================
async function shutdown() {
    console.log('[Server] Shutting down...');
    // Close Socket.IO connections
    io.close();
    // Disconnect MongoDB
    await mongoose.disconnect();
    console.log('[Server] Shutdown complete');
    process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('[Uncaught Exception]', error);
    shutdown();
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('[Unhandled Rejection]', reason);
});
// ============================================================================
// START
// ============================================================================
startServer().catch((error) => {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
});
// ============================================================================
// EXPORTS
// ============================================================================
export { app, io };
export default app;
//# sourceMappingURL=index.js.map