import logger from './utils/logger';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function quickSeed() {
  try {
    logger.info('🌱 Quick seeding database with essential data...');
    
    // Check if data already exists
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      console.log('✅ Database already contains data:', userCount, 'users');
      return;
    }
    
    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@restopapa.com',
        phone: '+919876543210',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$hash', // demo hash
        role: 'ADMIN',
        isVerified: true,
        profile: {
          create: {
            firstName: 'Admin',
            lastName: 'User',
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India'
          }
        }
      }
    });
    
    console.log('✅ Created admin user:', adminUser.email);
    
    // Create restaurant user
    const restaurantUser = await prisma.user.create({
      data: {
        email: 'restaurant@demo.com',
        phone: '+919876543211',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$hash',
        role: 'RESTAURANT',
        isVerified: true,
        profile: {
          create: {
            firstName: 'Restaurant',
            lastName: 'Owner',
            city: 'Delhi',
            state: 'Delhi',
            country: 'India'
          }
        },
        restaurant: {
          create: {
            name: 'Demo Restaurant',
            description: 'A demo restaurant for testing',
            cuisineType: ['Indian', 'Chinese'],
            verificationStatus: 'VERIFIED',
            rating: 4.5,
            totalReviews: 125
          }
        }
      }
    });
    
    console.log('✅ Created restaurant user:', restaurantUser.email);
    
    // Create employee user
    const employeeUser = await prisma.user.create({
      data: {
        email: 'employee@demo.com',
        phone: '+919876543212',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$hash',
        role: 'EMPLOYEE',
        isVerified: true,
        profile: {
          create: {
            firstName: 'John',
            lastName: 'Employee',
            city: 'Bangalore',
            state: 'Karnataka',
            country: 'India'
          }
        }
      }
    });
    
    console.log('✅ Created employee user:', employeeUser.email);
    
    // Create basic categories
    const categories = await prisma.category.createMany({
      data: [
        {
          name: 'Kitchen Equipment',
          slug: 'kitchen-equipment',
          description: 'Essential kitchen equipment for restaurants'
        },
        {
          name: 'Raw Materials',
          slug: 'raw-materials', 
          description: 'Fresh ingredients and supplies'
        },
        {
          name: 'Packaging',
          slug: 'packaging',
          description: 'Food packaging and containers'
        }
      ]
    });
    
    console.log('✅ Created categories:', categories.count);
    
    // Create sample jobs
    const restaurant = await prisma.restaurant.findFirst();
    if (restaurant) {
      const jobs = await prisma.job.createMany({
        data: [
          {
            restaurantId: restaurant.id,
            title: 'Head Chef',
            description: 'Experienced head chef needed for fine dining restaurant',
            requirements: ['5+ years experience', 'Culinary degree preferred', 'Leadership skills'],
            skills: ['Cooking', 'Menu Planning', 'Team Management'],
            experienceMin: 5,
            salaryMin: 50000,
            salaryMax: 80000,
            location: 'Delhi',
            jobType: 'Full-time',
            status: 'ACTIVE',
            validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          },
          {
            restaurantId: restaurant.id,
            title: 'Waiter/Waitress',
            description: 'Friendly waiter needed for customer service',
            requirements: ['Good communication skills', 'Customer service experience'],
            skills: ['Communication', 'Customer Service', 'Multitasking'],
            experienceMin: 1,
            salaryMin: 20000,
            salaryMax: 30000,
            location: 'Delhi',
            jobType: 'Full-time',
            status: 'ACTIVE',
            validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        ]
      });
      
      console.log('✅ Created jobs:', jobs.count);
    }
    
    // Create sample community posts
    const posts = await prisma.post.createMany({
      data: [
        {
          userId: adminUser.id,
          title: 'Welcome to RestoPapa Community!',
          content: 'This is the place to connect with fellow restaurant owners, share experiences, and grow your business together.',
          tags: ['welcome', 'community'],
          isPublished: true
        },
        {
          userId: restaurantUser.id,
          title: 'Looking for bulk vegetable suppliers',
          content: 'We are a mid-size restaurant in Delhi looking for reliable vegetable suppliers. Please contact us if you can provide fresh vegetables daily.',
          tags: ['suppliers', 'vegetables', 'delhi'],
          isPublished: true
        }
      ]
    });
    
    console.log('✅ Created posts:', posts.count);
    
    logger.info('🎉 Quick seed completed successfully!');
    logger.info('📊 Summary:');
    logger.info('   - Users: 3 (Admin, Restaurant, Employee)');
    logger.info('   - Categories: 3');
    logger.info('   - Jobs: 2');
    logger.info('   - Posts: 2');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

quickSeed();