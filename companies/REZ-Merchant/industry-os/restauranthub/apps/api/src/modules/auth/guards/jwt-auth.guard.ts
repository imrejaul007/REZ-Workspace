import { Injectable, UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenBlacklistService } from '../services/token-blacklist.service';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private tokenBlacklistService: TokenBlacklistService,
    private reflector: Reflector,
  ) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const canActivate = await super.canActivate(context);

    if (!canActivate) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (token && await this.tokenBlacklistService.isTokenBlacklisted(token)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    return true;
  }

  override handleRequest(err, user, info, context: ExecutionContext) {
    if (err || !user) {
      // Enhanced error messages for different scenarios
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      } else if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token format');
      } else if (info?.name === 'NotBeforeError') {
        throw new UnauthorizedException('Token not active yet');
      }

      throw err || new UnauthorizedException('Authentication required');
    }

    // Additional security checks - verify user object has required properties
    if (!user || typeof user !== 'object') {
      throw new UnauthorizedException('Invalid user object');
    }

    if (user.isActive === false) {
      throw new UnauthorizedException('Account is deactivated');
    }

    return user;
  }

  private extractTokenFromHeader(request): string | null {
    const authorization = request?.headers?.authorization;
    if (!authorization || typeof authorization !== 'string') {
      return null;
    }

    const parts = authorization.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
      return null;
    }

    return parts[1];
  }
}