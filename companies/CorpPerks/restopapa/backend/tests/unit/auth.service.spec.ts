import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import {
  createUser,
  createMockPrismaService,
} from '../factories';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPrisma = createMockPrismaService();
  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn().mockReturnValue({ userId: 'test-id' }),
  };
  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      const config: Record<string, string> = {
        JWT_SECRET: 'test-secret',
        JWT_EXPIRES_IN: '15m',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should throw BadRequestException when user already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(createUser({ email: 'existing@test.com' }));

      await expect(
        service.register({
          email: 'existing@test.com',
          password: 'Password123!',
          role: 'user',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'nonexistent@test.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(
        createUser({ email: 'inactive@test.com', isActive: false }),
      );

      await expect(
        service.login({
          email: 'inactive@test.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should return null for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@test.com', 'password');

      expect(result).toBeNull();
    });
  });

  describe('getProfile', () => {
    it('should throw UnauthorizedException for non-existent user', async () => {
      mockPrisma.getUserById.mockResolvedValue(null);

      await expect(service.getProfile('non-existent')).rejects.toThrow(UnauthorizedException);
    });
  });
});
