import { User, Restaurant, Order, Job, JobApplication, UserRole, JobStatus, OrderStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';

export class TestFixtures {
  /**
   * Generate a test user with realistic data
   */
  static createUser(overrides: Partial<User> = {}): User {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      passwordHash: '$2b$12$' + faker.string.alphanumeric(50),
      role: UserRole.CUSTOMER,
      status: 'ACTIVE',
      isActive: true,
      emailVerifiedAt: faker.date.past(),
      loginCount: faker.number.int({ min: 0, max: 100 }),
      lastLoginAt: faker.date.recent(),
      refreshToken: null,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    } as User;
  }

  /**
   * Generate a test restaurant with realistic data
   */
  static createRestaurant(overrides: Partial<Restaurant> = {}): Restaurant {
    return {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      name: faker.company.name() + ' Restaurant',
      description: faker.lorem.paragraph(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      website: faker.internet.url(),
      cuisineType: [faker.helpers.arrayElement(['Indian', 'Chinese', 'Italian', 'Mexican'])],
      priceRange: faker.helpers.arrayElement(['$', '$$', '$$$', '$$$$']),
      rating: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
      totalReviews: faker.number.int({ min: 0, max: 1000 }),
      isActive: true,
      status: 'ACTIVE',
      operatingHours: {
        monday: '9:00-22:00',
        tuesday: '9:00-22:00',
        wednesday: '9:00-22:00',
        thursday: '9:00-22:00',
        friday: '9:00-23:00',
        saturday: '9:00-23:00',
        sunday: '10:00-21:00',
      },
      features: ['Delivery', 'Takeout'],
      imageUrl: faker.image.url(),
      coverImageUrl: faker.image.url(),
      gallery: [faker.image.url(), faker.image.url()],
      socialMedia: {
        facebook: faker.internet.url(),
        instagram: faker.internet.url(),
      },
      verificationStatus: 'VERIFIED',
      verificationDocuments: ['document1.pdf'],
      taxInfo: {
        gstNumber: faker.string.alphanumeric(15),
        panNumber: faker.string.alphanumeric(10),
      },
      bankDetails: {
        accountNumber: faker.finance.accountNumber(),
        ifscCode: faker.string.alphanumeric(11),
        accountHolderName: faker.person.fullName(),
      },
      subscription: {
        plan: 'BASIC',
        status: 'ACTIVE',
        validUntil: faker.date.future(),
      },
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    } as Restaurant;
  }

  /**
   * Generate a test order with realistic data
   */
  static createOrder(overrides: Partial<Order> = {}): Order {
    const subtotal = faker.number.float({ min: 100, max: 1000, fractionDigits: 2 });
    const tax = subtotal * 0.18; // 18% GST
    const deliveryFee = faker.number.float({ min: 20, max: 50, fractionDigits: 2 });

    return {
      id: faker.string.uuid(),
      customerId: faker.string.uuid(),
      restaurantId: faker.string.uuid(),
      orderNumber: faker.string.numeric(8),
      status: OrderStatus.PENDING,
      orderType: faker.helpers.arrayElement(['DELIVERY', 'PICKUP', 'DINE_IN']),
      subtotal,
      tax,
      deliveryFee,
      discount: 0,
      totalAmount: subtotal + tax + deliveryFee,
      currency: 'INR',
      paymentMethod: faker.helpers.arrayElement(['CARD', 'UPI', 'CASH', 'WALLET']),
      paymentStatus: 'PENDING',
      deliveryAddress: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        coordinates: {
          lat: faker.location.latitude(),
          lng: faker.location.longitude(),
        },
      },
      estimatedDeliveryTime: faker.date.future(),
      actualDeliveryTime: null,
      specialInstructions: faker.lorem.sentence(),
      items: [],
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    } as Order;
  }

  /**
   * Generate a test job posting with realistic data
   */
  static createJob(overrides: Partial<Job> = {}): Job {
    return {
      id: faker.string.uuid(),
      restaurantId: faker.string.uuid(),
      title: faker.person.jobTitle(),
      description: faker.lorem.paragraphs(3),
      requirements: [
        faker.lorem.sentence(),
        faker.lorem.sentence(),
        faker.lorem.sentence(),
      ],
      responsibilities: [
        faker.lorem.sentence(),
        faker.lorem.sentence(),
        faker.lorem.sentence(),
      ],
      skills: [
        faker.person.jobArea(),
        faker.person.jobType(),
        faker.helpers.arrayElement(['Communication', 'Teamwork', 'Leadership']),
      ],
      experience: faker.helpers.arrayElement(['0-1 years', '1-3 years', '3-5 years', '5+ years']),
      education: faker.helpers.arrayElement(['High School', 'Bachelor', 'Master', 'Any']),
      jobType: faker.helpers.arrayElement(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']),
      workSchedule: faker.helpers.arrayElement(['DAY_SHIFT', 'NIGHT_SHIFT', 'FLEXIBLE', 'ROTATING']),
      salaryMin: faker.number.int({ min: 15000, max: 30000 }),
      salaryMax: faker.number.int({ min: 30000, max: 100000 }),
      currency: 'INR',
      benefits: ['Health Insurance', 'Paid Leave', 'Training'],
      location: faker.location.city(),
      isRemote: faker.datatype.boolean(),
      status: JobStatus.OPEN,
      priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
      validTill: faker.date.future(),
      tags: [faker.word.noun(), faker.word.noun()],
      applicationCount: faker.number.int({ min: 0, max: 50 }),
      viewCount: faker.number.int({ min: 0, max: 500 }),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    } as Job;
  }

  /**
   * Generate a test job application with realistic data
   */
  static createJobApplication(overrides: Partial<JobApplication> = {}): JobApplication {
    return {
      id: faker.string.uuid(),
      jobId: faker.string.uuid(),
      employeeId: faker.string.uuid(),
      status: faker.helpers.arrayElement(['PENDING', 'REVIEWED', 'SHORTLISTED', 'REJECTED', 'HIRED']),
      coverLetter: faker.lorem.paragraphs(2),
      resumeUrl: faker.internet.url(),
      portfolioUrl: faker.internet.url(),
      availability: {
        startDate: faker.date.future(),
        preferredShifts: ['MORNING', 'EVENING'],
        hoursPerWeek: faker.number.int({ min: 20, max: 40 }),
      },
      expectedSalary: faker.number.int({ min: 20000, max: 80000 }),
      experience: faker.lorem.paragraph(),
      skills: [faker.person.jobArea(), faker.person.jobType()],
      references: [
        {
          name: faker.person.fullName(),
          position: faker.person.jobTitle(),
          company: faker.company.name(),
          phone: faker.phone.number(),
          email: faker.internet.email(),
        },
      ],
      notes: faker.lorem.sentence(),
      appliedAt: faker.date.past(),
      reviewedAt: null,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    } as JobApplication;
  }

  /**
   * Generate test profile data
   */
  static createProfile(overrides = {}) {
    return {
      id: faker.string.uuid(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phoneNumber: faker.phone.number(),
      dateOfBirth: faker.date.birthdate(),
      gender: faker.helpers.arrayElement(['MALE', 'FEMALE', 'OTHER']),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      avatar: faker.image.avatar(),
      bio: faker.lorem.paragraph(),
      preferences: {
        language: 'en',
        notifications: true,
        newsletter: true,
      },
      socialProfiles: {
        linkedin: faker.internet.url(),
        twitter: faker.internet.userName(),
      },
      emergencyContact: {
        name: faker.person.fullName(),
        phone: faker.phone.number(),
        relationship: faker.helpers.arrayElement(['Spouse', 'Parent', 'Sibling', 'Friend']),
      },
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  /**
   * Generate test employee data
   */
  static createEmployee(overrides = {}) {
    return {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      skills: [faker.person.jobArea(), faker.person.jobType()],
      experience: faker.helpers.arrayElement(['0-1 years', '1-3 years', '3-5 years', '5+ years']),
      education: faker.helpers.arrayElement(['High School', 'Bachelor', 'Master', 'PhD']),
      certifications: [faker.lorem.word()],
      availability: {
        daysAvailable: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        preferredShifts: ['MORNING', 'EVENING'],
        hoursPerWeek: faker.number.int({ min: 20, max: 40 }),
      },
      expectedSalary: faker.number.int({ min: 20000, max: 80000 }),
      portfolio: {
        resumeUrl: faker.internet.url(),
        portfolioUrl: faker.internet.url(),
        linkedinUrl: faker.internet.url(),
      },
      isAvailable: true,
      rating: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
      totalReviews: faker.number.int({ min: 0, max: 100 }),
      jobsCompleted: faker.number.int({ min: 0, max: 50 }),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  /**
   * Generate multiple records of a given type
   */
  static createMany<T>(
    factory: (overrides?) => T,
    count: number,
    overrides?: unknown
  ): T[] {
    return Array.from({ length: count }, () => factory(overrides));
  }

  /**
   * Generate realistic test session data
   */
  static createSession(overrides = {}) {
    return {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      token: faker.string.alphanumeric(64),
      deviceInfo: {
        userAgent: faker.internet.userAgent(),
        ip: faker.internet.ip(),
        platform: faker.helpers.arrayElement(['web', 'mobile', 'tablet']),
        location: {
          city: faker.location.city(),
          country: faker.location.country(),
        },
      },
      isActive: true,
      lastActiveAt: faker.date.recent(),
      createdAt: faker.date.past(),
      expiresAt: faker.date.future(),
      ...overrides,
    };
  }

  /**
   * Generate test notification data
   */
  static createNotification(overrides = {}) {
    return {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      title: faker.lorem.sentence(),
      message: faker.lorem.paragraph(),
      type: faker.helpers.arrayElement(['INFO', 'SUCCESS', 'WARNING', 'ERROR']),
      category: faker.helpers.arrayElement(['ORDER', 'JOB', 'PAYMENT', 'SYSTEM']),
      data: {
        entityId: faker.string.uuid(),
        actionUrl: faker.internet.url(),
      },
      isRead: false,
      readAt: null,
      createdAt: faker.date.past(),
      ...overrides,
    };
  }
}