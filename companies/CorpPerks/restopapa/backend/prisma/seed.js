import logger from './utils/logger';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  logger.info('🌱 Starting database seed...');

  // Check if data already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@restauranthub.com' }
  });

  if (existingAdmin) {
    logger.info('✅ Database already seeded! Skipping...');
    logger.info('\n🔑 Sample Login Credentials:');
    logger.info('Admin: admin@restauranthub.com / admin123');
    logger.info('Restaurant: restaurant@example.com / password123');
    logger.info('Employee: employee@example.com / password123');
    logger.info('Vendor: vendor@example.com / password123');
    return;
  }

  // Create subscription plans
  const plans = await Promise.all([
    prisma.subscriptionPlan.create({
      data: {
        name: 'Free',
        price: 0,
        durationDays: 365,
        features: JSON.stringify({
          jobPosts: 1,
          employeeVerifications: 0,
          analytics: false,
          fraudAlerts: false,
        }),
      },
    }),
    prisma.subscriptionPlan.create({
      data: {
        name: 'Basic',
        price: 99900, // ₹999 in paise
        durationDays: 30,
        features: JSON.stringify({
          jobPosts: 10,
          employeeVerifications: 5,
          analytics: true,
          fraudAlerts: true,
        }),
      },
    }),
    prisma.subscriptionPlan.create({
      data: {
        name: 'Professional',
        price: 299900, // ₹2999 in paise
        durationDays: 30,
        features: JSON.stringify({
          jobPosts: 50,
          employeeVerifications: 25,
          analytics: true,
          fraudAlerts: true,
          premiumSupport: true,
        }),
      },
    }),
  ]);

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@restauranthub.com',
      passwordHash: adminPasswordHash,
      role: 'admin',
      isEmailVerified: true,
      isActive: true,
    },
  });

  // Create sample restaurant user
  const restaurantPasswordHash = await bcrypt.hash('password123', 12);
  const restaurantUser = await prisma.user.create({
    data: {
      email: 'restaurant@example.com',
      phone: '+91-9876543210',
      passwordHash: restaurantPasswordHash,
      role: 'restaurant',
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true,
    },
  });

  const restaurant = await prisma.restaurant.create({
    data: {
      userId: restaurantUser.id,
      businessName: 'Tasty Bites Restaurant',
      ownerName: 'John Doe',
      category: 'casual_dining',
      gstNumber: '27AAAAA1234A1Z5',
      fssaiLicense: '12345678901234',
      revenueRange: '10L-50L',
      totalEmployees: 25,
      websiteUrl: 'https://tastybites.com',
      description: 'A popular casual dining restaurant serving authentic Indian cuisine with a modern twist.',
      isVerified: true,
      trustScore: 85,
      subscriptionPlan: 'Professional',
      subscriptionStatus: 'active',
      subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  // Add restaurant address
  await prisma.restaurantAddress.create({
    data: {
      restaurantId: restaurant.id,
      addressLine1: '123 MG Road',
      addressLine2: 'Near City Center Mall',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      country: 'India',
      isPrimary: true,
      latitude: 19.0760,
      longitude: 72.8777,
    },
  });

  // Create sample employee user
  const employeePasswordHash = await bcrypt.hash('password123', 12);
  const employeeUser = await prisma.user.create({
    data: {
      email: 'employee@example.com',
      phone: '+91-9876543211',
      passwordHash: employeePasswordHash,
      role: 'employee',
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true,
    },
  });

  const employee = await prisma.employee.create({
    data: {
      userId: employeeUser.id,
      fullName: 'Jane Smith',
      dateOfBirth: new Date('1995-05-15'),
      gender: 'Female',
      maritalStatus: 'Single',
      totalExperienceMonths: 36, // 3 years
      education: 'Hotel Management Diploma',
      certifications: 'Food Safety Certification, Customer Service Training',
      skills: JSON.stringify(['Cooking', 'Customer Service', 'Team Leadership', 'Food Presentation']),
      aadhaarVerificationStatus: 'verified',
      reliabilityScore: 92,
      isProfileComplete: true,
    },
  });

  // Add employee addresses
  await Promise.all([
    prisma.employeeAddress.create({
      data: {
        employeeId: employee.id,
        addressType: 'permanent',
        addressLine1: '456 Park Street',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700016',
        country: 'India',
      },
    }),
    prisma.employeeAddress.create({
      data: {
        employeeId: employee.id,
        addressType: 'current',
        addressLine1: '789 Link Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050',
        country: 'India',
      },
    }),
  ]);

  // Create employment history
  await prisma.employmentHistory.create({
    data: {
      employeeId: employee.id,
      restaurantId: restaurant.id,
      position: 'Senior Chef',
      department: 'Kitchen',
      joiningDate: new Date('2022-01-15'),
      salaryRange: '25K-30K',
      isCurrent: true,
      isVerifiedByEmployer: true,
      isVerifiedByEmployee: true,
    },
  });

  // Create sample vendor user
  const vendorPasswordHash = await bcrypt.hash('password123', 12);
  const vendorUser = await prisma.user.create({
    data: {
      email: 'vendor@example.com',
      phone: '+91-9876543212',
      passwordHash: vendorPasswordHash,
      role: 'vendor',
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true,
    },
  });

  const vendor = await prisma.vendor.create({
    data: {
      userId: vendorUser.id,
      businessName: 'Fresh Farm Supplies',
      ownerName: 'Mike Wilson',
      category: 'raw_materials',
      gstNumber: '27BBBBB1234B1Z5',
      description: 'Premium quality fresh vegetables, fruits, and dairy products for restaurants.',
      isVerified: true,
      trustScore: 88,
      isPremium: true,
    },
  });

  // Add vendor address
  await prisma.vendorAddress.create({
    data: {
      vendorId: vendor.id,
      addressLine1: '101 Wholesale Market',
      addressLine2: 'Sector 15',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400070',
      country: 'India',
      isPrimary: true,
    },
  });

  // Create vendor offerings
  await Promise.all([
    prisma.vendorOffering.create({
      data: {
        vendorId: vendor.id,
        title: 'Fresh Organic Vegetables',
        description: 'Farm-fresh organic vegetables delivered daily',
        category: 'vegetables',
        priceRange: '₹50-500/kg',
        images: JSON.stringify(['/images/vegetables.jpg', '/images/fresh-produce.jpg']),
        isFeatured: true,
        isActive: true,
      },
    }),
    prisma.vendorOffering.create({
      data: {
        vendorId: vendor.id,
        title: 'Premium Dairy Products',
        description: 'High-quality milk, cheese, and dairy products',
        category: 'dairy',
        priceRange: '₹40-200/unit',
        images: JSON.stringify(['/images/dairy.jpg']),
        isFeatured: false,
        isActive: true,
      },
    }),
  ]);

  // Create sample jobs
  const job1 = await prisma.job.create({
    data: {
      restaurantId: restaurant.id,
      title: 'Experienced Chef Wanted',
      description: 'We are looking for an experienced chef to join our kitchen team. Must have 3+ years experience in Indian cuisine.',
      position: 'Chef',
      department: 'Kitchen',
      employmentType: 'full_time',
      salaryMin: 25000,
      salaryMax: 35000,
      experienceMin: 36, // 3 years in months
      experienceMax: 120, // 10 years in months
      location: 'Mumbai, Maharashtra',
      requirements: JSON.stringify(['3+ years cooking experience', 'Knowledge of Indian cuisine', 'Food safety certification']),
      benefits: JSON.stringify(['Health insurance', 'Paid leave', 'Performance bonus']),
      status: 'open',
      isPremium: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      createdBy: restaurantUser.id,
    },
  });

  const job2 = await prisma.job.create({
    data: {
      restaurantId: restaurant.id,
      title: 'Friendly Waiter/Waitress',
      description: 'Join our front-of-house team! We need enthusiastic waiters/waitresses with excellent customer service skills.',
      position: 'Waiter',
      department: 'Service',
      employmentType: 'full_time',
      salaryMin: 18000,
      salaryMax: 25000,
      experienceMin: 0,
      experienceMax: 24, // 2 years
      location: 'Mumbai, Maharashtra',
      requirements: JSON.stringify(['Good communication skills', 'Customer service experience preferred', 'Flexible working hours']),
      benefits: JSON.stringify(['Tips', 'Staff meals', 'Growth opportunities']),
      status: 'open',
      isPremium: false,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      createdBy: restaurantUser.id,
    },
  });

  // Create job application
  await prisma.jobApplication.create({
    data: {
      jobId: job1.id,
      employeeId: employee.id, // Use employee ID
      coverLetter: 'I am very interested in this chef position. With my 3 years of experience and passion for cooking, I would be a great fit for your team.',
      status: 'pending',
    },
  });

  // Create sample discussions
  const discussion1 = await prisma.discussion.create({
    data: {
      userId: restaurantUser.id,
      title: 'Looking for Reliable Delivery Partners',
      content: 'We are expanding our delivery service and need reliable delivery partners. Any recommendations for good delivery service providers in Mumbai?',
      category: 'vendor_inquiry',
      isPremium: false,
      likesCount: 5,
      commentsCount: 3,
      isActive: true,
    },
  });

  const discussion2 = await prisma.discussion.create({
    data: {
      userId: vendorUser.id,
      title: 'New Year Special: 20% Off on All Fresh Produce',
      content: 'Celebrating New Year with special discounts! Get 20% off on all fresh vegetables and fruits. Contact us for bulk orders.',
      category: 'business_offer',
      isPremium: true,
      likesCount: 12,
      commentsCount: 7,
      isActive: true,
    },
  });

  // Create discussion comments
  await Promise.all([
    prisma.discussionComment.create({
      data: {
        discussionId: discussion1.id,
        userId: vendorUser.id,
        content: 'We provide reliable delivery services across Mumbai. Would love to discuss partnership opportunities.',
        likesCount: 2,
        isActive: true,
      },
    }),
    prisma.discussionComment.create({
      data: {
        discussionId: discussion2.id,
        userId: restaurantUser.id,
        content: 'Great offer! We are interested in bulk vegetable orders. Will contact you soon.',
        likesCount: 1,
        isActive: true,
      },
    }),
  ]);

  // Create reviews
  await Promise.all([
    prisma.employeeReview.create({
      data: {
        employeeId: employee.id,
        restaurantId: restaurant.id,
        tag: 'star_employee',
        comment: 'Jane is an exceptional chef with great skills and work ethic. Always punctual and delivers high-quality work.',
        isDisputed: false,
        createdBy: restaurantUser.id,
      },
    }),
    prisma.vendorReview.create({
      data: {
        vendorId: vendor.id,
        restaurantId: restaurant.id,
        rating: 5,
        comment: 'Excellent quality products and timely delivery. Highly recommended for fresh produce.',
        createdBy: restaurantUser.id,
      },
    }),
  ]);

  // Create notifications
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: employeeUser.id,
        title: 'New Job Application',
        message: 'Your application for Chef position at Tasty Bites Restaurant has been received.',
        type: 'job_application',
        isRead: false,
        actionUrl: '/jobs/applications',
      },
    }),
    prisma.notification.create({
      data: {
        userId: restaurantUser.id,
        title: 'New Job Application Received',
        message: 'Jane Smith has applied for the Chef position.',
        type: 'job_application',
        isRead: false,
        actionUrl: '/dashboard/jobs',
      },
    }),
    prisma.notification.create({
      data: {
        userId: vendorUser.id,
        title: 'New Review Received',
        message: 'Tasty Bites Restaurant has given you a 5-star review.',
        type: 'review',
        isRead: false,
        actionUrl: '/dashboard/reviews',
      },
    }),
  ]);

  logger.info('✅ Database seeded successfully!');
  logger.info('\n🔑 Sample Login Credentials:');
  logger.info('Admin: admin@restauranthub.com / admin123');
  logger.info('Restaurant: restaurant@example.com / password123');
  logger.info('Employee: employee@example.com / password123');
  logger.info('Vendor: vendor@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });