import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { EmailService } from './services/email.service';
import { VerificationService } from './services/verification.service';
import { NotificationDeliveryService } from '../../services/notification-delivery.service';
import { UserRole } from '@prisma/client';
import * as crypto from 'crypto';
import { Logger } from '@nestjs/common';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private tokenBlacklistService: TokenBlacklistService,
    private emailService: EmailService,
    private verificationService: VerificationService,
    private notificationService: NotificationDeliveryService,
  ) {}

  async signUp(signUpDto) {
    const { email, password, role = UserRole.CUSTOMER, firstName, lastName, phone, appSource = 'restopapa_web' } = signUpDto;

    // Validate required fields
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    // Hash password
    const passwordHash = await argon2.hash(password);

    // Create user with unique constraint handling to prevent race conditions
    let user;
    try {
      user = await this.prisma.user.create({
        data: {
          email,
          phone: phone || null,
          passwordHash,
          role: role as UserRole,
          appSource,
          lastLoginApp: appSource,
        },
      });
    } catch (error) {
      // Handle unique constraint violation (race condition when user was just created)
      if (error.code === 'P2002') {
        throw new ConflictException('User with this email or phone already exists');
      }
      throw error;
    }

    // Create profile with firstName and lastName
    await this.prisma.profile.create({
      data: {
        userId: user.id,
        firstName: firstName || 'User',
        lastName: lastName || '',
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Save refresh token and create session
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    await this.createSession(user.id, tokens.accessToken);

    // Send email verification (non-blocking)
    this.verificationService.sendEmailVerification(user.id, user.email).catch((err) => {
      this.logger.error(`Failed to send verification email to ${user.email}:`, err);
    });

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async signIn(signInDto) {
    const { email, password, appSource = 'restopapa_web' } = signInDto;

    // Validate required fields
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Block local login for REZ bridge accounts — they must use POST /auth/rez-bridge
    if (user.passwordHash.startsWith('rez_bridge_no_local_password:')) {
      throw new UnauthorizedException('This account was created via REZ. Please sign in using the REZ app.');
    }

    const passwordValid = await argon2.verify(user.passwordHash, password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Update refresh token and last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: await argon2.hash(tokens.refreshToken),
        lastLoginAt: new Date(),
        lastLoginApp: appSource,
      },
    });

    this.logger.log(`User ${user.email} logged in successfully`);

    // Create session
    await this.createSession(user.id, tokens.accessToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async logout(userId: string, accessToken?: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    // Blacklist the access token so it cannot be reused before it expires
    if (accessToken) {
      await this.tokenBlacklistService.blacklistToken(accessToken, userId, 'logout');
    }

    // Invalidate current session
    const currentSession = await this.prisma.session.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (currentSession) {
      await this.prisma.session.delete({
        where: { id: currentSession.id },
      });
    }

    this.logger.log(`User ${userId} logged out`);
    return { message: 'Logged out successfully' };
  }

  async refreshTokens(refreshToken: string) {
    // Verify the refresh token signature
    let payload;
    try {
      payload = jwt.verify(
        refreshToken,
        (this.configService.get('JWT_REFRESH_SECRET') || this.configService.get('JWT_SECRET')) as string,
      ) as unknown;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive || !user.refreshToken) {
      throw new UnauthorizedException('User not found or logged out');
    }

    // Verify stored refresh token matches
    const tokenValid = await argon2.verify(user.refreshToken, refreshToken);
    if (!tokenValid) {
      throw new UnauthorizedException('Refresh token mismatch — please log in again');
    }

    // Issue new token pair (token rotation)
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    await this.createSession(user.id, tokens.accessToken);

    return tokens;
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const passwordValid = await argon2.verify(user.passwordHash, password);

    if (!passwordValid || !user.isActive) {
      return null;
    }

    return this.sanitizeUser(user);
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const accessJti = crypto.randomUUID();
    const refreshJti = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.sign(
        {
          sub: userId,
          email,
          role,
          jti: accessJti,
          iat: now,
          type: 'access'
        },
        {
          secret: this.configService.get('JWT_SECRET'),
          expiresIn: this.configService.get('JWT_EXPIRES_IN') || '15m',
        },
      ),
      this.jwtService.sign(
        {
          sub: userId,
          email,
          role,
          jti: refreshJti,
          iat: now,
          type: 'refresh'
        },
        {
          secret: this.configService.get('JWT_REFRESH_SECRET') || this.configService.get('JWT_SECRET'),
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes
      tokenType: 'Bearer',
    };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });
  }

  private async createSession(userId: string, token: string) {
    await this.prisma.session.create({
      data: {
        userId,
        token,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });
  }

  async disable2FA(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.twoFactorEnabled) {
      return { message: '2FA is not enabled on this account' };
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    this.logger.log(`User ${userId} disabled 2FA`);
    return { message: '2FA has been disabled successfully' };
  }

  async sendOtp(identifier: string, purpose: string) {
    // Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();
    const codeHash = await argon2.hash(code);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Invalidate any existing unverified OTPs for this identifier+purpose
    await this.prisma.otpCode.updateMany({
      where: { identifier, purpose, verifiedAt: null },
      data: { expiresAt: new Date() }, // expire immediately
    });

    await this.prisma.otpCode.create({
      data: { identifier, codeHash, purpose, expiresAt },
    });

    // Send OTP via NotificationDeliveryService (RABTUL)
    try {
      const isEmail = identifier.includes('@');
      if (isEmail) {
        await this.notificationService.sendTemplatedEmail(
          identifier,
          'OTP_VERIFICATION',
          { otp: code, purpose, expiry: '5 minutes' },
          { subject: `Your ${purpose} verification code` }
        );
      } else {
        await this.notificationService.sendOTPSMS(identifier, code, purpose);
      }
      this.logger.log(`[OTP] Sent to ${identifier} via ${isEmail ? 'email' : 'SMS'}`);
    } catch (error) {
      // Log but don't fail - OTP is stored in DB
      this.logger.error(`[OTP] Delivery failed for ${identifier}: ${error}`);
      // In dev, still log the code
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(`[OTP] DEV MODE - Code for ${identifier}: ${code}`);
      }
    }

    return { success: true, message: 'OTP sent successfully' };
  }

  async verifyOtp(identifier: string, code: string, purpose: string) {
    // Rate limit: max 5 failed attempts before the record self-expires
    const MAX_ATTEMPTS = 5;

    const record = await this.prisma.otpCode.findFirst({
      where: {
        identifier,
        purpose,
        verifiedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new BadRequestException('No active OTP found. Please request a new one.');
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      await this.prisma.otpCode.update({ where: { id: record.id }, data: { expiresAt: new Date() } });
      throw new BadRequestException('Too many failed attempts. Please request a new OTP.');
    }

    const valid = await argon2.verify(record.codeHash, code);
    if (!valid) {
      await this.prisma.otpCode.update({
        where: { id: record.id },
        data: { attempts: record.attempts + 1 },
      });
      throw new BadRequestException('Invalid OTP code');
    }

    // Success — mark as verified
    await this.prisma.otpCode.update({
      where: { id: record.id },
      data: { verifiedAt: new Date() },
    });

    this.logger.log(`OTP verified for ${identifier} (${purpose})`);
    return { success: true, message: 'OTP verified successfully' };
  }

  async forgotPassword(email: string): Promise<{ success: boolean; message: string; previewUrl?: string }> {
    // Always return success to prevent email enumeration
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      this.logger.log(`Password reset requested for non-existent email: ${email}`);
      return { success: true, message: 'If that email exists, a reset link has been sent' };
    }

    // Invalidate any existing reset tokens for this email
    await this.prisma.passwordReset.updateMany({
      where: { email, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.passwordReset.create({
      data: {
        email,
        token: hashedToken,
        expiresAt,
      },
    });

    // Get user name for email
    const profile = await this.prisma.profile.findUnique({ where: { userId: user.id } });
    const userName = profile ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() : undefined;

    // Send email
    const emailResult = await this.emailService.sendPasswordResetEmail(email, resetToken, userName);
    this.logger.log(`Password reset email sent to ${email}`);

    return {
      success: true,
      message: 'If that email exists, a reset link has been sent',
      previewUrl: emailResult.previewUrl,
    };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    if (!token || !newPassword) {
      throw new BadRequestException('Token and new password are required');
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const resetRecord = await this.prisma.passwordReset.findFirst({
      where: {
        token: hashedToken,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetRecord) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.prisma.user.findUnique({ where: { email: resetRecord.email } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Hash new password and update
    const passwordHash = await argon2.hash(newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          refreshToken: null, // Invalidate all existing sessions
        },
      }),
      this.prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // Blacklist all existing sessions
    await this.tokenBlacklistService.blacklistAllUserTokens(user.id, 'password_reset');

    this.logger.log(`Password reset completed for user ${user.id}`);

    return {
      success: true,
      message: 'Password has been reset successfully. Please log in with your new password.',
    };
  }

  private sanitizeUser(user) {
    const { passwordHash, refreshToken, twoFactorSecret, ...sanitized } = user;
    return sanitized;
  }
}