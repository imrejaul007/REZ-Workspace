import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';

class UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  private readonly logger = new Logger(ProfileController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get('profile')
  async getProfile(@Request() req) {
    const userId = req.user.sub || req.user.id;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            id: true,
            userId: true,
            firstName: true,
            lastName: true,
            avatar: true,
            bio: true,
            address: true,
            city: true,
            state: true,
            country: true,
            pincode: true,
            dateOfBirth: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
    return user;
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  async updateProfile(@Request() req, @Body() body: UpdateProfileDto) {
    const userId = req.user.sub || req.user.id;
    this.logger.log(`Updating profile for user ${userId}`);

    const { phone, ...profileFields } = body;

    // Update phone on User if provided
    if (phone !== undefined) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { phone },
      });
    }

    // Upsert Profile record
    const profile = await this.prisma.profile.upsert({
      where: { userId },
      update: profileFields,
      create: {
        userId,
        firstName: profileFields.firstName ?? '',
        lastName: profileFields.lastName ?? '',
        ...profileFields,
      },
    });

    return profile;
  }

  @Get('stats')
  async getUserStats(@Request() req) {
    const userId = req.user.sub || req.user.id;
    this.logger.log(`Fetching stats for user ${userId}`);

    // Return zero-counts — extend when concrete aggregation models exist
    return {
      jobsApplied: 0,
      ordersCount: 0,
      reviewsCount: 0,
      userId,
    };
  }
}
