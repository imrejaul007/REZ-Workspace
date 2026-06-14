import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

/**
 * Secure Mock Data Service
 *
 * This service handles the secure initialization of mock/demo data for development.
 * It ensures that no hardcoded credentials are present in the source code and
 * all demo credentials are loaded from environment variables.
 *
 * Security Features:
 * - No hardcoded password hashes in source code
 * - Environment-based credential configuration
 * - Secure password hashing with Argon2
 * - Audit logging for security events
 */
@Injectable()
export class SecureMockDataService {
  private readonly logger = new Logger(SecureMockDataService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Initialize secure demo users from environment configuration
   * Only creates users if all required environment variables are present
   */
  async initializeDemoUsers(): Promise<unknown[]> {
    this.logger.log('Initializing secure demo users from environment configuration');

    const demoConfigs = [
      {
        id: 'mock-admin-1',
        emailKey: 'DEMO_ADMIN_EMAIL',
        passwordKey: 'DEMO_ADMIN_PASSWORD',
        phone: '+1234567890',
        role: 'ADMIN',
        name: 'System Administrator'
      },
      {
        id: 'mock-restaurant-1',
        emailKey: 'DEMO_RESTAURANT_EMAIL',
        passwordKey: 'DEMO_RESTAURANT_PASSWORD',
        phone: '+1234567891',
        role: 'RESTAURANT',
        name: 'Restaurant Owner'
      },
      {
        id: 'mock-vendor-1',
        emailKey: 'DEMO_VENDOR_EMAIL',
        passwordKey: 'DEMO_VENDOR_PASSWORD',
        phone: '+1234567892',
        role: 'VENDOR',
        name: 'Vendor Manager'
      },
      {
        id: 'mock-employee-1',
        emailKey: 'DEMO_EMPLOYEE_EMAIL',
        passwordKey: 'DEMO_EMPLOYEE_PASSWORD',
        phone: '+1234567893',
        role: 'EMPLOYEE',
        name: 'Restaurant Employee'
      }
    ];

    const users: unknown[] = [];

    for (const config of demoConfigs) {
      const email = this.configService.get(config.emailKey);
      const password = this.configService.get(config.passwordKey);

      if (!email || !password) {
        this.logger.warn(`Skipping ${config.role} demo user - missing ${config.emailKey} or ${config.passwordKey} in environment`);
        continue;
      }

      try {
        // Hash password securely using Argon2
        const passwordHash = await argon2.hash(password, {
          type: argon2.argon2id,
          memoryCost: 2 ** 16, // 64 MB
          timeCost: 3,
          parallelism: 1,
        });

        const user = {
          id: config.id,
          email,
          passwordHash,
          phone: config.phone,
          role: config.role,
          isActive: true,
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        users.push(user);

        // Log creation without sensitive data
        this.logger.log(`Created secure demo user: ${config.role} (${email})`);
      } catch (error) {
        this.logger.error(`Failed to create demo user ${config.role}:`, error);
      }
    }

    if (users.length === 0) {
      this.logger.warn('No demo users configured - demo authentication will not work');
      this.logger.warn('To enable demo users, set DEMO_*_EMAIL and DEMO_*_PASSWORD environment variables');
    } else {
      this.logger.log(`Successfully initialized ${users.length} secure demo users`);
    }

    return users;
  }

  /**
   * Initialize corresponding profiles for demo users
   */
  async initializeDemoProfiles(users: unknown[]): Promise<unknown[]> {
    const profiles: unknown[] = [];

    for (const user of users) {
      const nameMap: Partial<Record<UserRole, { firstName: string; lastName: string }>> = {
        ADMIN: { firstName: 'System', lastName: 'Administrator' },
        RESTAURANT: { firstName: 'Restaurant', lastName: 'Owner' },
        VENDOR: { firstName: 'Vendor', lastName: 'Manager' },
        EMPLOYEE: { firstName: 'Restaurant', lastName: 'Employee' }
      };

      const names = nameMap[user.role as UserRole] || { firstName: 'Demo', lastName: 'User' };

      profiles.push({
        id: `mock-profile-${user.id}`,
        userId: user.id,
        firstName: names.firstName,
        lastName: names.lastName,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    this.logger.log(`Initialized ${profiles.length} demo user profiles`);
    return profiles;
  }

  /**
   * Validate environment configuration for security
   */
  validateSecurityConfiguration(): void {
    const requiredSecrets = [
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'SESSION_SECRET'
    ];

    const missingSecrets = requiredSecrets.filter(key => {
      const value = this.configService.get(key);
      return !value || value.length < 32; // Minimum 32 characters for secrets
    });

    if (missingSecrets.length > 0) {
      this.logger.error(`SECURITY WARNING: Missing or weak secrets detected: ${missingSecrets.join(', ')}`);
      this.logger.error('Please ensure all secrets are at least 32 characters long and cryptographically secure');
    }

    // Check for default/weak secrets
    const weakSecrets = requiredSecrets.filter(key => {
      const value = this.configService.get(key);
      return value && (
        value.includes('secret') ||
        value.includes('password') ||
        value.includes('123') ||
        value === 'your-secret-key' ||
        value === 'change-me'
      );
    });

    if (weakSecrets.length > 0) {
      this.logger.error(`SECURITY WARNING: Weak/default secrets detected: ${weakSecrets.join(', ')}`);
      this.logger.error('Please generate cryptographically secure secrets for production');
    }
  }
}
