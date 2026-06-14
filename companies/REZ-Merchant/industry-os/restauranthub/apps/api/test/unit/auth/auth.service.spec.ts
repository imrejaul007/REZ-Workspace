import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';

import { AuthService } from '../../../src/modules/auth/auth.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { UsersService } from '../../../src/modules/users/users.service';
import { EmailService } from '../../../src/modules/email/email.service';
import { TokenBlacklistService } from '../../../src/modules/auth/services/token-blacklist.service';
import { SecureTokenService } from '../../../src/modules/auth/secure-token.service';
import { MockPrismaService } from '../../utils/mock-prisma.service';
import { TestFactories } from '../../utils/test-factories';
import { AuthTestHelpers } from '../../utils/auth-test-helpers';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: MockPrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let usersService: UsersService;
  let emailService: EmailService;
  let tokenBlacklistService: TokenBlacklistService;
  let secureTokenService: SecureTokenService;

  // Mock implementations
  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        JWT_SECRET: 'test-jwt-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_EXPIRATION: '15m',
        JWT_REFRESH_EXPIRATION: '7d',
        FRONTEND_URL: 'https://test.com',
      };
      return config[key as keyof typeof config];
    }),
  };

  const mockUsersService = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    sanitizeUser: jest.fn(),
  };

  const mockEmailService = {
    sendWelcomeEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendVerificationEmail: jest.fn(),
    sendEmail: jest.fn(),
  };

  const mockTokenBlacklistService = {
    isBlacklisted: jest.fn(),
    addToBlacklist: jest.fn(),
    blacklistToken: jest.fn(),
    cleanup: jest.fn(),
  };

  const mockSecureTokenService = {
    generateSecureToken: jest.fn(),
    verifySecureToken: jest.fn(),
    storePasswordResetToken: jest.fn(),
    validatePasswordResetToken: jest.fn(),
    deletePasswordResetToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useClass: MockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: TokenBlacklistService,
          useValue: mockTokenBlacklistService,
        },
        {
          provide: SecureTokenService,
          useValue: mockSecureTokenService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<MockPrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    usersService = module.get<UsersService>(UsersService);
    emailService = module.get<EmailService>(EmailService);
    tokenBlacklistService = module.get<TokenBlacklistService>(TokenBlacklistService);
    secureTokenService = module.get<SecureTokenService>(SecureTokenService);

    // Setup AuthTestHelpers
    AuthTestHelpers.setJwtService(jwtService);

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await prismaService.cleanup();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    const signUpDto = TestFactories.createRegistrationData();

    it('should successfully register a new user', async () => {
      // Arrange
      mockJwtService.sign.mockReturnValueOnce('access_token').mockReturnValueOnce('refresh_token');

      const expectedUser = TestFactories.createUser({
        email: signUpDto.email,
        role: signUpDto.role,
      });

      // Mock no existing user
      prismaService.user.findFirst = jest.fn().mockResolvedValue(null);

      // Mock user creation
      prismaService.user.create = jest.fn().mockResolvedValue(expectedUser);

      // Mock profile creation
      prismaService.profile.create = jest.fn().mockResolvedValue({
        id: 'profile-id',
        userId: expectedUser.id,
        firstName: signUpDto.firstName,
        lastName: signUpDto.lastName,
      });

      // Mock session creation
      prismaService.session.create = jest.fn().mockResolvedValue({
        id: 'session-id',
        userId: expectedUser.id,
        token: 'access_token',
      });

      // Act
      const result = await service.signUp(signUpDto);

      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(signUpDto.email);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: signUpDto.email,
          phone: signUpDto.phone,
          passwordHash: expect.any(String),
          role: signUpDto.role,
        },
      });
      expect(prismaService.profile.create).toHaveBeenCalled();
      expect(emailService.sendEmail).toHaveBeenCalled();
    });

    it('should throw ConflictException if user already exists', async () => {
      // Arrange
      const existingUser = TestFactories.createUser({ email: signUpDto.email });
      prismaService.user.findFirst = jest.fn().mockResolvedValue(existingUser);

      // Act & Assert
      await expect(service.signUp(signUpDto)).rejects.toThrow(ConflictException);
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should hash password before storing', async () => {
      // Arrange
      const hashSpy = jest.spyOn(argon2, 'hash');
      mockJwtService.sign.mockReturnValue('mock_token');

      const expectedUser = TestFactories.createUser({
        email: signUpDto.email,
        role: signUpDto.role,
      });

      prismaService.user.findFirst = jest.fn().mockResolvedValue(null);
      prismaService.user.create = jest.fn().mockResolvedValue(expectedUser);
      prismaService.profile.create = jest.fn().mockResolvedValue({});
      prismaService.session.create = jest.fn().mockResolvedValue({});

      // Act
      await service.signUp(signUpDto);

      // Assert
      expect(hashSpy).toHaveBeenCalledWith(signUpDto.password);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          passwordHash: expect.any(String),
        }),
      });

      hashSpy.mockRestore();
    });
  });

  describe('signIn', () => {
    const signInDto = TestFactories.createLoginCredentials();

    it('should successfully sign in with valid credentials', async () => {
      // Arrange
      const user = TestFactories.createUser({
        email: signInDto.email,
        passwordHash: await argon2.hash(signInDto.password),
      });

      mockJwtService.sign.mockReturnValueOnce('access_token').mockReturnValueOnce('refresh_token');
      prismaService.user.findUnique = jest.fn().mockResolvedValue(user);
      prismaService.user.update = jest.fn().mockResolvedValue(user);
      prismaService.session.create = jest.fn().mockResolvedValue({
        id: 'session-id',
        userId: user.id,
        token: 'access_token',
      });

      const verifySpy = jest.spyOn(argon2, 'verify').mockResolvedValue(true);

      // Act
      const result = await service.signIn(signInDto);

      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(signInDto.email);
      expect(verifySpy).toHaveBeenCalledWith(user.passwordHash, signInDto.password);

      verifySpy.mockRestore();
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      // Arrange
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(service.signIn(signInDto)).rejects.toThrow(UnauthorizedException);
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      // Arrange
      const user = TestFactories.createUser({
        email: signInDto.email,
        passwordHash: await argon2.hash('different_password'),
      });

      prismaService.user.findUnique = jest.fn().mockResolvedValue(user);
      const verifySpy = jest.spyOn(argon2, 'verify').mockResolvedValue(false);

      // Act & Assert
      await expect(service.signIn(signInDto)).rejects.toThrow(UnauthorizedException);
      expect(mockJwtService.sign).not.toHaveBeenCalled();

      verifySpy.mockRestore();
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      // Arrange
      const user = TestFactories.createUser({
        email: signInDto.email,
        passwordHash: await argon2.hash(signInDto.password),
        isActive: false,
        status: 'INACTIVE',
      });

      prismaService.user.findUnique = jest.fn().mockResolvedValue(user);

      // Act & Assert
      await expect(service.signIn(signInDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    it('should generate new access token with valid refresh token', async () => {
      // Arrange
      const user = TestFactories.createUser();
      const refreshTokenDto = { refreshToken: 'valid_refresh_token' };

      mockJwtService.verify.mockReturnValue({ sub: user.id, email: user.email });
      mockJwtService.sign.mockReturnValue('new_access_token');

      prismaService.user.findUnique = jest.fn().mockResolvedValue({
        ...user,
        refreshToken: 'hashed_refresh_token',
      });

      // Mock argon2.verify to return true for refresh token validation
      const verifySpy = jest.spyOn(argon2, 'verify').mockResolvedValue(true);

      // Act
      const result = await service.refreshTokens(refreshTokenDto);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(mockJwtService.verify).toHaveBeenCalledWith(refreshTokenDto.refreshToken, expect.any(Object));

      verifySpy.mockRestore();
    });

    it('should throw UnauthorizedException for user without refresh token', async () => {
      // Arrange
      const refreshTokenDto = { refreshToken: 'valid_token' };
      const user = TestFactories.createUser({ refreshToken: null });

      mockJwtService.verify.mockReturnValue({ sub: user.id, email: user.email });
      prismaService.user.findUnique = jest.fn().mockResolvedValue(user);

      // Act & Assert
      await expect(service.refreshTokens(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      // Arrange
      const refreshTokenDto = { refreshToken: 'invalid_token' };
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      mockTokenBlacklistService.isBlacklisted.mockResolvedValue(false);

      // Act & Assert
      await expect(service.refreshTokens(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      // Arrange
      const userId = 'user-id';
      const logoutAll = false;

      prismaService.user.update = jest.fn().mockResolvedValue({});
      prismaService.session.findFirst = jest.fn().mockResolvedValue({
        id: 'session-id',
        userId,
        token: 'session_token',
      });
      prismaService.session.delete = jest.fn().mockResolvedValue({});
      mockTokenBlacklistService.blacklistToken = jest.fn().mockResolvedValue(undefined);

      // Act
      const result = await service.logout(userId, logoutAll);

      // Assert
      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { refreshToken: null },
      });
    });

    it('should handle logout when session not found', async () => {
      // Arrange
      const userId = 'user-id';
      const logoutAll = false;

      prismaService.user.update = jest.fn().mockResolvedValue({});
      prismaService.session.findFirst = jest.fn().mockResolvedValue(null);

      // Act
      const result = await service.logout(userId, logoutAll);

      // Assert
      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(prismaService.session.delete).not.toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email for existing user', async () => {
      // Arrange
      const forgotPasswordDto = { email: 'test@example.com' };
      const user = TestFactories.createUser({ email: forgotPasswordDto.email });

      prismaService.user.findUnique = jest.fn().mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue('reset_token');
      mockSecureTokenService.storePasswordResetToken = jest.fn().mockResolvedValue(undefined);

      // Act
      const result = await service.forgotPassword(forgotPasswordDto);

      // Assert
      expect(result).toEqual({
        message: 'If the email exists, a reset link has been sent'
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { sub: user.id, email: user.email, type: 'password-reset' },
        expect.any(Object)
      );
      expect(emailService.sendEmail).toHaveBeenCalled();
    });

    it('should return success message even for non-existent email (security)', async () => {
      // Arrange
      const forgotPasswordDto = { email: 'nonexistent@example.com' };
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);

      // Act
      const result = await service.forgotPassword(forgotPasswordDto);

      // Assert
      expect(result).toEqual({
        message: 'If the email exists, a reset link has been sent'
      });
      expect(mockJwtService.sign).not.toHaveBeenCalled();
      expect(emailService.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should successfully reset password with valid token', async () => {
      // Arrange
      const resetPasswordDto = {
        token: 'valid_reset_token',
        newPassword: 'newPassword123',
      };

      const userId = 'user-id';
      const user = TestFactories.createUser({ id: userId });

      mockJwtService.verify.mockReturnValue({ sub: userId, email: user.email, type: 'password-reset' });
      mockSecureTokenService.validatePasswordResetToken = jest.fn().mockResolvedValue(true);
      mockSecureTokenService.deletePasswordResetToken = jest.fn().mockResolvedValue(undefined);
      prismaService.user.update = jest.fn().mockResolvedValue({ ...user, passwordHash: 'new_hash' });
      prismaService.session.deleteMany = jest.fn().mockResolvedValue({ count: 0 });

      const hashSpy = jest.spyOn(argon2, 'hash').mockResolvedValue('new_hash');

      // Act
      const result = await service.resetPassword(resetPasswordDto);

      // Assert
      expect(result).toEqual({ message: 'Password reset successfully' });
      expect(mockJwtService.verify).toHaveBeenCalledWith(resetPasswordDto.token, expect.any(Object));
      expect(hashSpy).toHaveBeenCalledWith(resetPasswordDto.newPassword);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { passwordHash: 'new_hash' },
      });

      hashSpy.mockRestore();
    });

    it('should throw BadRequestException for invalid token', async () => {
      // Arrange
      const resetPasswordDto = {
        token: 'invalid_token',
        newPassword: 'newPassword123',
      };

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid token type', async () => {
      // Arrange
      const resetPasswordDto = {
        token: 'valid_token',
        newPassword: 'newPassword123',
      };

      mockJwtService.verify.mockReturnValue({ sub: 'user-id', type: 'invalid-type' });

      // Act & Assert
      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => {
      // Arrange
      const userId = 'user-id';
      const email = 'test@example.com';
      const role = 'CUSTOMER';

      mockJwtService.sign
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token');

      // Act
      const result = await service['generateTokens'](userId, email, role);

      // Assert
      expect(result).toEqual({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        expiresIn: expect.any(Number),
        tokenType: 'Bearer',
      });
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('validateUser', () => {
    it('should return user data for valid credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const user = TestFactories.createUser({
        email,
        passwordHash: await argon2.hash(password),
      });

      prismaService.user.findUnique = jest.fn().mockResolvedValue(user);
      const verifySpy = jest.spyOn(argon2, 'verify').mockResolvedValue(true);

      // Act
      const result = await service.validateUser(email, password);

      // Assert
      expect(result).toEqual(user);
      expect(verifySpy).toHaveBeenCalledWith(user.passwordHash, password);

      verifySpy.mockRestore();
    });

    it('should return null for invalid credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrong_password';
      const user = TestFactories.createUser({
        email,
        passwordHash: await argon2.hash('correct_password'),
      });

      prismaService.user.findUnique = jest.fn().mockResolvedValue(user);
      const verifySpy = jest.spyOn(argon2, 'verify').mockResolvedValue(false);

      // Act
      const result = await service.validateUser(email, password);

      // Assert
      expect(result).toBeNull();

      verifySpy.mockRestore();
    });
  });
});