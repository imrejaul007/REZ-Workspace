import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';


@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createRestaurantDto: CreateRestaurantDto) {
    // Verify user is restaurant owner
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { restaurant: true },
    });

    if (!user || user.role !== 'restaurant') {
      throw new ForbiddenException('Only restaurant users can create restaurant profiles');
    }

    if (user.restaurant) {
      throw new BadRequestException('Restaurant profile already exists');
    }

    const { addresses, ...restaurantData } = createRestaurantDto;

    const restaurant = await this.prisma.$transaction(async (tx) => {
      // Create restaurant
      const newRestaurant = await tx.restaurant.create({
        data: {
          ...restaurantData,
          userId,
        },
        include: {
          addresses: true,
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              isEmailVerified: true,
              isPhoneVerified: true,
            },
          },
        },
      });

      // Create addresses if provided
      if (addresses && addresses.length > 0) {
        await tx.restaurantAddress.createMany({
          data: addresses.map((address) => ({
            ...address,
            restaurantId: newRestaurant.id,
          })),
        });

        // Fetch restaurant with addresses
        return tx.restaurant.findUnique({
          where: { id: newRestaurant.id },
          include: {
            addresses: true,
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
                isEmailVerified: true,
                isPhoneVerified: true,
              },
            },
          },
        });
      }

      return newRestaurant;
    });

    // Record analytics event
    await this.prisma.recordAnalyticsEvent(
      userId,
      'restaurant_profile_created',
      { category: restaurant.category },
    );

    return restaurant;
  }

  async findAll(page = 1, limit = 20, filters?: any) {
    const skip = (page - 1) * limit;
    const where: any = { isVerified: true };

    // Apply filters
    if (filters?.category) {
      where.category = filters.category;
    }
    if (filters?.city) {
      where.addresses = {
        some: {
          city: {
            contains: filters.city,
            mode: 'insensitive',
          },
        },
      };
    }
    if (filters?.search) {
      where.OR = [
        { businessName: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [restaurants, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        where,
        skip,
        take: limit,
        include: {
          addresses: true,
          user: {
            select: {
              email: true,
              phone: true,
              isEmailVerified: true,
              isPhoneVerified: true,
            },
          },
          _count: {
            select: {
              jobs: { where: { status: 'open' } },
              employmentHistory: true,
            },
          },
        },
        orderBy: [
          { trustScore: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.restaurant.count({ where }),
    ]);

    return {
      restaurants,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, includePrivate = false) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        addresses: true,
        user: includePrivate ? {
          select: {
            id: true,
            email: true,
            phone: true,
            isEmailVerified: true,
            isPhoneVerified: true,
          },
        } : false,
        employmentHistory: {
          include: {
            employee: {
              select: {
                fullName: true,
                profilePictureUrl: true,
                reliabilityScore: true,
              },
            },
          },
          orderBy: { joiningDate: 'desc' },
          take: 10,
        },
        jobs: {
          where: { status: 'open' },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            jobs: { where: { status: 'open' } },
            employmentHistory: true,
          },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  async update(id: string, userId: string, updateRestaurantDto: UpdateRestaurantDto) {
    // Verify ownership
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (restaurant.userId !== userId) {
      throw new ForbiddenException('You can only update your own restaurant');
    }

    const { addresses, ...restaurantData } = updateRestaurantDto;

    const updatedRestaurant = await this.prisma.$transaction(async (tx) => {
      // Update restaurant data
      const updated = await tx.restaurant.update({
        where: { id },
        data: restaurantData,
      });

      // Update addresses if provided
      if (addresses) {
        // Remove existing addresses
        await tx.restaurantAddress.deleteMany({
          where: { restaurantId: id },
        });

        // Add new addresses
        if (addresses.length > 0) {
          await tx.restaurantAddress.createMany({
            data: addresses.map((address) => ({
              ...address,
              restaurantId: id,
            })),
          });
        }
      }

      // Return updated restaurant with addresses
      return tx.restaurant.findUnique({
        where: { id },
        include: {
          addresses: true,
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              isEmailVerified: true,
              isPhoneVerified: true,
            },
          },
        },
      });
    });

    // Record analytics event
    await this.prisma.recordAnalyticsEvent(
      userId,
      'restaurant_profile_updated',
    );

    return updatedRestaurant;
  }

  async remove(id: string, userId: string) {
    // Verify ownership
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (restaurant.userId !== userId) {
      throw new ForbiddenException('You can only delete your own restaurant');
    }

    await this.prisma.restaurant.delete({
      where: { id },
    });

    // Record analytics event
    await this.prisma.recordAnalyticsEvent(
      userId,
      'restaurant_profile_deleted',
    );

    return { message: 'Restaurant deleted successfully' };
  }

  async getAnalytics(restaurantId: string, userId: string) {
    // Verify ownership
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId, userId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found or access denied');
    }

    // Get analytics data
    const [
      totalJobs,
      openJobs,
      totalApplications,
      totalEmployees,
      employeesWithScores,
      monthlyApplications,
    ] = await Promise.all([
      this.prisma.job.count({
        where: { restaurantId },
      }),
      this.prisma.job.count({
        where: { restaurantId, status: 'open' },
      }),
      this.prisma.jobApplication.count({
        where: { job: { restaurantId } },
      }),
      this.prisma.employmentHistory.count({
        where: { restaurantId, isCurrent: true },
      }),
      // Get average reliability from current employees
      this.prisma.employee.findMany({
        where: {
          employmentHistory: {
            some: { restaurantId, isCurrent: true }
          }
        },
        select: { reliabilityScore: true }
      }),
      this.prisma.jobApplication.groupBy({
        by: ['appliedAt'],
        where: {
          job: { restaurantId },
          appliedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        _count: true,
      }),
    ]);

    // Calculate average reliability score
    const avgReliability = employeesWithScores.length > 0
      ? employeesWithScores.reduce((sum, e) => sum + e.reliabilityScore, 0) / employeesWithScores.length
      : 0;

    return {
      overview: {
        totalJobs,
        openJobs,
        totalApplications,
        totalEmployees,
        averageReliabilityScore: Math.round(avgReliability * 100) / 100,
        trustScore: restaurant.trustScore,
      },
      monthlyApplications,
    };
  }

  async updateSubscription(restaurantId: string, userId: string, subscriptionData: any) {
    // Verify ownership
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId, userId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found or access denied');
    }

    const updatedRestaurant = await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        subscriptionPlan: subscriptionData.plan,
        subscriptionStatus: subscriptionData.status,
        subscriptionExpiresAt: subscriptionData.expiresAt,
      },
    });

    // Record analytics event
    await this.prisma.recordAnalyticsEvent(
      userId,
      'subscription_updated',
      { plan: subscriptionData.plan, status: subscriptionData.status },
    );

    return updatedRestaurant;
  }
}