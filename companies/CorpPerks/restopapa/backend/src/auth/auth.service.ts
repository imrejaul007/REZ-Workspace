import logger from './utils/logger';

import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
// import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, role, phone, ...profileData } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('User already exists with this email or phone');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    try {
      // Create user in transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            email,
            phone,
            passwordHash,
            role,
          },
        });

        // Create role-specific profile
        switch (role) {
          case 'restaurant':
            await tx.restaurant.create({
              data: {
                userId: user.id,
                businessName: profileData.businessName || '',
                ownerName: profileData.ownerName || '',
                category: profileData.category || 'casual_dining',
              },
            });
            break;

          case 'employee':
            await tx.employee.create({
              data: {
                userId: user.id,
                fullName: profileData.fullName || '',
              },
            });
            break;

          case 'vendor':
            await tx.vendor.create({
              data: {
                userId: user.id,
                businessName: profileData.businessName || '',
                ownerName: profileData.ownerName || '',
                category: profileData.vendorCategory || 'raw_materials',
              },
            });
            break;
        }

        return user;
      });

      // Generate JWT token
      const token = this.generateJwtToken(result);

      // Record analytics event
      await this.prisma.recordAnalyticsEvent(
        result.id,
        'user_registered',
        { role: result.role },
      );

      return {
        user: this.sanitizeUser(result),
        token,
      };
    } catch (error) {
      throw new BadRequestException('Failed to create user account');
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user with role-specific data
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        restaurant: true,
        employee: true,
        vendor: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate JWT token
    const token = this.generateJwtToken(user);

    // Record analytics event
    await this.prisma.recordAnalyticsEvent(
      user.id,
      'user_login',
      { role: user.role },
    );

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && user.isActive && await bcrypt.compare(password, user.passwordHash)) {
      return this.sanitizeUser(user);
    }
    return null;
  }

  async getProfile(userId: string) {
    const user = await this.prisma.getUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, updateData: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Update user basic info if provided
    const userUpdateData: any = {};
    if (updateData.phone && updateData.phone !== user.phone) {
      // Check if phone is already taken
      const phoneExists = await this.prisma.user.findUnique({
        where: { phone: updateData.phone },
      });
      if (phoneExists && phoneExists.id !== userId) {
        throw new ConflictException('Phone number already in use');
      }
      userUpdateData.phone = updateData.phone;
      userUpdateData.isPhoneVerified = false; // Reset verification
    }

    // Update user if there are changes
    if (Object.keys(userUpdateData).length > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: userUpdateData,
      });
    }

    // Update role-specific profile
    await this.updateRoleSpecificProfile(userId, user.role, updateData);

    return this.getProfile(userId);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Record analytics event
    await this.prisma.recordAnalyticsEvent(
      userId,
      'password_changed',
    );

    return { message: 'Password changed successfully' };
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Store reset token (you'd typically store this in database)
    // For now, just log it (in production, send via email)
    logger.info(`Password reset token for ${email}: ${resetToken}`);

    // Record analytics event
    await this.prisma.recordAnalyticsEvent(
      user.id,
      'password_reset_requested',
    );

    return { message: 'If the email exists, a reset link has been sent' };
  }

  generateJwtToken(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  sanitizeUser(user: any) {
    const { passwordHash, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  private async updateRoleSpecificProfile(userId: string, role: string, updateData: any) {
    switch (role) {
      case 'restaurant':
        if (updateData.restaurant) {
          await this.prisma.restaurant.update({
            where: { userId },
            data: updateData.restaurant,
          });
        }
        break;

      case 'employee':
        if (updateData.employee) {
          await this.prisma.employee.update({
            where: { userId },
            data: updateData.employee,
          });
        }
        break;

      case 'vendor':
        if (updateData.vendor) {
          await this.prisma.vendor.update({
            where: { userId },
            data: updateData.vendor,
          });
        }
        break;
    }
  }
}