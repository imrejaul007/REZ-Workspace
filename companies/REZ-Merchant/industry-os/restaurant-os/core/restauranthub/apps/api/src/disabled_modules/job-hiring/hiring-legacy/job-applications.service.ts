import logger from './utils/logger';

import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateJobApplicationDto } from './dto/create-job-application.dto';
import { ApplicationStatus, UserRole } from '@prisma/client';

@Injectable()
export class JobApplicationsService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async create(jobId: string, employeeId: string, createApplicationDto: CreateJobApplicationDto) {
    // Check if already applied
    const existingApplication = await this.prisma.jobApplication.findFirst({
      where: {
        AND: [
          { jobId: jobId },
          { employeeId: employeeId }
        ]
      },
    });

    if (existingApplication) {
      throw new ConflictException('Already applied to this job');
    }

    // Verify job is still open
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job || job.status !== 'OPEN' || (job.validTill && job.validTill < new Date())) {
      throw new ForbiddenException('Job is no longer accepting applications');
    }

    const application = await this.prisma.jobApplication.create({
      data: {
        ...createApplicationDto,
        jobId: jobId,
        employeeId: employeeId,
      },
      include: {
        job: {
          include: {
            restaurant: {
              include: {
                user: {
                  include: {
                    profile: true,
                  },
                },
              },
            },
          },
        },
        employee: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });

    // Update application count on job
    await this.prisma.job.update({
      where: { id: jobId },
      data: { applicationCount: { increment: 1 } },
    });

    // Send notification to restaurant (implement notification service)
    await this.sendApplicationNotification(application);

    return application;
  }

  async findByEmployee(employeeId: string, page = 1, limit = 20, filters?) {
    const skip = (page - 1) * limit;
    const where: unknown = { employeeId };

    if (filters?.status) {
      where.status = filters.status;
    }

    const [applications, total] = await Promise.all([
      this.prisma.jobApplication.findMany({
        where,
        skip,
        take: limit,
        include: {
          job: {
            include: {
              restaurant: {
                include: {
                  user: {
                    include: {
                      profile: true,
                    },
                  },
                },
              },
            },
          },
          employee: {
            include: {
              user: {
                include: {
                  profile: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.jobApplication.count({ where }),
    ]);

    return {
      data: applications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByJob(jobId: string, page = 1, limit = 20, filters?) {
    const skip = (page - 1) * limit;
    const where: unknown = { jobId };

    if (filters?.status) {
      where.status = filters.status;
    }

    const [applications, total] = await Promise.all([
      this.prisma.jobApplication.findMany({
        where,
        skip,
        take: limit,
        include: {
          job: {
            include: {
              restaurant: {
                include: {
                  user: {
                    include: {
                      profile: true,
                    },
                  },
                },
              },
            },
          },
          employee: {
            include: {
              user: {
                include: {
                  profile: true,
                },
              },
              documents: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.jobApplication.count({ where }),
    ]);

    return {
      data: applications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const application = await this.prisma.jobApplication.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            restaurant: {
              include: {
                user: {
                  include: {
                    profile: true,
                  },
                },
              },
            },
          },
        },
        employee: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
            documents: true,
            attendance: {
              where: {
                date: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                },
              },
            },
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  async updateStatus(
    id: string,
    status: ApplicationStatus,
    reviewNotes: string,
    userId: string,
    userRole: string,
  ) {
    const application = await this.findOne(id);

    // Check permissions - only restaurant owner or admin can update
    if (userRole !== UserRole.ADMIN && application.job.restaurant.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const updatedApplication = await this.prisma.jobApplication.update({
      where: { id },
      data: {
        status,
        reviewNotes,
        reviewedAt: new Date(),
      },
      include: {
        job: {
          include: {
            restaurant: true,
          },
        },
        employee: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });

    // Send notification to employee
    await this.sendStatusUpdateNotification(updatedApplication);

    return updatedApplication;
  }

  async withdraw(id: string, employeeId: string) {
    const application = await this.findOne(id);

    if (application.employeeId !== employeeId) {
      throw new ForbiddenException('Access denied');
    }

    if (application.status !== ApplicationStatus.PENDING) {
      throw new ForbiddenException('Cannot withdraw application that has been reviewed');
    }

    await this.prisma.jobApplication.delete({
      where: { id },
    });

    // Update application count on job
    await this.prisma.job.update({
      where: { id: application.jobId },
      data: { applicationCount: { decrement: 1 } },
    });

    return { message: 'Application withdrawn successfully' };
  }

  async getApplicationStats(restaurantId?: string, employeeId?: string) {
    const where: unknown = {};
    
    if (restaurantId) {
      where.job = { restaurantId };
    }
    
    if (employeeId) {
      where.employeeId = employeeId;
    }

    const [
      totalApplications,
      pendingApplications,
      reviewedApplications,
      shortlistedApplications,
      acceptedApplications,
      rejectedApplications,
    ] = await Promise.all([
      this.prisma.jobApplication.count({ where }),
      this.prisma.jobApplication.count({ where: { ...where, status: ApplicationStatus.PENDING } }),
      this.prisma.jobApplication.count({ where: { ...where, status: ApplicationStatus.REVIEWED } }),
      this.prisma.jobApplication.count({ where: { ...where, status: ApplicationStatus.SHORTLISTED } }),
      this.prisma.jobApplication.count({ where: { ...where, status: ApplicationStatus.ACCEPTED } }),
      this.prisma.jobApplication.count({ where: { ...where, status: ApplicationStatus.REJECTED } }),
    ]);

    return {
      total: totalApplications,
      pending: pendingApplications,
      reviewed: reviewedApplications,
      shortlisted: shortlistedApplications,
      accepted: acceptedApplications,
      rejected: rejectedApplications,
    };
  }

  private async sendApplicationNotification(application) {
    logger.info(`New application for job ${application.job.title} from ${application.employee.user.profile.firstName}`);

    // Send notification to notification service via fetch
    try {
      const notificationPayload = {
        type: 'job_application_received',
        recipientId: application.job.restaurant.userId,
        recipientType: 'restaurant',
        title: 'New Job Application',
        body: `${application.employee.user.profile.firstName} ${application.employee.user.profile.lastName} applied for ${application.job.title}`,
        data: {
          applicationId: application.id,
          jobId: application.jobId,
          employeeId: application.employeeId,
          employeeName: `${application.employee.user.profile.firstName} ${application.employee.user.profile.lastName}`,
          restaurantId: application.job.restaurantId,
        },
        channels: ['in_app', 'push'],
      };

      const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3001/api/notifications';
      await fetch(`${notificationServiceUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationPayload),
      }).catch((err) => {
        logger.warn(`Failed to send notification to notification service: ${err.message}`);
      });
    } catch (error) {
      logger.warn(`Notification service call failed: ${error.message}`);
    }

    // Publish real-time event
    await this.redisService.publish(
      `restaurant:${application.job.restaurantId}`,
      JSON.stringify({
        type: 'job:application',
        data: {
          applicationId: application.id,
          jobId: application.jobId,
          employeeName: `${application.employee.user.profile.firstName} ${application.employee.user.profile.lastName}`,
        },
      }),
    );
  }

  private async sendStatusUpdateNotification(application) {
    logger.info(`Application status updated to ${application.status} for ${application.employee.user.profile.firstName}`);

    // Send notification to notification service via fetch
    try {
      const notificationPayload = {
        type: 'application_status_update',
        recipientId: application.employee.userId,
        recipientType: 'employee',
        title: 'Application Status Updated',
        body: `Your application for ${application.job.title} at ${application.job.restaurant.name} has been ${application.status.toLowerCase()}`,
        data: {
          applicationId: application.id,
          jobId: application.jobId,
          jobTitle: application.job.title,
          status: application.status,
          restaurantId: application.job.restaurantId,
          restaurantName: application.job.restaurant.name,
        },
        channels: ['in_app', 'push'],
      };

      const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3001/api/notifications';
      await fetch(`${notificationServiceUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationPayload),
      }).catch((err) => {
        logger.warn(`Failed to send notification to notification service: ${err.message}`);
      });
    } catch (error) {
      logger.warn(`Notification service call failed: ${error.message}`);
    }

    // Publish real-time event
    await this.redisService.publish(
      `employee:${application.employeeId}`,
      JSON.stringify({
        type: 'application:status',
        data: {
          applicationId: application.id,
          status: application.status,
          jobTitle: application.job.title,
          restaurantName: application.job.restaurant.name,
        },
      }),
    );
  }

  async findEmployeeByUserId(userId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId },
    });

    if (!employee) {
      throw new ForbiddenException('Employee profile not found');
    }

    return employee;
  }

  async findRestaurantByUserId(userId: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { userId },
    });

    if (!restaurant) {
      throw new ForbiddenException('Restaurant profile not found');
    }

    return restaurant;
  }

  async verifyJobOwnership(jobId: string, userId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        restaurant: true,
      },
    });

    if (!job || job.restaurant.userId !== userId) {
      throw new ForbiddenException('Access denied to this job');
    }

    return job;
  }

  async scheduleInterview(id: string, interviewData, userId: string, userRole: string) {
    const application = await this.findOne(id);

    // Check permissions
    if (userRole !== UserRole.ADMIN && application.job.restaurant.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Update application status and add interview details to review notes
    const interviewDetails = `Interview scheduled: ${interviewData.scheduledFor}, Type: ${interviewData.interviewType}, Location: ${interviewData.location || 'TBD'}, Notes: ${interviewData.notes || 'None'}`;
    
    const updatedApplication = await this.prisma.jobApplication.update({
      where: { id },
      data: {
        status: ApplicationStatus.SHORTLISTED,
        reviewNotes: interviewDetails,
        reviewedAt: new Date(),
      },
    });

    // Send notification to employee about interview
    await this.sendStatusUpdateNotification({
      ...updatedApplication,
      job: application.job,
      employee: application.employee,
    });

    return updatedApplication;
  }

  async hire(id: string, contractData, userId: string, userRole: string) {
    const application = await this.findOne(id);

    // Check permissions
    if (userRole !== UserRole.ADMIN && application.job.restaurant.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Update application status
    const updatedApplication = await this.prisma.jobApplication.update({
      where: { id },
      data: {
        status: ApplicationStatus.ACCEPTED,
        reviewNotes: `Hired: ${contractData.position} starting ${contractData.startDate}`,
        reviewedAt: new Date(),
      },
    });

    // Create employment history record
    const employmentHistory = await this.prisma.employmentHistory.create({
      data: {
        employeeId: application.employeeId,
        restaurantId: application.job.restaurantId,
        startDate: new Date(contractData.startDate),
        position: contractData.position,
        department: contractData.department,
      },
    });

    // Close the job if specified in contract data
    if (contractData.closeJob) {
      await this.prisma.job.update({
        where: { id: application.jobId },
        data: { status: 'FILLED' },
      });
    }

    // Send notification to employee
    await this.sendStatusUpdateNotification({
      ...updatedApplication,
      job: application.job,
      employee: application.employee,
    });

    return { application: updatedApplication, employmentHistory };
  }

  async rateEmployee(employmentHistoryId: string, ratingData, userId: string, userRole: string) {
    // Find employment history record
    const employmentHistory = await this.prisma.employmentHistory.findUnique({
      where: { id: employmentHistoryId },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        restaurant: true,
      },
    });

    if (!employmentHistory) {
      throw new NotFoundException('Employment history not found');
    }

    // Check permissions - only restaurant owner or admin can rate
    if (userRole !== UserRole.ADMIN && employmentHistory.restaurant.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Update employment history with rating and review
    const updatedHistory = await this.prisma.employmentHistory.update({
      where: { id: employmentHistoryId },
      data: {
        rating: ratingData.rating,
        review: ratingData.review,
        reason: ratingData.reason || null,
      },
    });

    return updatedHistory;
  }

  async getEmploymentHistory(employeeId: string, userId: string, userRole: string) {
    // Check permissions - employees can see their own history, restaurants can see their employees' history, admins can see all
    if (userRole === UserRole.EMPLOYEE) {
      const employee = await this.findEmployeeByUserId(userId);
      if (employee.id !== employeeId) {
        throw new ForbiddenException('Access denied');
      }
    } else if (userRole === UserRole.RESTAURANT) {
      // Verify employee works for this restaurant
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
        include: { restaurant: true },
      });
      
      if (!employee || employee.restaurant.userId !== userId) {
        throw new ForbiddenException('Access denied');
      }
    }

    const history = await this.prisma.employmentHistory.findMany({
      where: { employeeId },
      include: {
        restaurant: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return history;
  }

  async terminateEmployment(employmentHistoryId: string, terminationData, userId: string, userRole: string) {
    const employmentHistory = await this.prisma.employmentHistory.findUnique({
      where: { id: employmentHistoryId },
      include: {
        restaurant: true,
      },
    });

    if (!employmentHistory) {
      throw new NotFoundException('Employment history not found');
    }

    // Check permissions
    if (userRole !== UserRole.ADMIN && employmentHistory.restaurant.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Update employment history with end date and termination details
    const updatedHistory = await this.prisma.employmentHistory.update({
      where: { id: employmentHistoryId },
      data: {
        endDate: new Date(terminationData.endDate || new Date()),
        reason: terminationData.reason,
        rating: terminationData.rating || null,
        review: terminationData.review || null,
      },
    });

    return updatedHistory;
  }

  async getJobApplicationAnalytics(jobId: string) {
    const [
      totalApplications,
      statusBreakdown,
      applicationsByDate,
      topSkills,
    ] = await Promise.all([
      this.prisma.jobApplication.count({ where: { jobId } }),
      
      this.prisma.jobApplication.groupBy({
        by: ['status'],
        where: { jobId },
        _count: { status: true },
      }),
      
      this.prisma.$queryRaw`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM job_applications
        WHERE job_id = ${jobId}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `,
      
      this.prisma.$queryRaw`
        SELECT skill, COUNT(*) as count
        FROM job_applications ja
        JOIN employees e ON ja.employee_id = e.id
        CROSS JOIN LATERAL unnest(e.skills) as skill
        WHERE ja.job_id = ${jobId}
        GROUP BY skill
        ORDER BY count DESC
        LIMIT 10
      `,
    ]);

    return {
      totalApplications,
      statusBreakdown,
      applicationsByDate,
      topSkills,
    };
  }
}