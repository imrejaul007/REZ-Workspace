import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';
import sanitizeHtml from 'sanitize-html';
import xss from 'xss';
import * as mongoSanitize from 'express-mongo-sanitize';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);

  constructor(private configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Security headers
    this.setSecurityHeaders(res);

    // IP address validation and logging
    this.validateAndLogRequest(req);

    // Input sanitization
    this.sanitizeRequestData(req);

    // Request size validation
    this.validateRequestSize(req);

    next();
  }

  private setSecurityHeaders(res: Response) {
    // Enhanced security headers
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
    );
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');

    // Remove server information
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');
  }

  private validateAndLogRequest(req: Request) {
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';
    const method = req.method;
    const url = req.originalUrl;

    // Log suspicious patterns
    if (this.isSuspiciousRequest(req)) {
      this.logger.warn(`SECURITY ALERT: Suspicious request detected`, {
        ip: clientIP,
        userAgent,
        method,
        url,
        headers: this.sanitizeHeaders(req.headers),
        timestamp: new Date().toISOString(),
        severity: 'MEDIUM'
      });
    }

    // Log authentication attempts
    if (url.includes('/auth/')) {
      this.logger.log(`Authentication request`, {
        ip: clientIP,
        userAgent,
        method,
        url,
        timestamp: new Date().toISOString()
      });
    }
  }

  private isSuspiciousRequest(req: Request): boolean {
    const url = req.originalUrl.toLowerCase();
    const userAgent = (req.get('User-Agent') || '').toLowerCase();

    // Check for common attack patterns
    const suspiciousPatterns = [
      // SQL injection patterns
      'union select', 'drop table', 'insert into', 'delete from',
      // XSS patterns
      '<script>', 'javascript:', 'onerror=', 'onload=',
      // Path traversal
      '../', '..\\', '/etc/', '/proc/',
      // Command injection
      '|', '&&', '||', ';',
      // Common attack tools
      'sqlmap', 'nmap', 'burp', 'nikto', 'dirbuster'
    ];

    return suspiciousPatterns.some(pattern =>
      url.includes(pattern) || userAgent.includes(pattern)
    );
  }

  private sanitizeRequestData(req: Request) {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      req.body = this.deepSanitize(req.body);
      req.body = mongoSanitize.sanitize(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = this.deepSanitize(req.query);
      req.query = mongoSanitize.sanitize(req.query);
    }

    // Sanitize params
    if (req.params && typeof req.params === 'object') {
      req.params = this.deepSanitize(req.params);
      req.params = mongoSanitize.sanitize(req.params);
    }
  }

  private deepSanitize(obj): unknown {
    if (typeof obj !== 'object' || obj === null) {
      return typeof obj === 'string' ? this.sanitizeString(obj) : obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepSanitize(item));
    }

    const sanitized: unknown = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = this.sanitizeString(key);
      sanitized[sanitizedKey] = this.deepSanitize(value);
    }

    return sanitized;
  }

  private sanitizeString(str: string): string {
    if (typeof str !== 'string') return str;

    // XSS protection
    let sanitized = xss(str, {
      whiteList: {}, // No HTML tags allowed
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script']
    });

    // Additional sanitization
    sanitized = sanitizeHtml(sanitized, {
      allowedTags: [],
      allowedAttributes: {},
      disallowedTagsMode: 'recursiveEscape'
    });

    return sanitized;
  }

  private validateRequestSize(req: Request) {
    const contentLength = req.get('Content-Length');
    const maxSize = this.configService.get('MAX_REQUEST_SIZE', 10485760); // 10MB default

    if (contentLength && parseInt(contentLength) > maxSize) {
      this.logger.warn(`Request size exceeds limit`, {
        ip: req.ip,
        contentLength,
        maxSize,
        url: req.originalUrl
      });
    }
  }

  private sanitizeHeaders(headers): unknown {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    const sanitized = { ...headers };

    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}