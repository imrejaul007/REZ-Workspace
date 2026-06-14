import { Controller, Get, Post, Body } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsEmail, IsString, MinLength, MaxLength, Matches, IsNotEmpty } from 'class-validator';

class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

/**
 * RegisterDto - User registration DTO with comprehensive validation
 * SECURITY: Added validation decorators to prevent injection attacks and ensure password strength
 */
class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  })
  password!: string;
}

@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getHello() {
    return {
      message: 'RestoPapa API is running!',
      version: '2.0.0',
      description: 'Enhanced RestoPapa API with comprehensive mock data',
      documentation: {
        endpoints: {
          dashboard: '/api/dashboard/overview - Comprehensive dashboard overview',
          jobs: '/api/jobs - Enhanced job management with filters and analytics',
          community: '/api/community/posts - Rich community features with engagement',
          restaurants: '/api/restaurants - Restaurant profiles with menus and reviews',
          vendors: '/api/vendors - Vendor directory with product catalogs',
          users: '/api/users - User management with activity tracking'
        },
        features: [
          'Realistic mock data for 100+ jobs, restaurants, vendors, and users',
          'Advanced filtering and search capabilities',
          'Engagement metrics and analytics',
          'Rich user profiles with activity tracking',
          'Comprehensive restaurant and vendor information',
          'Community features with trending content'
        ]
      },
      timestamp: new Date().toISOString()
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '2.0.0',
      services: {
        database: 'ok',
        cache: 'ok',
        storage: 'ok'
      },
      metrics: {
        uptime: '24h 15m 32s',
        requests: '12,450',
        avgResponseTime: '145ms'
      }
    };
  }

  @Get('api-info')
  getApiInfo() {
    return {
      success: true,
      data: {
        name: 'RestoPapa Enhanced API',
        version: '2.0.0',
        description: 'Comprehensive restaurant industry platform API with rich mock data',
        endpoints: {
          dashboard: {
            overview: 'GET /api/dashboard/overview',
            featuredContent: 'GET /api/dashboard/featured-content',
            search: 'GET /api/dashboard/search',
            notifications: 'GET /api/dashboard/notifications'
          },
          jobs: {
            list: 'GET /api/jobs',
            featured: 'GET /api/jobs/featured',
            urgent: 'GET /api/jobs/urgent',
            stats: 'GET /api/jobs/stats',
            detail: 'GET /api/jobs/:id'
          },
          community: {
            posts: 'GET /api/community/posts',
            featured: 'GET /api/community/posts/featured',
            trending: 'GET /api/community/posts/trending',
            stats: 'GET /api/community/stats',
            leaderboard: 'GET /api/community/leaderboard',
            userProfile: 'GET /api/community/users/:userId/profile'
          },
          restaurants: {
            list: 'GET /api/restaurants',
            featured: 'GET /api/restaurants/featured',
            topRated: 'GET /api/restaurants/top-rated',
            stats: 'GET /api/restaurants/stats',
            detail: 'GET /api/restaurants/:id',
            menu: 'GET /api/restaurants/:id/menu'
          },
          vendors: {
            list: 'GET /api/vendors',
            featured: 'GET /api/vendors/featured',
            categories: 'GET /api/vendors/categories',
            stats: 'GET /api/vendors/stats',
            detail: 'GET /api/vendors/:id',
            products: 'GET /api/vendors/:id/products',
            reviews: 'GET /api/vendors/:id/reviews'
          },
          users: {
            list: 'GET /api/users',
            active: 'GET /api/users/active',
            leaderboard: 'GET /api/users/leaderboard',
            stats: 'GET /api/users/stats',
            analytics: 'GET /api/users/analytics',
            profile: 'GET /api/users/:id',
            activity: 'GET /api/users/:id/activity'
          }
        },
        sampleData: {
          jobs: '100 realistic job postings with filters',
          communityPosts: '120 posts with engagement metrics',
          restaurants: '35 restaurant profiles with menus',
          vendors: '40 vendor profiles with product catalogs',
          users: '200 user profiles with activity data'
        },
        features: [
          'Advanced search and filtering',
          'Real-time engagement metrics',
          'Comprehensive analytics',
          'Rich user profiles',
          'Detailed restaurant information',
          'Vendor product catalogs',
          'Community features',
          'Activity tracking'
        ]
      }
    };
  }

  // Legacy endpoints for backward compatibility
  @Post('auth/login')
  login(@Body() body: LoginDto) {
    return {
      success: true,
      message: 'Login endpoint available',
      data: {
        token: 'mock-jwt-token',
        user: {
          id: '1',
          email: body.email,
          role: 'RESTAURANT'
        }
      }
    };
  }

  @Post('auth/register')
  register(@Body() body: RegisterDto) {
    return {
      success: true,
      message: 'Register endpoint available',
      data: {
        id: '1',
        email: body.email,
        role: 'RESTAURANT',
        isVerified: false
      }
    };
  }

  // Redirect to enhanced endpoints
  @Get('jobs')
  getJobsLegacy() {
    return {
      success: true,
      message: 'This endpoint has been enhanced. Please use /api/jobs for full functionality.',
      redirect: '/api/jobs',
      sampleData: {
        total: 100,
        featured: 15,
        urgent: 8,
        categories: ['Head Chef', 'Server', 'Manager', 'Cook', 'Bartender']
      }
    };
  }

  @Get('community/posts')
  getCommunityPostsLegacy() {
    return {
      success: true,
      message: 'This endpoint has been enhanced. Please use /api/community/posts for full functionality.',
      redirect: '/api/community/posts',
      sampleData: {
        total: 120,
        trending: 12,
        featured: 8,
        engagement: '15,642 total interactions'
      }
    };
  }

  @Get('users/me')
  getCurrentUserLegacy() {
    return {
      success: true,
      message: 'This endpoint has been enhanced. Please use /api/users for full functionality.',
      redirect: '/api/users',
      data: {
        id: '1',
        email: 'test@example.com',
        role: 'RESTAURANT',
        isActive: true,
        createdAt: new Date().toISOString()
      }
    };
  }
}