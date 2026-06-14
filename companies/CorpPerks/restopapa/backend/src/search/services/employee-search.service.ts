import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EmployeeSearchService {
  constructor(private prisma: PrismaService) {}

  async searchEmployees(query: any) {
    const { q, skills, experience } = query;

    return this.prisma.employee.findMany({
      where: {
        AND: [
          q ? {
            OR: [
              { fullName: { contains: q } },
              { skills: { contains: q } },
              { education: { contains: q } }
            ]
          } : {},
          skills ? { skills: { contains: skills } } : {},
          experience ? { totalExperienceMonths: { gte: parseInt(experience, 10) * 12 } } : {}
        ]
      },
      include: {
        user: {
          select: {
            email: true,
            isActive: true
          }
        }
      }
    });
  }
}
