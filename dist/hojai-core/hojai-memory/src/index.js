/**
 * Hojai Memory Service
 * Version: 1.0 | Port: 4520
 * Vector store, customer memory, and timeline
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { memoryRoutes } from './routes/memory.js';
import { vectorRoutes } from './routes/vectors.js';
import { timelineRoutes } from './routes/timeline.js';
const PORT = 4520;
// ============================================
// LOGGING
// ============================================
function createLogger(service) {
    return {
        info: (event, data) => {
            console.log(JSON.stringify({ level: 'info', service, event, timestamp: new Date().toISOString(), ...data }));
        },
        error: (event, data) => {
            console.error(JSON.stringify({ level: 'error', service, event, timestamp: new Date().toISOString(), ...data }));
        },
        warn: (event, data) => {
            console.warn(JSON.stringify({ level: 'warn', service, event, timestamp: new Date().toISOString(), ...data }));
        }
    };
}
const logger = createLogger('hojai-memory');
// ============================================
// IN-MEMORY STORES
// ============================================
export const memoryStore = new Map();
export const vectorIndexStore = [];
export const timelineStore = new Map();
function tenantMiddleware() {
    return (req, res, next) => {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            return res.status(400).json({
                success: false,
                error: { code: 'MISSING_TENANT_ID', message: 'X-Tenant-Id header required' }
            });
        }
        req.tenantContext = { tenant_id: tenantId, user_id: req.headers['x-user-id'] };
        next();
    };
}
// ============================================
// SIMPLE VECTOR SIMILARITY (placeholder for real embedding service)
// ============================================
function cosineSimilarity(a, b) {
    if (a.length !== b.length)
        return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
// Generate a simple embedding from text (placeholder)
function textToEmbedding(text) {
    const dimension = 384; // Standard embedding dimension
    const embedding = [];
    // Simple hash-based embedding for demo
    const hash = text.split('').reduce((acc, char) => {
        return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    const seed = Math.abs(hash);
    for (let i = 0; i < dimension; i++) {
        // Pseudo-random based on seed and position
        const value = Math.sin(seed * (i + 1) * 0.1) * Math.cos(seed * (i + 1) * 0.05);
        embedding.push(value);
    }
    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / norm);
}
// ============================================
// MEMORY SERVICE CLASS
// ============================================
class HojaiMemory {
    app;
    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
    }
    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use((req, res, next) => {
            const start = Date.now();
            res.on('finish', () => {
                logger.info('request', {
                    method: req.method,
                    path: req.path,
                    status: res.statusCode,
                    duration: Date.now() - start
                });
            });
            next();
        });
    }
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'hojai-memory',
                version: '1.0.0',
                port: PORT,
                timestamp: new Date().toISOString()
            });
        });
        this.app.get('/health/live', (req, res) => res.json({ status: 'ok' }));
        this.app.get('/health/ready', (req, res) => res.json({ status: 'ready' }));
        // Stats
        this.app.get('/stats', tenantMiddleware(), (req, res) => {
            const ctx = req.tenantContext;
            const memories = memoryStore.get(ctx.tenant_id) || [];
            const timelines = timelineStore.get(ctx.tenant_id) || [];
            res.json({
                success: true,
                data: {
                    memories: {
                        total: memories.length,
                        byType: this.groupByType(memories)
                    },
                    timelines: {
                        total: timelines.length
                    },
                    indices: vectorIndexStore.filter(i => i.tenantId === ctx.tenant_id).length
                }
            });
        });
        // Mount routes
        this.app.use('/memory', tenantMiddleware(), memoryRoutes);
        this.app.use('/vectors', tenantMiddleware(), vectorRoutes);
        this.app.use('/timeline', tenantMiddleware(), timelineRoutes);
        // Error handler
        this.app.use((err, req, res, next) => {
            logger.error('error', { error: err.message, path: req.path });
            res.status(500).json({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: err.message }
            });
        });
        this.app.use((req, res) => {
            res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: `Route ${req.path} not found` }
            });
        });
    }
    groupByType(items) {
        const grouped = {};
        for (const item of items) {
            grouped[item.type] = (grouped[item.type] || 0) + 1;
        }
        return grouped;
    }
    start() {
        this.app.listen(PORT, () => {
            logger.info('service_started', { port: PORT });
            console.log(`
╔══════════════════════════════════════════════════════════════╗
║           HOJAI MEMORY v1.0.0                          ║
╠══════════════════════════════════════════════════════════════╣
║  Port: ${PORT}                                                ║
║  Status: Running                                              ║
╠══════════════════════════════════════════════════════════════╣
║  Features:                                                   ║
║  - Memory Storage & Retrieval                                ║
║  - Semantic Vector Search                                    ║
║  - Customer Timeline                                         ║
║  - Importance-Based Prioritization                          ║
╚══════════════════════════════════════════════════════════════╝
      `);
        });
    }
}
// ============================================
// BOOTSTRAP
// ============================================
const memory = new HojaiMemory();
memory.start();
export { HojaiMemory, cosineSimilarity, textToEmbedding };
export default memory;
//# sourceMappingURL=index.js.map