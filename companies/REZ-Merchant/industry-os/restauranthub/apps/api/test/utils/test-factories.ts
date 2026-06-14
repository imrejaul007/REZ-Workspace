import * as bcrypt from 'bcrypt';

/**
 * Test data factories for creating mock objects
 */
export class TestFactories {
  /**
   * Create a mock user with realistic data
   */
  static createUser(overrides: unknown = {}) {
    const defaultUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: `test${Math.random().toString(36).substr(2, 5)}@example.com`,
      passwordHash: bcrypt.hashSync('password123', 10),
      role: 'CUSTOMER',
      status: 'ACTIVE',
      isActive: true,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };

    return defaultUser;
  }

  /**
   * Create a mock user profile
   */
  static createProfile(userId: string, overrides: unknown = {}) {
    const defaultProfile = {
      id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'MALE',
      address: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      postalCode: '12345',
      country: 'Test Country',
      avatar: 'https://example.com/avatar.jpg',
      bio: 'Test user bio',
      preferences: {},
      ...overrides,
    };

    return defaultProfile;
  }

  /**
   * Create a mock restaurant owner user
   */
  static createRestaurantOwner(overrides: unknown = {}) {
    return this.createUser({
      role: 'RESTAURANT_OWNER',
      email: `owner${Math.random().toString(36).substr(2, 5)}@restaurant.com`,
      ...overrides,
    });
  }

  /**
   * Create a mock admin user
   */
  static createAdmin(overrides: unknown = {}) {
    return this.createUser({
      role: 'ADMIN',
      email: `admin${Math.random().toString(36).substr(2, 5)}@restopapa.com`,
      ...overrides,
    });
  }

  /**
   * Create a mock restaurant
   */
  static createRestaurant(ownerId: string, overrides: unknown = {}) {
    const defaultRestaurant = {
      id: `restaurant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: 'Test Restaurant',
      description: 'A great test restaurant serving delicious food',
      address: '456 Restaurant Ave',
      city: 'Food City',
      state: 'Taste State',
      postalCode: '54321',
      country: 'Food Country',
      phone: '+1987654321',
      email: 'contact@testrestaurant.com',
      website: 'https://testrestaurant.com',
      cuisineType: ['INDIAN', 'ITALIAN'],
      priceRange: 'MEDIUM',
      rating: 4.5,
      totalReviews: 100,
      isActive: true,
      status: 'ACTIVE',
      isVerified: true,
      verifiedAt: new Date(),
      openingHours: {
        monday: { open: '09:00', close: '22:00', isOpen: true },
        tuesday: { open: '09:00', close: '22:00', isOpen: true },
        wednesday: { open: '09:00', close: '22:00', isOpen: true },
        thursday: { open: '09:00', close: '22:00', isOpen: true },
        friday: { open: '09:00', close: '23:00', isOpen: true },
        saturday: { open: '10:00', close: '23:00', isOpen: true },
        sunday: { open: '10:00', close: '21:00', isOpen: true },
      },
      ownerId,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };

    return defaultRestaurant;
  }

  /**
   * Create a mock job posting
   */
  static createJob(restaurantId: string, createdBy: string, overrides: unknown = {}) {
    const defaultJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: 'Server Position',
      description: 'We are looking for an experienced server to join our team.',
      restaurantId,
      location: 'Test City, Test State',
      jobType: 'FULL_TIME',
      salary: 15000,
      salaryType: 'HOURLY',
      currency: 'USD',
      benefits: ['Health Insurance', 'Paid Time Off'],
      requirements: ['2+ years experience', 'Customer service skills'],
      responsibilities: ['Take orders', 'Serve food', 'Maintain cleanliness'],
      skills: ['Communication', 'Multitasking'],
      experienceLevel: 'MID_LEVEL',
      status: 'ACTIVE',
      isActive: true,
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };

    return defaultJob;
  }

  /**
   * Create a mock session
   */
  static createSession(userId: string, overrides: unknown = {}) {
    const defaultSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      token: `token_${Math.random().toString(36).substr(2, 20)}`,
      refreshToken: `refresh_${Math.random().toString(36).substr(2, 30)}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 Test Browser',
      isActive: true,
      createdAt: new Date(),
      ...overrides,
    };

    return defaultSession;
  }

  /**
   * Create mock login credentials
   */
  static createLoginCredentials(email?: string) {
    return {
      email: email || `test${Math.random().toString(36).substr(2, 5)}@example.com`,
      password: 'password123',
    };
  }

  /**
   * Create mock registration data
   */
  static createRegistrationData(overrides: unknown = {}) {
    const email = `test${Math.random().toString(36).substr(2, 5)}@example.com`;
    return {
      email,
      password: 'password123',
      confirmPassword: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      role: 'CUSTOMER',
      agreeToTerms: true,
      agreeToPrivacy: true,
      ...overrides,
    };
  }

  /**
   * Create mock JWT payload
   */
  static createJwtPayload(userId: string, overrides: unknown = {}) {
    return {
      sub: userId,
      email: `test${Math.random().toString(36).substr(2, 5)}@example.com`,
      role: 'CUSTOMER',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      ...overrides,
    };
  }

  /**
   * Create mock email data
   */
  static createEmailData(overrides: unknown = {}) {
    return {
      to: `test${Math.random().toString(36).substr(2, 5)}@example.com`,
      subject: 'Test Email Subject',
      template: 'test-template',
      context: {
        name: 'John Doe',
        message: 'This is a test email',
      },
      ...overrides,
    };
  }

  /**
   * Create mock search filters
   */
  static createSearchFilters(overrides: unknown = {}) {
    return {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      search: '',
      status: 'ACTIVE',
      ...overrides,
    };
  }

  /**
   * Create a batch of users for testing
   */
  static createUserBatch(count: number, overrides: unknown = {}) {
    return Array.from({ length: count }, (_, index) => {
      return this.createUser({
        email: `testuser${index}@example.com`,
        ...overrides,
      });
    });
  }

  /**
   * Create mock API response
   */
  static createApiResponse(data, overrides: unknown = {}) {
    return {
      success: true,
      data,
      message: 'Operation completed successfully',
      timestamp: new Date().toISOString(),
      ...overrides,
    };
  }

  /**
   * Create mock error response
   */
  static createErrorResponse(message: string, code: number = 400, overrides: unknown = {}) {
    return {
      success: false,
      error: {
        message,
        code,
        timestamp: new Date().toISOString(),
      },
      ...overrides,
    };
  }
}