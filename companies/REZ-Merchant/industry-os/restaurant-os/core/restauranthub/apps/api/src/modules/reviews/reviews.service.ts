import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async getRestaurantIdForUser(userId: string): Promise<string> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!restaurant) {
      throw new ForbiddenException('No restaurant associated with this account');
    }
    return restaurant.id;
  }

  async listReviews(userId: string) {
    const restaurantId = await this.getRestaurantIdForUser(userId);
    return this.prisma.review.findMany({
      where: { restaurantId },
      include: {
        user: { include: { profile: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats(userId: string) {
    const restaurantId = await this.getRestaurantIdForUser(userId);

    const reviews = await this.prisma.review.findMany({
      where: { restaurantId },
      select: { rating: true },
    });

    if (reviews.length === 0) {
      return { averageRating: 0, totalReviews: 0, breakdown: {} };
    }

    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const averageRating = Math.round((sum / total) * 10) / 10;

    const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) breakdown[r.rating]++;
    });

    return { averageRating, totalReviews: total, breakdown };
  }

  async createReview(
    userId: string,
    dto: { rating: number; comment?: string; orderId?: string; restaurantId?: string },
  ) {
    // Derive the target restaurant from the order when orderId is provided,
    // otherwise require an explicit restaurantId in the request body.
    let restaurantId: string;

    if (dto.orderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: dto.orderId },
        select: { id: true, restaurantId: true },
      });
      if (!order) {
        throw new NotFoundException('Order not found');
      }
      restaurantId = order.restaurantId;
    } else if (dto.restaurantId) {
      restaurantId = dto.restaurantId;
    } else {
      throw new ForbiddenException('Either orderId or restaurantId must be provided');
    }

    // Prevent a restaurant owner from reviewing their own restaurant.
    const ownedRestaurant = await this.prisma.restaurant.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (ownedRestaurant?.id === restaurantId) {
      throw new ForbiddenException('Restaurant owners may not review their own restaurant');
    }

    const review = await this.prisma.review.create({
      data: {
        userId,
        restaurantId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        user: { include: { profile: true } },
      },
    });

    this.logger.log(`Review ${review.id} created for restaurant ${restaurantId}`);
    return review;
  }
}
