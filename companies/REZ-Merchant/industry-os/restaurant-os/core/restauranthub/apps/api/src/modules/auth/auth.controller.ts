import { Controller, Post, Body, Get, Delete, Request, UseGuards, HttpCode, HttpStatus, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsEnum, IsNotEmpty, Matches } from 'class-validator';
import { AuthService } from './auth.service';
import { VerificationService } from './services/verification.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';

/**
 * SignUpDto - User signup DTO with comprehensive validation
 * SECURITY: Enhanced validation decorators for password strength and input sanitization
 */
class SignUpDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password!: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  appSource?: string;
}

class SignInDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  appSource?: string;
}

class RefreshDto {
  @IsString()
  refreshToken!: string;
}

class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  token!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password!: string;
}

class SendOtpDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @IsNotEmpty()
  type!: string;
}

class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  purpose!: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly verificationService: VerificationService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req) {
    const authHeader = req.headers?.authorization ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    return this.authService.logout(req.user.id, token ?? undefined);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return {
      user: req.user,
      message: 'Profile retrieved successfully',
    };
  }

  // Alias used by auth-api.ts checkAuthStatus()
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req) {
    return {
      authenticated: true,
      user: req.user,
    };
  }

  @Delete('2fa')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async disable2FA(@Request() req) {
    return this.authService.disable2FA(req.user.id);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Get('test')
  async test() {
    return {
      message: 'Auth endpoints are working!',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() dto: SendOtpDto) {
    const identifier = dto.phone || dto.email;
    if (!identifier) {
      throw new BadRequestException('Either phone or email must be provided');
    }
    return this.authService.sendOtp(identifier, dto.type || 'login');
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.identifier, dto.code, dto.purpose);
  }

  @Post('verify-email/send')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async sendEmailVerification(@Request() req) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) throw new BadRequestException('User not found');
    return this.verificationService.sendEmailVerification(user.id, user.email);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() body: { token: string }) {
    return this.verificationService.verifyEmail(body.token);
  }

  @Get('2fa/setup')
  @UseGuards(JwtAuthGuard)
  async setup2FA(@Request() req) {
    return this.verificationService.setup2FA(req.user.id);
  }

  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verify2FASetup(@Request() req, @Body() body: { token: string }) {
    return this.verificationService.verify2FASetup(req.user.id, body.token);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async disable2FAWithToken(@Request() req, @Body() body: { token: string }) {
    return this.verificationService.disable2FA(req.user.id, body.token);
  }

  @Post('2fa/validate')
  @HttpCode(HttpStatus.OK)
  async validate2FA(@Body() body: { userId: string; token: string }) {
    const valid = await this.verificationService.verify2FAToken(body.userId, body.token);
    if (!valid) throw new UnauthorizedException('Invalid 2FA code');
    return { valid: true };
  }
}
