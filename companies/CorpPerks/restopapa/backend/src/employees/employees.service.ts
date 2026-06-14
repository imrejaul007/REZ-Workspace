import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, filters?: any) {
    const skip = (page - 1) * limit;
    const where: any = { isProfileComplete: true };

    // Apply filters
    if (filters?.skills) {
      where.skills = {
        hasSome: Array.isArray(filters.skills) ? filters.skills : [filters.skills],
      };
    }
    if (filters?.experience) {
      where.totalExperienceMonths = {
        gte: parseInt(filters.experience) * 12,
      };
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

    const [employees, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip,
        take: limit,
        include: {
          addresses: true,
          user: {
            select: {
              email: true,
              isEmailVerified: true,
              isPhoneVerified: true,
            },
          },
          employmentHistory: {
            include: {
              restaurant: {
                select: {
                  businessName: true,
                  category: true,
                },
              },
            },
            orderBy: { joiningDate: 'desc' },
            take: 3,
          },
          _count: {
            select: {
              jobApplications: true,
              reviews: true,
            },
          },
        },
        orderBy: [
          { reliabilityScore: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      employees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
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
        employmentHistory: {
          include: {
            restaurant: {
              select: {
                businessName: true,
                category: true,
                trustScore: true,
              },
            },
          },
          orderBy: { joiningDate: 'desc' },
        },
        reviews: {
          include: {
            restaurant: {
              select: {
                businessName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        jobApplications: {
          include: {
            job: {
              select: {
                title: true,
                position: true,
                restaurant: {
                  select: {
                    businessName: true,
                  },
                },
              },
            },
          },
          orderBy: { appliedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  async verifyAadhaar(employeeId: string, aadhaarData: any) {
    // This would integrate with UIDAI API
    // For now, we'll simulate verification
    const employee = await this.prisma.employee.update({
      where: { id: employeeId },
      data: {
        aadhaarVerificationStatus: 'verified',
        reliabilityScore: { increment: 20 },
      },
    });

    // Record analytics event
    await this.prisma.recordAnalyticsEvent(
      employee.userId,
      'aadhaar_verified',
    );

    return employee;
  }
}