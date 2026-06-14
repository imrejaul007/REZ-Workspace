import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', 'smtp.ethereal.email'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<{ success: boolean; previewUrl?: string }> {
    const appName = this.configService.get('APP_NAME', 'RestoPapa');

    try {
      if (process.env.NODE_ENV !== 'production' || !this.configService.get('SMTP_USER')) {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });

        const info = await this.transporter.sendMail({
          from: `"${appName}" <${testAccount.user}>`,
          to,
          subject,
          html,
        });

        const previewUrl = nodemailer.getTestMessageUrl(info) as string | false;
        this.logger.log(`Email sent to ${to} (dev mode): ${previewUrl}`);
        return { success: true, previewUrl: previewUrl || undefined };
      }

      await this.transporter.sendMail({
        from: `"${appName}" <${this.configService.get('SMTP_FROM', 'noreply@restopapa.com')}>`,
        to,
        subject,
        html,
      });

      this.logger.log(`Email sent to ${to}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      return { success: true }; // Don't leak delivery failures
    }
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    userName?: string,
  ): Promise<{ success: boolean; previewUrl?: string }> {
    const appName = this.configService.get('APP_NAME', 'RestoPapa');
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

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
            .token { background: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${appName}</h1>
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>Hi ${userName || 'there'},</p>
              <p>You requested a password reset for your ${appName} account. Click the button below to reset your password:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <div class="token">${resetUrl}</div>
              <p><strong>This link expires in 1 hour.</strong></p>
              <p>If you didn't request this password reset, please ignore this email. Your account is safe.</p>
            </div>
            <div class="footer">
              <p>This is an automated email from ${appName}.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      // In development, use Ethereal for testing
      if (process.env.NODE_ENV !== 'production' || !this.configService.get('SMTP_USER')) {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });

        const info = await this.transporter.sendMail({
          from: `"${appName}" <${testAccount.user}>`,
          to: email,
          subject: `Password Reset - ${appName}`,
          html,
        });

        const previewUrl = nodemailer.getTestMessageUrl(info) as string | false;
        this.logger.log(`Password reset email sent to ${email} (dev mode)`);
        this.logger.debug(`Preview URL: ${previewUrl}`);
        return { success: true, previewUrl: previewUrl || undefined };
      }

      const info = await this.transporter.sendMail({
        from: `"${appName}" <${this.configService.get('SMTP_FROM', 'noreply@restopapa.com')}>`,
        to: email,
        subject: `Password Reset - ${appName}`,
        html,
      });

      this.logger.log(`Password reset email sent to ${email}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
      // Still return success to prevent email enumeration
      // The actual error is logged server-side
      return { success: true };
    }
  }
}
