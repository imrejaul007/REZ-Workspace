import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { JobsService } from '../../../src/modules/jobs/jobs.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { EmailService } from '../../../src/modules/email/email.service';
import { MockPrismaService } from '../../utils/mock-prisma.service';
import { TestFactories } from '../../utils/test-factories';
import { JobStatus, ApplicationStatus, UserRole } from '@prisma/client';

describe('JobsService - Enhanced Tests', () => {
  let service: JobsService;
  let prismaService: MockPrismaService;
  let emailService: EmailService;

  const mockEmailService = {
    sendEmail: jest.fn(),
    sendJobApplicationNotification: jest.fn(),
    sendJobStatusUpdateNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: PrismaService,
          useClass: MockPrismaService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
    prismaService = module.get<MockPrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await prismaService.cleanup();
    jest.restoreAllMocks();
  });

  describe('createJob', () => {
    const createJobDto = {
      title: 'Head Chef',
      description: 'Experienced chef needed for fine dining restaurant',
      requirements: ['Culinary degree', '5+ years experience'],
      skills: ['Cooking', 'Leadership', 'Menu Planning'],
      experienceMin: 5,
      experienceMax: 10,
      salaryMin: 60000,
      salaryMax: 80000,
      location: 'New York, NY',
      jobType: 'Full-time',
      validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };

    it('should create a job successfully', async () => {
      const restaurantId = 'restaurant-id';
      const expectedJob = TestFactories.createJob({
        ...createJobDto,
        restaurantId,
        status: JobStatus.OPEN,
      });

      prismaService.job.create = jest.fn().mockResolvedValue(expectedJob);

      const result = await service.createJob(restaurantId, createJobDto);

      expect(result).toEqual(expectedJob);
      expect(prismaService.job.create).toHaveBeenCalledWith({
        data: {
          ...createJobDto,
          restaurantId,
          status: JobStatus.OPEN,
        },
      });
    });

    it('should validate required fields', async () => {
      const invalidJobDto = {
        title: '',
        description: '',
        requirements: [],
        skills: [],
        experienceMin: -1,
        salaryMin: 0,
        location: '',
        jobType: '',
        validTill: new Date(Date.now() - 1000), // Past date
      };

      await expect(service.createJob('restaurant-id', invalidJobDto as any))
        .rejects.toThrow(BadRequestException);
    });

    it('should handle database errors gracefully', async () => {
      prismaService.job.create = jest.fn().mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(service.createJob('restaurant-id', createJobDto))
        .rejects.toThrow();
    });

    it('should validate salary range', async () => {
      const invalidSalaryDto = {
        ...createJobDto,
        salaryMin: 80000,
        salaryMax: 60000, // Max less than min
      };

      await expect(service.createJob('restaurant-id', invalidSalaryDto))
        .rejects.toThrow(BadRequestException);
    });

    it('should validate experience range', async () => {
      const invalidExperienceDto = {
        ...createJobDto,
        experienceMin: 10,
        experienceMax: 5, // Max less than min
      };

      await expect(service.createJob('restaurant-id', invalidExperienceDto))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('updateJob', () => {
    const jobId = 'job-id';
    const restaurantId = 'restaurant-id';
    const updateJobDto = {
      title: 'Senior Head Chef',
      description: 'Updated description',
      salaryMax: 90000,
    };

    beforeEach(() => {
      const existingJob = TestFactories.createJob({
        id: jobId,
        restaurantId,
        status: JobStatus.OPEN,
      });

      prismaService.job.findUnique = jest.fn().mockResolvedValue(existingJob);
    });

    it('should update job successfully', async () => {
      const updatedJob = TestFactories.createJob({
        id: jobId,
        restaurantId,
        ...updateJobDto,
      });

      prismaService.job.update = jest.fn().mockResolvedValue(updatedJob);

      const result = await service.updateJob(jobId, restaurantId, updateJobDto);

      expect(result).toEqual(updatedJob);
      expect(prismaService.job.update).toHaveBeenCalledWith({
        where: { id: jobId },
        data: updateJobDto,
      });
    });

    it('should throw NotFoundException if job does not exist', async () => {
      prismaService.job.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.updateJob(jobId, restaurantId, updateJobDto))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if restaurant does not own the job', async () => {
      const jobFromOtherRestaurant = TestFactories.createJob({
        id: jobId,
        restaurantId: 'other-restaurant-id',
      });

      prismaService.job.findUnique = jest.fn().mockResolvedValue(jobFromOtherRestaurant);

      await expect(service.updateJob(jobId, restaurantId, updateJobDto))
        .rejects.toThrow(ForbiddenException);
    });

    it('should not allow updating closed jobs', async () => {
      const closedJob = TestFactories.createJob({
        id: jobId,
        restaurantId,
        status: JobStatus.CLOSED,
      });

      prismaService.job.findUnique = jest.fn().mockResolvedValue(closedJob);

      await expect(service.updateJob(jobId, restaurantId, updateJobDto))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteJob', () => {
    const jobId = 'job-id';
    const restaurantId = 'restaurant-id';

    it('should delete job successfully', async () => {
      const existingJob = TestFactories.createJob({
        id: jobId,
        restaurantId,
        status: JobStatus.OPEN,
      });

      prismaService.job.findUnique = jest.fn().mockResolvedValue(existingJob);
      prismaService.job.delete = jest.fn().mockResolvedValue(existingJob);

      const result = await service.deleteJob(jobId, restaurantId);

      expect(result).toEqual({ message: 'Job deleted successfully' });
      expect(prismaService.job.delete).toHaveBeenCalledWith({
        where: { id: jobId },
      });
    });

    it('should throw NotFoundException if job does not exist', async () => {
      prismaService.job.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.deleteJob(jobId, restaurantId))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if restaurant does not own the job', async () => {
      const jobFromOtherRestaurant = TestFactories.createJob({
        id: jobId,
        restaurantId: 'other-restaurant-id',
      });

      prismaService.job.findUnique = jest.fn().mockResolvedValue(jobFromOtherRestaurant);

      await expect(service.deleteJob(jobId, restaurantId))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('getJobs', () => {
    it('should return paginated jobs with default parameters', async () => {
      const jobs = Array.from({ length: 5 }, (_, i) =>
        TestFactories.createJob({ id: `job-${i}` })
      );

      prismaService.job.findMany = jest.fn().mockResolvedValue(jobs);
      prismaService.job.count = jest.fn().mockResolvedValue(25);

      const result = await service.getJobs({});

      expect(result.jobs).toEqual(jobs);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });

    it('should filter jobs by location', async () => {
      const location = 'New York';
      const filteredJobs = [TestFactories.createJob({ location })];

      prismaService.job.findMany = jest.fn().mockResolvedValue(filteredJobs);
      prismaService.job.count = jest.fn().mockResolvedValue(1);

      const result = await service.getJobs({ location });

      expect(prismaService.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            location: { contains: location, mode: 'insensitive' },
          }),
        })
      );
    });

    it('should filter jobs by salary range', async () => {
      const salaryMin = 50000;
      const salaryMax = 80000;

      const filteredJobs = [TestFactories.createJob({ salaryMin, salaryMax })];

      prismaService.job.findMany = jest.fn().mockResolvedValue(filteredJobs);
      prismaService.job.count = jest.fn().mockResolvedValue(1);

      const result = await service.getJobs({ salaryMin, salaryMax });

      expect(prismaService.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            salaryMin: { gte: salaryMin },
            salaryMax: { lte: salaryMax },
          }),
        })
      );
    });

    it('should filter jobs by experience level', async () => {
      const experienceMin = 3;
      const experienceMax = 7;

      const filteredJobs = [TestFactories.createJob({ experienceMin, experienceMax })];

      prismaService.job.findMany = jest.fn().mockResolvedValue(filteredJobs);
      prismaService.job.count = jest.fn().mockResolvedValue(1);

      const result = await service.getJobs({ experienceMin, experienceMax });

      expect(prismaService.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            experienceMin: { gte: experienceMin },
            experienceMax: { lte: experienceMax },
          }),
        })
      );
    });

    it('should search jobs by title and description', async () => {
      const search = 'chef';
      const searchResults = [
        TestFactories.createJob({ title: 'Head Chef' }),
        TestFactories.createJob({ description: 'Looking for a chef' }),
      ];

      prismaService.job.findMany = jest.fn().mockResolvedValue(searchResults);
      prismaService.job.count = jest.fn().mockResolvedValue(2);

      const result = await service.getJobs({ search });

      expect(prismaService.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }),
        })
      );
    });
  });

  describe('getJobById', () => {
    const jobId = 'job-id';

    it('should return job with full details', async () => {
      const job = TestFactories.createJob({
        id: jobId,
        restaurant: TestFactories.createRestaurant(),
        jobApplications: [],
      });

      prismaService.job.findUnique = jest.fn().mockResolvedValue(job);

      const result = await service.getJobById(jobId);

      expect(result).toEqual(job);
      expect(prismaService.job.findUnique).toHaveBeenCalledWith({
        where: { id: jobId },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              location: true,
              cuisineType: true,
            },
          },
          jobApplications: {
            select: {
              id: true,
              status: true,
              appliedAt: true,
              user: {
                select: {
                  id: true,
                  email: true,
                  profile: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    });

    it('should throw NotFoundException if job does not exist', async () => {
      prismaService.job.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.getJobById(jobId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('applyToJob', () => {
    const jobId = 'job-id';
    const userId = 'user-id';
    const applicationData = {
      coverLetter: 'I am interested in this position...',
      resumeUrl: 'https://example.com/resume.pdf',
      availability: new Date(),
    };

    beforeEach(() => {
      const job = TestFactories.createJob({
        id: jobId,
        status: JobStatus.OPEN,
        validTill: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      });

      prismaService.job.findUnique = jest.fn().mockResolvedValue(job);
    });

    it('should create job application successfully', async () => {
      const application = TestFactories.createJobApplication({
        jobId,
        userId,
        ...applicationData,
      });

      // Mock no existing application
      prismaService.jobApplication.findFirst = jest.fn().mockResolvedValue(null);
      prismaService.jobApplication.create = jest.fn().mockResolvedValue(application);

      const result = await service.applyToJob(jobId, userId, applicationData);

      expect(result).toEqual(application);
      expect(prismaService.jobApplication.create).toHaveBeenCalledWith({
        data: {
          jobId,
          userId,
          ...applicationData,
          status: ApplicationStatus.PENDING,
        },
      });
    });

    it('should throw BadRequestException if already applied', async () => {
      const existingApplication = TestFactories.createJobApplication({
        jobId,
        userId,
      });

      prismaService.jobApplication.findFirst = jest.fn().mockResolvedValue(existingApplication);

      await expect(service.applyToJob(jobId, userId, applicationData))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if job does not exist', async () => {
      prismaService.job.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.applyToJob(jobId, userId, applicationData))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if job is closed', async () => {
      const closedJob = TestFactories.createJob({
        id: jobId,
        status: JobStatus.CLOSED,
      });

      prismaService.job.findUnique = jest.fn().mockResolvedValue(closedJob);

      await expect(service.applyToJob(jobId, userId, applicationData))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if job is expired', async () => {
      const expiredJob = TestFactories.createJob({
        id: jobId,
        status: JobStatus.OPEN,
        validTill: new Date(Date.now() - 1000), // Expired
      });

      prismaService.job.findUnique = jest.fn().mockResolvedValue(expiredJob);

      await expect(service.applyToJob(jobId, userId, applicationData))
        .rejects.toThrow(BadRequestException);
    });

    it('should send application notification email', async () => {
      const application = TestFactories.createJobApplication({
        jobId,
        userId,
        ...applicationData,
      });

      prismaService.jobApplication.findFirst = jest.fn().mockResolvedValue(null);
      prismaService.jobApplication.create = jest.fn().mockResolvedValue(application);

      await service.applyToJob(jobId, userId, applicationData);

      expect(mockEmailService.sendJobApplicationNotification).toHaveBeenCalled();
    });
  });

  describe('updateApplicationStatus', () => {
    const applicationId = 'application-id';
    const restaurantId = 'restaurant-id';
    const newStatus = ApplicationStatus.ACCEPTED;
    const notes = 'Great candidate';

    beforeEach(() => {
      const application = TestFactories.createJobApplication({
        id: applicationId,
        job: TestFactories.createJob({ restaurantId }),
        status: ApplicationStatus.PENDING,
      });

      prismaService.jobApplication.findUnique = jest.fn().mockResolvedValue(application);
    });

    it('should update application status successfully', async () => {
      const updatedApplication = TestFactories.createJobApplication({
        id: applicationId,
        status: newStatus,
        notes,
      });

      prismaService.jobApplication.update = jest.fn().mockResolvedValue(updatedApplication);

      const result = await service.updateApplicationStatus(
        applicationId,
        restaurantId,
        newStatus,
        notes
      );

      expect(result).toEqual(updatedApplication);
      expect(prismaService.jobApplication.update).toHaveBeenCalledWith({
        where: { id: applicationId },
        data: {
          status: newStatus,
          notes,
          reviewedAt: expect.any(Date),
        },
      });
    });

    it('should throw NotFoundException if application does not exist', async () => {
      prismaService.jobApplication.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.updateApplicationStatus(
        applicationId,
        restaurantId,
        newStatus,
        notes
      )).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if restaurant does not own the job', async () => {
      const applicationFromOtherRestaurant = TestFactories.createJobApplication({
        id: applicationId,
        job: TestFactories.createJob({ restaurantId: 'other-restaurant-id' }),
      });

      prismaService.jobApplication.findUnique = jest.fn()
        .mockResolvedValue(applicationFromOtherRestaurant);

      await expect(service.updateApplicationStatus(
        applicationId,
        restaurantId,
        newStatus,
        notes
      )).rejects.toThrow(ForbiddenException);
    });

    it('should send status update notification email', async () => {
      const updatedApplication = TestFactories.createJobApplication({
        id: applicationId,
        status: newStatus,
      });

      prismaService.jobApplication.update = jest.fn().mockResolvedValue(updatedApplication);

      await service.updateApplicationStatus(applicationId, restaurantId, newStatus, notes);

      expect(mockEmailService.sendJobStatusUpdateNotification).toHaveBeenCalled();
    });
  });

  describe('getJobApplications', () => {
    const jobId = 'job-id';
    const restaurantId = 'restaurant-id';

    beforeEach(() => {
      const job = TestFactories.createJob({
        id: jobId,
        restaurantId,
      });

      prismaService.job.findUnique = jest.fn().mockResolvedValue(job);
    });

    it('should return job applications with pagination', async () => {
      const applications = Array.from({ length: 3 }, (_, i) =>
        TestFactories.createJobApplication({
          id: `application-${i}`,
          jobId,
        })
      );

      prismaService.jobApplication.findMany = jest.fn().mockResolvedValue(applications);
      prismaService.jobApplication.count = jest.fn().mockResolvedValue(15);

      const result = await service.getJobApplications(jobId, restaurantId, {});

      expect(result.applications).toEqual(applications);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 15,
        totalPages: 2,
      });
    });

    it('should filter applications by status', async () => {
      const status = ApplicationStatus.PENDING;
      const filteredApplications = [
        TestFactories.createJobApplication({ status }),
      ];

      prismaService.jobApplication.findMany = jest.fn().mockResolvedValue(filteredApplications);
      prismaService.jobApplication.count = jest.fn().mockResolvedValue(1);

      const result = await service.getJobApplications(jobId, restaurantId, { status });

      expect(prismaService.jobApplication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status,
          }),
        })
      );
    });

    it('should throw NotFoundException if job does not exist', async () => {
      prismaService.job.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.getJobApplications(jobId, restaurantId, {}))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if restaurant does not own the job', async () => {
      const jobFromOtherRestaurant = TestFactories.createJob({
        id: jobId,
        restaurantId: 'other-restaurant-id',
      });

      prismaService.job.findUnique = jest.fn().mockResolvedValue(jobFromOtherRestaurant);

      await expect(service.getJobApplications(jobId, restaurantId, {}))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('getUserApplications', () => {
    const userId = 'user-id';

    it('should return user job applications with pagination', async () => {
      const applications = Array.from({ length: 2 }, (_, i) =>
        TestFactories.createJobApplication({
          id: `application-${i}`,
          userId,
        })
      );

      prismaService.jobApplication.findMany = jest.fn().mockResolvedValue(applications);
      prismaService.jobApplication.count = jest.fn().mockResolvedValue(5);

      const result = await service.getUserApplications(userId, {});

      expect(result.applications).toEqual(applications);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 5,
        totalPages: 1,
      });
    });

    it('should filter user applications by status', async () => {
      const status = ApplicationStatus.ACCEPTED;
      const filteredApplications = [
        TestFactories.createJobApplication({ userId, status }),
      ];

      prismaService.jobApplication.findMany = jest.fn().mockResolvedValue(filteredApplications);
      prismaService.jobApplication.count = jest.fn().mockResolvedValue(1);

      const result = await service.getUserApplications(userId, { status });

      expect(prismaService.jobApplication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            status,
          }),
        })
      );
    });
  });

  describe('closeJob', () => {
    const jobId = 'job-id';
    const restaurantId = 'restaurant-id';

    it('should close job successfully', async () => {
      const job = TestFactories.createJob({
        id: jobId,
        restaurantId,
        status: JobStatus.OPEN,
      });

      const closedJob = { ...job, status: JobStatus.CLOSED };

      prismaService.job.findUnique = jest.fn().mockResolvedValue(job);
      prismaService.job.update = jest.fn().mockResolvedValue(closedJob);

      const result = await service.closeJob(jobId, restaurantId);

      expect(result).toEqual(closedJob);
      expect(prismaService.job.update).toHaveBeenCalledWith({
        where: { id: jobId },
        data: { status: JobStatus.CLOSED },
      });
    });

    it('should throw NotFoundException if job does not exist', async () => {
      prismaService.job.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.closeJob(jobId, restaurantId))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if restaurant does not own the job', async () => {
      const jobFromOtherRestaurant = TestFactories.createJob({
        id: jobId,
        restaurantId: 'other-restaurant-id',
      });

      prismaService.job.findUnique = jest.fn().mockResolvedValue(jobFromOtherRestaurant);

      await expect(service.closeJob(jobId, restaurantId))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if job is already closed', async () => {
      const closedJob = TestFactories.createJob({
        id: jobId,
        restaurantId,
        status: JobStatus.CLOSED,
      });

      prismaService.job.findUnique = jest.fn().mockResolvedValue(closedJob);

      await expect(service.closeJob(jobId, restaurantId))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getJobStats', () => {
    const restaurantId = 'restaurant-id';

    it('should return job statistics', async () => {
      const mockStats = {
        totalJobs: 10,
        openJobs: 7,
        closedJobs: 3,
        totalApplications: 25,
        pendingApplications: 15,
        acceptedApplications: 5,
        rejectedApplications: 5,
      };

      // Mock aggregation queries
      prismaService.job.count = jest.fn()
        .mockResolvedValueOnce(mockStats.totalJobs)
        .mockResolvedValueOnce(mockStats.openJobs)
        .mockResolvedValueOnce(mockStats.closedJobs);

      prismaService.jobApplication.count = jest.fn()
        .mockResolvedValueOnce(mockStats.totalApplications)
        .mockResolvedValueOnce(mockStats.pendingApplications)
        .mockResolvedValueOnce(mockStats.acceptedApplications)
        .mockResolvedValueOnce(mockStats.rejectedApplications);

      const result = await service.getJobStats(restaurantId);

      expect(result).toEqual(mockStats);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      prismaService.job.findMany = jest.fn().mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(service.getJobs({}))
        .rejects.toThrow('Database connection failed');
    });

    it('should handle invalid input data', async () => {
      const invalidData = {
        title: '', // Empty title
        experienceMin: -1, // Negative experience
        salaryMin: 'invalid', // Non-numeric salary
      };

      await expect(service.createJob('restaurant-id', invalidData as any))
        .rejects.toThrow();
    });

    it('should handle concurrent application attempts', async () => {
      const jobId = 'job-id';
      const userId = 'user-id';
      const applicationData = {
        coverLetter: 'Test cover letter',
      };

      const job = TestFactories.createJob({
        id: jobId,
        status: JobStatus.OPEN,
        validTill: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      prismaService.job.findUnique = jest.fn().mockResolvedValue(job);

      // Simulate race condition - first call returns null, second returns existing application
      prismaService.jobApplication.findFirst = jest.fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(TestFactories.createJobApplication({ jobId, userId }));

      prismaService.jobApplication.create = jest.fn().mockRejectedValue(
        new Error('Unique constraint violation')
      );

      await expect(service.applyToJob(jobId, userId, applicationData))
        .rejects.toThrow();
    });
  });

  describe('Performance Tests', () => {
    it('should handle large result sets efficiently', async () => {
      const largeJobSet = Array.from({ length: 1000 }, (_, i) =>
        TestFactories.createJob({ id: `job-${i}` })
      );

      prismaService.job.findMany = jest.fn().mockResolvedValue(largeJobSet.slice(0, 10));
      prismaService.job.count = jest.fn().mockResolvedValue(1000);

      const startTime = Date.now();
      const result = await service.getJobs({ limit: 10 });
      const duration = Date.now() - startTime;

      expect(result.jobs).toHaveLength(10);
      expect(result.pagination.total).toBe(1000);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should optimize complex queries with multiple filters', async () => {
      const complexFilters = {
        location: 'New York',
        salaryMin: 50000,
        salaryMax: 100000,
        experienceMin: 2,
        experienceMax: 8,
        search: 'chef',
        jobType: 'Full-time',
      };

      const filteredJobs = [TestFactories.createJob()];

      prismaService.job.findMany = jest.fn().mockResolvedValue(filteredJobs);
      prismaService.job.count = jest.fn().mockResolvedValue(1);

      const startTime = Date.now();
      const result = await service.getJobs(complexFilters);
      const duration = Date.now() - startTime;

      expect(result.jobs).toEqual(filteredJobs);
      expect(duration).toBeLessThan(500); // Should handle complex queries efficiently
    });
  });
});