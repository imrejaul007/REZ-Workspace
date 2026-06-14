import { Application, Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { findRoute } from '../routes';
import { logProxyEvent, logError } from '../utils/logger';

// Error handler for proxy errors
function handleProxyError(
  err: Error & { code?: string },
  req: Request,
  res: Response
): void {
  logError(err, {
    requestId: req.context?.requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: req.auth?.userId,
  }, { type: 'proxy_error' });

  // Determine status code based on error
  let statusCode = 502;
  let message = 'Bad gateway';

  if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Service unavailable';
  } else if (err.code === 'ETIMEDOUT') {
    statusCode = 504;
    message = 'Gateway timeout';
  }

  if (!res.headersSent) {
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'PROXY_ERROR',
        message,
        requestId: req.context?.requestId || 'unknown',
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Create proxy middleware for a specific route
export function createProxy(route: string, target: string, timeout: number) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    timeout,
    proxyTimeout: timeout,
    logLevel: 'warn' as const,
    // Path rewrite to strip the gateway prefix
    pathRewrite: {
      [`^${route}`]: '',
    },
    onProxyReq: (proxyReq, req: Request) => {
      logProxyEvent('proxy_start', target, {
        requestId: req.context?.requestId,
        method: req.method,
        path: req.path,
      });

      // Add custom headers
      proxyReq.setHeader('X-Request-Id', req.context?.requestId || '');
      proxyReq.setHeader('X-Gateway-Time', new Date().toISOString());

      // Pass auth info to target service
      if (req.auth) {
        proxyReq.setHeader('X-User-Id', req.auth.userId);
        proxyReq.setHeader('X-User-Email', req.auth.email);
        proxyReq.setHeader('X-User-Role', req.auth.role);
        proxyReq.setHeader('X-Company-Id', req.auth.companyId);
        proxyReq.setHeader('X-User-Permissions', JSON.stringify(req.auth.permissions));
      }

      // Forward real IP
      const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      proxyReq.setHeader('X-Forwarded-For', Array.isArray(ip) ? ip.join(', ') : String(ip));

      return proxyReq;
    },
    onProxyRes: (proxyRes, req: Request, _res: Response) => {
      logProxyEvent('proxy_end', target, {
        requestId: req.context?.requestId,
        method: req.method,
        path: req.path,
      }, { statusCode: proxyRes.statusCode });
    },
    onError: (err, req, res) => {
      handleProxyError(err, req, res);
    },
  });
}

// Setup all route proxies
export function setupProxies(app: Application): void {
  const routes = [
    { path: '/api/employees', target: 'http://localhost:4006' },
    { path: '/api/attendance', target: 'http://localhost:4006' },
    { path: '/api/payroll', target: 'http://localhost:4738' },
    { path: '/api/performance', target: 'http://localhost:4729' },
    { path: '/api/1on1', target: 'http://localhost:4728' },
    { path: '/api/okr', target: 'http://localhost:4730' },
    { path: '/api/workflow', target: 'http://localhost:4731' },
    { path: '/api/onboarding', target: 'http://localhost:4732' },
    { path: '/api/exit', target: 'http://localhost:4733' },
    { path: '/api/lms', target: 'http://localhost:4734' },
    { path: '/api/reports', target: 'http://localhost:4735' },
    { path: '/api/calendar', target: 'http://localhost:4736' },
    { path: '/api/sso', target: 'http://localhost:4737' },
    { path: '/api/shifts', target: 'http://localhost:4739' },
    { path: '/api/compensation', target: 'http://localhost:4740' },
    { path: '/api/documents', target: 'http://localhost:4741' },
    { path: '/api/video', target: 'http://localhost:4742' },
    { path: '/api/crm', target: 'http://localhost:4725' },
    { path: '/api/corpid', target: 'http://localhost:4701' },
    { path: '/api/projects', target: 'http://localhost:4715' },
    { path: '/api/team', target: 'http://localhost:4716' },
  ];

  for (const route of routes) {
    const config = findRoute(route.path);
    const timeout = config?.timeout || 30000;

    logProxyEvent('proxy_start', route.target, { path: route.path }, { setup: true });

    app.use(route.path, createProxy(route.path, route.target, timeout));
  }
}

export default { createProxy, setupProxies };
