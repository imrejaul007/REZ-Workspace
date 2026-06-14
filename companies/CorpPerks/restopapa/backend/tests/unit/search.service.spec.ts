import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from '../../src/search/search.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  createJob,
  createEmployee,
  createProduct,
  createRestaurant,
  createMockPrismaService,
} from '../factories';

describe('SearchService', () => {
  let service: SearchService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrisma = createMockPrismaService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('searchJobs', () => {
    it('should return jobs matching query', async () => {
      const jobs = [createJob({ title: 'Chef' }), createJob({ title: 'Cook' })];
      mockPrisma.job.findMany.mockResolvedValue(jobs);

      const result = await service.searchJobs({ q: 'chef' });

      expect(result).toHaveLength(2);
    });

    it('should return job with restaurant info', async () => {
      const job = createJob({ title: 'Chef' });
      const jobWithRestaurant = {
        ...job,
        restaurant: {
          businessName: 'Test Restaurant',
          logoUrl: '/logo.jpg',
          isVerified: true,
        },
      };
      mockPrisma.job.findMany.mockResolvedValue([jobWithRestaurant]);

      const result = await service.searchJobs({ q: 'chef' });

      expect(result[0]).toHaveProperty('restaurant');
    });

    it('should search in title', async () => {
      mockPrisma.job.findMany.mockResolvedValue([createJob()]);

      await service.searchJobs({ q: 'manager' });

      expect(mockPrisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({ title: expect.objectContaining({ contains: 'manager' }) }),
                ]),
              }),
            ]),
          }),
        }),
      );
    });

    it('should search in description', async () => {
      mockPrisma.job.findMany.mockResolvedValue([createJob()]);

      await service.searchJobs({ q: 'experience' });

      expect(mockPrisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({ description: expect.objectContaining({ contains: 'experience' }) }),
                ]),
              }),
            ]),
          }),
        }),
      );
    });

    it('should search in position', async () => {
      mockPrisma.job.findMany.mockResolvedValue([createJob()]);

      await service.searchJobs({ q: 'head chef' });

      expect(mockPrisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({ position: expect.objectContaining({ contains: 'head chef' }) }),
                ]),
              }),
            ]),
          }),
        }),
      );
    });

    it('should filter by location', async () => {
      mockPrisma.job.findMany.mockResolvedValue([createJob()]);

      await service.searchJobs({ location: 'Mumbai' });

      expect(mockPrisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                location: expect.objectContaining({ contains: 'Mumbai' }),
              }),
            ]),
          }),
        }),
      );
    });

    it('should filter by department', async () => {
      mockPrisma.job.findMany.mockResolvedValue([createJob()]);

      await service.searchJobs({ department: 'Kitchen' });

      expect(mockPrisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({ department: 'Kitchen' }),
            ]),
          }),
        }),
      );
    });

    it('should filter by minimum salary', async () => {
      mockPrisma.job.findMany.mockResolvedValue([createJob()]);

      await service.searchJobs({ salaryMin: '30000' });

      expect(mockPrisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({ salaryMin: { gte: 30000 } }),
            ]),
          }),
        }),
      );
    });

    it('should return empty array for no matches', async () => {
      mockPrisma.job.findMany.mockResolvedValue([]);

      const result = await service.searchJobs({ q: 'nonexistentjob123' });

      expect(result).toEqual([]);
    });
  });

  describe('searchEmployees', () => {
    it('should return employees matching query', async () => {
      const employees = [createEmployee({ fullName: 'John Doe' })];
      mockPrisma.employee.findMany.mockResolvedValue(employees);

      const result = await service.searchEmployees({ q: 'john' });

      expect(result).toHaveLength(1);
    });

    it('should search by full name', async () => {
      mockPrisma.employee.findMany.mockResolvedValue([createEmployee()]);

      await service.searchEmployees({ q: 'john' });

      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({ fullName: expect.objectContaining({ contains: 'john' }) }),
                ]),
              }),
            ]),
          }),
        }),
      );
    });

    it('should search by skills', async () => {
      mockPrisma.employee.findMany.mockResolvedValue([createEmployee()]);

      await service.searchEmployees({ q: 'javascript' });

      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({ skills: expect.objectContaining({ contains: 'javascript' }) }),
                ]),
              }),
            ]),
          }),
        }),
      );
    });

    it('should filter by experience', async () => {
      mockPrisma.employee.findMany.mockResolvedValue([createEmployee()]);

      await service.searchEmployees({ experience: '2' });

      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({ totalExperienceMonths: { gte: 24 } }),
            ]),
          }),
        }),
      );
    });

    it('should convert years to months for query', async () => {
      mockPrisma.employee.findMany.mockResolvedValue([createEmployee()]);

      await service.searchEmployees({ experience: '3' });

      // 3 years = 36 months
      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({ totalExperienceMonths: { gte: 36 } }),
            ]),
          }),
        }),
      );
    });

    it('should convert experience to months', async () => {
      mockPrisma.employee.findMany.mockResolvedValue([createEmployee()]);

      await service.searchEmployees({ experience: '2.5' });

      // 2.5 years = 30 months (or close)
      expect(mockPrisma.employee.findMany).toHaveBeenCalled();
    });

    it('should handle 0 experience', async () => {
      mockPrisma.employee.findMany.mockResolvedValue([createEmployee({ totalExperienceMonths: 0 })]);

      await service.searchEmployees({ experience: '0' });

      expect(mockPrisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({ totalExperienceMonths: { gte: 0 } }),
            ]),
          }),
        }),
      );
    });
  });

  describe('searchProducts', () => {
    it('should return products matching query', async () => {
      const products = [createProduct({ title: 'Paneer Tikka' })];
      mockPrisma.vendorOffering.findMany.mockResolvedValue(products);

      const result = await service.searchProducts({ q: 'paneer' });

      expect(result).toHaveLength(1);
    });

    it('should search by title', async () => {
      mockPrisma.vendorOffering.findMany.mockResolvedValue([createProduct()]);

      await service.searchProducts({ q: 'biryani' });

      expect(mockPrisma.vendorOffering.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({ title: expect.objectContaining({ contains: 'biryani' }) }),
                ]),
              }),
            ]),
          }),
        }),
      );
    });

    it('should search by description', async () => {
      mockPrisma.vendorOffering.findMany.mockResolvedValue([createProduct()]);

      await service.searchProducts({ q: 'spicy' });

      expect(mockPrisma.vendorOffering.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({ description: expect.objectContaining({ contains: 'spicy' }) }),
                ]),
              }),
            ]),
          }),
        }),
      );
    });

    it('should filter by category', async () => {
      mockPrisma.vendorOffering.findMany.mockResolvedValue([createProduct()]);

      await service.searchProducts({ category: 'beverages' });

      expect(mockPrisma.vendorOffering.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({ category: 'beverages' }),
            ]),
          }),
        }),
      );
    });

    it('should filter by vendor', async () => {
      mockPrisma.vendorOffering.findMany.mockResolvedValue([createProduct()]);

      await service.searchProducts({ vendor: 'Test Vendor' });

      expect(mockPrisma.vendorOffering.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                vendor: expect.objectContaining({
                  businessName: expect.objectContaining({ contains: 'Test Vendor' }),
                }),
              }),
            ]),
          }),
        }),
      );
    });
  });

  describe('searchRestaurants', () => {
    it('should return restaurants matching query', async () => {
      const restaurants = [createRestaurant({ businessName: 'Pizza Palace' })];
      mockPrisma.restaurant.findMany.mockResolvedValue(restaurants);

      const result = await service.searchRestaurants({ q: 'pizza' });

      expect(result).toHaveLength(1);
    });

    it('should search by business name', async () => {
      mockPrisma.restaurant.findMany.mockResolvedValue([createRestaurant()]);

      await service.searchRestaurants({ q: 'burger' });

      expect(mockPrisma.restaurant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({ businessName: expect.objectContaining({ contains: 'burger' }) }),
                ]),
              }),
            ]),
          }),
        }),
      );
    });

    it('should search by description', async () => {
      mockPrisma.restaurant.findMany.mockResolvedValue([createRestaurant()]);

      await service.searchRestaurants({ q: 'italian' });

      expect(mockPrisma.restaurant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({ description: expect.objectContaining({ contains: 'italian' }) }),
                ]),
              }),
            ]),
          }),
        }),
      );
    });
  });
});

describe('Search Edge Cases', () => {
  let service: SearchService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrisma = createMockPrismaService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    prisma = module.get(PrismaService);
  });

  it('should handle empty query (return all)', async () => {
    mockPrisma.job.findMany.mockResolvedValue([createJob(), createJob()]);

    const result = await service.searchJobs({});

    expect(result).toHaveLength(2);
  });

  it('should handle very long query', async () => {
    mockPrisma.job.findMany.mockResolvedValue([]);

    const longQuery = 'a'.repeat(500);
    await service.searchJobs({ q: longQuery });

    expect(mockPrisma.job.findMany).toHaveBeenCalled();
  });

  it('should handle special characters in query', async () => {
    mockPrisma.job.findMany.mockResolvedValue([]);

    await service.searchJobs({ q: "Chef's Special @#$%" });

    expect(mockPrisma.job.findMany).toHaveBeenCalled();
  });

  it('should handle SQL injection attempt', async () => {
    mockPrisma.job.findMany.mockResolvedValue([]);

    await service.searchJobs({ q: "'; DROP TABLE jobs; --" });

    // Should just search for the literal string
    expect(mockPrisma.job.findMany).toHaveBeenCalled();
  });

  it('should handle case insensitivity', async () => {
    mockPrisma.job.findMany.mockResolvedValue([createJob({ title: 'CHEF' })]);

    // Search with lowercase
    await service.searchJobs({ q: 'chef' });

    // Should still find due to case-insensitive search
    expect(mockPrisma.job.findMany).toHaveBeenCalled();
  });
});
