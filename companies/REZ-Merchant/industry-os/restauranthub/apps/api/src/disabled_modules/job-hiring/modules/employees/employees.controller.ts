import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('employees')
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create employee' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Employee created successfully' })
  async create(
    @Request() req,
    @Body() createEmployeeDto: CreateEmployeeDto,
  ) {
    const result = await this.employeesService.create(req.user.restaurant?.id, createEmployeeDto);
    
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Employee created successfully',
      data: result,
    };
  }

  @Get()
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all employees' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Employees retrieved successfully' })
  async findAll(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query() filters?,
  ) {
    const result = await this.employeesService.findByRestaurant(
      req.user.restaurant?.id,
      page,
      limit,
      filters,
    );
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Employees retrieved successfully',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Employee retrieved successfully' })
  async findOne(@Param('id') id: string) {
    const result = await this.employeesService.findOne(id);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Employee retrieved successfully',
      data: result,
    };
  }

  @Patch(':id')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update employee' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Employee updated successfully' })
  async update(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto) {
    const result = await this.employeesService.update(id, updateEmployeeDto);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Employee updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete employee' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Employee deleted successfully' })
  async remove(@Param('id') id: string) {
    const result = await this.employeesService.remove(id);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Employee deleted successfully',
    };
  }

  @Get(':id/profile')
  @ApiOperation({ summary: 'Get employee profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Employee profile retrieved successfully' })
  async getProfile(@Param('id') id: string) {
    const result = await this.employeesService.getProfile(id);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Employee profile retrieved successfully',
      data: result,
    };
  }

  @Get(':id/performance')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get employee performance report' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Performance report retrieved successfully' })
  async getPerformance(@Param('id') id: string) {
    const result = await this.employeesService.getPerformanceReport(id);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Performance report retrieved successfully',
      data: result,
    };
  }

  @Get(':id/attendance')
  @ApiOperation({ summary: 'Get employee attendance' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Attendance records retrieved successfully' })
  async getAttendance(@Param('id') id: string) {
    const result = await this.employeesService.getAttendance(id);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Attendance records retrieved successfully',
      data: result,
    };
  }

  @Post(':id/attendance')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Mark employee attendance' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Attendance marked successfully' })
  async markAttendance(@Param('id') id: string, @Body() attendanceData) {
    const result = await this.employeesService.markAttendance(id, attendanceData);
    
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Attendance marked successfully',
      data: result,
    };
  }
}