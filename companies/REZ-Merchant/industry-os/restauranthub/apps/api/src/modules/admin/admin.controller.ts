import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly adminService: AdminService) {}

  private assertAdmin(req) {
    const role = req.user?.role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
  }

  // ── Users ──────────────────────────────────────────────────────────────────

  @Get('users')
  async listUsers(
    @Request() req,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.assertAdmin(req);
    return this.adminService.listUsers({
      search,
      role,
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('users/:id')
  async getUserById(@Request() req, @Param('id') id: string) {
    this.assertAdmin(req);
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/status')
  @HttpCode(HttpStatus.OK)
  async updateUserStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
  ) {
    this.assertAdmin(req);
    this.logger.log(`Admin ${req.user.id} updating user ${id} status`);
    return this.adminService.updateUserStatus(id, body.isActive);
  }

  // ── Restaurants ────────────────────────────────────────────────────────────

  @Get('restaurants')
  async listRestaurants(
    @Request() req,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('verificationStatus') verificationStatus?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.assertAdmin(req);
    return this.adminService.listRestaurants({
      search,
      status,
      verificationStatus,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('restaurants/:id')
  async getRestaurantById(@Request() req, @Param('id') id: string) {
    this.assertAdmin(req);
    return this.adminService.getRestaurantById(id);
  }

  @Patch('restaurants/:id/status')
  @HttpCode(HttpStatus.OK)
  async updateRestaurantStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { status?: string; verificationStatus?: string },
  ) {
    this.assertAdmin(req);
    this.logger.log(`Admin ${req.user.id} updating restaurant ${id} status`);
    return this.adminService.updateRestaurantStatus(id, body);
  }

  // ── Verification ───────────────────────────────────────────────────────────

  @Get('verification')
  async listVerifications(
    @Request() req,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.assertAdmin(req);
    return this.adminService.listVerifications({
      search,
      status,
      type,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Patch('verification/:id')
  @HttpCode(HttpStatus.OK)
  async updateVerificationStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    this.assertAdmin(req);
    this.logger.log(`Admin ${req.user.id} updating verification ${id} to ${body.status}`);
    return this.adminService.updateVerificationStatus(id, body.status);
  }
}
