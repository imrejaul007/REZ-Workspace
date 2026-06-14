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
  Req,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { JobApplicationsService } from './job-applications.service';
import { CreateJobApplicationDto } from './dto/create-job-application.dto';
import { ScheduleInterviewDto } from './dto/schedule-interview.dto';
import { HireEmployeeDto } from './dto/hire-employee.dto';
import { RateEmployeeDto } from './dto/rate-employee.dto';
import { ApplicationStatus, UserRole } from '@prisma/client';

@ApiTags('job-applications')
@Controller('job-applications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JobApplicationsController {
  constructor(private readonly jobApplicationsService: JobApplicationsService) {}

  @Post(':jobId/apply')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Apply for a job' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Application submitted successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Already applied to this job' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Job is no longer accepting applications' })
  async applyForJob(
    @Param('jobId') jobId: string,
    @Body() createApplicationDto: CreateJobApplicationDto,
    @Req() req,
  ) {
    const { user } = req;
    const employee = await this.jobApplicationsService.findEmployeeByUserId(user.id);
    return this.jobApplicationsService.create(jobId, employee.id, createApplicationDto);
  }

  @Get('my-applications')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Get current employee applications' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiQuery({ name: 'status', required: false, enum: ApplicationStatus })
  @ApiResponse({ status: HttpStatus.OK, description: 'Applications retrieved successfully' })
  async getMyApplications(@Query() filters, @Req() req) {
    const { user } = req;
    const { page = 1, limit = 20, ...otherFilters } = filters;
    
    const employee = await this.jobApplicationsService.findEmployeeByUserId(user.id);
    return this.jobApplicationsService.findByEmployee(employee.id, +page, +limit, otherFilters);
  }

  @Get('job/:jobId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get applications for a specific job' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiQuery({ name: 'status', required: false, enum: ApplicationStatus })
  @ApiResponse({ status: HttpStatus.OK, description: 'Job applications retrieved successfully' })
  async getJobApplications(
    @Param('jobId') jobId: string,
    @Query() filters,
    @Req() req,
  ) {
    const { user } = req;
    const { page = 1, limit = 20, ...otherFilters } = filters;
    
    // Verify job belongs to restaurant (if not admin)
    if (user.role === UserRole.RESTAURANT) {
      await this.jobApplicationsService.verifyJobOwnership(jobId, user.id);
    }
    
    return this.jobApplicationsService.findByJob(jobId, +page, +limit, otherFilters);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.EMPLOYEE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get application statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Statistics retrieved successfully' })
  async getApplicationStats(@Req() req) {
    const { user } = req;
    
    if (user.role === UserRole.RESTAURANT) {
      const restaurant = await this.jobApplicationsService.findRestaurantByUserId(user.id);
      return this.jobApplicationsService.getApplicationStats(restaurant.id);
    } else if (user.role === UserRole.EMPLOYEE) {
      const employee = await this.jobApplicationsService.findEmployeeByUserId(user.id);
      return this.jobApplicationsService.getApplicationStats(undefined, employee.id);
    } else {
      // Admin gets overall stats
      return this.jobApplicationsService.getApplicationStats();
    }
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYEE, UserRole.RESTAURANT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a specific application' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Application retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Application not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async findOne(@Param('id') id: string, @Req() req) {
    const { user } = req;
    const application = await this.jobApplicationsService.findOne(id);
    
    // Check permissions
    if (user.role === UserRole.EMPLOYEE) {
      const employee = await this.jobApplicationsService.findEmployeeByUserId(user.id);
      if (application.employeeId !== employee.id) {
        throw new Error('Forbidden');
      }
    } else if (user.role === UserRole.RESTAURANT) {
      if (application.job.restaurant.userId !== user.id) {
        throw new Error('Forbidden');
      }
    }
    
    return application;
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update application status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Application status updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Application not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ApplicationStatus,
    @Body('reviewNotes') reviewNotes: string,
    @Req() req,
  ) {
    const { user } = req;
    return this.jobApplicationsService.updateStatus(id, status, reviewNotes, user.id, user.role);
  }

  @Delete(':id/withdraw')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Withdraw job application' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Application withdrawn successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Application not found' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Cannot withdraw reviewed application' })
  async withdraw(@Param('id') id: string, @Req() req) {
    const { user } = req;
    const employee = await this.jobApplicationsService.findEmployeeByUserId(user.id);
    return this.jobApplicationsService.withdraw(id, employee.id);
  }

  @Post(':id/interview')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Schedule interview for application' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Interview scheduled successfully' })
  async scheduleInterview(
    @Param('id') id: string,
    @Body() interviewData: ScheduleInterviewDto,
    @Req() req,
  ) {
    const { user } = req;
    return this.jobApplicationsService.scheduleInterview(id, interviewData, user.id, user.role);
  }

  @Post(':id/hire')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Hire employee from application' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Employee hired successfully' })
  async hire(
    @Param('id') id: string,
    @Body() contractData: HireEmployeeDto,
    @Req() req,
  ) {
    const { user } = req;
    return this.jobApplicationsService.hire(id, contractData, user.id, user.role);
  }

  @Get('job/:jobId/analytics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get application analytics for a job' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Analytics retrieved successfully' })
  async getJobApplicationAnalytics(
    @Param('jobId') jobId: string,
    @Req() req,
  ) {
    const { user } = req;
    
    // Verify job belongs to restaurant (if not admin)
    if (user.role === UserRole.RESTAURANT) {
      await this.jobApplicationsService.verifyJobOwnership(jobId, user.id);
    }
    
    return this.jobApplicationsService.getJobApplicationAnalytics(jobId);
  }

  @Get('employment-history/:employeeId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYEE, UserRole.RESTAURANT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get employment history for an employee' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Employment history retrieved successfully' })
  async getEmploymentHistory(
    @Param('employeeId') employeeId: string,
    @Req() req,
  ) {
    const { user } = req;
    return this.jobApplicationsService.getEmploymentHistory(employeeId, user.id, user.role);
  }

  @Post('employment/:employmentHistoryId/rate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Rate an employee in employment history' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Employee rated successfully' })
  async rateEmployee(
    @Param('employmentHistoryId') employmentHistoryId: string,
    @Body() ratingData: RateEmployeeDto,
    @Req() req,
  ) {
    const { user } = req;
    return this.jobApplicationsService.rateEmployee(employmentHistoryId, ratingData, user.id, user.role);
  }

  @Post('employment/:employmentHistoryId/terminate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Terminate employment' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Employment terminated successfully' })
  async terminateEmployment(
    @Param('employmentHistoryId') employmentHistoryId: string,
    @Body() terminationData: {
      endDate?: string;
      reason?: string;
      rating?: number;
      review?: string;
    },
    @Req() req,
  ) {
    const { user } = req;
    return this.jobApplicationsService.terminateEmployment(employmentHistoryId, terminationData, user.id, user.role);
  }
}