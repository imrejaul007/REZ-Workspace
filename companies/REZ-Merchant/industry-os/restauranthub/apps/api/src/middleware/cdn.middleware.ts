import { Injectable, NestMiddleware, CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * CDN and asset optimization middleware for API responses
 */
@Injectable()
export class CDNMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Add CDN-friendly headers for static assets
    if (this.isStaticAsset(req.path)) {
      this.addStaticAssetHeaders(res);
    }

    // Add cache headers for API responses
    if (this.isAPIRequest(req.path)) {
      this.addAPIHeaders(res, req);
    }

    // Add compression headers
    this.addCompressionHeaders(res);

    // Add security headers
    this.addSecurityHeaders(res);

    next();
  }

  private isStaticAsset(path: string): boolean {
    return /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/i.test(path);
  }

  private isAPIRequest(path: string): boolean {
    return path.startsWith('/api/');
  }

  private addStaticAssetHeaders(res: Response): void {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Vary', 'Accept-Encoding');
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }

  private addAPIHeaders(res: Response, req: Request): void {
    const method = req.method.toLowerCase();

    // Different cache strategies for different HTTP methods
    if (method === 'get') {
      // GET requests can be cached
      if (this.isCacheableEndpoint(req.path)) {
        res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600'); // 5min client, 10min CDN
      } else {
        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120'); // 1min client, 2min CDN
      }
    } else {
      // POST, PUT, DELETE are not cached
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    res.setHeader('Vary', 'Accept-Encoding, Authorization');
  }

  private addCompressionHeaders(res: Response): void {
    res.setHeader('Accept-Encoding', 'gzip, deflate, br');
  }

  private addSecurityHeaders(res: Response): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
  }

  private isCacheableEndpoint(path: string): boolean {
    // Define which endpoints can be cached longer
    const cacheablePatterns = [
      '/api/restaurants',
      '/api/categories',
      '/api/products',
      '/api/jobs',
    ];

    return cacheablePatterns.some(pattern => path.startsWith(pattern));
  }
}

/**
 * Asset response optimization interceptor
 */
@Injectable()
export class AssetOptimizationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        // Transform image URLs to CDN URLs if needed
        if (data && typeof data === 'object') {
          return this.transformAssetUrls(data);
        }
        return data;
      })
    );
  }

  private transformAssetUrls(data): unknown {
    if (Array.isArray(data)) {
      return data.map(item => this.transformAssetUrls(item));
    }

    if (data && typeof data === 'object') {
      const transformed = { ...data };

      // Transform common image fields
      const imageFields = ['image', 'avatar', 'logo', 'banner', 'thumbnail', 'photo'];

      imageFields.forEach(field => {
        if (transformed[field] && typeof transformed[field] === 'string') {
          transformed[field] = this.getCDNUrl(transformed[field]);
        }
      });

      // Recursively transform nested objects
      Object.keys(transformed).forEach(key => {
        if (transformed[key] && typeof transformed[key] === 'object') {
          transformed[key] = this.transformAssetUrls(transformed[key]);
        }
      });

      return transformed;
    }

    return data;
  }

  private getCDNUrl(url: string): string {
    // If already a CDN URL or external URL, return as-is
    if (url.startsWith('http') || url.startsWith('//')) {
      return url;
    }

    // Transform relative URLs to CDN URLs
    const cdnBaseUrl = process.env.CDN_BASE_URL || '';
    if (cdnBaseUrl) {
      return `${cdnBaseUrl}${url.startsWith('/') ? url : '/' + url}`;
    }

    return url;
  }
}