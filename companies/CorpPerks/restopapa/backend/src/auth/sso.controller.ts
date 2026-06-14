import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SSOService } from './sso.service';
import { AuthService } from './auth.service';
import { ReZLoginDto } from './dto/rez-login.dto';

@ApiTags('auth/sso')
@Controller('auth/sso')
export class SSOController {
  private readonly logger = new Logger(SSOController.name);

  constructor(
    private readonly ssoService: SSOService,
    private readonly authService: AuthService,
  ) {}

  @Post('rez-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with ReZ Merchant SSO' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async rezLogin(@Body() body: ReZLoginDto) {
    this.logger.log('ReZ SSO login attempt');

    // Validate the ReZ token
    const rezUser = await this.ssoService.validateReZToken(body.token);

    // Get or create the user
    const user = await this.ssoService.getOrCreateUser(rezUser);

    // Generate JWT token for the user
    const jwtToken = this.authService.generateJwtToken(user);

    this.logger.log(`ReZ SSO login successful for user: ${user.email}`);

    return {
      token: jwtToken,
      user: this.authService.sanitizeUser(user),
      source: 'rez_merchant',
    };
  }

  @Post('rez-link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Link existing account to ReZ Merchant' })
  @ApiResponse({ status: 200, description: 'Account linked successfully' })
  @ApiResponse({ status: 401, description: 'Invalid token or unauthorized' })
  @ApiResponse({ status: 409, description: 'Account already linked' })
  async rezLinkAccount(
    @Body() body: { token: string; userId: string },
  ) {
    this.logger.log(`ReZ account link attempt for user: ${body.userId}`);

    // Validate the ReZ token
    const rezUser = await this.ssoService.validateReZToken(body.token);

    // Check if this ReZ account is already linked to another user
    const existingLink = await this.ssoService.findByExternalId(rezUser.id);
    if (existingLink && existingLink.id !== body.userId) {
      throw new Error('This ReZ account is already linked to another user');
    }

    // Link the account
    await this.ssoService.linkAccount(body.userId, rezUser);

    this.logger.log(`ReZ account linked successfully for user: ${body.userId}`);

    return { message: 'Account linked successfully' };
  }
}
