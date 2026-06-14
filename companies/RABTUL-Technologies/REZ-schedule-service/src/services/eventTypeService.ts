// ReZ Schedule - Event Type Service
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import type { CreateEventTypeInput } from '../types';

interface EventTypeWithRelations {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  duration: number;
  bufferTime: number;
  locationType: 'IN_PERSON' | 'PHONE_CALL' | 'VIDEO_CALL' | 'CUSTOM_LINK';
  locationAddress: string | null;
  meetingUrl: string | null;
  phoneNumber: string | null;
  requiresConfirmation: boolean;
  disableGuests: boolean;
  hideBranding: boolean;
  maxBookingsPerDay: number | null;
  minNoticeMinutes: number;
  slotInterval: number | null;
  price: number | null;
  currency: string;
  paidBooking: boolean;
  active: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    username: string;
    name: string;
    email: string;
    timeZone: string;
    avatarUrl: string | null;
  };
  customQuestions: {
    id: string;
    question: string;
    type: string;
    required: boolean;
    options: string[];
    order: number;
  }[];
}

export class EventTypeService {
  /**
   * Create a new event type
   */
  async createEventType(userId: string, input: CreateEventTypeInput): Promise<EventTypeWithRelations> {
    const { customQuestions, scheduleId, ...eventTypeData } = input;

    // Check if slug is unique for this user
    const existingSlug = await prisma.eventType.findFirst({
      where: { userId, slug: input.slug },
    });

    if (existingSlug) {
      throw new Error('Event type with this slug already exists');
    }

    // Get user's default schedule if not provided
    let linkedScheduleId = scheduleId;
    if (!linkedScheduleId) {
      const defaultSchedule = await prisma.schedule.findFirst({
        where: { userId, isDefault: true },
      });
      linkedScheduleId = defaultSchedule?.id;
    }

    // Create event type with custom questions
    const eventType = await prisma.eventType.create({
      data: {
        ...eventTypeData,
        userId,
        schedules: linkedScheduleId
          ? {
              create: {
                scheduleId: linkedScheduleId,
              },
            }
          : undefined,
        customQuestions: customQuestions
          ? {
              createMany: {
                data: customQuestions.map((q, index) => ({
                  question: q.question,
                  type: q.type,
                  required: q.required,
                  options: q.options || [],
                  order: index,
                })),
              },
            }
          : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            timeZone: true,
            avatarUrl: true,
          },
        },
        customQuestions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    logger.info(`[EventType] Created ${eventType.slug} for user ${userId}`);

    return eventType as unknown as EventTypeWithRelations;
  }

  /**
   * Get event type by ID
   */
  async getEventTypeById(id: string): Promise<EventTypeWithRelations | null> {
    const eventType = await prisma.eventType.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            timeZone: true,
            avatarUrl: true,
          },
        },
        customQuestions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return eventType as unknown as EventTypeWithRelations | null;
  }

  /**
   * Get event type by username and slug (public)
   */
  async getEventTypeByUsernameAndSlug(
    username: string,
    slug: string
  ): Promise<EventTypeWithRelations | null> {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return null;
    }

    const eventType = await prisma.eventType.findFirst({
      where: {
        userId: user.id,
        slug,
        active: true,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            timeZone: true,
            avatarUrl: true,
          },
        },
        customQuestions: {
          where: { eventTypeId: undefined }, // Exclude required questions for public view? No, include all
          orderBy: { order: 'asc' },
        },
      },
    });

    // Refetch with correct eventTypeId
    if (eventType) {
      const eventTypeWithQuestions = await prisma.eventType.findFirst({
        where: {
          userId: user.id,
          slug,
          active: true,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              email: true,
              timeZone: true,
              avatarUrl: true,
            },
          },
          customQuestions: {
            orderBy: { order: 'asc' },
          },
        },
      });
      return eventTypeWithQuestions as unknown as EventTypeWithRelations;
    }

    return eventType as unknown as EventTypeWithRelations | null;
  }

  /**
   * List event types for a user
   */
  async listEventTypes(userId: string): Promise<EventTypeWithRelations[]> {
    const eventTypes = await prisma.eventType.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            timeZone: true,
            avatarUrl: true,
          },
        },
        customQuestions: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return eventTypes as unknown as EventTypeWithRelations[];
  }

  /**
   * Update event type
   */
  async updateEventType(
    id: string,
    userId: string,
    input: Partial<CreateEventTypeInput>
  ): Promise<EventTypeWithRelations> {
    // Verify ownership
    const existing = await prisma.eventType.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error('Event type not found');
    }

    // Check slug uniqueness if changing
    if (input.slug && input.slug !== existing.slug) {
      const slugExists = await prisma.eventType.findFirst({
        where: { userId, slug: input.slug, id: { not: id } },
      });

      if (slugExists) {
        throw new Error('Event type with this slug already exists');
      }
    }

    // Update event type
    const { customQuestions, scheduleId, ...updateData } = input;

    const eventType = await prisma.eventType.update({
      where: { id },
      data: {
        ...updateData,
        customQuestions: customQuestions
          ? {
              deleteMany: {},
              createMany: {
                data: customQuestions.map((q, index) => ({
                  question: q.question,
                  type: q.type,
                  required: q.required,
                  options: q.options || [],
                  order: index,
                })),
              },
            }
          : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            timeZone: true,
            avatarUrl: true,
          },
        },
        customQuestions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    logger.info(`[EventType] Updated ${eventType.slug} for user ${userId}`);

    return eventType as unknown as EventTypeWithRelations;
  }

  /**
   * Delete event type
   */
  async deleteEventType(id: string, userId: string): Promise<void> {
    // Verify ownership
    const existing = await prisma.eventType.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error('Event type not found');
    }

    // Check for active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        eventTypeId: id,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (activeBookings > 0) {
      throw new Error('Cannot delete event type with active bookings');
    }

    await prisma.eventType.delete({
      where: { id },
    });

    logger.info(`[EventType] Deleted ${existing.slug} for user ${userId}`);
  }

  /**
   * Toggle event type active status
   */
  async toggleEventType(id: string, userId: string): Promise<EventTypeWithRelations> {
    const existing = await prisma.eventType.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new Error('Event type not found');
    }

    const eventType = await prisma.eventType.update({
      where: { id },
      data: { active: !existing.active },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            timeZone: true,
            avatarUrl: true,
          },
        },
        customQuestions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return eventType as unknown as EventTypeWithRelations;
  }
}

export const eventTypeService = new EventTypeService();
export default eventTypeService;
