import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from '../../../src/modules/users/users.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { UpdateUserDto } from '../../../src/modules/users/dto/update-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  // Mock user data
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    passwordHash: 'hashed-password',
    role: 'CUSTOMER',
    isActive: true,
    avatar: null,
    restaurant: null,
    employee: null,
    vendor: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
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

  describe('findById', () => {
    it('should return a user when found', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await service.findById('user-123');

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('user-123');
      expect(result).not.toHaveProperty('passwordHash');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        include: {
          restaurant: true,
          employee: true,
          vendor: true,
        },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById('nonexistent-id')).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'nonexistent-id' },
        include: {
          restaurant: true,
          employee: true,
          vendor: true,
        },
      });
    });

    it('should sanitize user data by removing sensitive fields', async () => {
      // Arrange
      const userWithSensitiveData = {
        ...mockUser,
        passwordHash: 'sensitive-hash',
        sessionToken: 'session-token',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(userWithSensitiveData);

      // Act
      const result = await service.findById('user-123');

      // Assert
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('sessionToken');
      expect(result.id).toBe('user-123');
      expect(result.email).toBe('test@example.com');
    });
  });

  describe('findByEmail', () => {
    it('should return a user when found by email', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await service.findByEmail('test@example.com');

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
      expect(result).not.toHaveProperty('passwordHash');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: {
          restaurant: true,
          employee: true,
          vendor: true,
        },
      });
    });

    it('should return null when user not found by email', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.findByEmail('nonexistent@example.com');

      // Assert
      expect(result).toBeNull();
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
        include: {
          restaurant: true,
          employee: true,
          vendor: true,
        },
      });
    });

    it('should handle email case sensitivity correctly', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await service.findByEmail('TEST@EXAMPLE.COM');

      // Assert
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'TEST@EXAMPLE.COM' },
        include: {
          restaurant: true,
          employee: true,
          vendor: true,
        },
      });
    });
  });

  describe('updateProfile', () => {
    const updateUserDto: UpdateUserDto = {
      firstName: 'Jane',
      lastName: 'Smith',
      avatar: 'https://example.com/avatar.jpg',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      pincode: '10001',
      dateOfBirth: '1990-01-01',
    };

    it('should update user profile successfully', async () => {
      // Arrange
      const updatedUser = { ...mockUser, ...updateUserDto };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      // Act
      const result = await service.updateProfile('user-123', updateUserDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Smith');
      expect(result).not.toHaveProperty('passwordHash');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          firstName: 'Jane',
          lastName: 'Smith',
          avatar: 'https://example.com/avatar.jpg',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          pincode: '10001',
          dateOfBirth: '1990-01-01',
        },
        include: {
          restaurant: true,
          employee: true,
          vendor: true,
        },
      });
    });

    it('should handle partial updates', async () => {
      // Arrange
      const partialUpdate = { firstName: 'Jane' };
      const updatedUser = { ...mockUser, firstName: 'Jane' };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      // Act
      const result = await service.updateProfile('user-123', partialUpdate);

      // Assert
      expect(result.firstName).toBe('Jane');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          firstName: 'Jane',
          lastName: undefined,
          avatar: undefined,
          address: undefined,
          city: undefined,
          state: undefined,
          country: undefined,
          pincode: undefined,
          dateOfBirth: undefined,
        },
        include: {
          restaurant: true,
          employee: true,
          vendor: true,
        },
      });
    });

    it('should throw error when user does not exist', async () => {
      // Arrange
      mockPrismaService.user.update.mockRejectedValue(new Error('User not found'));

      // Act & Assert
      await expect(service.updateProfile('nonexistent-id', updateUserDto))
        .rejects.toThrow('User not found');
    });
  });

  describe('sanitizeUser', () => {
    it('should remove sensitive fields from user object', () => {
      // Arrange
      const userWithSensitiveData = {
        ...mockUser,
        passwordHash: 'sensitive-hash',
        refreshToken: 'refresh-token',
        sessionToken: 'session-token',
      };

      // Act
      const result = service.sanitizeUser(userWithSensitiveData);

      // Assert
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('refreshToken');
      expect(result).not.toHaveProperty('sessionToken');
      expect(result.id).toBe(userWithSensitiveData.id);
      expect(result.email).toBe(userWithSensitiveData.email);
      expect(result.firstName).toBe(userWithSensitiveData.firstName);
    });

    it('should preserve non-sensitive fields', () => {
      // Act
      const result = service.sanitizeUser(mockUser);

      // Assert
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(result.firstName).toBe(mockUser.firstName);
      expect(result.lastName).toBe(mockUser.lastName);
      expect(result.role).toBe(mockUser.role);
      expect(result.isActive).toBe(mockUser.isActive);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      // Act & Assert
      await expect(service.findById('user-123')).rejects.toThrow('Database connection failed');
    });

    it('should handle invalid user IDs gracefully', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById('')).rejects.toThrow(NotFoundException);
      await expect(service.findById('invalid-uuid')).rejects.toThrow(NotFoundException);
    });

    it('should handle malformed email addresses', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.findByEmail('invalid-email');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('Performance', () => {
    it('should complete findById within acceptable time', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const startTime = Date.now();
      await service.findById('user-123');
      const endTime = Date.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle multiple concurrent requests', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const promises = Array.from({ length: 10 }, (_, i) =>
        service.findById(`user-${i}`)
      );
      const results = await Promise.all(promises);

      // Assert
      expect(results).toHaveLength(10);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledTimes(10);
    });
  });

  describe('Integration with Related Entities', () => {
    it('should include restaurant data when user is restaurant owner', async () => {
      // Arrange
      const userWithRestaurant = {
        ...mockUser,
        restaurant: {
          id: 'restaurant-123',
          name: 'Test Restaurant',
          ownerId: 'user-123',
        },
      };
      mockPrismaService.user.findUnique.mockResolvedValue(userWithRestaurant);

      // Act
      const result = await service.findById('user-123');

      // Assert
      expect(result.restaurant).toBeDefined();
      expect(result.restaurant.name).toBe('Test Restaurant');
    });

    it('should include employee data when user is employee', async () => {
      // Arrange
      const userWithEmployee = {
        ...mockUser,
        employee: {
          id: 'employee-123',
          userId: 'user-123',
          restaurantId: 'restaurant-123',
          position: 'MANAGER',
        },
      };
      mockPrismaService.user.findUnique.mockResolvedValue(userWithEmployee);

      // Act
      const result = await service.findById('user-123');

      // Assert
      expect(result.employee).toBeDefined();
      expect(result.employee.position).toBe('MANAGER');
    });
  });
});