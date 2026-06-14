import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { JobsModule } from '../../../src/modules/jobs/jobs.module';
import { AuthModule } from '../../../src/modules/auth/auth.module';
import { UsersModule } from '../../../src/modules/users/users.module';
import { ConfigModule } from '@nestjs/config';
import { JobStatus } from '@prisma/client';

describe('Jobs Endpoints (Integration)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authToken: string;
  let userId: string;
  let restaurantId: string;

  // Test data
  const testUser = {
    email: 'restaurant.owner@example.com',
    password: 'password123',
    firstName: 'Restaurant',
    lastName: 'Owner',
    phone: '+1234567890',
    role: 'RESTAURANT_OWNER',
  };

  const testRestaurant = {
    name: 'Test Restaurant',
    description: 'A test restaurant for job postings',
    address: '123 Test Street',
    city: 'Test City',
    state: 'TS',
    country: 'Test Country',
    pincode: '12345',
    phone: '+1234567890',
    email: 'test@restaurant.com',
  };

  const testJob = {
    title: 'Test Job Position',
    description: 'A comprehensive test job description',
    requirements: 'Test requirements for the position',
    salary: '$50,000 - $60,000',
    location: 'Test City, TS',
    type: 'FULL_TIME',
    validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        AuthModule,
        UsersModule,
        JobsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();

    // Clean up database before tests
    await cleanupDatabase();

    // Create test user and restaurant
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await app.close();
  });

  beforeEach(async () => {
    // Clean up jobs before each test
    await prismaService.job.deleteMany();
  });

  async function cleanupDatabase() {
    await prismaService.jobApplication.deleteMany();
    await prismaService.job.deleteMany();
    await prismaService.restaurant.deleteMany();
    await prismaService.user.deleteMany();
  }

  async function setupTestData() {
    // Create user
    const signupResponse = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(testUser);

    authToken = signupResponse.body.accessToken;
    userId = signupResponse.body.user.id;

    // Create restaurant
    const restaurant = await prismaService.restaurant.create({
      data: {
        ...testRestaurant,
        userId,
      },
    });

    restaurantId = restaurant.id;
  }

  describe('POST /jobs', () => {
    it('should create a job successfully with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...testJob,
          restaurantId,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(testJob.title);
      expect(response.body.restaurantId).toBe(restaurantId);
      expect(response.body.status).toBe(JobStatus.OPEN);

      // Verify job was created in database
      const dbJob = await prismaService.job.findUnique({
        where: { id: response.body.id },
      });
      expect(dbJob).toBeTruthy();
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app.getHttpServer())
        .post('/jobs')
        .send({
          ...testJob,
          restaurantId,
        })
        .expect(401);

      expect(response.body.message).toBeDefined();
    });

    it('should return 403 when user does not own the restaurant', async () => {
      // Create another user
      const anotherUser = {
        ...testUser,
        email: 'another@example.com',
      };

      const anotherUserResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(anotherUser);

      const response = await request(app.getHttpServer())
        .post('/jobs')
        .set('Authorization', `Bearer ${anotherUserResponse.body.accessToken}`)
        .send({
          ...testJob,
          restaurantId, // This restaurant belongs to the first user
        })
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });

    it('should validate required fields', async () => {
      const incompleteJob = {
        title: testJob.title,
        // Missing required fields
      };

      const response = await request(app.getHttpServer())
        .post('/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...incompleteJob,
          restaurantId,
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should validate date format for validTill', async () => {
      const invalidDateJob = {
        ...testJob,
        validTill: 'invalid-date',
      };

      const response = await request(app.getHttpServer())
        .post('/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...invalidDateJob,
          restaurantId,
        })
        .expect(400);

      expect(response.body.message).toContain('date');
    });
  });

  describe('GET /jobs', () => {
    beforeEach(async () => {
      // Create multiple test jobs
      await prismaService.job.createMany({
        data: [
          {
            ...testJob,
            restaurantId,
            title: 'Job 1',
            status: JobStatus.OPEN,
            validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          {
            ...testJob,
            restaurantId,
            title: 'Job 2',
            status: JobStatus.OPEN,
            validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          {
            ...testJob,
            restaurantId,
            title: 'Expired Job',
            status: JobStatus.OPEN,
            validTill: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          },
          {
            ...testJob,
            restaurantId,
            title: 'Closed Job',
            status: JobStatus.CLOSED,
            validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        ],
      });
    });

    it('should return list of open and valid jobs', async () => {
      const response = await request(app.getHttpServer())
        .get('/jobs')
        .expect(200);

      expect(response.body).toHaveProperty('jobs');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body.jobs).toHaveLength(2); // Only Job 1 and Job 2 should be returned
      expect(response.body.jobs.every(job => job.status === JobStatus.OPEN)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/jobs?page=1&limit=1')
        .expect(200);

      expect(response.body.jobs).toHaveLength(1);
      expect(response.body.page).toBe(1);
      expect(response.body.totalPages).toBe(2);
    });

    it('should support filtering by location', async () => {
      const response = await request(app.getHttpServer())
        .get(`/jobs?location=${encodeURIComponent(testJob.location)}`)
        .expect(200);

      expect(response.body.jobs.every(job => job.location === testJob.location)).toBe(true);
    });

    it('should support filtering by job type', async () => {
      const response = await request(app.getHttpServer())
        .get('/jobs?type=FULL_TIME')
        .expect(200);

      expect(response.body.jobs.every(job => job.type === 'FULL_TIME')).toBe(true);
    });

    it('should support search functionality', async () => {
      const response = await request(app.getHttpServer())
        .get('/jobs?search=Job 1')
        .expect(200);

      expect(response.body.jobs).toHaveLength(1);
      expect(response.body.jobs[0].title).toContain('Job 1');
    });
  });

  describe('GET /jobs/:id', () => {
    let jobId: string;

    beforeEach(async () => {
      const job = await prismaService.job.create({
        data: {
          ...testJob,
          restaurantId,
          validTill: new Date(testJob.validTill),
        },
      });
      jobId = job.id;
    });

    it('should return job details by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/jobs/${jobId}`)
        .expect(200);

      expect(response.body.id).toBe(jobId);
      expect(response.body.title).toBe(testJob.title);
      expect(response.body).toHaveProperty('restaurant');
    });

    it('should return 404 for non-existent job', async () => {
      const response = await request(app.getHttpServer())
        .get('/jobs/non-existent-id')
        .expect(404);

      expect(response.body.message).toContain('not found');
    });
  });

  describe('PATCH /jobs/:id', () => {
    let jobId: string;

    beforeEach(async () => {
      const job = await prismaService.job.create({
        data: {
          ...testJob,
          restaurantId,
          validTill: new Date(testJob.validTill),
        },
      });
      jobId = job.id;
    });

    it('should update job successfully when user owns restaurant', async () => {
      const updateData = {
        title: 'Updated Job Title',
        salary: '$70,000 - $80,000',
      };

      const response = await request(app.getHttpServer())
        .patch(`/jobs/${jobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.salary).toBe(updateData.salary);

      // Verify update in database
      const dbJob = await prismaService.job.findUnique({
        where: { id: jobId },
      });
      expect(dbJob.title).toBe(updateData.title);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/jobs/${jobId}`)
        .send({ title: 'Updated Title' })
        .expect(401);

      expect(response.body.message).toBeDefined();
    });

    it('should return 403 when user does not own restaurant', async () => {
      // Create another user
      const anotherUser = {
        ...testUser,
        email: 'another2@example.com',
      };

      const anotherUserResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(anotherUser);

      const response = await request(app.getHttpServer())
        .patch(`/jobs/${jobId}`)
        .set('Authorization', `Bearer ${anotherUserResponse.body.accessToken}`)
        .send({ title: 'Updated Title' })
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });

    it('should return 404 for non-existent job', async () => {
      const response = await request(app.getHttpServer())
        .patch('/jobs/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Title' })
        .expect(404);

      expect(response.body.message).toContain('not found');
    });
  });

  describe('DELETE /jobs/:id', () => {
    let jobId: string;

    beforeEach(async () => {
      const job = await prismaService.job.create({
        data: {
          ...testJob,
          restaurantId,
          validTill: new Date(testJob.validTill),
        },
      });
      jobId = job.id;
    });

    it('should delete job successfully when user owns restaurant', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/jobs/${jobId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toContain('deleted');

      // Verify deletion in database
      const dbJob = await prismaService.job.findUnique({
        where: { id: jobId },
      });
      expect(dbJob).toBeNull();
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/jobs/${jobId}`)
        .expect(401);

      expect(response.body.message).toBeDefined();
    });

    it('should return 403 when user does not own restaurant', async () => {
      // Create another user
      const anotherUser = {
        ...testUser,
        email: 'another3@example.com',
      };

      const anotherUserResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(anotherUser);

      const response = await request(app.getHttpServer())
        .delete(`/jobs/${jobId}`)
        .set('Authorization', `Bearer ${anotherUserResponse.body.accessToken}`)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('POST /jobs/:id/apply', () => {
    let jobId: string;
    let applicantToken: string;

    beforeEach(async () => {
      // Create job
      const job = await prismaService.job.create({
        data: {
          ...testJob,
          restaurantId,
          validTill: new Date(testJob.validTill),
        },
      });
      jobId = job.id;

      // Create applicant user
      const applicant = {
        email: 'applicant@example.com',
        password: 'password123',
        firstName: 'Job',
        lastName: 'Applicant',
        phone: '+1234567890',
        role: 'CUSTOMER',
      };

      const applicantResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(applicant);

      applicantToken = applicantResponse.body.accessToken;
    });

    it('should apply for job successfully', async () => {
      const applicationData = {
        coverLetter: 'I am very interested in this position',
        resume: 'https://example.com/resume.pdf',
      };

      const response = await request(app.getHttpServer())
        .post(`/jobs/${jobId}/apply`)
        .set('Authorization', `Bearer ${applicantToken}`)
        .send(applicationData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.coverLetter).toBe(applicationData.coverLetter);
      expect(response.body.status).toBe('PENDING');

      // Verify application in database
      const dbApplication = await prismaService.jobApplication.findUnique({
        where: { id: response.body.id },
      });
      expect(dbApplication).toBeTruthy();
    });

    it('should prevent duplicate applications', async () => {
      const applicationData = {
        coverLetter: 'I am very interested in this position',
        resume: 'https://example.com/resume.pdf',
      };

      // First application
      await request(app.getHttpServer())
        .post(`/jobs/${jobId}/apply`)
        .set('Authorization', `Bearer ${applicantToken}`)
        .send(applicationData)
        .expect(201);

      // Second application should fail
      const response = await request(app.getHttpServer())
        .post(`/jobs/${jobId}/apply`)
        .set('Authorization', `Bearer ${applicantToken}`)
        .send(applicationData)
        .expect(400);

      expect(response.body.message).toContain('already applied');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app.getHttpServer())
        .post(`/jobs/${jobId}/apply`)
        .send({
          coverLetter: 'Test cover letter',
          resume: 'https://example.com/resume.pdf',
        })
        .expect(401);

      expect(response.body.message).toBeDefined();
    });

    it('should return 404 for non-existent job', async () => {
      const response = await request(app.getHttpServer())
        .post('/jobs/non-existent-id/apply')
        .set('Authorization', `Bearer ${applicantToken}`)
        .send({
          coverLetter: 'Test cover letter',
          resume: 'https://example.com/resume.pdf',
        })
        .expect(404);

      expect(response.body.message).toContain('not found');
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle concurrent job creation requests', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        request(app.getHttpServer())
          .post('/jobs')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            ...testJob,
            title: `Concurrent Job ${i}`,
            restaurantId,
          })
      );

      const responses = await Promise.allSettled(promises);

      // All requests should succeed
      const successfulResponses = responses.filter(
        (response) =>
          response.status === 'fulfilled' && response.value.status === 201
      );

      expect(successfulResponses.length).toBe(10);
    });

    it('should handle large job listings efficiently', async () => {
      // Create many jobs
      const jobs = Array.from({ length: 100 }, (_, i) => ({
        ...testJob,
        title: `Large Dataset Job ${i}`,
        restaurantId,
        validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }));

      await prismaService.job.createMany({ data: jobs });

      const startTime = Date.now();
      const response = await request(app.getHttpServer())
        .get('/jobs?page=1&limit=20')
        .expect(200);

      const responseTime = Date.now() - startTime;

      expect(response.body.jobs).toHaveLength(20);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });
  });

  describe('Data Validation and Security', () => {
    it('should sanitize input data', async () => {
      const maliciousJob = {
        ...testJob,
        title: '<script>alert("xss")</script>Malicious Job',
        description: '<img src="x" onerror="alert(1)">Description',
      };

      const response = await request(app.getHttpServer())
        .post('/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...maliciousJob,
          restaurantId,
        })
        .expect(201);

      // Should not contain script tags
      expect(response.body.title).not.toContain('<script>');
      expect(response.body.description).not.toContain('<img');
    });

    it('should prevent SQL injection attempts', async () => {
      const sqlInjectionAttempt = {
        ...testJob,
        title: "'; DROP TABLE jobs; --",
      };

      const response = await request(app.getHttpServer())
        .post('/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...sqlInjectionAttempt,
          restaurantId,
        })
        .expect(201);

      // Table should still exist
      const jobsCount = await prismaService.job.count();
      expect(jobsCount).toBeGreaterThan(0);
    });
  });
});