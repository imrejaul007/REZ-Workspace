import logger from './utils/logger';

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'argon2';

const prisma = new PrismaClient();

const USER_ROLES = ['ADMIN', 'RESTAURANT', 'VENDOR', 'EMPLOYEE'] as const;
const VERIFICATION_STATUS = ['PENDING', 'VERIFIED', 'REJECTED'] as const;
const ORDER_STATUS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'] as const;
const PAYMENT_STATUS = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'] as const;

// Food categories and items for realistic data
const FOOD_CATEGORIES = [
  {
    name: 'Appetizers',
    items: ['Samosa', 'Spring Rolls', 'Chicken Wings', 'Paneer Tikka', 'Fish Fingers', 'Bruschetta', 'Nachos']
  },
  {
    name: 'Main Course',
    items: ['Butter Chicken', 'Biryani', 'Dal Makhani', 'Pasta Alfredo', 'Grilled Fish', 'Mutton Curry', 'Vegetable Thali']
  },
  {
    name: 'Desserts',
    items: ['Gulab Jamun', 'Ice Cream', 'Chocolate Cake', 'Rasmalai', 'Tiramisu', 'Kulfi', 'Brownie']
  },
  {
    name: 'Beverages',
    items: ['Lassi', 'Coffee', 'Fresh Juice', 'Soft Drinks', 'Tea', 'Milkshake', 'Mocktails']
  },
  {
    name: 'Ingredients',
    items: ['Basmati Rice', 'Chicken', 'Paneer', 'Vegetables', 'Spices', 'Oil', 'Flour', 'Lentils']
  },
];

const RESTAURANT_NAMES = [
  'Spice Junction', 'The Golden Fork', 'Taste of India', 'Urban Bites', 'Café Delight',
  'Royal Kitchen', 'Food Paradise', 'The Hungry Soul', 'Flavors of Asia', 'Desi Dhaba',
  'Corner Bistro', 'Masala House', 'The Great Indian', 'Street Food Co.', 'Curry Express',
  'Tandoor Nights', 'Mumbai Chaat', 'South Indian Flavors', 'Punjabi Haveli', 'Coastal Kitchen'
];

const VENDOR_NAMES = [
  'Fresh Farm Supplies', 'Metro Food Distributors', 'Quality Ingredients Co.', 'Urban Suppliers',
  'Wholesale Food Hub', 'Prime Vendors', 'Agro Fresh Solutions', 'Daily Needs Suppliers',
  'Kitchen Essentials', 'Bulk Food Mart', 'Restaurant Supply Co.', 'Food Chain Solutions',
  'Organic Suppliers', 'Spice Merchants', 'Dairy Fresh Ltd', 'Meat Masters', 'Veggie Vault',
  'Grain & More', 'Beverage Suppliers', 'Frozen Foods Inc'
];

const JOB_TITLES = [
  'Head Chef', 'Sous Chef', 'Line Cook', 'Kitchen Helper', 'Waiter', 'Waitress',
  'Bartender', 'Cashier', 'Manager', 'Assistant Manager', 'Delivery Boy',
  'Cleaner', 'Security Guard', 'Receptionist', 'Food Runner'
];

const EMPLOYEE_NAMES = [
  'Rahul Kumar', 'Priya Sharma', 'Amit Singh', 'Sneha Patel', 'Ravi Gupta',
  'Anjali Verma', 'Suresh Yadav', 'Pooja Jain', 'Vikash Modi', 'Kavita Agarwal',
  'Deepak Shah', 'Meera Nair', 'Rajesh Tiwari', 'Sunita Joshi', 'Manoj Dubey'
];

const SKILLS = [
  'Cooking', 'Customer Service', 'Food Safety', 'Team Management', 'POS Systems',
  'Inventory Management', 'Food Preparation', 'Cash Handling', 'Communication',
  'Time Management', 'Problem Solving', 'Menu Planning', 'Quality Control'
];

const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad',
  'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur',
  'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna'
];

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password);
}

async function createUsers() {
  logger.info('Creating users...');

  // Create demo admin user first
  const demoAdmin = await prisma.user.create({
    data: {
      firstName: 'Demo',
      lastName: 'Admin',
      email: 'admin@demo.com',
      phone: '9876543210',
      passwordHash: await hashPassword('Password123'),
      role: 'ADMIN',
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
      avatar: faker.image.avatar(),
    },
  });

  // Create 4 more admin users
  const adminUsers = [demoAdmin];
  for (let i = 0; i < 4; i++) {
    const admin = await prisma.user.create({
      data: {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email().toLowerCase(),
        phone: faker.phone.number('##########'),
        passwordHash: await hashPassword('Password123'),
        role: 'ADMIN',
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        avatar: faker.image.avatar(),
      },
    });
    adminUsers.push(admin);
  }

  // Create demo restaurant user first
  const demoRestaurant = await prisma.user.create({
    data: {
      firstName: 'Demo',
      lastName: 'Restaurant',
      email: 'restaurant@demo.com',
      phone: '9876543211',
      passwordHash: await hashPassword('Password123'),
      role: 'RESTAURANT',
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
      avatar: faker.image.avatar(),
    },
  });

  // Create 49 more restaurant users
  const restaurantUsers = [demoRestaurant];
  for (let i = 0; i < 49; i++) {
    const restaurant = await prisma.user.create({
      data: {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email().toLowerCase(),
        phone: faker.phone.number('##########'),
        passwordHash: await hashPassword('Password123'),
        role: 'RESTAURANT',
        isActive: true,
        emailVerified: faker.datatype.boolean(0.8),
        phoneVerified: faker.datatype.boolean(0.9),
        avatar: faker.image.avatar(),
      },
    });
    restaurantUsers.push(restaurant);
  }

  // Create demo vendor user first
  const demoVendor = await prisma.user.create({
    data: {
      firstName: 'Demo',
      lastName: 'Vendor',
      email: 'vendor@demo.com',
      phone: '9876543212',
      passwordHash: await hashPassword('Password123'),
      role: 'VENDOR',
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
      avatar: faker.image.avatar(),
    },
  });

  // Create 29 more vendor users
  const vendorUsers = [demoVendor];
  for (let i = 0; i < 29; i++) {
    const vendor = await prisma.user.create({
      data: {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email().toLowerCase(),
        phone: faker.phone.number('##########'),
        passwordHash: await hashPassword('Password123'),
        role: 'VENDOR',
        isActive: true,
        emailVerified: faker.datatype.boolean(0.8),
        phoneVerified: faker.datatype.boolean(0.9),
        avatar: faker.image.avatar(),
      },
    });
    vendorUsers.push(vendor);
  }

  // Create demo employee user first
  const demoEmployee = await prisma.user.create({
    data: {
      firstName: 'Demo',
      lastName: 'Employee',
      email: 'employee@demo.com',
      phone: '9876543213',
      passwordHash: await hashPassword('Password123'),
      role: 'EMPLOYEE',
      isActive: true,
      emailVerified: true,
      phoneVerified: true,
      avatar: faker.image.avatar(),
    },
  });

  // Create 99 more employee users
  const employeeUsers = [demoEmployee];
  for (let i = 0; i < 99; i++) {
    const employee = await prisma.user.create({
      data: {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email().toLowerCase(),
        phone: faker.phone.number('##########'),
        passwordHash: await hashPassword('Password123'),
        role: 'EMPLOYEE',
        isActive: true,
        emailVerified: faker.datatype.boolean(0.7),
        phoneVerified: faker.datatype.boolean(0.8),
        avatar: faker.image.avatar(),
      },
    });
    employeeUsers.push(employee);
  }

  return { adminUsers, restaurantUsers, vendorUsers, employeeUsers };
}

async function createRestaurantProfiles(restaurantUsers: unknown[]) {
  logger.info('Creating restaurant profiles...');
  
  const restaurants = [];
  for (let i = 0; i < restaurantUsers.length; i++) {
    const user = restaurantUsers[i];
    const restaurant = await prisma.restaurant.create({
      data: {
        userId: user.id,
        businessName: RESTAURANT_NAMES[i % RESTAURANT_NAMES.length] + (i > RESTAURANT_NAMES.length - 1 ? ` ${Math.floor(i / RESTAURANT_NAMES.length) + 1}` : ''),
        description: faker.lorem.paragraph(),
        cuisine: faker.helpers.arrayElement(['Indian', 'Chinese', 'Italian', 'Mexican', 'Continental', 'Thai', 'Japanese']),
        address: faker.location.streetAddress(),
        city: faker.helpers.arrayElement(CITIES),
        state: 'Maharashtra',
        country: 'India',
        pincode: faker.location.zipCode('######'),
        phone: faker.phone.number('##########'),
        email: user.email,
        website: faker.internet.url(),
        gstNumber: faker.string.alphanumeric(15).toUpperCase(),
        fssaiNumber: faker.string.numeric(14),
        verificationStatus: faker.helpers.arrayElement(VERIFICATION_STATUS),
        isActive: true,
        logo: faker.image.urlLoremFlickr({ category: 'restaurant' }),
        banner: faker.image.urlLoremFlickr({ category: 'food' }),
        rating: faker.number.float({ min: 3.0, max: 5.0, precision: 0.1 }),
        reviewCount: faker.number.int({ min: 10, max: 500 }),
        averageDeliveryTime: faker.number.int({ min: 20, max: 60 }),
        minimumOrderAmount: faker.number.float({ min: 100, max: 300 }),
        deliveryRadius: faker.number.int({ min: 5, max: 15 }),
        latitude: faker.location.latitude(),
        longitude: faker.location.longitude(),
        openingTime: '09:00',
        closingTime: '22:00',
        isOpen: faker.datatype.boolean(0.8),
        capacity: faker.number.int({ min: 20, max: 200 }),
        staffCount: faker.number.int({ min: 5, max: 50 }),
      },
    });
    restaurants.push(restaurant);
  }

  return restaurants;
}

async function createVendorProfiles(vendorUsers: unknown[]) {
  logger.info('Creating vendor profiles...');
  
  const vendors = [];
  for (let i = 0; i < vendorUsers.length; i++) {
    const user = vendorUsers[i];
    const vendor = await prisma.vendor.create({
      data: {
        userId: user.id,
        businessName: VENDOR_NAMES[i % VENDOR_NAMES.length] + (i > VENDOR_NAMES.length - 1 ? ` ${Math.floor(i / VENDOR_NAMES.length) + 1}` : ''),
        description: faker.lorem.paragraph(),
        businessType: faker.helpers.arrayElement(['MANUFACTURER', 'DISTRIBUTOR', 'WHOLESALER', 'SUPPLIER']),
        address: faker.location.streetAddress(),
        city: faker.helpers.arrayElement(CITIES),
        state: 'Maharashtra',
        country: 'India',
        pincode: faker.location.zipCode('######'),
        phone: faker.phone.number('##########'),
        email: user.email,
        website: faker.internet.url(),
        gstNumber: faker.string.alphanumeric(15).toUpperCase(),
        panNumber: faker.string.alphanumeric(10).toUpperCase(),
        verificationStatus: faker.helpers.arrayElement(VERIFICATION_STATUS),
        isActive: true,
        logo: faker.image.urlLoremFlickr({ category: 'business' }),
        banner: faker.image.urlLoremFlickr({ category: 'warehouse' }),
        rating: faker.number.float({ min: 3.5, max: 5.0, precision: 0.1 }),
        reviewCount: faker.number.int({ min: 5, max: 200 }),
        minimumOrderAmount: faker.number.float({ min: 500, max: 2000 }),
        deliveryRadius: faker.number.int({ min: 10, max: 50 }),
        processingTime: faker.number.int({ min: 1, max: 7 }),
        bankName: faker.company.name() + ' Bank',
        accountNumber: faker.finance.accountNumber(),
        ifscCode: faker.string.alphanumeric(11).toUpperCase(),
        accountHolderName: user.firstName + ' ' + user.lastName,
      },
    });
    vendors.push(vendor);
  }

  return vendors;
}

async function createEmployeeProfiles(employeeUsers: unknown[], restaurants: unknown[]) {
  logger.info('Creating employee profiles...');
  
  const employees = [];
  for (let i = 0; i < employeeUsers.length; i++) {
    const user = employeeUsers[i];
    const restaurant = faker.helpers.arrayElement(restaurants);
    
    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        restaurantId: restaurant.id,
        employeeCode: `EMP${String(i + 1).padStart(4, '0')}`,
        designation: faker.helpers.arrayElement(JOB_TITLES),
        department: faker.helpers.arrayElement(['Kitchen', 'Service', 'Management', 'Delivery', 'Cleaning']),
        aadharNumber: faker.string.numeric(12),
        aadharVerified: faker.datatype.boolean(0.6),
        verifiedAt: faker.date.past(),
        salary: faker.number.float({ min: 15000, max: 50000 }),
        joiningDate: faker.date.past({ years: 2 }),
        isActive: faker.datatype.boolean(0.9),
      },
    });
    employees.push(employee);
  }

  return employees;
}

async function createProducts(vendors: unknown[], restaurants: unknown[]) {
  logger.info('Creating products...');
  
  const products = [];
  
  // Create vendor products (for marketplace)
  for (const vendor of vendors) {
    const productCount = faker.number.int({ min: 8, max: 20 });
    
    for (let i = 0; i < productCount; i++) {
      const category = faker.helpers.arrayElement(FOOD_CATEGORIES);
      const product = await prisma.product.create({
        data: {
          vendorId: vendor.id,
          name: faker.helpers.arrayElement(category.items),
          description: faker.lorem.sentence(),
          category: category.name,
          subcategory: faker.helpers.arrayElement(['Premium', 'Standard', 'Bulk', 'Fresh', 'Frozen']),
          price: faker.number.float({ min: 50, max: 2000, precision: 0.01 }),
          unit: faker.helpers.arrayElement(['kg', 'piece', 'liter', 'packet', 'box']),
          stockQuantity: faker.number.int({ min: 10, max: 1000 }),
          minOrderQty: faker.number.int({ min: 1, max: 10 }),
          maxOrderQty: faker.number.int({ min: 50, max: 500 }),
          images: [
            faker.image.urlLoremFlickr({ category: 'food' }),
            faker.image.urlLoremFlickr({ category: 'food' })
          ],
          tags: faker.helpers.arrayElements(['fresh', 'organic', 'premium', 'bulk', 'daily'], { min: 1, max: 3 }),
          sku: faker.string.alphanumeric(8).toUpperCase(),
          barcode: faker.string.numeric(13),
          isActive: true,
          isAvailable: faker.datatype.boolean(0.9),
          rating: faker.number.float({ min: 3.0, max: 5.0, precision: 0.1 }),
          reviewCount: faker.number.int({ min: 0, max: 100 }),
          views: faker.number.int({ min: 0, max: 1000 }),
          orderCount: faker.number.int({ min: 0, max: 200 }),
          isFeatured: faker.datatype.boolean(0.2),
          weight: faker.number.float({ min: 0.1, max: 50.0 }),
          dimensions: `${faker.number.int({ min: 10, max: 50 })}x${faker.number.int({ min: 10, max: 50 })}x${faker.number.int({ min: 5, max: 30 })}`,
          shelfLife: faker.number.int({ min: 7, max: 365 }),
          storageInstructions: faker.lorem.sentence(),
        },
      });
      products.push(product);
    }
  }

  // Create restaurant products (for customer orders)
  for (const restaurant of restaurants.slice(0, 30)) { // Only first 30 restaurants
    const productCount = faker.number.int({ min: 10, max: 25 });
    
    for (let i = 0; i < productCount; i++) {
      const category = faker.helpers.arrayElement(FOOD_CATEGORIES);
      const product = await prisma.product.create({
        data: {
          restaurantId: restaurant.id,
          name: faker.helpers.arrayElement(category.items),
          description: faker.lorem.sentence(),
          category: category.name,
          subcategory: faker.helpers.arrayElement(['Veg', 'Non-Veg', 'Vegan', 'Jain', 'Spicy']),
          price: faker.number.float({ min: 80, max: 600, precision: 0.01 }),
          unit: 'piece',
          stockQuantity: faker.number.int({ min: 5, max: 100 }),
          minOrderQty: 1,
          maxOrderQty: 10,
          images: [
            faker.image.urlLoremFlickr({ category: 'food' }),
            faker.image.urlLoremFlickr({ category: 'food' })
          ],
          tags: faker.helpers.arrayElements(['spicy', 'mild', 'popular', 'chef-special', 'bestseller'], { min: 1, max: 3 }),
          sku: faker.string.alphanumeric(8).toUpperCase(),
          isActive: true,
          isAvailable: faker.datatype.boolean(0.95),
          rating: faker.number.float({ min: 3.5, max: 5.0, precision: 0.1 }),
          reviewCount: faker.number.int({ min: 5, max: 200 }),
          views: faker.number.int({ min: 10, max: 2000 }),
          orderCount: faker.number.int({ min: 5, max: 500 }),
          isFeatured: faker.datatype.boolean(0.3),
          preparationTime: faker.number.int({ min: 10, max: 45 }),
          calories: faker.number.int({ min: 200, max: 800 }),
          isVegetarian: faker.datatype.boolean(0.6),
          isVegan: faker.datatype.boolean(0.2),
          isGlutenFree: faker.datatype.boolean(0.3),
          spiceLevel: faker.number.int({ min: 1, max: 5 }),
        },
      });
      products.push(product);
    }
  }

  return products;
}

async function createOrders(restaurants: unknown[], vendors: unknown[], products: unknown[]) {
  logger.info('Creating orders...');
  
  const orders = [];
  const vendorProducts = products.filter(p => p.vendorId);
  const restaurantProducts = products.filter(p => p.restaurantId);
  
  // Create B2B orders (restaurant buying from vendors)
  for (let i = 0; i < 300; i++) {
    const restaurant = faker.helpers.arrayElement(restaurants);
    const vendor = faker.helpers.arrayElement(vendors);
    const vendorProductsForOrder = vendorProducts
      .filter(p => p.vendorId === vendor.id)
      .slice(0, faker.number.int({ min: 1, max: 5 }));
    
    if (vendorProductsForOrder.length === 0) continue;

    const orderItems = vendorProductsForOrder.map(product => ({
      productId: product.id,
      quantity: faker.number.int({ min: 1, max: product.minOrderQty * 3 }),
      unitPrice: product.price,
      totalPrice: product.price * faker.number.int({ min: 1, max: product.minOrderQty * 3 }),
    }));

    const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = subtotal * 0.18; // 18% GST
    const totalAmount = subtotal + taxAmount;

    const order = await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
        vendorId: vendor.id,
        orderNumber: `ORD${String(i + 1).padStart(6, '0')}`,
        status: faker.helpers.arrayElement(ORDER_STATUS),
        paymentStatus: faker.helpers.arrayElement(PAYMENT_STATUS),
        paymentMethod: faker.helpers.arrayElement(['CARD', 'UPI', 'NET_BANKING', 'WALLET', 'COD', 'CREDIT']),
        subtotal,
        taxAmount,
        deliveryFee: faker.number.float({ min: 0, max: 100 }),
        totalAmount,
        deliveryAddress: {
          street: faker.location.streetAddress(),
          city: faker.helpers.arrayElement(CITIES),
          state: 'Maharashtra',
          pincode: faker.location.zipCode('######'),
        },
        deliveryDate: faker.date.future(),
        notes: faker.lorem.sentence(),
        items: {
          create: orderItems,
        },
      },
    });
    orders.push(order);
  }

  return orders;
}

async function createJobs(restaurants: unknown[]) {
  logger.info('Creating jobs...');
  
  const jobs = [];
  for (let i = 0; i < 150; i++) {
    const restaurant = faker.helpers.arrayElement(restaurants);
    
    const job = await prisma.job.create({
      data: {
        restaurantId: restaurant.id,
        title: faker.helpers.arrayElement(JOB_TITLES),
        department: faker.helpers.arrayElement(['Kitchen', 'Service', 'Management', 'Delivery', 'Cleaning']),
        description: faker.lorem.paragraphs(2),
        requirements: faker.helpers.arrayElements(SKILLS, { min: 3, max: 7 }),
        location: restaurant.city,
        employmentType: faker.helpers.arrayElement(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']),
        experience: faker.helpers.arrayElement(['0-1 years', '1-3 years', '3-5 years', '5+ years']),
        salaryMin: faker.number.int({ min: 15000, max: 30000 }),
        salaryMax: faker.number.int({ min: 35000, max: 80000 }),
        benefits: faker.helpers.arrayElements(['Food', 'Transport', 'Insurance', 'PF', 'Bonus'], { min: 2, max: 4 }),
        status: faker.helpers.arrayElement(['DRAFT', 'OPEN', 'CLOSED', 'FILLED']),
        isActive: faker.datatype.boolean(0.8),
        isPriority: faker.datatype.boolean(0.3),
        validUntil: faker.date.future(),
        workingHours: '8 hours',
        workingDays: 'Monday to Sunday',
        contactEmail: restaurant.email,
        contactPhone: restaurant.phone,
      },
    });
    jobs.push(job);
  }

  return jobs;
}

async function createJobApplications(employees: unknown[], jobs: unknown[]) {
  logger.info('Creating job applications...');
  
  const applications = [];
  for (let i = 0; i < 400; i++) {
    const employee = faker.helpers.arrayElement(employees);
    const job = faker.helpers.arrayElement(jobs);
    
    // Avoid duplicate applications
    const existingApplication = await prisma.jobApplication.findFirst({
      where: {
        employeeId: employee.id,
        jobId: job.id,
      },
    });
    
    if (existingApplication) continue;

    const application = await prisma.jobApplication.create({
      data: {
        employeeId: employee.id,
        jobId: job.id,
        status: faker.helpers.arrayElement(['PENDING', 'REVIEWED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED']),
        coverLetter: faker.lorem.paragraphs(2),
        expectedSalary: faker.number.int({ min: 18000, max: 45000 }),
        availableFrom: faker.date.future(),
        skills: faker.helpers.arrayElements(SKILLS, { min: 3, max: 8 }),
        experience: faker.number.int({ min: 0, max: 10 }),
        references: [
          {
            name: faker.person.fullName(),
            phone: faker.phone.number('##########'),
            relationship: 'Previous Manager',
          },
        ],
      },
    });
    applications.push(application);
  }

  return applications;
}

async function createForumPosts(users: unknown[]) {
  logger.info('Creating forum posts...');
  
  // Create forums first
  const forums = [];
  const forumData = [
    { 
      name: 'General Discussion', 
      slug: 'general-discussion',
      description: 'General topics and discussions', 
      category: 'general',
      icon: '💬',
      color: '#3b82f6',
      displayOrder: 1
    },
    { 
      name: 'Recipe Exchange', 
      slug: 'recipe-exchange',
      description: 'Share and discover new recipes', 
      category: 'recipes',
      icon: '🍳',
      color: '#10b981',
      displayOrder: 2
    },
    { 
      name: 'Restaurant Tips', 
      slug: 'restaurant-tips',
      description: 'Tips for running restaurants', 
      category: 'business',
      icon: '🏪',
      color: '#f59e0b',
      displayOrder: 3
    },
    { 
      name: 'Job Opportunities', 
      slug: 'job-opportunities',
      description: 'Job postings and career discussions', 
      category: 'jobs',
      icon: '💼',
      color: '#8b5cf6',
      displayOrder: 4
    },
    { 
      name: 'Vendor Recommendations', 
      slug: 'vendor-recommendations',
      description: 'Find and recommend suppliers and vendors', 
      category: 'vendors',
      icon: '🤝',
      color: '#06b6d4',
      displayOrder: 5
    },
    { 
      name: 'Food Reviews', 
      slug: 'food-reviews',
      description: 'Review restaurants and dishes', 
      category: 'reviews',
      icon: '⭐',
      color: '#f97316',
      displayOrder: 6
    },
  ];

  for (const forumInfo of forumData) {
    const forum = await prisma.forum.create({
      data: {
        name: forumInfo.name,
        slug: forumInfo.slug,
        description: forumInfo.description,
        category: forumInfo.category,
        icon: forumInfo.icon,
        color: forumInfo.color,
        displayOrder: forumInfo.displayOrder,
        isActive: true,
        memberCount: 0,
        postCount: 0,
      },
    });
    forums.push(forum);
  }

  // Add subscriptions to forums
  for (const forum of forums) {
    const subscriberCount = faker.number.int({ min: 10, max: 100 });
    const subscribers = faker.helpers.arrayElements(users, subscriberCount);
    
    for (const subscriber of subscribers) {
      await prisma.forumSubscription.create({
        data: {
          forumId: forum.id,
          userId: subscriber.id,
        },
      });
    }
    
    await prisma.forum.update({
      where: { id: forum.id },
      data: { memberCount: subscriberCount },
    });
  }

  // Create posts
  const posts = [];
  for (let i = 0; i < 200; i++) {
    const author = faker.helpers.arrayElement(users);
    const forum = faker.helpers.arrayElement(forums);
    
    const title = faker.lorem.sentence();
    const slug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-') + '-' + faker.string.alphanumeric(6);
    
    const post = await prisma.forumPost.create({
      data: {
        forumId: forum.id,
        userId: author.id,
        title,
        content: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 3 })),
        slug,
        type: faker.helpers.arrayElement(['DISCUSSION', 'TIP', 'RECIPE', 'JOB_REQUEST', 'NEWS', 'REVIEW']),
        visibility: faker.helpers.arrayElement(['PUBLIC', 'FOLLOWERS', 'PRIVATE']),
        tags: faker.helpers.arrayElements(['cooking', 'tips', 'recipe', 'business', 'help', 'discussion'], { min: 1, max: 4 }),
        images: faker.datatype.boolean(0.3) ? [faker.image.url(), faker.image.url()] : [],
        isDeleted: false,
        isPinned: faker.datatype.boolean(0.1),
        isFeatured: faker.datatype.boolean(0.05),
        viewCount: faker.number.int({ min: 1, max: 500 }),
        likeCount: 0,
        shareCount: 0,
        commentCount: 0,
      },
    });
    posts.push(post);
  }

  // Create post likes and replies
  for (const post of posts.slice(0, 100)) {
    // Add likes
    const likeCount = faker.number.int({ min: 0, max: 50 });
    const likers = faker.helpers.arrayElements(users, likeCount);
    
    for (const liker of likers) {
      await prisma.forumPostLike.create({
        data: {
          postId: post.id,
          userId: liker.id,
        },
      });
    }

    // Add replies
    const replyCount = faker.number.int({ min: 0, max: 10 });
    for (let i = 0; i < replyCount; i++) {
      const replier = faker.helpers.arrayElement(users);
      await prisma.forumPostReply.create({
        data: {
          postId: post.id,
          authorId: replier.id,
          content: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 2 })),
          isDeleted: false,
        },
      });
    }
  }

  return { forums, posts };
}

async function createMessages(users: unknown[]) {
  logger.info('Creating messages and conversations...');
  
  const conversations = [];
  
  // Create individual conversations
  for (let i = 0; i < 100; i++) {
    const participants = faker.helpers.arrayElements(users, 2);
    
    const conversation = await prisma.conversation.create({
      data: {
        isGroup: false,
        lastActivityAt: faker.date.recent(),
        participants: {
          create: participants.map(p => ({
            userId: p.id,
            role: 'member',
          })),
        },
      },
    });
    conversations.push(conversation);
  }

  // Create group conversations
  for (let i = 0; i < 20; i++) {
    const participantCount = faker.number.int({ min: 3, max: 10 });
    const participants = faker.helpers.arrayElements(users, participantCount);
    const creator = participants[0];
    
    const conversation = await prisma.conversation.create({
      data: {
        name: `${faker.company.name()} Group`,
        isGroup: true,
        createdBy: creator.id,
        lastActivityAt: faker.date.recent(),
        participants: {
          create: participants.map((p, index) => ({
            userId: p.id,
            role: index === 0 ? 'admin' : 'member',
          })),
        },
      },
    });
    conversations.push(conversation);
  }

  // Create messages
  for (const conversation of conversations) {
    const messageCount = faker.number.int({ min: 5, max: 30 });
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId: conversation.id },
      include: { user: true },
    });
    
    let lastMessageId = null;
    
    for (let i = 0; i < messageCount; i++) {
      const sender = faker.helpers.arrayElement(participants);
      
      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: sender.userId,
          content: faker.lorem.sentences(faker.number.int({ min: 1, max: 3 })),
          type: faker.helpers.arrayElement(['text', 'image', 'file']),
        },
      });
      
      lastMessageId = message.id;
      
      // Mark some messages as read
      if (faker.datatype.boolean(0.7)) {
        const readers = faker.helpers.arrayElements(
          participants.filter(p => p.userId !== sender.userId),
          faker.number.int({ min: 1, max: participants.length - 1 })
        );
        
        for (const reader of readers) {
          await prisma.messageRead.create({
            data: {
              messageId: message.id,
              userId: reader.userId,
            },
          });
        }
      }
    }
    
    // Update conversation with last message
    if (lastMessageId) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageId,
          lastActivityAt: new Date(),
        },
      });
    }
  }

  return conversations;
}

async function createNotifications(users: unknown[]) {
  logger.info('Creating notifications...');
  
  const notifications = [];
  
  for (let i = 0; i < 500; i++) {
    const user = faker.helpers.arrayElement(users);
    
    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        title: faker.lorem.sentence({ min: 3, max: 8 }),
        message: faker.lorem.sentence({ min: 5, max: 15 }),
        type: faker.helpers.arrayElement(['ORDER', 'PAYMENT', 'JOB', 'MESSAGE', 'SYSTEM', 'PROMOTION']),
        data: {
          relatedId: faker.string.uuid(),
          action: faker.helpers.arrayElement(['view', 'approve', 'pay', 'respond']),
        },
        readAt: faker.datatype.boolean(0.4) ? faker.date.recent() : null,
      },
    });
    notifications.push(notification);
  }

  return notifications;
}

async function createAnalytics(restaurants: unknown[], vendors: unknown[]) {
  logger.info('Creating analytics data...');
  
  const analytics = [];
  
  // Create restaurant analytics
  for (const restaurant of restaurants.slice(0, 20)) {
    for (let i = 0; i < 30; i++) {
      const analytic = await prisma.analytics.create({
        data: {
          restaurantId: restaurant.id,
          date: faker.date.past({ days: 90 }),
          revenue: faker.number.float({ min: 1000, max: 50000 }),
          orders: faker.number.int({ min: 5, max: 100 }),
          customers: faker.number.int({ min: 3, max: 80 }),
          avgOrderValue: faker.number.float({ min: 200, max: 800 }),
          newCustomers: faker.number.int({ min: 0, max: 20 }),
          repeatCustomers: faker.number.int({ min: 1, max: 60 }),
          cancellations: faker.number.int({ min: 0, max: 10 }),
          refunds: faker.number.float({ min: 0, max: 2000 }),
          rating: faker.number.float({ min: 3.0, max: 5.0, precision: 0.1 }),
        },
      });
      analytics.push(analytic);
    }
  }

  return analytics;
}

async function createReviews(users: unknown[], restaurants: unknown[], products: unknown[]) {
  logger.info('Creating reviews...');
  
  const reviews = [];
  
  // Restaurant reviews
  for (let i = 0; i < 300; i++) {
    const user = faker.helpers.arrayElement(users.filter(u => u.role !== 'VENDOR'));
    const restaurant = faker.helpers.arrayElement(restaurants);
    
    const review = await prisma.review.create({
      data: {
        userId: user.id,
        restaurantId: restaurant.id,
        rating: faker.number.int({ min: 1, max: 5 }),
        comment: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 2 })),
        isVisible: true,
        isFlagged: faker.datatype.boolean(0.05),
        response: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : null,
      },
    });
    reviews.push(review);
  }

  // Product reviews
  for (let i = 0; i < 200; i++) {
    const user = faker.helpers.arrayElement(users.filter(u => u.role !== 'VENDOR'));
    const product = faker.helpers.arrayElement(products);
    
    const review = await prisma.review.create({
      data: {
        userId: user.id,
        productId: product.id,
        rating: faker.number.int({ min: 1, max: 5 }),
        comment: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 2 })),
        isVisible: true,
        isFlagged: faker.datatype.boolean(0.03),
      },
    });
    reviews.push(review);
  }

  return reviews;
}

async function createEmployeeTagsAndDefenses(employees: unknown[], restaurants: unknown[]) {
  logger.info('Creating employee tags and defenses...');
  
  const tags = [];
  const defenses = [];
  
  for (let i = 0; i < 50; i++) {
    const employee = faker.helpers.arrayElement(employees);
    const restaurant = faker.helpers.arrayElement(restaurants);
    const restaurantUser = await prisma.user.findFirst({
      where: { restaurantProfile: { id: restaurant.id } },
    });
    
    if (!restaurantUser) continue;

    const tag = await prisma.employeeTag.create({
      data: {
        employeeId: employee.id,
        restaurantId: restaurant.id,
        taggedBy: restaurantUser.id,
        type: faker.helpers.arrayElement(['POSITIVE', 'NEGATIVE', 'NEUTRAL']),
        category: faker.helpers.arrayElement(['Performance', 'Attitude', 'Punctuality', 'Teamwork', 'Skills']),
        reason: faker.lorem.sentence(),
        details: faker.lorem.paragraph(),
        evidence: [],
        severity: faker.number.int({ min: 1, max: 5 }),
        status: faker.helpers.arrayElement(['ACTIVE', 'DISPUTED', 'RESOLVED']),
      },
    });
    tags.push(tag);

    // Create some defenses for negative tags
    if (tag.type === 'NEGATIVE' && faker.datatype.boolean(0.4)) {
      const employeeUser = await prisma.user.findUnique({ where: { id: employee.userId } });
      if (employeeUser) {
        const defense = await prisma.employeeDefense.create({
          data: {
            tagId: tag.id,
            employeeId: employee.id,
            response: faker.lorem.paragraphs(2),
            evidence: [],
            isResolved: faker.datatype.boolean(0.6),
            resolutionNote: faker.datatype.boolean(0.6) ? faker.lorem.sentence() : null,
          },
        });
        defenses.push(defense);
      }
    }
  }

  // Create employment history
  for (let i = 0; i < 30; i++) {
    const employee = faker.helpers.arrayElement(employees);
    const restaurant = faker.helpers.arrayElement(restaurants);
    
    await prisma.employmentHistory.create({
      data: {
        employeeId: employee.id,
        restaurantId: restaurant.id,
        startDate: faker.date.past({ years: 3 }),
        endDate: faker.datatype.boolean(0.7) ? faker.date.past({ years: 1 }) : null,
        position: faker.helpers.arrayElement(JOB_TITLES),
        department: faker.helpers.arrayElement(['Kitchen', 'Service', 'Management']),
        reason: faker.datatype.boolean(0.5) ? faker.lorem.sentence() : null,
        rating: faker.number.float({ min: 2.0, max: 5.0, precision: 0.1 }),
        review: faker.lorem.paragraph(),
        isVerified: faker.datatype.boolean(0.8),
      },
    });
  }

  return { tags, defenses };
}

async function main() {
  logger.info('🌱 Starting database seeding...');
  
  // Clean existing data
  logger.info('🧹 Cleaning existing data...');
  await prisma.employmentHistory.deleteMany();
  await prisma.employeeDefense.deleteMany();
  await prisma.employeeTag.deleteMany();
  await prisma.messageRead.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  // Clean community models in correct order
  await prisma.reputationHistory.deleteMany();
  await prisma.userReputation.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.communityLeaderboard.deleteMany();
  await prisma.trendingTag.deleteMany();
  await prisma.trendingPost.deleteMany();
  await prisma.forumModerator.deleteMany();
  await prisma.forumSubscription.deleteMany();
  await prisma.groupInvitation.deleteMany();
  await prisma.groupPost.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.communityGroup.deleteMany();
  await prisma.postProductTag.deleteMany();
  await prisma.postVendorTag.deleteMany();
  await prisma.productSuggestion.deleteMany();
  await prisma.vendorSuggestion.deleteMany();
  await prisma.commentReport.deleteMany();
  await prisma.postReport.deleteMany();
  await prisma.postShare.deleteMany();
  await prisma.postBookmark.deleteMany();
  await prisma.commentLike.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.postComment.deleteMany();
  await prisma.forumPost.deleteMany();
  await prisma.forum.deleteMany();
  await prisma.userFollow.deleteMany();
  await prisma.jobApplication.deleteMany();
  await prisma.job.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();
  await prisma.analytics.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.user.deleteMany();

  // Create all data
  const { adminUsers, restaurantUsers, vendorUsers, employeeUsers } = await createUsers();
  const allUsers = [...adminUsers, ...restaurantUsers, ...vendorUsers, ...employeeUsers];
  
  const restaurants = await createRestaurantProfiles(restaurantUsers);
  const vendors = await createVendorProfiles(vendorUsers);
  const employees = await createEmployeeProfiles(employeeUsers, restaurants);
  const products = await createProducts(vendors, restaurants);
  const orders = await createOrders(restaurants, vendors, products);
  const jobs = await createJobs(restaurants);
  const applications = await createJobApplications(employees, jobs);
  const { forums, posts } = await createForumPosts(allUsers);
  const conversations = await createMessages(allUsers);
  const notifications = await createNotifications(allUsers);
  const analytics = await createAnalytics(restaurants, vendors);
  const reviews = await createReviews(allUsers, restaurants, products);
  const { tags, defenses } = await createEmployeeTagsAndDefenses(employees, restaurants);

  logger.info('✅ Database seeded successfully!');
  logger.info(`
📊 Summary:
- Users: ${allUsers.length} (${adminUsers.length} admins, ${restaurantUsers.length} restaurants, ${vendorUsers.length} vendors, ${employeeUsers.length} employees)
- Restaurants: ${restaurants.length}
- Vendors: ${vendors.length}
- Employees: ${employees.length}
- Products: ${products.length}
- Orders: ${orders.length}
- Jobs: ${jobs.length}
- Applications: ${applications.length}
- Forums: ${forums.length}
- Posts: ${posts.length}
- Conversations: ${conversations.length}
- Messages: Created with conversations
- Notifications: ${notifications.length}
- Reviews: ${reviews.length}
- Employee Tags: ${tags.length}
- Employee Defenses: ${defenses.length}
- Analytics Records: ${analytics.length}
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });