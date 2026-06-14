import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RABTULAuthService } from './rabtul-auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SendOtpDto, VerifyOtpDto, OAuthGoogleDto, LinkRABTULDto } from './dto/otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RABTULAuthGuard } from './guards/rabtul-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RateLimitGuard } from '../security/rate-limit.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private rabtulAuthService: RABTULAuthService,
  ) {}

  @UseGuards(RateLimitGuard)
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(RateLimitGuard, LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async login(@Body() loginDto: LoginDto, @Request() req) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(@Request() req, @Body() updateData: any) {
    return this.authService.updateProfile(req.user.id, updateData);
  }

  @UseGuards(JwtAuthGuard)
  @Put('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @Request() req,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(
      req.user.id,
      body.currentPassword,
      body.newPassword,
    );
  }

  @UseGuards(RateLimitGuard)
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Reset link sent if email exists' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async requestPasswordReset(@Body() body: { email: string }) {
    return this.authService.requestPasswordReset(body.email);
  }

  // ============================================
  // RABTUL OTP Authentication (New)
  // ============================================

  @UseGuards(RateLimitGuard)
  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP via RABTUL (phone-based auth)' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid phone number' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async sendOTP(@Body() dto: SendOtpDto) {
    return this.rabtulAuthService.sendOTP(dto.phone);
  }

  @UseGuards(RateLimitGuard)
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and login via RABTUL' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid OTP' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async verifyOTP(@Body() dto: VerifyOtpDto) {
    return this.rabtulAuthService.verifyOTP(dto.phone, dto.otp, dto.role);
  }

  @UseGuards(RateLimitGuard)
  @Post('oauth/google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login/Register with Google OAuth via RABTUL' })
  @ApiResponse({ status: 200, description: 'OAuth login successful' })
  @ApiResponse({ status: 401, description: 'Invalid Google token' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async googleOAuth(@Body() dto: OAuthGoogleDto) {
    return this.rabtulAuthService.registerWithOAuth('google', dto.token, undefined, undefined);
  }

  @UseGuards(RABTULAuthGuard)
  @Post('link-rabtul')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link existing account to RABTUL' })
  @ApiResponse({ status: 200, description: 'Account linked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async linkToRABTUL(@Request() req, @Body() dto: LinkRABTULDto) {
    await this.rabtulAuthService.linkToRABTUL(req.user.id, dto.rabtulUserId, dto.phone);
    return { message: 'Account linked to RABTUL successfully' };
  }

  @UseGuards(RABTULAuthGuard)
  @Post('unlink-rabtul')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlink RABTUL from account' })
  @ApiResponse({ status: 200, description: 'Account unlinked successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async unlinkFromRABTUL(@Request() req) {
    await this.rabtulAuthService.unlinkFromRABTUL(req.user.id);
    return { message: 'Account unlinked from RABTUL' };
  }

  // New RABTUL-authenticated profile endpoints
  @UseGuards(RABTULAuthGuard)
  @Get('profile-v2')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile (RABTUL auth)' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfileV2(@Request() req) {
    return this.rabtulAuthService.getProfile(req.user.id);
  }

  @UseGuards(RABTULAuthGuard)
  @Put('profile-v2')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile (RABTUL auth)' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfileV2(@Request() req, @Body() updateData: any) {
    return this.rabtulAuthService.updateProfile(req.user.id, updateData);
  }
}