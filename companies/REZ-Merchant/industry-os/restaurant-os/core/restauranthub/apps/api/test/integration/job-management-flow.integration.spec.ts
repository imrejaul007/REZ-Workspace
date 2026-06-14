import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Job Management Flow Integration Tests', () => {
  let app: INestApplication;
  let httpServer: any;
  let prismaService: PrismaService;

  // Test users
  let employerTokens: any;
  let employerUserId: string;
  let jobSeekerTokens: any;
  let jobSeekerUserId: string;
  let adminTokens: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = app.get<PrismaService>(PrismaService);

    await app.init();
    httpServer = app.getHttpServer();

    // Setup test users
    await setupTestUsers();
  });

  afterAll(async () => {
    // Clean up test data
    await prismaService.jobApplication.deleteMany({
      where: {
        job: {
          createdBy: {
            email: {
              contains: 'job-integration-test',
            },
          },
        },
      },
    });

    await prismaService.job.deleteMany({
      where: {
        createdBy: {
          email: {
            contains: 'job-integration-test',
          },
        },
      },
    });

    await prismaService.user.deleteMany({
      where: {
        email: {
          contains: 'job-integration-test',
        },
      },
    });

    await app.close();
  });

  async function setupTestUsers() {
    // Create employer
    const employerData = {
      email: `employer-job-integration-test-${Date.now()}@example.com`,
      password: 'EmployerTest123!',
      firstName: 'Test',
      lastName: 'Employer',
      phone: '+1234567890',
      role: 'EMPLOYER',
    };

    const employerResponse = await request(httpServer)
      .post('/auth/register')
      .send({
        ...employerData,
        confirmPassword: employerData.password,
        agreeToTerms: true,
        agreeToPrivacy: true,
      });

    employerUserId = employerResponse.body.data.user.id;

    const employerLogin = await request(httpServer)
      .post('/auth/login')
      .send({
        email: employerData.email,
        password: employerData.password,
      });

    employerTokens = employerLogin.body.data;

    // Create job seeker
    const jobSeekerData = {
      email: `jobseeker-job-integration-test-${Date.now()}@example.com`,
      password: 'JobSeekerTest123!',
      firstName: 'Test',
      lastName: 'JobSeeker',
      phone: '+1987654321',
      role: 'JOB_SEEKER',
    };

    const jobSeekerResponse = await request(httpServer)
      .post('/auth/register')
      .send({
        ...jobSeekerData,
        confirmPassword: jobSeekerData.password,
        agreeToTerms: true,
        agreeToPrivacy: true,
      });

    jobSeekerUserId = jobSeekerResponse.body.data.user.id;

    const jobSeekerLogin = await request(httpServer)
      .post('/auth/login')
      .send({
        email: jobSeekerData.email,
        password: jobSeekerData.password,
      });

    jobSeekerTokens = jobSeekerLogin.body.data;

    // Create admin user
    const adminData = {
      email: `admin-job-integration-test-${Date.now()}@example.com`,
      password: 'AdminTest123!',
      firstName: 'Test',
      lastName: 'Admin',
      phone: '+1555666777',
      role: 'ADMIN',
    };

    await request(httpServer)
      .post('/auth/register')
      .send({
        ...adminData,
        confirmPassword: adminData.password,
        agreeToTerms: true,
        agreeToPrivacy: true,
      });

    const adminLogin = await request(httpServer)
      .post('/auth/login')
      .send({
        email: adminData.email,
        password: adminData.password,
      });

    adminTokens = adminLogin.body.data;
  }

  describe('Complete Job Creation → Application → Hiring Flow', () => {
    let createdJobId: string;
    let applicationId: string;

    it('should allow employer to create a new job posting', async () => {
      const jobData = {
        title: 'Senior Restaurant Manager',
        description: 'Looking for an experienced restaurant manager to lead our team.',
        type: 'FULL_TIME',
        location: 'New York, NY',
        salary: {
          min: 60000,
          max: 80000,
          currency: 'USD',
        },
        requirements: [
          '5+ years of restaurant management experience',
          'Strong leadership skills',
          'Knowledge of food safety regulations',
        ],
        benefits: [
          'Health insurance',
          'Paid time off',
          '401k matching',
        ],
        category: 'MANAGEMENT',
        experienceLevel: 'SENIOR',
        isRemote: false,
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      };

      const createJobResponse = await request(httpServer)
        .post('/jobs')
        .set('Authorization', `Bearer ${employerTokens.accessToken}`)
        .send(jobData)
        .expect(201);

      expect(createJobResponse.body).toHaveProperty('success', true);
      expect(createJobResponse.body.data).toHaveProperty('id');
      expect(createJobResponse.body.data.title).toBe(jobData.title);
      expect(createJobResponse.body.data.status).toBe('ACTIVE');
      expect(createJobResponse.body.data.createdBy.id).toBe(employerUserId);

      createdJobId = createJobResponse.body.data.id;

      // Verify job exists in database
      const dbJob = await prismaService.job.findUnique({
        where: { id: createdJobId },
        include: { createdBy: true },
      });

      expect(dbJob).toBeTruthy();
      expect(dbJob?.title).toBe(jobData.title);
      expect(dbJob?.createdBy.id).toBe(employerUserId);
    });

    it('should list jobs publicly without authentication', async () => {
      const jobsResponse = await request(httpServer)
        .get('/jobs')
        .expect(200);

      expect(jobsResponse.body).toHaveProperty('success', true);
      expect(jobsResponse.body.data).toBeInstanceOf(Array);

      // Should include our created job
      const ourJob = jobsResponse.body.data.find((job: any) => job.id === createdJobId);
      expect(ourJob).toBeTruthy();
      expect(ourJob.status).toBe('ACTIVE');
    });

    it('should filter jobs by various criteria', async () => {
      // Filter by type
      const fullTimeJobsResponse = await request(httpServer)
        .get('/jobs?type=FULL_TIME')
        .expect(200);

      expect(fullTimeJobsResponse.body.data.every((job: any) => job.type === 'FULL_TIME')).toBe(true);

      // Filter by location
      const nyJobsResponse = await request(httpServer)
        .get('/jobs?location=New York')
        .expect(200);

      expect(nyJobsResponse.body.data.some((job: any) => job.location.includes('New York'))).toBe(true);

      // Filter by salary range
      const salaryFilterResponse = await request(httpServer)
        .get('/jobs?minSalary=50000&maxSalary=90000')
        .expect(200);

      expect(salaryFilterResponse.body.data).toBeInstanceOf(Array);
    });

    it('should allow job seeker to view job details', async () => {
      const jobDetailsResponse = await request(httpServer)
        .get(`/jobs/${createdJobId}`)
        .set('Authorization', `Bearer ${jobSeekerTokens.accessToken}`)
        .expect(200);

      expect(jobDetailsResponse.body).toHaveProperty('success', true);
      expect(jobDetailsResponse.body.data.id).toBe(createdJobId);
      expect(jobDetailsResponse.body.data).toHaveProperty('requirements');
      expect(jobDetailsResponse.body.data).toHaveProperty('benefits');
      expect(jobDetailsResponse.body.data).toHaveProperty('createdBy');
    });

    it('should allow job seeker to apply for the job', async () => {
      const applicationData = {
        coverLetter: 'I am very interested in this position and believe my experience makes me a great fit.',
        resume: 'https://example.com/resume.pdf', // In real scenario, this would be uploaded
        availability: 'IMMEDIATE',
        expectedSalary: 70000,
      };

      const applyResponse = await request(httpServer)
        .post(`/jobs/${createdJobId}/apply`)
        .set('Authorization', `Bearer ${jobSeekerTokens.accessToken}`)
        .send(applicationData)
        .expect(201);

      expect(applyResponse.body).toHaveProperty('success', true);
      expect(applyResponse.body.data).toHaveProperty('id');
      expect(applyResponse.body.data.status).toBe('PENDING');
      expect(applyResponse.body.data.jobId).toBe(createdJobId);
      expect(applyResponse.body.data.applicantId).toBe(jobSeekerUserId);

      applicationId = applyResponse.body.data.id;

      // Verify application exists in database
      const dbApplication = await prismaService.jobApplication.findUnique({
        where: { id: applicationId },
        include: { applicant: true, job: true },
      });

      expect(dbApplication).toBeTruthy();
      expect(dbApplication?.applicant.id).toBe(jobSeekerUserId);
      expect(dbApplication?.job.id).toBe(createdJobId);
    });

    it('should prevent duplicate applications', async () => {
      const duplicateApplication = await request(httpServer)
        .post(`/jobs/${createdJobId}/apply`)
        .set('Authorization', `Bearer ${jobSeekerTokens.accessToken}`)
        .send({
          coverLetter: 'Attempting to apply again',
        })
        .expect(409);

      expect(duplicateApplication.body).toHaveProperty('success', false);
      expect(duplicateApplication.body.message).toMatch(/already.*applied/i);
    });

    it('should allow employer to view job applications', async () => {
      const applicationsResponse = await request(httpServer)
        .get(`/jobs/${createdJobId}/applications`)
        .set('Authorization', `Bearer ${employerTokens.accessToken}`)
        .expect(200);

      expect(applicationsResponse.body).toHaveProperty('success', true);
      expect(applicationsResponse.body.data).toBeInstanceOf(Array);
      expect(applicationsResponse.body.data.length).toBeGreaterThan(0);

      const ourApplication = applicationsResponse.body.data.find((app: any) => app.id === applicationId);
      expect(ourApplication).toBeTruthy();
      expect(ourApplication.applicant.id).toBe(jobSeekerUserId);
    });

    it('should allow employer to update application status', async () => {
      const statusUpdateResponse = await request(httpServer)
        .put(`/jobs/${createdJobId}/applications/${applicationId}`)
        .set('Authorization', `Bearer ${employerTokens.accessToken}`)
        .send({
          status: 'UNDER_REVIEW',
          notes: 'Candidate looks promising, scheduling interview.',
        })
        .expect(200);

      expect(statusUpdateResponse.body).toHaveProperty('success', true);
      expect(statusUpdateResponse.body.data.status).toBe('UNDER_REVIEW');

      // Verify in database
      const updatedApplication = await prismaService.jobApplication.findUnique({
        where: { id: applicationId },
      });

      expect(updatedApplication?.status).toBe('UNDER_REVIEW');
    });

    it('should allow job seeker to view their application status', async () => {
      const myApplicationsResponse = await request(httpServer)
        .get('/users/applications')
        .set('Authorization', `Bearer ${jobSeekerTokens.accessToken}`)
        .expect(200);

      expect(myApplicationsResponse.body).toHaveProperty('success', true);
      expect(myApplicationsResponse.body.data).toBeInstanceOf(Array);

      const ourApplication = myApplicationsResponse.body.data.find((app: any) => app.id === applicationId);
      expect(ourApplication).toBeTruthy();
      expect(ourApplication.status).toBe('UNDER_REVIEW');
    });

    it('should allow employer to accept application', async () => {
      const acceptResponse = await request(httpServer)
        .put(`/jobs/${createdJobId}/applications/${applicationId}`)
        .set('Authorization', `Bearer ${employerTokens.accessToken}`)
        .send({
          status: 'ACCEPTED',
          notes: 'Congratulations! We would like to offer you the position.',
        })
        .expect(200);

      expect(acceptResponse.body).toHaveProperty('success', true);
      expect(acceptResponse.body.data.status).toBe('ACCEPTED');

      // When an application is accepted, job status might change
      const updatedJobResponse = await request(httpServer)
        .get(`/jobs/${createdJobId}`)
        .set('Authorization', `Bearer ${employerTokens.accessToken}`);

      // Job might be marked as filled or remain active depending on business logic
      expect(['ACTIVE', 'FILLED']).toContain(updatedJobResponse.body.data.status);
    });
  });

  describe('Job Management and Administration', () => {
    let managementJobId: string;

    it('should allow employer to create job with advanced settings', async () => {
      const advancedJobData = {
        title: 'Head Chef - Fine Dining',
        description: 'Seeking an experienced head chef for upscale restaurant.',
        type: 'FULL_TIME',
        location: 'San Francisco, CA',
        salary: {
          min: 80000,
          max: 120000,
          currency: 'USD',
        },
        requirements: [
          '10+ years culinary experience',
          'Culinary arts degree preferred',
          'Experience in fine dining establishments',
        ],
        benefits: ['Health insurance', 'Paid vacation', 'Professional development'],
        category: 'KITCHEN',
        experienceLevel: 'EXECUTIVE',
        isRemote: false,
        isUrgent: true,
        screeningQuestions: [
          'Describe your fine dining experience',
          'What is your management philosophy?',
        ],
        applicationDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
      };

      const createResponse = await request(httpServer)
        .post('/jobs')
        .set('Authorization', `Bearer ${employerTokens.accessToken}`)
        .send(advancedJobData)
        .expect(201);

      managementJobId = createResponse.body.data.id;
      expect(createResponse.body.data.isUrgent).toBe(true);
      expect(createResponse.body.data.screeningQuestions).toEqual(advancedJobData.screeningQuestions);
    });

    it('should allow employer to update job posting', async () => {
      const updateData = {
        title: 'Executive Head Chef - Fine Dining',
        salary: {
          min: 85000,
          max: 130000,
          currency: 'USD',
        },
        description: 'Updated description with more details about the role.',
      };

      const updateResponse = await request(httpServer)
        .put(`/jobs/${managementJobId}`)
        .set('Authorization', `Bearer ${employerTokens.accessToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.data.title).toBe(updateData.title);
      expect(updateResponse.body.data.salary.min).toBe(updateData.salary.min);
    });

    it('should allow employer to pause and reactivate job', async () => {
      // Pause job
      const pauseResponse = await request(httpServer)
        .put(`/jobs/${managementJobId}`)
        .set('Authorization', `Bearer ${employerTokens.accessToken}`)
        .send({ status: 'PAUSED' })
        .expect(200);

      expect(pauseResponse.body.data.status).toBe('PAUSED');

      // Paused jobs should not appear in public listings
      const publicJobsResponse = await request(httpServer)
        .get('/jobs')
        .expect(200);

      const pausedJob = publicJobsResponse.body.data.find((job: any) => job.id === managementJobId);
      expect(pausedJob).toBeUndefined();

      // Reactivate job
      const reactivateResponse = await request(httpServer)
        .put(`/jobs/${managementJobId}`)
        .set('Authorization', `Bearer ${employerTokens.accessToken}`)
        .send({ status: 'ACTIVE' })
        .expect(200);

      expect(reactivateResponse.body.data.status).toBe('ACTIVE');
    });

    it('should allow employer to view job analytics', async () => {
      const analyticsResponse = await request(httpServer)
        .get(`/jobs/${managementJobId}/analytics`)
        .set('Authorization', `Bearer ${employerTokens.accessToken}`)
        .expect(200);

      expect(analyticsResponse.body).toHaveProperty('success', true);
      expect(analyticsResponse.body.data).toHaveProperty('views');
      expect(analyticsResponse.body.data).toHaveProperty('applications');
      expect(analyticsResponse.body.data).toHaveProperty('applicationsToday');
      expect(analyticsResponse.body.data).toHaveProperty('averageTimeToApply');
    });

    it('should allow employer to delete job posting', async () => {
      // Create a job specifically for deletion
      const deleteJobResponse = await request(httpServer)
        .post('/jobs')
        .set('Authorization', `Bearer ${employerTokens.accessToken}`)
        .send({
          title: 'Job to Delete',
          description: 'This job will be deleted',
          type: 'PART_TIME',
          location: 'Remote',
        });

      const deleteJobId = deleteJobResponse.body.data.id;

      // Delete the job
      const deleteResponse = await request(httpServer)
        .delete(`/jobs/${deleteJobId}`)
        .set('Authorization', `Bearer ${employerTokens.accessToken}`)
        .expect(200);

      expect(deleteResponse.body).toHaveProperty('success', true);

      // Verify job is deleted
      const getDeletedJobResponse = await request(httpServer)
        .get(`/jobs/${deleteJobId}`)
        .expect(404);

      expect(getDeletedJobResponse.body).toHaveProperty('success', false);
    });
  });

  describe('Job Search and Filtering', () => {
    beforeAll(async () => {
      // Create multiple jobs for testing search functionality
      const testJobs = [
        {
          title: 'Sous Chef',
          description: 'Experienced sous chef needed',
          type: 'FULL_TIME',
          location: 'Los Angeles, CA',
          category: 'KITCHEN',
          experienceLevel: 'MID',
          salary: { min: 45000, max: 60000, currency: 'USD' },
        },
        {
          title: 'Server',
          description: 'Friendly server for busy restaurant',
          type: 'PART_TIME',
          location: 'Chicago, IL',
          category: 'SERVICE',
          experienceLevel: 'ENTRY',
          salary: { min: 25000, max: 35000, currency: 'USD' },
        },
        {
          title: 'Restaurant Manager',
          description: 'Lead our restaurant team',
          type: 'FULL_TIME',
          location: 'Remote',
          category: 'MANAGEMENT',
          experienceLevel: 'SENIOR',
          isRemote: true,
          salary: { min: 55000, max: 75000, currency: 'USD' },
        },
      ];

      for (const jobData of testJobs) {
        await request(httpServer)
          .post('/jobs')
          .set('Authorization', `Bearer ${employerTokens.accessToken}`)
          .send(jobData);
      }
    });

    it('should search jobs by title', async () => {
      const searchResponse = await request(httpServer)
        .get('/jobs?search=chef')
        .expect(200);

      expect(searchResponse.body.data.length).toBeGreaterThan(0);
      expect(searchResponse.body.data.some((job: any) => job.title.toLowerCase().includes('chef'))).toBe(true);
    });

    it('should filter by multiple criteria', async () => {
      const filterResponse = await request(httpServer)
        .get('/jobs?type=FULL_TIME&category=KITCHEN&experienceLevel=MID')
        .expect(200);

      expect(filterResponse.body.data.every((job: any) =>
        job.type === 'FULL_TIME' &&
        job.category === 'KITCHEN'
      )).toBe(true);
    });

    it('should sort jobs by creation date', async () => {
      const sortedResponse = await request(httpServer)
        .get('/jobs?sortBy=createdAt&sortOrder=desc')
        .expect(200);

      const jobs = sortedResponse.body.data;
      for (let i = 1; i < jobs.length; i++) {
        const prevDate = new Date(jobs[i - 1].createdAt);
        const currDate = new Date(jobs[i].createdAt);
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
      }
    });

    it('should paginate job results', async () => {
      const page1Response = await request(httpServer)
        .get('/jobs?page=1&limit=2')
        .expect(200);

      expect(page1Response.body.data.length).toBeLessThanOrEqual(2);
      expect(page1Response.body).toHaveProperty('meta');
      expect(page1Response.body.meta).toHaveProperty('total');
      expect(page1Response.body.meta).toHaveProperty('page', 1);
      expect(page1Response.body.meta).toHaveProperty('limit', 2);

      if (page1Response.body.meta.total > 2) {
        const page2Response = await request(httpServer)
          .get('/jobs?page=2&limit=2')
          .expect(200);

        expect(page2Response.body.meta).toHaveProperty('page', 2);
        // Results should be different from page 1
        const page1Ids = page1Response.body.data.map((job: any) => job.id);
        const page2Ids = page2Response.body.data.map((job: any) => job.id);
        expect(page1Ids.some((id: string) => page2Ids.includes(id))).toBe(false);
      }
    });

    it('should filter by remote work option', async () => {
      const remoteJobsResponse = await request(httpServer)
        .get('/jobs?isRemote=true')
        .expect(200);

      expect(remoteJobsResponse.body.data.every((job: any) => job.isRemote === true)).toBe(true);
    });
  });

  describe('Application Management', () => {
    let testJobId: string;
    let testApplicationId: string;

    beforeAll(async () => {
      // Create a job for application testing
      const jobResponse = await request(httpServer)
        .post('/jobs')
        .set('Authorization', `Bearer ${employerTokens.accessToken}`)
        .send({
          title: 'Application Test Job',
          description: 'For testing applications',
          type: 'FULL_TIME',
          location: 'Test City',
        });

      testJobId = jobResponse.body.data.id;
    });

    it('should handle application with screening questions', async () => {
      const applicationData = {
        coverLetter: 'Application with screening answers',
        screeningAnswers: [
          'I have 8 years of experience in fine dining',
          'My management philosophy is collaborative leadership',
        ],
      };

      const applyResponse = await request(httpServer)
        .post(`/jobs/${testJobId}/apply`)
        .set('Authorization', `Bearer ${jobSeekerTokens.accessToken}`)
        .send(applicationData)
        .expect(201);

      testApplicationId = applyResponse.body.data.id;
      expect(applyResponse.body.data).toHaveProperty('screeningAnswers');
    });

    it('should allow employer to bulk update application statuses', async () => {
      // Create additional applications for bulk testing
      const additionalApplications = [];

      // Create more test users and applications
      for (let i = 0; i < 3; i++) {
        const testUserResponse = await request(httpServer)
          .post('/auth/register')
          .send({
            email: `bulk-test-${i}-${Date.now()}@example.com`,
            password: 'BulkTest123!',
            confirmPassword: 'BulkTest123!',
            firstName: `Bulk${i}`,
            lastName: 'Test',
            phone: `+15551234${i}`,
            role: 'JOB_SEEKER',
            agreeToTerms: true,
            agreeToPrivacy: true,
          });

        const loginResponse = await request(httpServer)
          .post('/auth/login')
          .send({
            email: `bulk-test-${i}-${Date.now()}@example.com`,
            password: 'BulkTest123!',
          });

        const appResponse = await request(httpServer)
          .post(`/jobs/${testJobId}/apply`)
          .set('Authorization', `Bearer ${loginResponse.body.data.accessToken}`)
          .send({
            coverLetter: `Bulk application ${i}`,
          });

        additionalApplications.push(appResponse.body.data.id);
      }

      // Bulk update application statuses
      const bulkUpdateResponse = await request(httpServer)
        .put(`/jobs/${testJobId}/applications/bulk`)
        .set('Authorization', `Bearer ${employerTokens.accessToken}`)
        .send({
          applicationIds: additionalApplications,
          status: 'REJECTED',
          notes: 'Thank you for your interest. We have decided to move forward with other candidates.',
        })
        .expect(200);

      expect(bulkUpdateResponse.body).toHaveProperty('success', true);
      expect(bulkUpdateResponse.body.data.updated).toBe(additionalApplications.length);
    });

    it('should generate application reports for employers', async () => {
      const reportResponse = await request(httpServer)
        .get(`/jobs/${testJobId}/applications/report`)
        .set('Authorization', `Bearer ${employerTokens.accessToken}`)
        .expect(200);

      expect(reportResponse.body).toHaveProperty('success', true);
      expect(reportResponse.body.data).toHaveProperty('totalApplications');
      expect(reportResponse.body.data).toHaveProperty('statusBreakdown');
      expect(reportResponse.body.data).toHaveProperty('averageResponseTime');
      expect(reportResponse.body.data).toHaveProperty('topSources');
    });
  });

  describe('Job Permissions and Security', () => {
    it('should prevent non-employers from creating jobs', async () => {
      const jobData = {
        title: 'Unauthorized Job',
        description: 'This should fail',
        type: 'FULL_TIME',
        location: 'Nowhere',
      };

      const unauthorizedResponse = await request(httpServer)
        .post('/jobs')
        .set('Authorization', `Bearer ${jobSeekerTokens.accessToken}`)
        .send(jobData)
        .expect(403);

      expect(unauthorizedResponse.body).toHaveProperty('success', false);
      expect(unauthorizedResponse.body.message).toMatch(/permission|unauthorized/i);
    });

    it('should prevent unauthorized job modifications', async () => {
      // Create job with one employer
      const jobResponse = await request(httpServer)
        .post('/jobs')
        .set('Authorization', `Bearer ${employerTokens.accessToken}`)
        .send({
          title: 'Protected Job',
          description: 'Only creator should modify this',
          type: 'FULL_TIME',
          location: 'Secure Location',
        });

      const jobId = jobResponse.body.data.id;

      // Try to modify with different user
      const unauthorizedUpdate = await request(httpServer)
        .put(`/jobs/${jobId}`)
        .set('Authorization', `Bearer ${jobSeekerTokens.accessToken}`)
        .send({
          title: 'Hacked Job Title',
        })
        .expect(403);

      expect(unauthorizedUpdate.body).toHaveProperty('success', false);
    });

    it('should prevent unauthorized access to applications', async () => {
      const unauthorizedAppsResponse = await request(httpServer)
        .get(`/jobs/invalid-job-id/applications`)
        .set('Authorization', `Bearer ${jobSeekerTokens.accessToken}`)
        .expect(403);

      expect(unauthorizedAppsResponse.body).toHaveProperty('success', false);
    });

    it('should validate job data input', async () => {
      const invalidJobData = [
        { title: '', description: 'No title' },
        { title: 'Valid Title' }, // No description
        { title: 'Valid Title', description: 'Valid Description', type: 'INVALID_TYPE' },
        { title: 'A'.repeat(1000), description: 'Too long title' }, // Title too long
      ];

      for (const invalidData of invalidJobData) {
        const response = await request(httpServer)
          .post('/jobs')
          .set('Authorization', `Bearer ${employerTokens.accessToken}`)
          .send(invalidData)
          .expect(400);

        expect(response.body).toHaveProperty('success', false);
      }
    });
  });

  describe('Job Notifications and Communications', () => {
    it('should handle application notifications', async () => {
      // This test would typically involve checking that notifications are sent
      // For now, we'll verify the endpoint structure
      const notificationsResponse = await request(httpServer)
        .get('/users/notifications')
        .set('Authorization', `Bearer ${employerTokens.accessToken}`)
        .expect(200);

      expect(notificationsResponse.body).toHaveProperty('success', true);
      expect(notificationsResponse.body.data).toBeInstanceOf(Array);
    });

    it('should mark notifications as read', async () => {
      const markReadResponse = await request(httpServer)
        .put('/users/notifications/mark-read')
        .set('Authorization', `Bearer ${jobSeekerTokens.accessToken}`)
        .send({ notificationIds: ['test-notification-id'] })
        .expect(200);

      expect(markReadResponse.body).toHaveProperty('success', true);
    });
  });

  describe('Admin Job Management', () => {
    it('should allow admin to view all jobs', async () => {
      const adminJobsResponse = await request(httpServer)
        .get('/admin/jobs')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      expect(adminJobsResponse.body).toHaveProperty('success', true);
      expect(adminJobsResponse.body.data).toBeInstanceOf(Array);
    });

    it('should allow admin to moderate job postings', async () => {
      // Create a job for moderation
      const jobResponse = await request(httpServer)
        .post('/jobs')
        .set('Authorization', `Bearer ${employerTokens.accessToken}`)
        .send({
          title: 'Job Needing Moderation',
          description: 'This job needs admin review',
          type: 'FULL_TIME',
          location: 'Admin Review Location',
        });

      const jobId = jobResponse.body.data.id;

      // Admin moderates the job
      const moderateResponse = await request(httpServer)
        .put(`/admin/jobs/${jobId}/moderate`)
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .send({
          status: 'APPROVED',
          moderationNotes: 'Job posting approved after review',
        })
        .expect(200);

      expect(moderateResponse.body).toHaveProperty('success', true);
      expect(moderateResponse.body.data.moderationStatus).toBe('APPROVED');
    });

    it('should provide admin dashboard statistics', async () => {
      const statsResponse = await request(httpServer)
        .get('/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminTokens.accessToken}`)
        .expect(200);

      expect(statsResponse.body).toHaveProperty('success', true);
      expect(statsResponse.body.data).toHaveProperty('totalJobs');
      expect(statsResponse.body.data).toHaveProperty('activeJobs');
      expect(statsResponse.body.data).toHaveProperty('totalApplications');
      expect(statsResponse.body.data).toHaveProperty('newJobsToday');
    });
  });
});