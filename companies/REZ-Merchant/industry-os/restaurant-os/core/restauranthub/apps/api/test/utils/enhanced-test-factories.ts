import { faker } from '@faker-js/faker';
import { UserRole, VerificationStatus, JobStatus, ApplicationStatus, OrderStatus, PaymentStatus } from '@prisma/client';

/**
 * Enhanced Test Factories for generating realistic test data
 * Provides consistent, deterministic test data for all models
 */
export class EnhancedTestFactories {
  /**
   * Generate deterministic IDs for testing
   */
  static generateId(prefix = 'test'): string {
    return `${prefix}-${faker.string.uuid()}`;
  }

  /**
   * Create a test user with realistic data
   */
  static createUser(overrides: Partial<unknown> = {}): unknown {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    return {
      id: this.generateId('user'),
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      passwordHash: '$2b$12$' + faker.string.alphanumeric(53), // Valid bcrypt hash format
      role: faker.helpers.arrayElement([UserRole.CUSTOMER, UserRole.RESTAURANT, UserRole.EMPLOYEE, UserRole.VENDOR]),
      isActive: true,
      status: 'ACTIVE',
      emailVerifiedAt: faker.date.past(),
      lastLoginAt: faker.date.recent(),
      phone: faker.phone.number('+1##########'),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      refreshToken: null,
      twoFactorSecret: null,
      twoFactorEnabled: false,
      profile: {
        id: this.generateId('profile'),
        firstName,
        lastName,
        bio: faker.lorem.paragraph(),
        location: `${faker.location.city()}, ${faker.location.state()}`,
        avatarUrl: faker.image.avatar(),
        dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
        website: faker.internet.url(),
        socialLinks: {
          twitter: `@${faker.internet.userName()}`,
          linkedin: faker.internet.url(),
          instagram: `@${faker.internet.userName()}`,
        },
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
      },
      ...overrides,
    };
  }

  /**
   * Create a test restaurant with complete data
   */
  static createRestaurant(overrides: Partial<unknown> = {}): unknown {
    const restaurantName = faker.company.name() + ' Restaurant';

    return {
      id: this.generateId('restaurant'),
      userId: this.generateId('user'),
      name: restaurantName,
      businessName: restaurantName,
      description: faker.lorem.paragraphs(2),
      cuisineType: faker.helpers.arrayElements([
        'Italian', 'Chinese', 'Indian', 'Mexican', 'French', 'Japanese', 'Thai', 'American', 'Mediterranean'
      ], faker.number.int({ min: 1, max: 3 })),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
      pincode: faker.location.zipCode(),
      latitude: parseFloat(faker.location.latitude()),
      longitude: parseFloat(faker.location.longitude()),
      phone: faker.phone.number('+1##########'),
      email: faker.internet.email(),
      website: faker.internet.url(),
      hours: {
        monday: { open: '09:00', close: '22:00', isOpen: true },
        tuesday: { open: '09:00', close: '22:00', isOpen: true },
        wednesday: { open: '09:00', close: '22:00', isOpen: true },
        thursday: { open: '09:00', close: '22:00', isOpen: true },
        friday: { open: '09:00', close: '23:00', isOpen: true },
        saturday: { open: '10:00', close: '23:00', isOpen: true },
        sunday: { open: '10:00', close: '21:00', isOpen: true },
      },
      averageRating: parseFloat(faker.number.float({ min: 3.0, max: 5.0, fractionDigits: 1 }).toFixed(1)),
      totalReviews: faker.number.int({ min: 0, max: 500 }),
      priceRange: faker.helpers.arrayElement(['$', '$$', '$$$', '$$$$']),
      features: faker.helpers.arrayElements([
        'parking', 'wifi', 'outdoor_seating', 'takeout', 'delivery', 'reservations', 'live_music'
      ], faker.number.int({ min: 1, max: 4 })),
      photos: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () => faker.image.urlLoremFlickr({ category: 'food' })),
      verificationStatus: faker.helpers.arrayElement([VerificationStatus.PENDING, VerificationStatus.VERIFIED, VerificationStatus.REJECTED]),
      verificationDocuments: {
        businessLicense: faker.internet.url(),
        taxId: faker.string.alphanumeric(10),
        ownershipProof: faker.internet.url(),
      },
      isActive: true,
      isFeatured: faker.datatype.boolean(0.1), // 10% chance of being featured
      deliveryRadius: faker.number.int({ min: 5, max: 25 }),
      minimumOrder: faker.number.int({ min: 10, max: 50 }),
      deliveryFee: parseFloat(faker.number.float({ min: 2.99, max: 9.99, fractionDigits: 2 }).toFixed(2)),
      estimatedDeliveryTime: faker.number.int({ min: 20, max: 60 }),
      tags: faker.helpers.arrayElements([
        'fast_food', 'fine_dining', 'family_friendly', 'romantic', 'business', 'casual', 'vegetarian', 'vegan', 'halal'
      ], faker.number.int({ min: 1, max: 3 })),
      socialMedia: {
        facebook: faker.internet.url(),
        instagram: `@${faker.internet.userName()}`,
        twitter: `@${faker.internet.userName()}`,
      },
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  /**
   * Create a test job posting with realistic requirements
   */
  static createJob(overrides: Partial<unknown> = {}): unknown {
    const jobTitles = [
      'Head Chef', 'Sous Chef', 'Line Cook', 'Prep Cook', 'Kitchen Manager',
      'Server', 'Bartender', 'Host/Hostess', 'Restaurant Manager', 'Assistant Manager',
      'Cashier', 'Food Runner', 'Busser', 'Dishwasher', 'Delivery Driver'
    ];

    const title = faker.helpers.arrayElement(jobTitles);
    const experienceMin = faker.number.int({ min: 0, max: 5 });
    const experienceMax = faker.number.int({ min: experienceMin + 1, max: experienceMin + 7 });
    const salaryMin = faker.number.int({ min: 25000, max: 60000 });
    const salaryMax = faker.number.int({ min: salaryMin + 5000, max: salaryMin + 25000 });

    return {
      id: this.generateId('job'),
      restaurantId: this.generateId('restaurant'),
      title,
      description: this.generateJobDescription(title),
      requirements: this.generateJobRequirements(title),
      skills: this.generateJobSkills(title),
      responsibilities: this.generateJobResponsibilities(title),
      benefits: this.generateJobBenefits(),
      experienceMin,
      experienceMax,
      salaryMin,
      salaryMax,
      salaryType: faker.helpers.arrayElement(['HOURLY', 'MONTHLY', 'YEARLY']),
      location: `${faker.location.city()}, ${faker.location.state()}`,
      jobType: faker.helpers.arrayElement(['Full-time', 'Part-time', 'Contract', 'Temporary']),
      workSchedule: faker.helpers.arrayElement(['Morning', 'Evening', 'Night', 'Flexible', 'Split Shift']),
      status: faker.helpers.arrayElement([JobStatus.OPEN, JobStatus.CLOSED, JobStatus.PAUSED]),
      isUrgent: faker.datatype.boolean(0.2), // 20% chance of being urgent
      isRemote: faker.datatype.boolean(0.1), // 10% chance of being remote
      validTill: faker.date.future(),
      applicationDeadline: faker.date.soon(),
      startDate: faker.date.soon({ days: 30 }),
      contactEmail: faker.internet.email(),
      contactPhone: faker.phone.number('+1##########'),
      applicationInstructions: 'Please submit your resume and cover letter.',
      tags: faker.helpers.arrayElements([
        'entry_level', 'experienced', 'full_time', 'part_time', 'urgent', 'high_volume', 'fine_dining', 'casual_dining'
      ], faker.number.int({ min: 1, max: 3 })),
      viewCount: faker.number.int({ min: 0, max: 1000 }),
      applicationCount: faker.number.int({ min: 0, max: 50 }),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  /**
   * Create a test job application
   */
  static createJobApplication(overrides: Partial<unknown> = {}): unknown {
    return {
      id: this.generateId('application'),
      jobId: this.generateId('job'),
      userId: this.generateId('user'),
      coverLetter: faker.lorem.paragraphs(3),
      resumeUrl: faker.internet.url(),
      portfolioUrl: faker.internet.url(),
      expectedSalary: faker.number.int({ min: 30000, max: 80000 }),
      availabilityDate: faker.date.soon(),
      references: Array.from({ length: 2 }, () => ({
        name: faker.person.fullName(),
        company: faker.company.name(),
        position: faker.person.jobTitle(),
        phone: faker.phone.number('+1##########'),
        email: faker.internet.email(),
        relationship: faker.helpers.arrayElement(['Previous Manager', 'Colleague', 'Client', 'Mentor']),
      })),
      workEligibility: true,
      backgroundCheckConsent: true,
      status: faker.helpers.arrayElement([
        ApplicationStatus.PENDING,
        ApplicationStatus.UNDER_REVIEW,
        ApplicationStatus.INTERVIEW_SCHEDULED,
        ApplicationStatus.ACCEPTED,
        ApplicationStatus.REJECTED,
        ApplicationStatus.WITHDRAWN
      ]),
      notes: faker.lorem.paragraph(),
      interviewDate: faker.date.soon(),
      interviewNotes: faker.lorem.paragraph(),
      reviewedAt: faker.date.recent(),
      appliedAt: faker.date.past(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  /**
   * Create a test employee profile
   */
  static createEmployee(overrides: Partial<unknown> = {}): unknown {
    return {
      id: this.generateId('employee'),
      userId: this.generateId('user'),
      restaurantId: this.generateId('restaurant'),
      employeeCode: faker.string.alphanumeric({ length: 8, casing: 'upper' }),
      designation: faker.person.jobTitle(),
      department: faker.helpers.arrayElement(['Kitchen', 'Service', 'Management', 'Administration', 'Delivery']),
      joiningDate: faker.date.past(),
      probationEndDate: faker.date.future(),
      employmentType: faker.helpers.arrayElement(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']),
      salary: faker.number.int({ min: 25000, max: 80000 }),
      hourlyRate: parseFloat(faker.number.float({ min: 12.00, max: 35.00, fractionDigits: 2 }).toFixed(2)),
      workSchedule: {
        monday: { start: '09:00', end: '17:00', isWorkDay: true },
        tuesday: { start: '09:00', end: '17:00', isWorkDay: true },
        wednesday: { start: '09:00', end: '17:00', isWorkDay: true },
        thursday: { start: '09:00', end: '17:00', isWorkDay: true },
        friday: { start: '09:00', end: '17:00', isWorkDay: true },
        saturday: { start: '10:00', end: '15:00', isWorkDay: false },
        sunday: { start: '10:00', end: '15:00', isWorkDay: false },
      },
      permissions: faker.helpers.arrayElements([
        'view_orders', 'create_orders', 'manage_inventory', 'view_reports', 'manage_staff'
      ], faker.number.int({ min: 1, max: 3 })),
      emergencyContact: {
        name: faker.person.fullName(),
        relationship: faker.helpers.arrayElement(['Parent', 'Spouse', 'Sibling', 'Friend']),
        phone: faker.phone.number('+1##########'),
        email: faker.internet.email(),
      },
      documents: {
        resume: faker.internet.url(),
        idProof: faker.internet.url(),
        addressProof: faker.internet.url(),
        educationCertificates: [faker.internet.url()],
      },
      performanceRating: parseFloat(faker.number.float({ min: 3.0, max: 5.0, fractionDigits: 1 }).toFixed(1)),
      trainingCompleted: faker.helpers.arrayElements([
        'Food Safety', 'Customer Service', 'Fire Safety', 'First Aid', 'POS System'
      ], faker.number.int({ min: 1, max: 3 })),
      isActive: true,
      terminationDate: null,
      terminationReason: null,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  /**
   * Create a test vendor profile
   */
  static createVendor(overrides: Partial<unknown> = {}): unknown {
    return {
      id: this.generateId('vendor'),
      userId: this.generateId('user'),
      companyName: faker.company.name(),
      businessName: faker.company.name(),
      businessType: faker.helpers.arrayElement([
        'Food Supplier', 'Equipment Supplier', 'Packaging', 'Cleaning Services', 'Technology', 'Marketing'
      ]),
      description: faker.lorem.paragraphs(2),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
      pincode: faker.location.zipCode(),
      phone: faker.phone.number('+1##########'),
      email: faker.internet.email(),
      website: faker.internet.url(),
      taxId: faker.string.alphanumeric(10),
      businessLicense: faker.string.alphanumeric(12),
      categories: faker.helpers.arrayElements([
        'Fresh Produce', 'Dairy', 'Meat & Seafood', 'Beverages', 'Kitchen Equipment', 'Furniture', 'Technology'
      ], faker.number.int({ min: 1, max: 3 })),
      serviceAreas: faker.helpers.arrayElements([
        'Downtown', 'Midtown', 'Uptown', 'Suburbs', 'Airport', 'University District'
      ], faker.number.int({ min: 1, max: 4 })),
      paymentTerms: faker.helpers.arrayElement(['Net 30', 'Net 15', 'COD', 'Prepaid']),
      minimumOrder: faker.number.int({ min: 50, max: 500 }),
      deliveryFee: parseFloat(faker.number.float({ min: 5.00, max: 25.00, fractionDigits: 2 }).toFixed(2)),
      deliveryTime: faker.helpers.arrayElement(['Same Day', 'Next Day', '2-3 Days', '1 Week']),
      rating: parseFloat(faker.number.float({ min: 3.5, max: 5.0, fractionDigits: 1 }).toFixed(1)),
      totalOrders: faker.number.int({ min: 0, max: 1000 }),
      verificationStatus: faker.helpers.arrayElement([VerificationStatus.PENDING, VerificationStatus.VERIFIED, VerificationStatus.REJECTED]),
      isActive: true,
      isFeatured: faker.datatype.boolean(0.15), // 15% chance of being featured
      certifications: faker.helpers.arrayElements([
        'FDA Approved', 'Organic Certified', 'ISO 9001', 'HACCP', 'Halal Certified'
      ], faker.number.int({ min: 0, max: 3 })),
      socialMedia: {
        website: faker.internet.url(),
        linkedin: faker.internet.url(),
        facebook: faker.internet.url(),
      },
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  /**
   * Create registration data for auth tests
   */
  static createRegistrationData(overrides: Partial<unknown> = {}): unknown {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    return {
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      password: 'Password123!',
      firstName,
      lastName,
      phone: faker.phone.number('+1##########'),
      role: faker.helpers.arrayElement([UserRole.CUSTOMER, UserRole.RESTAURANT, UserRole.EMPLOYEE, UserRole.VENDOR]),
      termsAccepted: true,
      ...overrides,
    };
  }

  /**
   * Create login credentials for auth tests
   */
  static createLoginCredentials(overrides: Partial<unknown> = {}): unknown {
    return {
      email: faker.internet.email().toLowerCase(),
      password: 'Password123!',
      rememberMe: faker.datatype.boolean(),
      ...overrides,
    };
  }

  /**
   * Generate realistic job description based on title
   */
  private static generateJobDescription(title: string): string {
    const baseDescriptions = {
      'Head Chef': 'Lead our culinary team in creating exceptional dining experiences. Oversee menu development, kitchen operations, and staff management.',
      'Server': 'Provide outstanding customer service while taking orders, serving food, and ensuring guest satisfaction.',
      'Bartender': 'Craft exceptional cocktails and beverages while providing friendly service to bar guests.',
      'Manager': 'Oversee daily restaurant operations, manage staff, and ensure excellent customer service and profitability.',
    };

    const genericTitle = Object.keys(baseDescriptions).find(key => title.includes(key)) || 'Default';
    const baseDescription = baseDescriptions[genericTitle] || 'Join our team and contribute to our restaurant\'s success in a dynamic, fast-paced environment.';

    return `${baseDescription} ${faker.lorem.paragraph()}`;
  }

  /**
   * Generate job requirements based on title
   */
  private static generateJobRequirements(title: string): string[] {
    const commonRequirements = [
      'Must be 18 years or older',
      'Ability to work flexible hours including weekends',
      'Strong communication skills',
      'Team player with positive attitude',
    ];

    const specificRequirements = {
      'Chef': ['Culinary degree or equivalent experience', 'Food safety certification', 'Knife skills'],
      'Server': ['Previous serving experience preferred', 'Ability to carry multiple plates', 'POS system knowledge'],
      'Bartender': ['Mixology knowledge', 'Responsible service of alcohol certification', 'Cash handling experience'],
      'Manager': ['Management experience required', 'P&L responsibility', 'Staff scheduling experience'],
    };

    const titleKey = Object.keys(specificRequirements).find(key => title.includes(key));
    const specific = titleKey ? specificRequirements[titleKey] : [];

    return [...commonRequirements, ...specific];
  }

  /**
   * Generate job skills based on title
   */
  private static generateJobSkills(title: string): string[] {
    const commonSkills = ['Communication', 'Time Management', 'Teamwork', 'Customer Service'];

    const specificSkills = {
      'Chef': ['Cooking', 'Menu Planning', 'Food Safety', 'Kitchen Management', 'Recipe Development'],
      'Server': ['Order Taking', 'Food Service', 'Multitasking', 'Problem Solving', 'Upselling'],
      'Bartender': ['Mixology', 'Inventory Management', 'Cash Handling', 'Customer Relations'],
      'Manager': ['Leadership', 'Staff Management', 'Financial Management', 'Operations', 'Training'],
    };

    const titleKey = Object.keys(specificSkills).find(key => title.includes(key));
    const specific = titleKey ? specificSkills[titleKey] : ['Attention to Detail', 'Reliability'];

    return [...commonSkills, ...specific];
  }

  /**
   * Generate job responsibilities
   */
  private static generateJobResponsibilities(title: string): string[] {
    const baseResponsibilities = [
      'Maintain high standards of quality and service',
      'Follow health and safety protocols',
      'Work collaboratively with team members',
      'Complete assigned tasks efficiently',
    ];

    const specificResponsibilities = {
      'Chef': [
        'Plan and prepare menu items',
        'Manage kitchen staff and operations',
        'Ensure food quality and presentation',
        'Control food costs and inventory',
      ],
      'Server': [
        'Take customer orders accurately',
        'Serve food and beverages promptly',
        'Process payments and handle cash',
        'Maintain clean dining area',
      ],
    };

    const titleKey = Object.keys(specificResponsibilities).find(key => title.includes(key));
    const specific = titleKey ? specificResponsibilities[titleKey] : [];

    return [...baseResponsibilities, ...specific];
  }

  /**
   * Generate job benefits
   */
  private static generateJobBenefits(): string[] {
    return faker.helpers.arrayElements([
      'Competitive salary',
      'Health insurance',
      'Paid time off',
      'Employee meals',
      'Flexible scheduling',
      'Career advancement opportunities',
      'Training and development',
      '401(k) plan',
      'Employee discounts',
      'Performance bonuses',
    ], faker.number.int({ min: 3, max: 6 }));
  }

  /**
   * Create test session data
   */
  static createSession(overrides: Partial<unknown> = {}): unknown {
    return {
      id: this.generateId('session'),
      userId: this.generateId('user'),
      token: faker.string.alphanumeric(64),
      refreshToken: faker.string.alphanumeric(64),
      ipAddress: faker.internet.ip(),
      userAgent: faker.internet.userAgent(),
      expiresAt: faker.date.future(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  /**
   * Create test notification data
   */
  static createNotification(overrides: Partial<unknown> = {}): unknown {
    return {
      id: this.generateId('notification'),
      userId: this.generateId('user'),
      title: faker.lorem.sentence(),
      message: faker.lorem.paragraph(),
      type: faker.helpers.arrayElement(['INFO', 'SUCCESS', 'WARNING', 'ERROR']),
      category: faker.helpers.arrayElement(['SYSTEM', 'ORDER', 'JOB', 'PROMOTION', 'REMINDER']),
      isRead: faker.datatype.boolean(),
      actionUrl: faker.internet.url(),
      metadata: {
        orderId: faker.datatype.boolean(0.3) ? this.generateId('order') : null,
        jobId: faker.datatype.boolean(0.2) ? this.generateId('job') : null,
      },
      createdAt: faker.date.past(),
      readAt: faker.datatype.boolean(0.6) ? faker.date.recent() : null,
      ...overrides,
    };
  }

  /**
   * Create multiple test records
   */
  static createMultiple<T>(factory: () => T, count: number): T[] {
    return Array.from({ length: count }, factory);
  }

  /**
   * Create test data with relationships
   */
  static createUserWithRestaurant(userOverrides: Partial<unknown> = {}, restaurantOverrides: Partial<unknown> = {}): unknown {
    const user = this.createUser({ role: UserRole.RESTAURANT, ...userOverrides });
    const restaurant = this.createRestaurant({ userId: user.id, ...restaurantOverrides });

    return {
      user: { ...user, restaurant },
      restaurant: { ...restaurant, user },
    };
  }

  /**
   * Create test data for job with restaurant and applications
   */
  static createJobWithApplications(
    jobOverrides: Partial<unknown> = {},
    restaurantOverrides: Partial<unknown> = {},
    applicationCount = 3
  ): unknown {
    const restaurant = this.createRestaurant(restaurantOverrides);
    const job = this.createJob({ restaurantId: restaurant.id, ...jobOverrides });
    const applications = this.createMultiple(
      () => this.createJobApplication({ jobId: job.id }),
      applicationCount
    );

    return {
      job: { ...job, restaurant, jobApplications: applications },
      restaurant: { ...restaurant, jobs: [job] },
      applications,
    };
  }

  /**
   * Reset faker seed for deterministic tests
   */
  static resetSeed(seed = 12345): void {
    faker.seed(seed);
  }

  /**
   * Generate test data for performance testing
   */
  static generateLargeDataset(count = 1000): unknown {
    this.resetSeed();

    return {
      users: this.createMultiple(() => this.createUser(), count),
      restaurants: this.createMultiple(() => this.createRestaurant(), Math.floor(count * 0.1)),
      jobs: this.createMultiple(() => this.createJob(), Math.floor(count * 0.2)),
      applications: this.createMultiple(() => this.createJobApplication(), Math.floor(count * 0.5)),
    };
  }
}

export default EnhancedTestFactories;