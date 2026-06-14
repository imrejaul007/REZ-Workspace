import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JobStatus, ApplicationStatus } from '@prisma/client';
import { FileStorageService } from './file-storage.service';

export interface CreateJobDto {
  title: string;
  description: string;
  requirements: string[];
  skills: string[];
  experienceMin?: number;
  experienceMax?: number;
  salaryMin?: number;
  salaryMax?: number;
  location: string;
  jobType: string;
  validTill: Date;
}

export interface UpdateJobDto {
  title?: string;
  description?: string;
  requirements?: string[];
  skills?: string[];
  experienceMin?: number;
  experienceMax?: number;
  salaryMin?: number;
  salaryMax?: number;
  location?: string;
  jobType?: string;
  status?: JobStatus;
  validTill?: Date;
}

export interface JobFilters {
  status?: JobStatus;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  experienceMin?: number;
  experienceMax?: number;
  skills?: string[];
  search?: string;
}

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private fileStorageService: FileStorageService
  ) {}

  async createJob(restaurantId: string, data: CreateJobDto) {
    const job = await this.prisma.job.create({
      data: {
        ...data,
        restaurantId,
        status: 'DRAFT'
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                profile: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    return job;
  }

  async getJobs(filters: JobFilters = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const {
      status,
      location,
      salaryMin,
      salaryMax,
      experienceMin,
      experienceMax,
      skills,
      search
    } = filters;

    const where: unknown = {
      ...(status && { status }),
      ...(location && {
        location: { contains: location, mode: 'insensitive' }
      }),
      ...(salaryMin && { salaryMin: { gte: salaryMin } }),
      ...(salaryMax && { salaryMax: { lte: salaryMax } }),
      ...(experienceMin !== undefined && { experienceMin: { gte: experienceMin } }),
      ...(experienceMax !== undefined && { experienceMax: { lte: experienceMax } }),
      ...(skills && skills.length > 0 && {
        skills: { hasSome: skills }
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
          { skills: { hasSome: [search] } }
        ]
      })
    };

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              user: {
                select: {
                  profile: {
                    select: {
                      firstName: true,
                      lastName: true
                    }
                  }
                }
              }
            }
          },
          _count: {
            select: {
              applications: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.job.count({ where })
    ]);

    return {
      data: jobs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getJob(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true
                  }
                }
              }
            }
          }
        },
        applications: {
          include: {
            employee: {
              select: {
                id: true,
                user: {
                  select: {
                    profile: {
                      select: {
                        firstName: true,
                        lastName: true,
                        avatar: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Increment view count
    await this.prisma.job.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });

    return job;
  }

  async updateJob(id: string, restaurantId: string, data: UpdateJobDto) {
    // Verify job belongs to restaurant
    const job = await this.prisma.job.findFirst({
      where: { id, restaurantId }
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return this.prisma.job.update({
      where: { id },
      data,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      }
    });
  }

  async deleteJob(id: string, restaurantId: string) {
    const job = await this.prisma.job.findFirst({
      where: { id, restaurantId }
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    await this.prisma.job.delete({
      where: { id }
    });

    return { message: 'Job deleted successfully' };
  }

  async getRestaurantJobs(restaurantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where: { restaurantId },
        include: {
          _count: {
            select: {
              applications: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.job.count({ where: { restaurantId } })
    ]);

    return {
      data: jobs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Job Application methods
  async applyToJob(jobId: string, employeeId: string, coverLetter: string, resumeFile?: string) {
    // Check if job exists and is open
    const job = await this.prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job || !job.status) {
      throw new NotFoundException('Job not found');
    }

    if (job.status !== 'OPEN') {
      throw new BadRequestException('Job is not accepting applications');
    }

    if (new Date() > job.validTill) {
      throw new BadRequestException('Job application deadline has passed');
    }

    // Check if user already applied
    const existingApplication = await this.prisma.jobApplication.findFirst({
      where: { jobId, employeeId }
    });

    if (existingApplication) {
      throw new BadRequestException('You have already applied to this job');
    }

    // Sanitize resume file path - only accept files from trusted upload directory
    let resumePath: string | undefined;
    if (resumeFile) {
      // Reject path traversal attempts
      if (resumeFile.includes('..') || resumeFile.includes('/') || !resumeFile.match(/^[a-zA-Z0-9._-]+$/)) {
        throw new BadRequestException('Invalid resume file path');
      }
      resumePath = resumeFile;
    }

    // Create application
    const application = await this.prisma.jobApplication.create({
      data: {
        jobId,
        employeeId,
        coverLetter,
        resume: resumePath,
        status: 'PENDING'
      },
      include: {
        employee: {
          select: {
            id: true,
            user: {
              select: {
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true
                  }
                }
              }
            }
          }
        },
        job: {
          select: {
            id: true,
            title: true,
            restaurant: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    // Update job application count
    await this.prisma.job.update({
      where: { id: jobId },
      data: { applicationCount: { increment: 1 } }
    });

    return application;
  }

  async getJobApplications(jobId: string, restaurantId: string, page = 1, limit = 20) {
    // Verify job belongs to restaurant
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, restaurantId }
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      this.prisma.jobApplication.findMany({
        where: { jobId },
        include: {
          employee: {
            select: {
              id: true,
              designation: true,
              user: {
                select: {
                  email: true,
                  profile: {
                    select: {
                      firstName: true,
                      lastName: true,
                      avatar: true,
                      address: true,
                      city: true,
                      state: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.jobApplication.count({ where: { jobId } })
    ]);

    return {
      data: applications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async updateApplicationStatus(
    applicationId: string,
    restaurantId: string,
    status: ApplicationStatus,
    reviewNotes?: string
  ) {
    // Verify application belongs to restaurant's job
    const application = await this.prisma.jobApplication.findFirst({
      where: {
        id: applicationId,
        job: { restaurantId }
      }
    });

    if (!application) {
      throw new NotFoundException('Job application not found');
    }

    return this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: {
        status,
        reviewNotes,
        reviewedAt: new Date()
      },
      include: {
        employee: {
          select: {
            id: true,
            user: {
              select: {
                profile: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        },
        job: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });
  }

  async getRestaurantApplications(restaurantId: string, page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;

    const where: unknown = {
      job: { restaurantId },
      ...(status && status !== 'all' ? { status: status.toUpperCase() } : {}),
    };

    const [applications, total] = await Promise.all([
      this.prisma.jobApplication.findMany({
        where,
        include: {
          job: {
            select: {
              id: true,
              title: true,
            },
          },
          employee: {
            select: {
              id: true,
              designation: true,
              user: {
                select: {
                  email: true,
                  phone: true,
                  profile: {
                    select: {
                      firstName: true,
                      lastName: true,
                      avatar: true,
                      city: true,
                      state: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
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

  async getRestaurantApplication(applicationId: string, restaurantId: string) {
    const application = await this.prisma.jobApplication.findFirst({
      where: {
        id: applicationId,
        job: { restaurantId },
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
          },
        },
        employee: {
          select: {
            id: true,
            designation: true,
            user: {
              select: {
                email: true,
                phone: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                    city: true,
                    state: true,
                    address: true,
                  },
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

  async getMyApplications(employeeId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      this.prisma.jobApplication.findMany({
        where: { employeeId },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              location: true,
              salaryMin: true,
              salaryMax: true,
              validTill: true,
              restaurant: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.jobApplication.count({ where: { employeeId } })
    ]);

    return {
      data: applications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Saved Jobs methods
  async getSavedJobs(userId: string) {
    const savedJobs = await this.prisma.savedJob.findMany({
      where: { userId },
      include: {
        job: {
          include: {
            restaurant: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: { applications: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: savedJobs.map(s => s.job),
      total: savedJobs.length,
    };
  }

  async toggleSaveJob(userId: string, jobId: string) {
    // Verify job exists
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    const existing = await this.prisma.savedJob.findUnique({
      where: { userId_jobId: { userId, jobId } },
    });

    if (existing) {
      await this.prisma.savedJob.delete({
        where: { userId_jobId: { userId, jobId } },
      });
      return { saved: false, jobId };
    }

    await this.prisma.savedJob.create({ data: { userId, jobId } });
    return { saved: true, jobId };
  }

  // File upload helper methods
  async uploadResume(file: Express.Multer.File): Promise<string> {
    const result = await this.fileStorageService.uploadResume(file);
    return result.url;
  }

  async uploadJobAttachment(file: Express.Multer.File): Promise<string> {
    const result = await this.fileStorageService.uploadJobAttachment(file);
    return result.url;
  }
}