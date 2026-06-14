// Simplified Mock Data Generator for RestoPapa
// Provides realistic data without external dependencies

import crypto from 'crypto';

// Utility functions for generating random data using crypto
const randomInt = (min: number, max: number): number => crypto.randomInt(min, max);

const randomElement = <T>(array: T[]): T => array[crypto.randomInt(0, array.length - 1)];

const randomElements = <T>(array: T[], count: number): T[] => {
  const shuffled = [...array].sort(() => 0.5 - Math.random()); // Fisher-Yates shuffle uses Math.random for ordering, not security
  return shuffled.slice(0, Math.min(count, array.length));
};

const randomFloat = (min: number, max: number, decimals: number = 2): number => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals)); // Mock data only, not security-sensitive
};

const randomBoolean = (probability: number = 0.5): boolean => Math.random() < probability; // Mock data only, not security-sensitive

// Generate dates
const randomDate = (daysBack: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - crypto.randomInt(0, daysBack));
  return date;
};

const futureDate = (daysForward: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + crypto.randomInt(1, daysForward));
  return date;
};

// Sample data arrays
const jobTitles = [
  'Head Chef', 'Sous Chef', 'Line Cook', 'Prep Cook', 'Kitchen Manager',
  'Restaurant Manager', 'Assistant Manager', 'Server', 'Bartender', 'Host/Hostess',
  'Dishwasher', 'Food Runner', 'Barista', 'Cashier', 'Delivery Driver'
];

const locations = [
  'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ',
  'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'San Jose, CA'
];

const skills = [
  'Cooking', 'Food Safety', 'Menu Planning', 'Customer Service', 'Leadership',
  'Team Management', 'POS Systems', 'Food Preparation', 'Communication', 'Problem Solving'
];

const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emily', 'Chris', 'Lisa', 'Robert', 'Jessica'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];

const postTitles = {
  DISCUSSION: [
    'How do you handle difficult customers?',
    'Best practices for inventory management?',
    'Thoughts on new food safety regulations?',
    'How to improve team communication?',
    'What\'s your biggest challenge as a restaurant manager?'
  ],
  TIP: [
    'Quick tip: Reduce food waste with this simple trick',
    'How to speed up service during rush hours',
    'Money-saving tip for restaurant owners',
    'Improve your plating presentation',
    '5 ways to boost customer satisfaction'
  ],
  RECIPE: [
    'Amazing marinara sauce recipe that customers love',
    'Perfect burger seasoning blend',
    'Secret ingredient for the best pancakes',
    'Homemade pasta recipe',
    'Restaurant-quality caesar dressing'
  ]
};

const restaurantNames = [
  'Golden Spoon Restaurant', 'Silver Fork Bistro', 'Red Pepper Cafe', 'Blue Ocean Grill',
  'Green Garden Kitchen', 'Sunset Bistro', 'Harbor View Restaurant', 'Mountain Top Cafe',
  'Valley Fresh Kitchen', 'City Lights Restaurant'
];

const cuisineTypes = [
  ['Italian', 'Mediterranean'], ['Chinese', 'Asian'], ['Mexican', 'Latin'],
  ['Indian', 'South Asian'], ['American', 'Comfort Food'], ['Japanese', 'Asian']
];

const vendorTypes = [
  'Food Ingredients', 'Kitchen Equipment', 'Packaging Supplies', 'Cleaning Supplies',
  'Beverages', 'Produce', 'Meat & Poultry', 'Bakery Supplies'
];

// Generate functions
export const generateJobs = (count: number = 50) => {
  return Array.from({ length: count }, (_, i) => {
    const title = randomElement(jobTitles);
    const salaryMin = randomInt(25000, 60000);
    const salaryMax = salaryMin + randomInt(10000, 40000);

    return {
      id: `job-${i + 1}`,
      title,
      description: `We are seeking an experienced ${title} to join our dynamic team. This is an excellent opportunity for growth in the restaurant industry.`,
      requirements: randomElements([
        '2+ years restaurant experience',
        'Food safety certification',
        'Excellent communication skills',
        'Fast-paced environment experience',
        'Weekend availability',
        'Team player attitude'
      ], randomInt(3, 5)),
      skills: randomElements(skills, randomInt(3, 6)),
      experienceMin: randomInt(0, 3),
      experienceMax: randomInt(2, 8),
      salaryMin,
      salaryMax,
      location: randomElement(locations),
      jobType: randomElement(['FULL_TIME', 'PART_TIME', 'CONTRACT']),
      status: randomElement(['DRAFT', 'OPEN', 'CLOSED', 'FILLED']),
      validTill: futureDate(90),
      viewCount: randomInt(5, 300),
      applicationCount: randomInt(0, 25),
      restaurantName: randomElement(restaurantNames),
      postedDate: randomDate(30),
      featured: randomBoolean(0.2),
      urgentHiring: randomBoolean(0.1),
      benefits: randomElements([
        'Health Insurance', 'Paid Time Off', 'Employee Discount',
        'Flexible Schedule', 'Training Provided', 'Tips'
      ], randomInt(2, 4))
    };
  });
};

export const generateCommunityPosts = (count: number = 80) => {
  return Array.from({ length: count }, (_, i) => {
    const type = randomElement(['DISCUSSION', 'TIP', 'RECIPE']);
    const likeCount = randomInt(0, 100);
    const commentCount = randomInt(0, 30);
    const shareCount = randomInt(0, 15);
    const viewCount = likeCount + randomInt(10, 200);

    return {
      id: `post-${i + 1}`,
      title: randomElement(postTitles[type as keyof typeof postTitles]),
      content: `This is a detailed post about restaurant operations and best practices. The content provides valuable insights for restaurant professionals and covers important aspects of the industry.`,
      type,
      author: {
        id: `user-${randomInt(1, 30)}`,
        name: `${randomElement(firstNames)} ${randomElement(lastNames)}`,
        avatar: `https://ui-avatars.com/api/?name=${randomElement(firstNames)}+${randomElement(lastNames)}&background=random`,
        role: randomElement(['RESTAURANT', 'VENDOR', 'EMPLOYEE']),
        reputation: randomInt(10, 1500),
        isVerified: randomBoolean(0.3)
      },
      images: randomBoolean(0.3) ? [`https://picsum.photos/400/300?random=${i}`] : [],
      tags: randomElements(['cooking', 'management', 'tips', 'business', 'staff'], randomInt(1, 3)),
      viewCount,
      likeCount,
      commentCount,
      shareCount,
      bookmarkCount: randomInt(0, 20),
      isPinned: randomBoolean(0.05),
      isFeatured: randomBoolean(0.1),
      createdAt: randomDate(60),
      lastActivity: randomDate(7),
      engagement: parseFloat(((likeCount + commentCount * 2 + shareCount * 3) / Math.max(viewCount, 1) * 100).toFixed(1))
    };
  });
};

export const generateRestaurants = (count: number = 25) => {
  return Array.from({ length: count }, (_, i) => {
    const cuisine = randomElement(cuisineTypes);
    const rating = randomFloat(3.0, 5.0, 1);

    return {
      id: `restaurant-${i + 1}`,
      name: randomElement(restaurantNames),
      description: 'A wonderful restaurant offering delicious food and excellent service in a welcoming atmosphere.',
      cuisineType: cuisine,
      logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(randomElement(restaurantNames))}&background=random`,
      banner: `https://picsum.photos/800/300?random=${i + 100}`,
      address: {
        street: `${randomInt(100, 999)} Main Street`,
        city: randomElement(['New York', 'Los Angeles', 'Chicago', 'Houston']),
        state: randomElement(['NY', 'CA', 'IL', 'TX']),
        zipCode: `${randomInt(10000, 99999)}`
      },
      contact: {
        phone: `+1${randomInt(100, 999)}${randomInt(100, 999)}${randomInt(1000, 9999)}`,
        email: 'contact@restaurant.com'
      },
      rating,
      totalReviews: randomInt(25, 300),
      priceRange: randomElement(['$', '$$', '$$$']),
      features: randomElements([
        'Outdoor Seating', 'Delivery', 'Takeout', 'WiFi', 'Parking'
      ], randomInt(2, 4)),
      stats: {
        totalOrders: randomInt(500, 3000),
        monthlyRevenue: randomInt(50000, 300000),
        averageOrderValue: randomFloat(25, 65, 2)
      },
      isActive: true,
      joinedDate: randomDate(365),
      verificationStatus: randomElement(['VERIFIED', 'PENDING'])
    };
  });
};

export const generateVendors = (count: number = 30) => {
  return Array.from({ length: count }, (_, i) => {
    const vendorType = randomElement(vendorTypes);
    const rating = randomFloat(3.5, 5.0, 1);

    return {
      id: `vendor-${i + 1}`,
      companyName: `${randomElement(['Premium', 'Quality', 'Fresh'])} ${vendorType} Co.`,
      description: `Professional supplier of high-quality ${vendorType.toLowerCase()} for restaurants and food service establishments.`,
      businessType: vendorType,
      logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(vendorType)}&background=random`,
      contact: {
        phone: `+1${randomInt(100, 999)}${randomInt(100, 999)}${randomInt(1000, 9999)}`,
        email: 'sales@vendor.com'
      },
      address: {
        city: randomElement(['Dallas', 'Phoenix', 'San Diego']),
        state: randomElement(['TX', 'AZ', 'CA'])
      },
      rating,
      totalReviews: randomInt(10, 150),
      yearsInBusiness: randomInt(2, 20),
      serviceAreas: randomElements(['Northeast', 'Southeast', 'Midwest', 'West Coast'], randomInt(1, 3)),
      minimumOrder: randomFloat(100, 500, 2),
      productCount: randomInt(20, 100),
      stats: {
        totalOrders: randomInt(100, 1000),
        onTimeDelivery: randomFloat(90, 99, 1),
        customerSatisfaction: randomFloat(4.0, 5.0, 1)
      },
      isActive: true,
      verificationStatus: randomElement(['VERIFIED', 'PENDING'])
    };
  });
};

export const generateUsers = (count: number = 150) => {
  return Array.from({ length: count }, (_, i) => {
    const firstName = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const role = randomElement(['RESTAURANT', 'VENDOR', 'EMPLOYEE', 'CUSTOMER']);
    const activityLevel = randomElement(['HIGH', 'MEDIUM', 'LOW']);

    return {
      id: `user-${i + 1}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      firstName,
      lastName,
      avatar: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`,
      role,
      activityLevel,
      bio: 'Experienced restaurant professional passionate about the food industry.',
      location: `${randomElement(['New York', 'Los Angeles', 'Chicago'])}, ${randomElement(['NY', 'CA', 'IL'])}`,
      stats: {
        postsCreated: randomInt(0, activityLevel === 'HIGH' ? 50 : activityLevel === 'MEDIUM' ? 20 : 5),
        commentsPosted: randomInt(0, activityLevel === 'HIGH' ? 100 : activityLevel === 'MEDIUM' ? 40 : 10),
        likesReceived: randomInt(0, activityLevel === 'HIGH' ? 200 : activityLevel === 'MEDIUM' ? 80 : 20),
        reputationPoints: randomInt(0, activityLevel === 'HIGH' ? 2000 : activityLevel === 'MEDIUM' ? 800 : 200)
      },
      badges: activityLevel === 'HIGH' ? ['Top Contributor', 'Community Helper'] : activityLevel === 'MEDIUM' ? ['Active Member'] : [],
      joinedDate: randomDate(730), // Up to 2 years ago
      lastActive: randomDate(activityLevel === 'HIGH' ? 1 : activityLevel === 'MEDIUM' ? 7 : 30),
      isVerified: randomBoolean(0.4),
      reputation: randomInt(10, 3000),
      isActive: randomBoolean(0.9)
    };
  });
};

// Pre-generate data for controllers
export const mockData = {
  jobs: generateJobs(100),
  communityPosts: generateCommunityPosts(120),
  restaurants: generateRestaurants(35),
  vendors: generateVendors(40),
  users: generateUsers(200)
};
