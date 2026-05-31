/**
 * Hojai Governance Service
 * Version: 1.0 | Port: 4501
 * RBAC, permissions, audit logging
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import { roleRoutes } from './routes/roles.js';
import { permissionRoutes } from './routes/permissions.js';
import { userRoutes } from './routes/users.js';
import { auditRoutes } from './routes/audit.js';
const PORT = 4501;
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
const logger = createLogger('hojai-governance');
// ============================================
// RESPONSE HELPERS
// ============================================
function createResponse(data, tenantId) {
    return {
        success: true,
        data,
        meta: {
            timestamp: new Date().toISOString(),
            requestId: `req_${Date.now()}`,
            tenantId
        }
    };
}
function createErrorResponse(code, message) {
    return {
        success: false,
        error: { code, message },
        meta: {
            timestamp: new Date().toISOString(),
            requestId: `req_${Date.now()}`
        }
    };
}
function tenantMiddleware() {
    return (req, res, next) => {
        const tenantId = req.headers['x-tenant-id'];
        const userId = req.headers['x-user-id'];
        const rolesHeader = req.headers['x-roles'];
        if (!tenantId) {
            return res.status(400).json(createErrorResponse('MISSING_TENANT_ID', 'X-Tenant-Id header required'));
        }
        let roles = [];
        if (rolesHeader) {
            try {
                roles = JSON.parse(rolesHeader);
            }
            catch {
                roles = rolesHeader.split(',');
            }
        }
        req.tenantContext = { tenant_id: tenantId, user_id: userId, roles };
        next();
    };
}
// ============================================
// PERMISSION CHECK
// ============================================
function requirePermission(permission) {
    return (req, res, next) => {
        const ctx = req.tenantContext;
        if (!ctx) {
            return res.status(401).json(createErrorResponse('UNAUTHORIZED', 'No tenant context'));
        }
        // Check if user has the required permission
        const hasPermission = ctx.permissions?.includes(permission) ||
            ctx.roles?.some(role => PERMISSION_MAP[role]?.includes(permission));
        if (!hasPermission) {
            return res.status(403).json(createErrorResponse('FORBIDDEN', `Permission denied: ${permission}`));
        }
        next();
    };
}
// Permission mapping (role -> permissions)
const PERMISSION_MAP = {
    admin: ['*'],
    owner: ['users:*', 'roles:*', 'permissions:*', 'audit:*'],
    manager: ['users:read', 'users:write', 'roles:read', 'audit:read'],
    member: ['users:read'],
    guest: []
};
const auditLog = [];
function logAudit(entry) {
    const fullEntry = {
        ...entry,
        id: uuidv4(),
        timestamp: new Date().toISOString()
    };
    auditLog.push(fullEntry);
    logger.info('audit', fullEntry);
}
// ============================================
// GATEWAY CLASS
// ============================================
class HojaiGovernance {
    app;
    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
    }
    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(express.json());
        // Request logging
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
                service: 'hojai-governance',
                version: '1.0.0',
                port: PORT,
                timestamp: new Date().toISOString()
            });
        });
        this.app.get('/health/live', (req, res) => res.json({ status: 'ok' }));
        this.app.get('/health/ready', (req, res) => res.json({ status: 'ready' }));
        // Tenant info
        this.app.get('/api/tenant', tenantMiddleware(), (req, res) => {
            const ctx = req.tenantContext;
            res.json(createResponse({
                tenant_id: ctx.tenant_id,
                stats: {
                    roles: ROLE_DEFINITIONS.length,
                    permissions: PERMISSION_DEFINITIONS.length,
                    auditEntries: auditLog.filter(a => a.tenantId === ctx.tenant_id).length
                }
            }, ctx.tenant_id));
        });
        // Mount route modules
        this.app.use('/api/roles', tenantMiddleware(), roleRoutes);
        this.app.use('/api/permissions', tenantMiddleware(), permissionRoutes);
        this.app.use('/api/users', tenantMiddleware(), userRoutes);
        this.app.use('/api/audit', tenantMiddleware(), auditRoutes);
        // Error handler
        this.app.use((err, req, res, next) => {
            logger.error('error', { error: err.message, path: req.path });
            res.status(500).json(createErrorResponse('INTERNAL_ERROR', err.message));
        });
        // 404
        this.app.use((req, res) => {
            res.status(404).json(createErrorResponse('NOT_FOUND', `Route ${req.path} not found`));
        });
    }
    start() {
        this.app.listen(PORT, () => {
            logger.info('service_started', { port: PORT });
            console.log(`
╔══════════════════════════════════════════════════════════════╗
║           HOJAI GOVERNANCE v1.0.0                           ║
╠══════════════════════════════════════════════════════════════╣
║  Port: ${PORT}                                                ║
║  Status: Running                                              ║
╠══════════════════════════════════════════════════════════════╣
║  Features:                                                   ║
║  - Role-Based Access Control (RBAC)                          ║
║  - Permission Management                                      ║
║  - Audit Logging                                              ║
║  - User Role Assignment                                       ║
╚══════════════════════════════════════════════════════════════╝
      `);
        });
    }
}
const ROLE_DEFINITIONS = [
    { id: 'admin', name: 'Administrator', description: 'Full system access', permissions: ['*'], isSystem: true },
    { id: 'owner', name: 'Owner', description: 'Tenant owner with full tenant access', permissions: ['users:*', 'roles:*', 'permissions:*', 'audit:*'], isSystem: true },
    { id: 'manager', name: 'Manager', description: 'Management access', permissions: ['users:read', 'users:write', 'roles:read', 'audit:read'], isSystem: true },
    { id: 'member', name: 'Member', description: 'Standard member access', permissions: ['users:read'], isSystem: true },
    { id: 'guest', name: 'Guest', description: 'Limited guest access', permissions: [], isSystem: true }
];
const PERMISSION_DEFINITIONS = [
    // User permissions
    { id: 'users:read', name: 'Read Users', description: 'View user list and details', category: 'users' },
    { id: 'users:write', name: 'Write Users', description: 'Create and update users', category: 'users' },
    { id: 'users:delete', name: 'Delete Users', description: 'Remove users', category: 'users' },
    // Role permissions
    { id: 'roles:read', name: 'Read Roles', description: 'View roles', category: 'roles' },
    { id: 'roles:write', name: 'Write Roles', description: 'Create and update roles', category: 'roles' },
    // Permission permissions
    { id: 'permissions:read', name: 'Read Permissions', description: 'View permissions', category: 'permissions' },
    // Audit permissions
    { id: 'audit:read', name: 'Read Audit Log', description: 'View audit logs', category: 'audit' },
    // Memory permissions
    { id: 'memory:read', name: 'Read Memory', description: 'View stored memories', category: 'memory' },
    { id: 'memory:write', name: 'Write Memory', description: 'Store new memories', category: 'memory' },
    // Event permissions
    { id: 'events:read', name: 'Read Events', description: 'View events', category: 'events' },
    { id: 'events:write', name: 'Publish Events', description: 'Publish new events', category: 'events' },
    // Workflow permissions
    { id: 'workflows:read', name: 'Read Workflows', description: 'View workflows', category: 'workflows' },
    { id: 'workflows:write', name: 'Write Workflows', description: 'Create and modify workflows', category: 'workflows' },
    { id: 'workflows:execute', name: 'Execute Workflows', description: 'Trigger workflow execution', category: 'workflows' },
    // Agent permissions
    { id: 'agents:read', name: 'Read Agents', description: 'View agents', category: 'agents' },
    { id: 'agents:write', name: 'Write Agents', description: 'Create and modify agents', category: 'agents' },
    { id: 'agents:execute', name: 'Execute Agents', description: 'Run agent executions', category: 'agents' }
];
// Export for route modules
export { ROLE_DEFINITIONS, PERMISSION_DEFINITIONS, PERMISSION_MAP, logAudit, createResponse, createErrorResponse, tenantMiddleware, requirePermission };
export default HojaiGovernance;
// ============================================
// BOOTSTRAP
// ============================================
const governance = new HojaiGovernance();
governance.start();
//# sourceMappingURL=index.js.map