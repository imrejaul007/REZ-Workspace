import { Injectable, NestMiddleware, Logger, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PerformanceService } from './performance.service';

@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  private readonly logger = new Logger(PerformanceMiddleware.name);

  constructor(private readonly performanceService: PerformanceService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = process.hrtime.bigint();
    (req as unknown)['startTime'] = startTime;
    (req as unknown)['startTimestamp'] = Date.now();

    // Capture class members before the closure to avoid `this` binding issues
    const perfSvc = this.performanceService;
    const log = this.logger;

    const originalEnd = res.end.bind(res) as typeof res.end;

    (res as unknown).end = function(chunk?, encoding?: BufferEncoding | (() => void), cb?: () => void) {
      const endTime = process.hrtime.bigint();
      const responseTime = Number(endTime - startTime) / 1_000_000;
      const isError = res.statusCode >= 400;

      perfSvc.recordRequest(responseTime, isError);

      if (responseTime > 1000) {
        log.warn(`Slow request detected: ${req.method} ${req.path} - ${responseTime.toFixed(2)}ms`);
      }
      if (isError) {
        log.error(`Error response: ${req.method} ${req.path} - ${res.statusCode} in ${responseTime.toFixed(2)}ms`);
      }

      return originalEnd.call(res, chunk, encoding as BufferEncoding, cb);
    };

    next();
  }
}

// Performance interceptor for controllers
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import type {} from '@nestjs/common'; // no-op: NestInterceptor/ExecutionContext/CallHandler already imported above

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);

  constructor(private readonly performanceService: PerformanceService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const controller = context.getClass().name;
    const handler = context.getHandler().name;
    const methodKey = `${controller}.${handler}`;

    const timer = this.performanceService.startTimer(methodKey);

    return next.handle().pipe(
      tap(() => {
        const duration = timer();

        // Log slow controller methods
        if (duration > 500) {
          this.logger.warn(`Slow controller method: ${methodKey} took ${duration.toFixed(2)}ms`);
        }
      }),
      catchError((error) => {
        const duration = timer();
        this.logger.error(`Controller method error: ${methodKey} failed after ${duration.toFixed(2)}ms - ${error.message}`);
        throw error;
      })
    );
  }
}

// Database performance interceptor
@Injectable()
export class DatabasePerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DatabasePerformanceInterceptor.name);

  constructor(private readonly performanceService: PerformanceService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const queryInfo = this.extractQueryInfo(context);

    return next.handle().pipe(
      tap(() => {
        // Database query completed successfully
      }),
      catchError((error) => {
        this.logger.error(`Database query failed: ${queryInfo} - ${error.message}`);
        throw error;
      })
    );
  }

  private extractQueryInfo(context: ExecutionContext): string {
    // Extract meaningful query information from context
    const handler = context.getHandler().name;
    const controller = context.getClass().name;
    return `${controller}.${handler}`;
  }
}

// Memory monitoring middleware
@Injectable()
export class MemoryMiddleware implements NestMiddleware {
  private readonly logger = new Logger(MemoryMiddleware.name);
  private memoryCheckInterval: NodeJS.Timeout | null = null;

  constructor(private readonly performanceService: PerformanceService) {
    this.startMemoryMonitoring();
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // Check for potential memory leaks on high-memory operations
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;

    if (heapUsedMB > 500) { // More than 500MB
      this.logger.warn(`High memory usage detected: ${heapUsedMB.toFixed(2)}MB`);

      // Trigger memory leak detection
      const leakStatus = this.performanceService.detectMemoryLeaks();
      if (leakStatus.status === 'potential_leak') {
        this.logger.error('Potential memory leak detected', leakStatus);
      }
    }

    next();
  }

  private startMemoryMonitoring(): void {
    // Check memory usage every 30 seconds
    this.memoryCheckInterval = setInterval(() => {
      const metrics = this.performanceService.getMetrics();
      const memUsage = metrics.system.memoryUsage;
      const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

      if (heapUsedPercent > 80) {
        this.logger.warn(`Memory usage warning: ${heapUsedPercent.toFixed(1)}% of heap used`);
      }

      // Force garbage collection if memory usage is very high
      if (heapUsedPercent > 90 && global.gc) {
        this.logger.log('Forcing garbage collection due to high memory usage');
        global.gc();
      }
    }, 30000);
  }

  onModuleDestroy(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }
  }
}

// Rate limiting performance middleware
@Injectable()
export class RateLimitPerformanceMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitPerformanceMiddleware.name);
  private requestCounts = new Map<string, number>();
  private lastReset = Date.now();

  constructor(private readonly performanceService: PerformanceService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const clientId = this.getClientId(req);
    const now = Date.now();

    // Reset counters every minute
    if (now - this.lastReset > 60000) {
      this.requestCounts.clear();
      this.lastReset = now;
    }

    // Track requests per client
    const currentCount = this.requestCounts.get(clientId) || 0;
    this.requestCounts.set(clientId, currentCount + 1);

    // Log high request rates
    if (currentCount > 100) { // More than 100 requests per minute
      this.logger.warn(`High request rate from client ${clientId}: ${currentCount} requests/min`);
    }

    next();
  }

  private getClientId(req: Request): string {
    return req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
  }
}

// Request size monitoring middleware
@Injectable()
export class RequestSizeMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestSizeMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    let requestSize = 0;

    // Calculate request size
    if (req.headers['content-length']) {
      requestSize = parseInt(req.headers['content-length']);
    }

    // Log large requests
    if (requestSize > 10 * 1024 * 1024) { // Larger than 10MB
      this.logger.warn(`Large request detected: ${requestSize} bytes from ${req.ip} to ${req.path}`);
    }

    // Monitor response size
    const sizeLogger = this.logger;
    const originalSend = res.send.bind(res);
    (res as unknown).send = function(body) {
      if (body) {
        try {
          const responseSize = Buffer.byteLength(JSON.stringify(body));
          if (responseSize > 5 * 1024 * 1024) {
            sizeLogger.warn(`Large response sent: ${responseSize} bytes to ${req.ip} from ${req.path}`);
          }
        } catch { /* ignore non-serialisable bodies */ }
      }
      return originalSend(body);
    };

    next();
  }
}

// Performance header middleware
@Injectable()
export class PerformanceHeaderMiddleware implements NestMiddleware {
  constructor(private readonly performanceService: PerformanceService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();

    res.on('finish', () => {
      const responseTime = Date.now() - startTime;

      // Add performance headers in development mode
      if (process.env.NODE_ENV === 'development') {
        res.setHeader('X-Response-Time', `${responseTime}ms`);
        res.setHeader('X-Node-Version', process.version);
        res.setHeader('X-Memory-Usage', `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);

        const metrics = this.performanceService.getMetrics();
        res.setHeader('X-Event-Loop-Delay', `${metrics.application.eventLoopDelay.toFixed(2)}ms`);
      }
    });

    next();
  }
}