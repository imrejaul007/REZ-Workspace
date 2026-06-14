import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { JobsService } from '../../../src/modules/jobs/jobs.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { CreateJobDto } from '../../../src/modules/jobs/dto/create-job.dto';
import { UpdateJobDto } from '../../../src/modules/jobs/dto/update-job.dto';
import { JobStatus, UserRole } from '@prisma/client';

describe('JobsService', () => {
  let service: JobsService;
  let prismaService: PrismaService;

  // Mock data
  const mockRestaurant = {
    id: 'restaurant-123',
    name: 'Test Restaurant',
    userId: 'user-123',
    description: 'A test restaurant',
    address: '123 Test St',
    city: 'Test City',
    state: 'TS',
    country: 'Test Country',
    pincode: '12345',
    phone: '+1234567890',
    email: 'test@restaurant.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockJob = {
    id: 'job-123',
    title: 'Test Job',
    description: 'A test job posting',
    requirements: 'Test requirements',
    salary: '$50,000',
    location: 'Test City',
    type: 'FULL_TIME',
    status: JobStatus.OPEN,
    validTill: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    restaurantId: 'restaurant-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    restaurant: mockRestaurant,
  };

  const mockPrismaService = {
    restaurant: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    job: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    jobApplication: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have prisma service injected', () => {
      expect(prismaService).toBeDefined();
    });
  });

  describe('create', () => {
    const createJobDto: CreateJobDto = {
      title: 'New Job',
      description: 'Job description',
      requirements: 'Job requirements',
      salary: '$60,000',
      location: 'New City',
      type: 'FULL_TIME',
      validTill: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    it('should create a job successfully when user owns restaurant', async () => {
      // Arrange
      mockPrismaService.restaurant.findFirst.mockResolvedValue(mockRestaurant);
      mockPrismaService.job.create.mockResolvedValue(mockJob);

      // Act
      const result = await service.create('restaurant-123', 'user-123', createJobDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.title).toBe('Test Job');
      expect(mockPrismaService.restaurant.findFirst).toHaveBeenCalledWith({
        where: { id: 'restaurant-123', userId: 'user-123' },
      });
      expect(mockPrismaService.job.create).toHaveBeenCalledWith({
        data: {
          ...createJobDto,
          restaurantId: 'restaurant-123',
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
    });

    it('should throw ForbiddenException when user does not own restaurant', async () => {
      // Arrange
      mockPrismaService.restaurant.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create('restaurant-123', 'other-user', createJobDto))
        .rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.job.create).not.toHaveBeenCalled();
    });

    it('should handle date conversion for validTill', async () => {
      // Arrange
      mockPrismaService.restaurant.findFirst.mockResolvedValue(mockRestaurant);
      mockPrismaService.job.create.mockResolvedValue(mockJob);
      const validTillString = '2024-12-31T23:59:59.000Z';
      const createJobDtoWithDate = { ...createJobDto, validTill: validTillString };

      // Act
      await service.create('restaurant-123', 'user-123', createJobDtoWithDate);

      // Assert
      expect(mockPrismaService.job.create).toHaveBeenCalledWith({
        data: {
          ...createJobDtoWithDate,
          restaurantId: 'restaurant-123',
          validTill: new Date(validTillString),
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
    });
  });

  describe('findAll', () => {
    const mockJobs = [mockJob, { ...mockJob, id: 'job-456', title: 'Another Job' }];

    it('should return paginated list of open jobs', async () => {
      // Arrange
      mockPrismaService.job.findMany.mockResolvedValue(mockJobs);
      mockPrismaService.job.count.mockResolvedValue(2);

      // Act
      const result = await service.findAll(1, 20);

      // Assert
      expect(result.jobs).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(mockPrismaService.job.findMany).toHaveBeenCalledWith({
        where: {
          status: JobStatus.OPEN,
          validTill: { gte: expect.any(Date) },
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
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should apply pagination correctly', async () => {
      // Arrange
      mockPrismaService.job.findMany.mockResolvedValue([mockJob]);
      mockPrismaService.job.count.mockResolvedValue(25);

      // Act
      const result = await service.findAll(2, 10);

      // Assert
      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(3);
      expect(mockPrismaService.job.findMany).toHaveBeenCalledWith({
        where: {
          status: JobStatus.OPEN,
          validTill: { gte: expect.any(Date) },
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
        skip: 10,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should apply filters when provided', async () => {
      // Arrange
      mockPrismaService.job.findMany.mockResolvedValue(mockJobs);
      mockPrismaService.job.count.mockResolvedValue(2);
      const filters = {
        location: 'Test City',
        type: 'FULL_TIME',
        search: 'Test',
      };

      // Act
      await service.findAll(1, 20, filters);

      // Assert
      expect(mockPrismaService.job.findMany).toHaveBeenCalledWith({
        where: {
          status: JobStatus.OPEN,
          validTill: { gte: expect.any(Date) },
          location: 'Test City',
          type: 'FULL_TIME',
          OR: [
            { title: { contains: 'Test', mode: 'insensitive' } },
            { description: { contains: 'Test', mode: 'insensitive' } },
          ],
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
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a job by id', async () => {
      // Arrange
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);

      // Act
      const result = await service.findOne('job-123');

      // Assert
      expect(result).toBe(mockJob);
      expect(mockPrismaService.job.findUnique).toHaveBeenCalledWith({
        where: { id: 'job-123' },
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
    });

    it('should throw NotFoundException when job not found', async () => {
      // Arrange
      mockPrismaService.job.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateJobDto: UpdateJobDto = {
      title: 'Updated Job Title',
      salary: '$70,000',
    };

    it('should update a job successfully when user owns restaurant', async () => {
      // Arrange
      const updatedJob = { ...mockJob, ...updateJobDto };
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.job.update.mockResolvedValue(updatedJob);

      // Act
      const result = await service.update('job-123', 'user-123', updateJobDto);

      // Assert
      expect(result.title).toBe('Updated Job Title');
      expect(result.salary).toBe('$70,000');
      expect(mockPrismaService.job.update).toHaveBeenCalledWith({
        where: { id: 'job-123' },
        data: updateJobDto,
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
    });

    it('should throw NotFoundException when job not found', async () => {
      // Arrange
      mockPrismaService.job.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update('nonexistent-id', 'user-123', updateJobDto))
        .rejects.toThrow(NotFoundException);
      expect(mockPrismaService.job.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user does not own restaurant', async () => {
      // Arrange
      const jobWithDifferentOwner = {
        ...mockJob,
        restaurant: { ...mockRestaurant, userId: 'other-user' },
      };
      mockPrismaService.job.findUnique.mockResolvedValue(jobWithDifferentOwner);

      // Act & Assert
      await expect(service.update('job-123', 'user-123', updateJobDto))
        .rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.job.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a job successfully when user owns restaurant', async () => {
      // Arrange
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.job.delete.mockResolvedValue(mockJob);

      // Act
      const result = await service.remove('job-123', 'user-123');

      // Assert
      expect(result).toBe(mockJob);
      expect(mockPrismaService.job.delete).toHaveBeenCalledWith({
        where: { id: 'job-123' },
      });
    });

    it('should throw NotFoundException when job not found', async () => {
      // Arrange
      mockPrismaService.job.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove('nonexistent-id', 'user-123'))
        .rejects.toThrow(NotFoundException);
      expect(mockPrismaService.job.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user does not own restaurant', async () => {
      // Arrange
      const jobWithDifferentOwner = {
        ...mockJob,
        restaurant: { ...mockRestaurant, userId: 'other-user' },
      };
      mockPrismaService.job.findUnique.mockResolvedValue(jobWithDifferentOwner);

      // Act & Assert
      await expect(service.remove('job-123', 'user-123'))
        .rejects.toThrow(ForbiddenException);
      expect(mockPrismaService.job.delete).not.toHaveBeenCalled();
    });
  });

  describe('Job Applications', () => {
    const mockApplication = {
      id: 'application-123',
      jobId: 'job-123',
      userId: 'applicant-123',
      coverLetter: 'I am interested in this position',
      resume: 'resume-url',
      status: 'PENDING',
      createdAt: new Date(),
    };

    it('should apply for a job successfully', async () => {
      // Arrange
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.jobApplication.findFirst.mockResolvedValue(null);
      mockPrismaService.jobApplication.create.mockResolvedValue(mockApplication);

      // Act
      const result = await service.applyForJob('job-123', 'applicant-123', {
        coverLetter: 'I am interested in this position',
        resume: 'resume-url',
      });

      // Assert
      expect(result).toBe(mockApplication);
      expect(mockPrismaService.jobApplication.create).toHaveBeenCalledWith({
        data: {
          jobId: 'job-123',
          userId: 'applicant-123',
          coverLetter: 'I am interested in this position',
          resume: 'resume-url',
        },
        include: {
          user: {
            include: {
              profile: true,
            },
          },
          job: true,
        },
      });
    });

    it('should throw error when user already applied', async () => {
      // Arrange
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockPrismaService.jobApplication.findFirst.mockResolvedValue(mockApplication);

      // Act & Assert
      await expect(service.applyForJob('job-123', 'applicant-123', {
        coverLetter: 'I am interested in this position',
        resume: 'resume-url',
      })).rejects.toThrow('You have already applied for this job');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Arrange
      mockPrismaService.job.findMany.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(service.findAll()).rejects.toThrow('Database connection failed');
    });

    it('should handle invalid job IDs gracefully', async () => {
      // Arrange
      mockPrismaService.job.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('invalid-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('Performance', () => {
    it('should complete findAll within acceptable time', async () => {
      // Arrange
      mockPrismaService.job.findMany.mockResolvedValue([mockJob]);
      mockPrismaService.job.count.mockResolvedValue(1);

      // Act
      const startTime = Date.now();
      await service.findAll();
      const endTime = Date.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle large datasets efficiently', async () => {
      // Arrange
      const largeJobList = Array.from({ length: 1000 }, (_, i) => ({
        ...mockJob,
        id: `job-${i}`,
      }));
      mockPrismaService.job.findMany.mockResolvedValue(largeJobList.slice(0, 20));
      mockPrismaService.job.count.mockResolvedValue(1000);

      // Act
      const result = await service.findAll(1, 20);

      // Assert
      expect(result.jobs).toHaveLength(20);
      expect(result.total).toBe(1000);
      expect(result.totalPages).toBe(50);
    });
  });
});