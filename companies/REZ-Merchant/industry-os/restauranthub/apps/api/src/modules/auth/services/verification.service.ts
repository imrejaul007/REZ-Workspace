import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailService } from './email.service';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async sendEmailVerification(userId: string, email: string): Promise<{ success: boolean; previewUrl?: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    // Invalidate existing verification tokens
    await this.prisma.emailVerification.updateMany({
      where: { email, verifiedAt: null },
      data: { expiresAt: new Date() },
    });

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.emailVerification.create({
      data: { email, token, userId, expiresAt },
    });

    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const verifyUrl = `${frontendUrl}/auth/verify-email?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>RestoPapa</h1>
            </div>
            <div class="content">
              <h2>Verify Your Email</h2>
              <p>Thank you for signing up! Please click the button below to verify your email address:</p>
              <p style="text-align: center;">
                <a href="${verifyUrl}" class="button">Verify Email</a>
              </p>
              <p>This link expires in 24 hours. If you didn't create an account, please ignore this email.</p>
            </div>
            <div class="footer"><p>© RestoPapa</p></div>
          </div>
        </body>
      </html>
    `;

    try {
      const result = await this.emailService.sendEmail(email, 'Verify Your Email - RestoPapa', html);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}:`, error);
      return { success: true }; // Don't leak email delivery failures
    }
  }

  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const verification = await this.prisma.emailVerification.findFirst({
      where: {
        token: hashedToken,
        verifiedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verification) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: verification.userId },
        data: { isVerified: true, emailVerifiedAt: new Date() },
      }),
      this.prisma.emailVerification.update({
        where: { id: verification.id },
        data: { verifiedAt: new Date() },
      }),
    ]);

    this.logger.log(`Email verified for user ${verification.userId}`);
    return { success: true, message: 'Email verified successfully' };
  }

  async setup2FA(userId: string): Promise<{ secret: string; qrCodeUrl: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `RestoPapa (${user.email})`,
      length: 20,
    });

    // Store encrypted secret in user record
    const encryptedSecret = this.encryptSecret(secret.ascii);
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: encryptedSecret },
    });

    return {
      secret: secret.ascii,
      qrCodeUrl: secret.otpauth_url || '',
    };
  }

  async verify2FASetup(userId: string, token: string): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA not set up. Call setup first.');
    }

    const secret = this.decryptSecret(user.twoFactorSecret);
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'ascii',
      token,
      window: 1,
    });

    if (!verified) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    this.logger.log(`2FA enabled for user ${userId}`);
    return { success: true, message: '2FA enabled successfully' };
  }

  async verify2FAToken(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return false;
    }

    const secret = this.decryptSecret(user.twoFactorSecret);
    return speakeasy.totp.verify({
      secret,
      encoding: 'ascii',
      token,
      window: 1,
    });
  }

  async disable2FA(userId: string, token: string): Promise<{ success: boolean; message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    if (user.twoFactorEnabled && user.twoFactorSecret) {
      const secret = this.decryptSecret(user.twoFactorSecret);
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'ascii',
        token,
        window: 1,
      });

      if (!verified) {
        throw new BadRequestException('Invalid 2FA code to disable');
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });

    this.logger.log(`2FA disabled for user ${userId}`);
    return { success: true, message: '2FA disabled successfully' };
  }

  private encryptSecret(secret: string): string {
    const key = this.configService.get('ENCRYPTION_KEY', 'default-key-change-me!');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', crypto.createHash('sha256').update(key).digest(), iv);
    let encrypted = cipher.update(secret);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  private decryptSecret(encrypted: string): string {
    const key = this.configService.get('ENCRYPTION_KEY', 'default-key-change-me!');
    const [ivHex, dataHex] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', crypto.createHash('sha256').update(key).digest(), iv);
    let decrypted = decipher.update(Buffer.from(dataHex, 'hex'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
}
