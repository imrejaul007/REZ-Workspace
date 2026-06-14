import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobStatus, UserRole } from '@prisma/client';

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async create(restaurantId: string, userId: string, createJobDto: CreateJobDto) {
    // Verify restaurant ownership
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { id: restaurantId, userId },
    });

    if (!restaurant) {
      throw new ForbiddenException('Access denied');
    }

    const job = await this.prisma.job.create({
      data: {
        ...createJobDto,
        restaurantId,
        validTill: new Date(createJobDto.validTill),
      },
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
    });

    return job;
  }

  async findAll(page = 1, limit = 20, filters?) {
    const skip = (page - 1) * limit;
    const where: unknown = { 
      status: JobStatus.OPEN,
      validTill: { gte: new Date() },
    };

    if (filters?.location) {
      where.location = {
        contains: filters.location,
        mode: 'insensitive',
      };
    }

    if (filters?.jobType) {
      where.jobType = {
        contains: filters.jobType,
        mode: 'insensitive',
      };
    }

    if (filters?.skills) {
      where.skills = {
        hasSome: Array.isArray(filters.skills) ? filters.skills : [filters.skills],
      };
    }

    if (filters?.experienceMin) {
      where.experienceMin = {
        lte: parseInt(filters.experienceMin),
      };
    }

    if (filters?.salaryMin && filters.salaryMax) {
      where.OR = [
        {
          salaryMin: {
            gte: parseFloat(filters.salaryMin),
            lte: parseFloat(filters.salaryMax),
          },
        },
        {
          salaryMax: {
            gte: parseFloat(filters.salaryMin),
            lte: parseFloat(filters.salaryMax),
          },
        },
      ];
    }

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip,
        take: limit,
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
          _count: {
            select: {
              applications: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      data: jobs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByRestaurant(restaurantId: string, page = 1, limit = 20, filters?) {
    const skip = (page - 1) * limit;
    const where: unknown = { restaurantId };

    if (filters?.status) {
      where.status = filters.status;
    }

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip,
        take: limit,
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
          applications: {
            include: {
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
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          _count: {
            select: {
              applications: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      data: jobs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    // Increment view count
    await this.prisma.job.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        restaurant: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
            branches: true,
          },
        },
        applications: {
          include: {
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
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return job;
  }

  async update(id: string, userId: string, userRole: string, updateJobDto: UpdateJobDto) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        restaurant: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    };

    // Check permissions
    if (userRole !== UserRole.ADMIN && job.restaurant.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const updatedJob = await this.prisma.job.update({
      where: { id },
      data: {
        ...updateJobDto,
        validTill: updateJobDto.validTill ? new Date(updateJobDto.validTill) : undefined,
      },
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
    });

    return updatedJob;
  }

  async updateStatus(id: string, status: JobStatus, userId: string, userRole: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        restaurant: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    };

    // Check permissions
    if (userRole !== UserRole.ADMIN && job.restaurant.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const updatedJob = await this.prisma.job.update({
      where: { id },
      data: { status },
    });

    return updatedJob;
  }

  async searchJobs(query: string, filters?) {
    const where: unknown = {
      status: JobStatus.OPEN,
      validTill: { gte: new Date() },
      OR: [
        {
          title: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          skills: {
            hasSome: [query],
          },
        },
      ],
    };

    if (filters?.location) {
      where.location = {
        contains: filters.location,
        mode: 'insensitive',
      };
    }

    if (filters?.jobType) {
      where.jobType = filters.jobType;
    }

    const jobs = await this.prisma.job.findMany({
      where,
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
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    return jobs;
  }

  async getJobStats(restaurantId: string) {
    const [
      totalJobs,
      openJobs,
      closedJobs,
      filledJobs,
      totalApplications,
      recentApplications,
    ] = await Promise.all([
      this.prisma.job.count({ where: { restaurantId } }),
      this.prisma.job.count({ where: { restaurantId, status: JobStatus.OPEN } }),
      this.prisma.job.count({ where: { restaurantId, status: JobStatus.CLOSED } }),
      this.prisma.job.count({ where: { restaurantId, status: JobStatus.FILLED } }),
      this.prisma.jobApplication.count({
        where: { job: { restaurantId } },
      }),
      this.prisma.jobApplication.findMany({
        where: { job: { restaurantId } },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          employee: {
            include: {
              user: {
                include: {
                  profile: true,
                },
              },
            },
          },
          job: true,
        },
      }),
    ]);

    return {
      totalJobs,
      openJobs,
      closedJobs,
      filledJobs,
      totalApplications,
      recentApplications,
    };
  }

  async getRecommendedJobs(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        applications: {
          include: {
            job: true,
          },
        },
      },
    });

    if (!employee) {
      return [];
    }

    // Get applied job IDs to exclude
    const appliedJobIds = employee.applications.map((app) => app.job.id);

    const jobs = await this.prisma.job.findMany({
      where: {
        id: { notIn: appliedJobIds },
        status: JobStatus.OPEN,
        validTill: { gte: new Date() },
      },
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
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    return jobs;
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

  async findEmployeeByUserId(userId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { userId },
    });

    if (!employee) {
      throw new ForbiddenException('Employee profile not found');
    }

    return employee;
  }

  async getAllRestaurants() {
    return this.prisma.restaurant.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });
  }

  async findRestaurantById(id: string) {
    return this.prisma.restaurant.findUnique({
      where: { id },
      select: { id: true, name: true, isActive: true },
    });
  }

  // Job Application Methods
  async applyForJob(jobId: string, userId: string, applicationData) {
    // Check if job exists and is open
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job || job.status !== JobStatus.OPEN) {
      throw new NotFoundException('Job not found or no longer accepting applications');
    }

    // Find employee record for this user
    const employee = await this.findEmployeeByUserId(userId);
    if (!employee) {
      throw new ForbiddenException('Employee profile not found');
    }

    // Check if user has already applied for this job
    const existingApplication = await this.prisma.jobApplication.findFirst({
      where: {
        jobId,
        employeeId: employee.id,
      },
    });

    if (existingApplication) {
      throw new ForbiddenException('You have already applied for this job');
    }

    // Create job application
    const application = await this.prisma.jobApplication.create({
      data: {
        jobId,
        employeeId: employee.id,
        coverLetter: applicationData?.coverLetter || '',
        resume: applicationData?.resume || '',
        status: 'PENDING',
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

    return application;
  }

  async getJobApplications(jobId: string, page = 1, limit = 20, filters?) {
    const skip = (page - 1) * limit;
    const where: unknown = { jobId };

    if (filters?.status) {
      where.status = filters.status;
    }

    const applications = await this.prisma.jobApplication.findMany({
      where,
      skip,
      take: limit,
      include: {
        employee: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
        job: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.jobApplication.count({ where });

    return {
      applications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserApplications(userId: string, page = 1, limit = 20, filters?) {
    const skip = (page - 1) * limit;

    // Find employee record for this user
    const employee = await this.findEmployeeByUserId(userId);
    if (!employee) {
      throw new ForbiddenException('Employee profile not found');
    }

    const where: unknown = { employeeId: employee.id };

    if (filters?.status) {
      where.status = filters.status;
    }

    const applications = await this.prisma.jobApplication.findMany({
      where,
      skip,
      take: limit,
      include: {
        job: {
          include: {
            restaurant: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.jobApplication.count({ where });

    return {
      applications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateApplicationStatus(
    applicationId: string,
    status: string,
    notes: string,
    userId: string,
    userRole: UserRole
  ) {
    const application = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          include: { restaurant: true },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Check permissions
    if (userRole === UserRole.RESTAURANT) {
      const restaurant = await this.findRestaurantByUserId(userId);
      if (application.job.restaurantId !== restaurant.id) {
        throw new ForbiddenException('Access denied');
      }
    }

    const updatedApplication = await this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        status: status as unknown,
        reviewNotes: notes,
        reviewedAt: new Date(),
      },
      include: {
        job: true,
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

    return updatedApplication;
  }

  async getApplicationDetails(applicationId: string, userId: string, userRole: UserRole) {
    const application = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
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

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Check permissions
    if (userRole === UserRole.EMPLOYEE) {
      const employee = await this.findEmployeeByUserId(userId);
      if (!employee || application.employeeId !== employee.id) {
        throw new ForbiddenException('Access denied');
      }
    }

    if (userRole === UserRole.RESTAURANT) {
      const restaurant = await this.findRestaurantByUserId(userId);
      if (application.job.restaurantId !== restaurant.id) {
        throw new ForbiddenException('Access denied');
      }
    }

    return application;
  }
}