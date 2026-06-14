import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StaffService } from './staff.service';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  CreateShiftDto,
  UpdateShiftDto,
  StaffQueryDto,
} from './staff.dto';

@Controller('staff')
@UseGuards(JwtAuthGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  // ─── Employees ───────────────────────────────────────────────────────────────

  @Get('employees')
  async getEmployees(@Request() req, @Query() query: StaffQueryDto) {
    const restaurantId = this.requireRestaurantId(req);
    return this.staffService.getEmployees(restaurantId, query);
  }

  @Post('employees')
  async createEmployee(@Body() dto: CreateEmployeeDto, @Request() req) {
    const restaurantId = this.requireRestaurantId(req);
    return this.staffService.createEmployee(dto, restaurantId);
  }

  @Get('employees/:id')
  async getEmployee(@Param('id') id: string, @Request() req) {
    const restaurantId = this.requireRestaurantId(req);
    return this.staffService.getEmployee(id, restaurantId);
  }

  @Patch('employees/:id')
  async updateEmployee(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
    @Request() req,
  ) {
    const restaurantId = this.requireRestaurantId(req);
    return this.staffService.updateEmployee(id, dto, restaurantId);
  }

  @Delete('employees/:id')
  async deleteEmployee(@Param('id') id: string, @Request() req) {
    const restaurantId = this.requireRestaurantId(req);
    return this.staffService.deleteEmployee(id, restaurantId);
  }

  // ─── Shifts ──────────────────────────────────────────────────────────────────

  @Get('shifts')
  async getShifts(
    @Request() req,
    @Query('weekStart') weekStart?: string,
  ) {
    const restaurantId = this.requireRestaurantId(req);
    return this.staffService.getShifts(restaurantId, weekStart);
  }

  @Post('shifts')
  async createShift(@Body() dto: CreateShiftDto, @Request() req) {
    const restaurantId = this.requireRestaurantId(req);
    return this.staffService.createShift(dto, restaurantId);
  }

  @Patch('shifts/:id')
  async updateShift(
    @Param('id') id: string,
    @Body() dto: UpdateShiftDto,
    @Request() req,
  ) {
    const restaurantId = this.requireRestaurantId(req);
    return this.staffService.updateShift(id, dto, restaurantId);
  }

  @Delete('shifts/:id')
  async deleteShift(@Param('id') id: string, @Request() req) {
    const restaurantId = this.requireRestaurantId(req);
    return this.staffService.deleteShift(id, restaurantId);
  }

  // ─── Roles ───────────────────────────────────────────────────────────────────

  @Get('roles')
  async getRoles(@Request() req) {
    const restaurantId = this.requireRestaurantId(req);
    return this.staffService.getRoles(restaurantId);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private requireRestaurantId(req): string {
    const restaurantId: string | null = req.user?.restaurantId ?? null;
    if (!restaurantId) {
      throw new BadRequestException(
        'This endpoint is only available to restaurant accounts',
      );
    }
    return restaurantId;
  }
}
