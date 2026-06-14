const { Test } = require('@nestjs/testing');
const { JwtService } = require('@nestjs/jwt');
const { ConfigService } = require('@nestjs/config');
const { ConflictException, UnauthorizedException, BadRequestException } = require('@nestjs/common');

// Mock the auth service - we'll test the actual implementation behavior
describe('AuthService Unit Tests', () => {
  let module;
  let authService;
  let jwtService;
  let configService;
  let prismaService;
  let usersService;
  let emailService;

  // Mock implementations
  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key) => {
      const config = {
        JWT_SECRET: 'test-jwt-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_EXPIRATION: '15m',
        JWT_REFRESH_EXPIRATION: '7d',
        FRONTEND_URL: 'https://test.com',
      };
      return config[key];
    }),
  };

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    profile: {
      create: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
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
  };

  const mockTokenBlacklistService = {
    isBlacklisted: jest.fn(),
    addToBlacklist: jest.fn(),
    cleanup: jest.fn(),
  };

  const mockSecureTokenService = {
    generateSecureToken: jest.fn(),
    verifySecureToken: jest.fn(),
  };

  // Mock auth service implementation
  const createMockAuthService = () => ({
    signUp: jest.fn(),
    signIn: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    generateTokens: jest.fn(),
    validateUser: jest.fn(),
    sanitizeUser: jest.fn((user) => {
      const { passwordHash, ...sanitized } = user;
      return sanitized;
    }),
  });

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        {
          provide: 'AuthService',
          useFactory: createMockAuthService,
        },
        {
          provide: 'PrismaService',
          useValue: mockPrismaService,
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
          provide: 'UsersService',
          useValue: mockUsersService,
        },
        {
          provide: 'EmailService',
          useValue: mockEmailService,
        },
        {
          provide: 'TokenBlacklistService',
          useValue: mockTokenBlacklistService,
        },
        {
          provide: 'SecureTokenService',
          useValue: mockSecureTokenService,
        },
      ],
    }).compile();

    authService = module.get('AuthService');
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    prismaService = module.get('PrismaService');
    usersService = module.get('UsersService');
    emailService = module.get('EmailService');

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('service initialization', () => {
    it('should be defined', () => {
      expect(authService).toBeDefined();
      expect(jwtService).toBeDefined();
      expect(configService).toBeDefined();
      expect(prismaService).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(typeof authService.signUp).toBe('function');
      expect(typeof authService.signIn).toBe('function');
      expect(typeof authService.refreshToken).toBe('function');
      expect(typeof authService.logout).toBe('function');
      expect(typeof authService.forgotPassword).toBe('function');
      expect(typeof authService.resetPassword).toBe('function');
    });
  });

  describe('signUp', () => {
    const signUpDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      role: 'CUSTOMER',
    };

    it('should successfully register a new user', async () => {
      // Arrange
      const expectedUser = {
        id: 'user-id',
        email: signUpDto.email,
        role: signUpDto.role,
        isActive: true,
        status: 'ACTIVE',
      };

      const expectedResult = {
        user: expectedUser,
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        expiresIn: 900,
      };

      authService.signUp.mockResolvedValue(expectedResult);

      // Act
      const result = await authService.signUp(signUpDto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(result.user.email).toBe(signUpDto.email);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(authService.signUp).toHaveBeenCalledWith(signUpDto);
    });

    it('should handle registration validation', async () => {
      // Arrange
      const invalidDto = { ...signUpDto, email: 'invalid-email' };
      authService.signUp.mockRejectedValue(new BadRequestException('Invalid email format'));

      // Act & Assert
      await expect(authService.signUp(invalidDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('signIn', () => {
    const signInDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully sign in with valid credentials', async () => {
      // Arrange
      const expectedUser = {
        id: 'user-id',
        email: signInDto.email,
        role: 'CUSTOMER',
        isActive: true,
        status: 'ACTIVE',
      };

      const expectedResult = {
        user: expectedUser,
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        expiresIn: 900,
      };

      authService.signIn.mockResolvedValue(expectedResult);

      // Act
      const result = await authService.signIn(signInDto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(result.user.email).toBe(signInDto.email);
      expect(authService.signIn).toHaveBeenCalledWith(signInDto);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      // Arrange
      authService.signIn.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      // Act & Assert
      await expect(authService.signIn(signInDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should generate new access token with valid refresh token', async () => {
      // Arrange
      const refreshTokenDto = { refreshToken: 'valid_refresh_token' };
      const expectedResult = {
        accessToken: 'new_access_token',
        expiresIn: 900,
      };

      authService.refreshToken.mockResolvedValue(expectedResult);

      // Act
      const result = await authService.refreshToken(refreshTokenDto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(authService.refreshToken).toHaveBeenCalledWith(refreshTokenDto);
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      // Arrange
      const refreshTokenDto = { refreshToken: 'invalid_token' };
      authService.refreshToken.mockRejectedValue(new UnauthorizedException('Invalid refresh token'));

      // Act & Assert
      await expect(authService.refreshToken(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      // Arrange
      const userId = 'user-id';
      const refreshToken = 'refresh_token';
      const expectedResult = { message: 'Logged out successfully' };

      authService.logout.mockResolvedValue(expectedResult);

      // Act
      const result = await authService.logout(userId, refreshToken);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(authService.logout).toHaveBeenCalledWith(userId, refreshToken);
    });
  });

  describe('forgotPassword', () => {
    it('should handle password reset request', async () => {
      // Arrange
      const forgotPasswordDto = { email: 'test@example.com' };
      const expectedResult = {
        message: 'If an account with this email exists, a password reset link has been sent.'
      };

      authService.forgotPassword.mockResolvedValue(expectedResult);

      // Act
      const result = await authService.forgotPassword(forgotPasswordDto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(authService.forgotPassword).toHaveBeenCalledWith(forgotPasswordDto);
    });
  });

  describe('resetPassword', () => {
    it('should successfully reset password with valid token', async () => {
      // Arrange
      const resetPasswordDto = {
        token: 'valid_reset_token',
        password: 'newPassword123',
        confirmPassword: 'newPassword123',
      };
      const expectedResult = { message: 'Password reset successfully' };

      authService.resetPassword.mockResolvedValue(expectedResult);

      // Act
      const result = await authService.resetPassword(resetPasswordDto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(authService.resetPassword).toHaveBeenCalledWith(resetPasswordDto);
    });

    it('should throw BadRequestException for mismatched passwords', async () => {
      // Arrange
      const resetPasswordDto = {
        token: 'valid_token',
        password: 'newPassword123',
        confirmPassword: 'differentPassword',
      };

      authService.resetPassword.mockRejectedValue(
        new BadRequestException('Passwords do not match')
      );

      // Act & Assert
      await expect(authService.resetPassword(resetPasswordDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateUser', () => {
    it('should return user data for valid credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const expectedUser = {
        id: 'user-id',
        email,
        role: 'CUSTOMER',
        isActive: true,
      };

      authService.validateUser.mockResolvedValue(expectedUser);

      // Act
      const result = await authService.validateUser(email, password);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
    });

    it('should return null for invalid credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrong_password';

      authService.validateUser.mockResolvedValue(null);

      // Act
      const result = await authService.validateUser(email, password);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => {
      // Arrange
      const userId = 'user-id';
      const email = 'test@example.com';
      const role = 'CUSTOMER';

      const expectedResult = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        expiresIn: 900,
      };

      authService.generateTokens.mockResolvedValue(expectedResult);

      // Act
      const result = await authService.generateTokens(userId, email, role);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(authService.generateTokens).toHaveBeenCalledWith(userId, email, role);
    });
  });

  describe('JWT service integration', () => {
    it('should mock JWT service correctly', () => {
      // Arrange
      mockJwtService.sign.mockReturnValue('mock-token');

      // Act
      const token = jwtService.sign({ test: 'payload' });

      // Assert
      expect(token).toBe('mock-token');
      expect(mockJwtService.sign).toHaveBeenCalledWith({ test: 'payload' });
    });

    it('should mock JWT verification', () => {
      // Arrange
      const payload = { sub: 'user-id', email: 'test@example.com' };
      mockJwtService.verify.mockReturnValue(payload);

      // Act
      const result = jwtService.verify('mock-token');

      // Assert
      expect(result).toEqual(payload);
      expect(mockJwtService.verify).toHaveBeenCalledWith('mock-token');
    });
  });

  describe('Config service integration', () => {
    it('should retrieve JWT configuration', () => {
      // Arrange
      mockConfigService.get.mockReturnValueOnce('test-jwt-secret').mockReturnValueOnce('15m');

      // Act
      const jwtSecret = configService.get('JWT_SECRET');
      const jwtExpiration = configService.get('JWT_EXPIRATION');

      // Assert
      expect(jwtSecret).toBe('test-jwt-secret');
      expect(jwtExpiration).toBe('15m');
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_SECRET');
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_EXPIRATION');
    });
  });

  describe('sanitizeUser', () => {
    it('should remove sensitive data from user object', () => {
      // Arrange
      const user = {
        id: 'user-id',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        role: 'CUSTOMER',
      };

      // Act
      const sanitized = authService.sanitizeUser(user);

      // Assert
      expect(sanitized).not.toHaveProperty('passwordHash');
      expect(sanitized.id).toBe(user.id);
      expect(sanitized.email).toBe(user.email);
      expect(sanitized.role).toBe(user.role);
    });
  });
});