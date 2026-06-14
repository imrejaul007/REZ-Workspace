import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

// Security Services
import { TokenBlacklistService } from '../../modules/auth/services/token-blacklist.service';
import { SessionService } from '../services/session.service';

// Security Guards
import { ApiKeyGuard } from '../guards/api-key.guard';
import { BruteForceGuard } from '../guards/brute-force.guard';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';

// Security Middleware & Interceptors
import { SecurityMiddleware } from '../middleware/security.middleware';
import { SecurityLoggingInterceptor } from '../interceptors/security-logging.interceptor';

// Security Filters
import { GlobalExceptionFilter } from '../filters/global-exception.filter';

// Security Tasks
import { SecurityCleanupTask } from '../tasks/security-cleanup.task';

// Security Validators
import { IsSecureStringConstraint, IsStrongPasswordConstraint, IsSafeFilenameConstraint } from '../decorators/validators';

@Global()
@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    // Core Security Services
    TokenBlacklistService,
    SessionService,
    SecurityCleanupTask,

    // Security Guards — registered both as injectable class AND as global APP_GUARD
    BruteForceGuard,
    {
      provide: APP_GUARD,
      useClass: BruteForceGuard,
    },

    // Security Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: SecurityLoggingInterceptor,
    },

    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },

    // Custom Validators
    IsSecureStringConstraint,
    IsStrongPasswordConstraint,
    IsSafeFilenameConstraint,
  ],
  exports: [
    TokenBlacklistService,
    SessionService,
    SecurityCleanupTask,
    IsSecureStringConstraint,
    IsStrongPasswordConstraint,
    IsSafeFilenameConstraint,
  ],
})
export class SecurityModule {
  // Security configuration constants
  static readonly SECURITY_CONFIG = {
    // Password requirements
    PASSWORD: {
      MIN_LENGTH: 8,
      REQUIRE_UPPERCASE: true,
      REQUIRE_LOWERCASE: true,
      REQUIRE_NUMBERS: true,
      REQUIRE_SYMBOLS: true,
    },

    // Rate limiting
    RATE_LIMITS: {
      GLOBAL: {
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        MAX_REQUESTS: 1000,
      },
      AUTH: {
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        MAX_REQUESTS: 5,
      },
      PASSWORD_RESET: {
        WINDOW_MS: 60 * 60 * 1000, // 1 hour
        MAX_REQUESTS: 3,
      },
    },

    // Session management
    SESSION: {
      DURATION_MS: 24 * 60 * 60 * 1000, // 24 hours
      CLEANUP_INTERVAL_MS: 60 * 60 * 1000, // 1 hour
      MAX_SESSIONS_PER_USER: 10,
    },

    // Token management
    TOKEN: {
      ACCESS_EXPIRES_IN: '15m',
      REFRESH_EXPIRES_IN: '7d',
      BLACKLIST_CLEANUP_INTERVAL_MS: 60 * 60 * 1000, // 1 hour
    },

    // Brute force protection
    BRUTE_FORCE: {
      MAX_ATTEMPTS: {
        LOGIN: 5,
        PASSWORD_RESET: 3,
        DEFAULT: 10,
      },
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
      BLOCK_DURATION_MS: 60 * 60 * 1000, // 1 hour
    },

    // File upload security
    FILE_UPLOAD: {
      MAX_SIZE: 10 * 1024 * 1024, // 10MB
      ALLOWED_TYPES: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'text/plain',
        'text/csv',
      ],
      BLOCKED_EXTENSIONS: [
        '.exe', '.bat', '.cmd', '.com', '.pif', '.scr',
        '.vbs', '.js', '.jar', '.sh', '.ps1',
      ],
    },

    // Security headers
    HEADERS: {
      HSTS: {
        MAX_AGE: 31536000, // 1 year
        INCLUDE_SUB_DOMAINS: true,
        PRELOAD: true,
      },
      CSP: {
        DEFAULT_SRC: ["'self'"],
        SCRIPT_SRC: ["'self'", "'unsafe-inline'"],
        STYLE_SRC: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        IMG_SRC: ["'self'", 'data:', 'https:'],
        CONNECT_SRC: ["'self'", 'https://api.stripe.com'],
        FONT_SRC: ["'self'", 'https://fonts.gstatic.com'],
      },
    },
  };

  // Security utility methods
  static getSecurityHeaders(environment: string) {
    const isProduction = environment === 'production';

    return {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      ...(isProduction && {
        'Strict-Transport-Security': `max-age=${SecurityModule.SECURITY_CONFIG.HEADERS.HSTS.MAX_AGE}; includeSubDomains; preload`,
      }),
    };
  }

  static getCSPDirective(environment: string) {
    const config = SecurityModule.SECURITY_CONFIG.HEADERS.CSP;

    return [
      `default-src ${config.DEFAULT_SRC.join(' ')}`,
      `script-src ${config.SCRIPT_SRC.join(' ')}`,
      `style-src ${config.STYLE_SRC.join(' ')}`,
      `img-src ${config.IMG_SRC.join(' ')}`,
      `connect-src ${config.CONNECT_SRC.join(' ')}`,
      `font-src ${config.FONT_SRC.join(' ')}`,
      "frame-src 'none'",
      "object-src 'none'",
      ...(environment === 'production' ? ['upgrade-insecure-requests'] : []),
    ].join('; ');
  }

  static validateEnvironmentVariables() {
    const required = [
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'DATABASE_URL',
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Validate JWT secret strength
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret && jwtSecret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }

    return true;
  }
}

export default SecurityModule;