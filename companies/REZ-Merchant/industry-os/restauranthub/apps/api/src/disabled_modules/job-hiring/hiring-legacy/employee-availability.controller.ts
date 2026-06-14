import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EmployeeAvailabilityService } from './employee-availability.service';
import { EmployeeAvailabilityDto } from './dto/employee-availability.dto';
import { UserRole } from '@prisma/client';

@ApiTags('employee-availability')
@Controller('employee-availability')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EmployeeAvailabilityController {
  constructor(private readonly employeeAvailabilityService: EmployeeAvailabilityService) {}

  @Post(':employeeId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYEE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update employee availability preferences' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Availability updated successfully' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async updateAvailability(
    @Param('employeeId') employeeId: string,
    @Body() availabilityData: EmployeeAvailabilityDto,
    @Req() req,
  ) {
    const { user } = req;
    return this.employeeAvailabilityService.updateAvailability(employeeId, availabilityData, user.id, user.role);
  }

  @Get(':employeeId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYEE, UserRole.RESTAURANT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get employee availability preferences' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Availability retrieved successfully' })
  async getAvailability(@Param('employeeId') employeeId: string, @Req() req) {
    const { user } = req;
    return this.employeeAvailabilityService.getAvailability(employeeId, user.id, user.role);
  }

  @Patch(':employeeId/deactivate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYEE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate employee availability' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Availability deactivated successfully' })
  async deactivateAvailability(@Param('employeeId') employeeId: string, @Req() req) {
    const { user } = req;
    return this.employeeAvailabilityService.deactivateAvailability(employeeId, user.id, user.role);
  }

  @Get(':employeeId/matches')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYEE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get job matches for employee based on availability' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Job matches retrieved successfully' })
  async getJobMatches(@Param('employeeId') employeeId: string, @Req() req) {
    const { user } = req;
    return this.employeeAvailabilityService.matchJobsToEmployee(employeeId, user.id, user.role);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get list of available employees' })
  @ApiQuery({ name: 'location', required: false, type: 'string' })
  @ApiQuery({ name: 'jobType', required: false, type: 'string' })
  @ApiQuery({ name: 'role', required: false, type: 'string' })
  @ApiQuery({ name: 'salaryMin', required: false, type: 'number' })
  @ApiQuery({ name: 'salaryMax', required: false, type: 'number' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Available employees retrieved successfully' })
  async getAvailableEmployees(@Query() filters) {
    return this.employeeAvailabilityService.getAvailableEmployees(filters);
  }

  @Get('stats/overview')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get availability statistics' })
  @ApiQuery({ name: 'restaurantId', required: false, type: 'string' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Availability statistics retrieved successfully' })
  async getAvailabilityStats(@Query('restaurantId') restaurantId?: string, @Req() req?) {
    const { user } = req;
    
    // If restaurant user, only show their stats
    if (user.role === UserRole.RESTAURANT && !restaurantId) {
      const restaurant = await this.employeeAvailabilityService['prisma'].restaurant.findFirst({
        where: { userId: user.id },
      });
      restaurantId = restaurant?.id;
    }
    
    return this.employeeAvailabilityService.getAvailabilityStats(restaurantId);
  }
}