import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';
import * as crypto from 'crypto';

export const API_KEY_REQUIRED = 'apiKeyRequired';
export const RequireApiKey = (required: boolean = true) => SetMetadata(API_KEY_REQUIRED, required);

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const apiKeyRequired = this.reflector.get<boolean>(API_KEY_REQUIRED, context.getHandler()) ||
                          this.reflector.get<boolean>(API_KEY_REQUIRED, context.getClass());

    if (!apiKeyRequired) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      this.logger.warn(`API key missing for ${request.method} ${request.path}`, {
        ip: request.ip,
        userAgent: request.get('User-Agent'),
      });
      throw new UnauthorizedException('API key is required');
    }

    const isValid = await this.validateApiKey(apiKey, request);

    if (!isValid) {
      this.logger.warn(`Invalid API key used`, {
        ip: request.ip,
        userAgent: request.get('User-Agent'),
        path: request.path,
        keyPrefix: apiKey.substring(0, 8) + '...',
      });
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }

  private extractApiKey(request): string | null {
    // Check header
    const headerKey = request.headers['x-api-key'];
    if (headerKey) return headerKey;

    // Check query parameter
    const queryKey = request.query['api_key'];
    if (queryKey) return queryKey;

    return null;
  }

  private async validateApiKey(apiKey: string, request): Promise<boolean> {
    try {
      // Hash the API key for comparison
      const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

      // Check in database
      const apiKeyRecord = await this.prisma.apiKey.findFirst({
        where: {
          keyHash: hashedKey,
          isActive: true,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              isActive: true,
            },
          },
        },
      });

      if (!apiKeyRecord || !apiKeyRecord.user.isActive) {
        return false;
      }

      // Update last used timestamp
      await this.prisma.apiKey.update({
        where: { id: apiKeyRecord.id },
        data: {
          lastUsedAt: new Date(),
          usageCount: {
            increment: 1,
          },
        },
      });

      // Add API key info to request for later use
      request.apiKey = {
        id: apiKeyRecord.id,
        name: apiKeyRecord.name,
        permissions: (apiKeyRecord as unknown).permissions,
        userId: apiKeyRecord.userId,
        user: apiKeyRecord.user,
      };

      this.logger.log(`Valid API key used: ${apiKeyRecord.name}`, {
        userId: apiKeyRecord.userId,
        ip: request.ip,
        path: request.path,
      });

      return true;
    } catch (error) {
      this.logger.error('Error validating API key:', error);
      return false;
    }
  }
}