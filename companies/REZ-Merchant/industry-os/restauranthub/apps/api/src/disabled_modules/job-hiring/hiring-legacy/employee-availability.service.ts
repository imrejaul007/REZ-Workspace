import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { EmployeeAvailabilityDto } from './dto/employee-availability.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class EmployeeAvailabilityService {
  private availabilityCache = new Map<string, any>(); // In-memory cache for availability data

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async updateAvailability(employeeId: string, availabilityData: EmployeeAvailabilityDto, userId: string, userRole: string) {
    // Check permissions - only employees can update their own availability or admins
    if (userRole !== UserRole.ADMIN) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
      });

      if (!employee || employee.userId !== userId) {
        throw new ForbiddenException('Access denied');
      }
    }

    // Store availability data in cache (since we don't have a dedicated model)
    const cacheKey = `availability:${employeeId}`;
    const availabilityRecord = {
      employeeId,
      ...availabilityData,
      updatedAt: new Date(),
      isActive: true,
    };

    this.availabilityCache.set(cacheKey, availabilityRecord);

    // Publish real-time event
    await this.redisService.publish(
      `employee:${employeeId}`,
      JSON.stringify({
        type: 'availability:updated',
        data: {
          employeeId,
          availability: availabilityRecord,
        },
      }),
    );

    return availabilityRecord;
  }

  async getAvailability(employeeId: string, userId: string, userRole: string) {
    // Check permissions - employees can see their own, restaurants can see their employees', admins can see all
    if (userRole === UserRole.EMPLOYEE) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
      });

      if (!employee || employee.userId !== userId) {
        throw new ForbiddenException('Access denied');
      }
    } else if (userRole === UserRole.RESTAURANT) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
        include: { restaurant: true },
      });

      if (!employee || employee.restaurant.userId !== userId) {
        throw new ForbiddenException('Access denied');
      }
    }

    const cacheKey = `availability:${employeeId}`;
    const availability = this.availabilityCache.get(cacheKey);

    if (!availability) {
      // Return default availability if none set
      return {
        employeeId,
        preferredJobTypes: ['Full-time'],
        preferredLocations: [],
        preferredRoles: [],
        isActive: false,
        message: 'Employee has not set availability preferences yet',
      };
    }

    return availability;
  }

  async getAvailableEmployees(filters?) {
    // Get all employees with their availability data
    const employees = await this.prisma.employee.findMany({
      where: {
        isActive: true,
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        applications: {
          where: {
            status: 'PENDING',
          },
          include: {
            job: true,
          },
        },
        employmentHistory: {
          orderBy: {
            startDate: 'desc',
          },
          take: 1,
        },
      },
    });

    // Enhance with availability data and apply filters
    const availableEmployees = employees
      .map(employee => {
        const cacheKey = `availability:${employee.id}`;
        const availability = this.availabilityCache.get(cacheKey);
        
        if (!availability || !availability.isActive) {
          return null;
        }

        return {
          ...employee,
          availability,
          isAvailable: true,
          activeApplicationsCount: employee.applications.length,
          lastEmployment: employee.employmentHistory[0] || null,
        };
      })
      .filter(employee => employee !== null);

    // Apply filters
    let filteredEmployees = availableEmployees;

    if (filters?.location) {
      filteredEmployees = filteredEmployees.filter(emp => 
        emp.availability.preferredLocations.some((loc: string) => 
          loc.toLowerCase().includes(filters.location.toLowerCase())
        )
      );
    }

    if (filters?.jobType) {
      filteredEmployees = filteredEmployees.filter(emp => 
        emp.availability.preferredJobTypes.includes(filters.jobType)
      );
    }

    if (filters?.role) {
      filteredEmployees = filteredEmployees.filter(emp => 
        emp.availability.preferredRoles.includes(filters.role)
      );
    }

    if (filters?.salaryMin) {
      filteredEmployees = filteredEmployees.filter(emp => 
        !emp.availability.expectedSalaryMin || 
        emp.availability.expectedSalaryMin <= parseInt(filters.salaryMin)
      );
    }

    if (filters?.salaryMax) {
      filteredEmployees = filteredEmployees.filter(emp => 
        !emp.availability.expectedSalaryMax || 
        emp.availability.expectedSalaryMax >= parseInt(filters.salaryMax)
      );
    }

    return {
      data: filteredEmployees,
      total: filteredEmployees.length,
      filters: filters || {},
    };
  }

  async matchJobsToEmployee(employeeId: string, userId: string, userRole: string) {
    // Check permissions
    if (userRole === UserRole.EMPLOYEE) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
      });

      if (!employee || employee.userId !== userId) {
        throw new ForbiddenException('Access denied');
      }
    }

    const availability = await this.getAvailability(employeeId, userId, userRole);
    
    if (!availability.isActive) {
      return {
        matches: [],
        message: 'Employee availability not set or inactive',
      };
    }

    // Get all open jobs
    const jobs = await this.prisma.job.findMany({
      where: {
        status: 'OPEN',
        validTill: { gte: new Date() },
      },
      include: {
        restaurant: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    // Score and match jobs based on availability preferences
    const matchedJobs = jobs
      .map(job => {
        let matchScore = 0;
        const matchReasons: string[] = [];

        // Location match
        if (availability.preferredLocations.some((loc: string) => 
          job.location.toLowerCase().includes(loc.toLowerCase())
        )) {
          matchScore += 30;
          matchReasons.push('Location preference match');
        }

        // Job type match
        if (availability.preferredJobTypes.includes(job.jobType)) {
          matchScore += 25;
          matchReasons.push('Job type preference match');
        }

        // Role/title match
        if (availability.preferredRoles && availability.preferredRoles.some((role: string) => 
          job.title.toLowerCase().includes(role.toLowerCase())
        )) {
          matchScore += 35;
          matchReasons.push('Role preference match');
        }

        // Salary match
        if (availability.expectedSalaryMin && job.salaryMin && 
            job.salaryMin >= availability.expectedSalaryMin) {
          matchScore += 10;
          matchReasons.push('Salary expectation met');
        }

        return {
          ...job,
          matchScore,
          matchReasons,
          isMatch: matchScore >= 25, // Minimum 25% match
        };
      })
      .filter(job => job.isMatch)
      .sort((a, b) => b.matchScore - a.matchScore);

    return {
      matches: matchedJobs.slice(0, 20), // Top 20 matches
      total: matchedJobs.length,
      employeeId,
      availability,
    };
  }

  async deactivateAvailability(employeeId: string, userId: string, userRole: string) {
    // Check permissions
    if (userRole !== UserRole.ADMIN) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
      });

      if (!employee || employee.userId !== userId) {
        throw new ForbiddenException('Access denied');
      }
    }

    const cacheKey = `availability:${employeeId}`;
    const availability = this.availabilityCache.get(cacheKey);

    if (availability) {
      availability.isActive = false;
      availability.deactivatedAt = new Date();
      this.availabilityCache.set(cacheKey, availability);

      // Publish real-time event
      await this.redisService.publish(
        `employee:${employeeId}`,
        JSON.stringify({
          type: 'availability:deactivated',
          data: {
            employeeId,
          },
        }),
      );
    }

    return { message: 'Availability deactivated successfully' };
  }

  async getAvailabilityStats(restaurantId?: string) {
    let employees;
    
    if (restaurantId) {
      employees = await this.prisma.employee.findMany({
        where: {
          restaurantId,
          isActive: true,
        },
      });
    } else {
      employees = await this.prisma.employee.findMany({
        where: {
          isActive: true,
        },
      });
    }

    const totalEmployees = employees.length;
    const availableEmployees = employees.filter(emp => {
      const cacheKey = `availability:${emp.id}`;
      const availability = this.availabilityCache.get(cacheKey);
      return availability && availability.isActive;
    }).length;

    // Get availability breakdown
    const availabilityBreakdown = {
      fullTime: 0,
      partTime: 0,
      contract: 0,
    };

    employees.forEach(emp => {
      const cacheKey = `availability:${emp.id}`;
      const availability = this.availabilityCache.get(cacheKey);
      if (availability && availability.isActive) {
        if (availability.preferredJobTypes.includes('Full-time')) {
          availabilityBreakdown.fullTime++;
        }
        if (availability.preferredJobTypes.includes('Part-time')) {
          availabilityBreakdown.partTime++;
        }
        if (availability.preferredJobTypes.includes('Contract')) {
          availabilityBreakdown.contract++;
        }
      }
    });

    return {
      totalEmployees,
      availableEmployees,
      availabilityRate: totalEmployees > 0 ? (availableEmployees / totalEmployees * 100).toFixed(1) : 0,
      availabilityBreakdown,
    };
  }
}