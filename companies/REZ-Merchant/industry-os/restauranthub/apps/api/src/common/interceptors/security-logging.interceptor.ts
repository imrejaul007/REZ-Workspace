import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecurityLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SecurityLoggingInterceptor.name);

  constructor(private configService: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    const logData = {
      method: request.method,
      url: request.originalUrl,
      ip: request.ip,
      userAgent: request.get('User-Agent'),
      userId: request.user?.id,
      userRole: request.user?.role,
      apiKeyId: request.apiKey?.id,
      timestamp: new Date().toISOString(),
    };

    // Log sensitive operations
    if (this.isSensitiveOperation(request)) {
      this.logger.warn(`SECURITY LOG: Sensitive operation accessed`, {
        ...logData,
        severity: 'HIGH',
      });
    }

    // Log admin operations
    if (this.isAdminOperation(request)) {
      this.logger.log(`ADMIN LOG: Administrative operation`, {
        ...logData,
        severity: 'MEDIUM',
      });
    }

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;

        // Log response
        this.logger.log(`${request.method} ${request.originalUrl} - ${response.statusCode}`, {
          ...logData,
          statusCode: response.statusCode,
          duration: `${duration}ms`,
          responseSize: this.getResponseSize(data),
        });

        // Log slow requests
        if (duration > 5000) {
          this.logger.warn(`PERFORMANCE: Slow request detected`, {
            ...logData,
            duration: `${duration}ms`,
            severity: 'MEDIUM',
          });
        }
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;

        this.logger.error(`ERROR: ${request.method} ${request.originalUrl}`, error.stack || error.message, {
          ...logData,
          duration: `${duration}ms`,
          error: error.message,
          errorCode: error.code,
          severity: error.status >= 500 ? 'HIGH' : 'MEDIUM',
        });

        throw error;
      }),
    );
  }

  private isSensitiveOperation(request): boolean {
    const sensitiveEndpoints = [
      '/auth/',
      '/admin/',
      '/password',
      '/reset',
      '/users/',
      '/api-keys',
      '/permissions',
      '/roles',
      '/settings',
    ];

    return sensitiveEndpoints.some(endpoint =>
      request.originalUrl.toLowerCase().includes(endpoint)
    );
  }

  private isAdminOperation(request): boolean {
    const adminEndpoints = [
      '/admin/',
      '/system/',
      '/config/',
      '/logs/',
      '/metrics/',
    ];

    return adminEndpoints.some(endpoint =>
      request.originalUrl.toLowerCase().includes(endpoint)
    ) || request.user?.role === 'ADMIN';
  }

  private getResponseSize(data): string {
    if (!data) return '0B';

    try {
      const size = JSON.stringify(data).length;
      if (size > 1024 * 1024) {
        return `${(size / (1024 * 1024)).toFixed(2)}MB`;
      } else if (size > 1024) {
        return `${(size / 1024).toFixed(2)}KB`;
      } else {
        return `${size}B`;
      }
    } catch {
      return 'Unknown';
    }
  }
}