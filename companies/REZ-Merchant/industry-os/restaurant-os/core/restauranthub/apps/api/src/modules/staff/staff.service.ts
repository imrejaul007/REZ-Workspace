import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto, CreateShiftDto, UpdateShiftDto, StaffQueryDto } from './staff.dto';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async getEmployees(restaurantId: string, query: StaffQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: unknown = {
      restaurantId,
      isActive: true,
    };

    if (query.department) {
      where.department = query.department;
    }

    if (query.role) {
      where.designation = query.role;
    }

    const [employees, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.employee.count({ where }),
    ]);

    const data = employees.map((emp) => this.formatEmployee(emp));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getEmployee(id: string, restaurantId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, restaurantId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        attendance: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        leaves: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return this.formatEmployee(employee);
  }

  async createEmployee(dto: CreateEmployeeDto, restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // Verify email doesn't already exist as a user
    if (dto.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existingUser) {
        throw new BadRequestException('A user with this email already exists');
      }
    }

    const employeeCode = `EMP-${Date.now()}-${randomUUID().replace(/-/g, '').slice(0, 8)}`;

    // Create user account for the employee
    const user = await this.prisma.user.create({
      data: {
        email: dto.email ?? `${employeeCode}@${restaurantId}.internal`,
        phone: dto.phone,
        passwordHash: '',
        role: 'EMPLOYEE',
        isActive: true,
        profile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
          },
        },
        employee: {
          create: {
            restaurantId,
            employeeCode,
            designation: dto.role,
            department: dto.department ?? null,
            salary: dto.salary ?? null,
            joiningDate: dto.startDate ? new Date(dto.startDate) : new Date(),
          },
        },
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
                profile: {
                  select: { firstName: true, lastName: true, avatar: true },
                },
              },
            },
          },
        },
      },
    });

    return this.formatEmployee(user.employee!);
  }

  async updateEmployee(id: string, dto: UpdateEmployeeDto, restaurantId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, restaurantId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const [updatedEmployee] = await this.prisma.$transaction([
      this.prisma.employee.update({
        where: { id },
        data: {
          ...(dto.role !== undefined && { designation: dto.role }),
          ...(dto.department !== undefined && { department: dto.department }),
          ...(dto.salary !== undefined && { salary: dto.salary }),
          ...(dto.startDate !== undefined && { joiningDate: new Date(dto.startDate) }),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              phone: true,
              profile: {
                select: { firstName: true, lastName: true, avatar: true },
              },
            },
          },
        },
      }),
    ]);

    // Update profile separately if name fields provided
    if (dto.firstName !== undefined || dto.lastName !== undefined) {
      await this.prisma.profile.updateMany({
        where: { userId: employee.userId },
        data: {
          ...(dto.firstName !== undefined && { firstName: dto.firstName }),
          ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        },
      });
    }

    return this.formatEmployee(updatedEmployee);
  }

  async deleteEmployee(id: string, restaurantId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, restaurantId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    await this.prisma.employee.update({
      where: { id },
      data: { isActive: false, relievingDate: new Date() },
    });

    return { message: 'Employee deactivated successfully' };
  }

  async getShifts(restaurantId: string, weekStart?: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    let dateFilter: unknown = {};

    if (weekStart) {
      const start = new Date(weekStart);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      dateFilter = {
        date: { gte: start, lt: end },
      };
    }

    const shifts = await this.prisma.attendance.findMany({
      where: {
        employee: { restaurantId },
        ...dateFilter,
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                profile: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return {
      data: shifts.map((shift) => this.formatShift(shift)),
      total: shifts.length,
    };
  }

  async createShift(dto: CreateShiftDto, restaurantId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, restaurantId },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found in this restaurant');
    }

    const shiftDate = new Date(dto.date);

    // Check for existing shift on same day
    const existing = await this.prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: dto.employeeId,
          date: shiftDate,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('A shift already exists for this employee on this date');
    }

    const shift = await this.prisma.attendance.create({
      data: {
        employeeId: dto.employeeId,
        date: shiftDate,
        checkInTime: this.buildDateTime(shiftDate, dto.startTime),
        checkOutTime: this.buildDateTime(shiftDate, dto.endTime),
        status: 'scheduled',
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                profile: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    return this.formatShift(shift);
  }

  async updateShift(id: string, dto: UpdateShiftDto, restaurantId: string) {
    const shift = await this.prisma.attendance.findFirst({
      where: {
        id,
        employee: { restaurantId },
      },
    });

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    const updatedShift = await this.prisma.attendance.update({
      where: { id },
      data: {
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
        ...(dto.startTime !== undefined && {
          checkInTime: this.buildDateTime(
            dto.date ? new Date(dto.date) : shift.date,
            dto.startTime
          ),
        }),
        ...(dto.endTime !== undefined && {
          checkOutTime: this.buildDateTime(
            dto.date ? new Date(dto.date) : shift.date,
            dto.endTime
          ),
        }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                profile: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    return this.formatShift(updatedShift);
  }

  async deleteShift(id: string, restaurantId: string) {
    const shift = await this.prisma.attendance.findFirst({
      where: {
        id,
        employee: { restaurantId },
      },
    });

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    await this.prisma.attendance.delete({ where: { id } });

    return { message: 'Shift deleted successfully' };
  }

  async getRoles(restaurantId: string) {
    const employees = await this.prisma.employee.findMany({
      where: { restaurantId, isActive: true },
      select: { designation: true },
      distinct: ['designation'],
    });

    const roles = employees
      .map((e) => e.designation)
      .filter(Boolean)
      .sort();

    return { data: roles };
  }

  private formatEmployee(employee) {
    const profile = employee.user?.profile;
    const firstName = profile?.firstName ?? '';
    const lastName = profile?.lastName ?? '';

    return {
      id: employee.id,
      userId: employee.userId,
      employeeCode: employee.employeeCode,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      email: employee.user?.email ?? null,
      phone: employee.user?.phone ?? null,
      avatar: profile?.avatar ?? null,
      role: employee.designation,
      department: employee.department ?? null,
      salary: employee.salary ?? null,
      startDate: employee.joiningDate,
      endDate: employee.relievingDate ?? null,
      isActive: employee.isActive,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
      attendance: employee.attendance ?? undefined,
      leaves: employee.leaves ?? undefined,
    };
  }

  private formatShift(shift) {
    const profile = shift.employee?.user?.profile;
    const firstName = profile?.firstName ?? '';
    const lastName = profile?.lastName ?? '';

    const startTime = shift.checkInTime
      ? this.extractTime(shift.checkInTime)
      : null;
    const endTime = shift.checkOutTime
      ? this.extractTime(shift.checkOutTime)
      : null;

    return {
      id: shift.id,
      employeeId: shift.employeeId,
      employeeName: `${firstName} ${lastName}`.trim(),
      date: shift.date,
      startTime,
      endTime,
      totalHours: shift.totalHours ?? null,
      status: shift.status,
      createdAt: shift.createdAt,
    };
  }

  private buildDateTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const dt = new Date(date);
    dt.setUTCHours(hours, minutes, 0, 0);
    return dt;
  }

  private extractTime(dt: Date): string {
    const d = new Date(dt);
    const h = String(d.getUTCHours()).padStart(2, '0');
    const m = String(d.getUTCMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
}
