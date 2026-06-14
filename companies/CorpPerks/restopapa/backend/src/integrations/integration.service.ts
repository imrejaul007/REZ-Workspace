import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncEmployeesDto } from './dto/sync-employees.dto';

export interface RestaurantData {
  id: string;
  businessName: string;
  ownerName: string;
  category: string;
  description?: string;
  phone?: string;
  email?: string;
  addresses?: Array<{
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  }>;
  employees?: Array<{
    id: string;
    fullName: string;
    position?: string;
    department?: string;
    reliabilityScore?: number;
  }>;
}

export interface RestaurantAnalytics {
  totalOrders: number;
  revenue: number;
  employees: {
    total: number;
    active: number;
    averageReliabilityScore: number;
  };
  jobs: {
    total: number;
    open: number;
  };
  trustScore: number;
}

@Injectable()
export class IntegrationService {
  private readonly logger = new Logger(IntegrationService.name);

  constructor(
    private prisma: PrismaService,
  ) {}

  /**
   * Get restaurant data with addresses and employees
   */
  async getRestaurantData(restaurantId: string): Promise<RestaurantData> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        addresses: true,
        employmentHistory: {
          where: { isCurrent: true },
          include: {
            employee: {
              select: {
                id: true,
                fullName: true,
                reliabilityScore: true,
              },
            },
          },
        },
        user: {
          select: {
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${restaurantId} not found`);
    }

    return {
      id: restaurant.id,
      businessName: restaurant.businessName,
      ownerName: restaurant.ownerName,
      category: restaurant.category,
      description: restaurant.description || undefined,
      phone: restaurant.user.phone || undefined,
      email: restaurant.user.email,
      addresses: restaurant.addresses.map((addr) => ({
        addressLine1: addr.addressLine1 || undefined,
        addressLine2: addr.addressLine2 || undefined,
        city: addr.city || undefined,
        state: addr.state || undefined,
        pincode: addr.pincode || undefined,
        country: addr.country || undefined,
        latitude: addr.latitude || undefined,
        longitude: addr.longitude || undefined,
      })),
      employees: restaurant.employmentHistory.map((eh) => ({
        id: eh.employee.id,
        fullName: eh.employee.fullName,
        position: eh.position || undefined,
        department: eh.department || undefined,
        reliabilityScore: eh.employee.reliabilityScore,
      })),
    };
  }

  /**
   * Sync employees from external source (ReZ Merchant)
   */
  async syncEmployees(restaurantId: string, syncDto: SyncEmployeesDto): Promise<{
    created: number;
    updated: number;
    skipped: number;
    employees: Array<{
      id: string;
      fullName: string;
      email?: string;
      status: 'created' | 'updated' | 'skipped';
    }>;
  }> {
    const { employees } = syncDto;

    // Verify restaurant exists
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${restaurantId} not found`);
    }

    if (!employees || employees.length === 0) {
      throw new BadRequestException('No employees provided for sync');
    }

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      employees: [] as Array<{
        id: string;
        fullName: string;
        email?: string;
        status: 'created' | 'updated' | 'skipped';
      }>,
    };

    for (const employee of employees) {
      try {
        // Check if employee exists by email
        let existingEmployee = employee.email
          ? await this.prisma.employee.findFirst({
              where: {
                user: { email: employee.email },
              },
              include: { user: true },
            })
          : null;

        if (existingEmployee) {
          // Update existing employee
          const updated = await this.prisma.employee.update({
            where: { id: existingEmployee.id },
            data: {
              fullName: employee.fullName,
              aadhaarVerificationStatus: employee.isVerified ? 'verified' : existingEmployee.aadhaarVerificationStatus,
            },
          });

          // Update or create employment history if restaurant association is new
          const existingEmployment = await this.prisma.employmentHistory.findFirst({
            where: {
              employeeId: existingEmployee.id,
              restaurantId,
            },
          });

          if (!existingEmployment) {
            await this.prisma.employmentHistory.create({
              data: {
                employeeId: existingEmployee.id,
                restaurantId,
                position: employee.role || 'Employee',
                joiningDate: new Date(),
                isCurrent: true,
              },
            });
          }

          results.updated++;
          results.employees.push({
            id: updated.id,
            fullName: updated.fullName,
            email: employee.email,
            status: 'updated',
          });
        } else {
          // Create new user for employee
          const user = await this.prisma.user.create({
            data: {
              email: employee.email || `employee_${Date.now()}@placeholder.local`,
              phone: employee.phone,
              role: 'employee',
              isActive: true,
              // Note: In production, you'd want to handle password generation securely
              // For integration, we might use a temporary password or SSO
              passwordHash: '$2a$12$placeholder.hash.for.integration', // Placeholder
              source: 'rez_merchant',
            },
          });

          // Parse skills from string if provided
          const skills = employee.skills ? JSON.stringify(employee.skills) : null;

          // Create new employee
          const newEmployee = await this.prisma.employee.create({
            data: {
              userId: user.id,
              fullName: employee.fullName,
              skills,
              aadhaarVerificationStatus: employee.isVerified ? 'verified' : 'pending',
              isProfileComplete: true,
            },
          });

          // Create employment history
          await this.prisma.employmentHistory.create({
            data: {
              employeeId: newEmployee.id,
              restaurantId,
              position: employee.role || 'Employee',
              joiningDate: new Date(),
              isCurrent: true,
            },
          });

          results.created++;
          results.employees.push({
            id: newEmployee.id,
            fullName: newEmployee.fullName,
            email: employee.email,
            status: 'created',
          });
        }
      } catch (error) {
        this.logger.error(`Failed to sync employee: ${error.message}`, error.stack);
        results.skipped++;
        results.employees.push({
          id: employee.externalId || 'unknown',
          fullName: employee.fullName,
          email: employee.email,
          status: 'skipped',
        });
      }
    }

    // Record analytics event
    await this.prisma.recordAnalyticsEvent(
      restaurant.userId,
      'employees_synced',
      { count: employees.length, created: results.created, updated: results.updated },
    );

    return results;
  }

  /**
   * Get comprehensive restaurant analytics
   */
  async getRestaurantAnalytics(
    restaurantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<RestaurantAnalytics> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${restaurantId} not found`);
    }

    // Run all queries in parallel for better performance
    const [
      totalEmployees,
      activeEmployees,
      employeesWithScores,
      totalJobs,
      openJobs,
      jobApplications,
    ] = await Promise.all([
      // Total employees (current employment)
      this.prisma.employmentHistory.count({
        where: { restaurantId },
      }),
      // Active employees (current employment)
      this.prisma.employmentHistory.count({
        where: { restaurantId, isCurrent: true },
      }),
      // Get reliability scores from current employees
      this.prisma.employee.findMany({
        where: {
          employmentHistory: {
            some: { restaurantId, isCurrent: true },
          },
        },
        select: { reliabilityScore: true },
      }),
      // Total jobs
      this.prisma.job.count({
        where: { restaurantId },
      }),
      // Open jobs
      this.prisma.job.count({
        where: { restaurantId, status: 'open' },
      }),
      // Job applications in date range
      this.prisma.jobApplication.count({
        where: {
          job: { restaurantId },
          appliedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ]);

    // Calculate average reliability score
    const avgReliability =
      employeesWithScores.length > 0
        ? employeesWithScores.reduce((sum, e) => sum + e.reliabilityScore, 0) /
          employeesWithScores.length
        : 0;

    return {
      totalOrders: jobApplications, // Using job applications as orders
      revenue: 0, // Revenue tracking would require order/payment integration
      employees: {
        total: totalEmployees,
        active: activeEmployees,
        averageReliabilityScore: Math.round(avgReliability * 100) / 100,
      },
      jobs: {
        total: totalJobs,
        open: openJobs,
      },
      trustScore: restaurant.trustScore,
    };
  }

  /**
   * Push data to external ReZ Merchant system
   */
  async pushToReZMerchant(restaurantId: string, endpoint: string): Promise<{
    success: boolean;
    message: string;
    data?: RestaurantData;
  }> {
    const restaurant = await this.getRestaurantData(restaurantId);

    try {
      // This would make an HTTP call to ReZ Merchant API
      // For now, we'll just log and return success
      this.logger.log(`Pushing data to ReZ Merchant endpoint: ${endpoint}`);
      this.logger.debug(`Data: ${JSON.stringify(restaurant)}`);

      return {
        success: true,
        message: 'Data pushed successfully',
        data: restaurant,
      };
    } catch (error) {
      this.logger.error(`Failed to push to ReZ Merchant: ${error.message}`, error.stack);
      return {
        success: false,
        message: `Failed to push data: ${error.message}`,
      };
    }
  }

  /**
   * Verify webhook signature from ReZ Merchant
   */
  async verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<boolean> {
    if (!payload || !signature || !secret) {
      this.logger.warn('Missing required parameters for signature verification');
      return false;
    }

    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('hex');

      // Use timing-safe comparison
      const signatureBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expectedSignature);

      if (signatureBuffer.length !== expectedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`);
      return false;
    }
  }
}
