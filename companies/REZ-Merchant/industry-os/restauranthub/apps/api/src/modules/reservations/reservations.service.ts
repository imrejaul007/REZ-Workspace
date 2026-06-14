import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateTableDto,
  UpdateTableDto,
  CreateReservationDto,
  UpdateReservationDto,
  ReservationsQueryDto,
} from './reservations.dto';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

// Menu base URL - where customers go after scanning QR
const MENU_BASE_URL = process.env.MENU_BASE_URL || 'https://menu.rez.money';

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Private helpers ────────────────────────────────────────────────────────

  private async assertRestaurantOwner(restaurantId: string): Promise<void> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true },
    });
    if (!restaurant) {
      throw new ForbiddenException('Restaurant not found');
    }
  }

  /**
   * Combine a date string ("2025-04-10") and time string ("19:00")
   * into a single UTC Date object. Validates ISO format.
   */
  private buildReservationTime(date: string, time: string): Date {
    // Validate date format (YYYY-MM-DD)
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      throw new BadRequestException('Date must be in format YYYY-MM-DD');
    }
    // Validate time format (HH:MM)
    if (!time.match(/^\d{2}:\d{2}$/)) {
      throw new BadRequestException('Time must be in format HH:MM');
    }

    const dateTime = new Date(`${date}T${time}:00`);
    if (isNaN(dateTime.getTime())) {
      throw new BadRequestException('Invalid date or time');
    }
    return dateTime;
  }

  // ── Tables ─────────────────────────────────────────────────────────────────

  async getTables(restaurantId: string): Promise<unknown> {
    await this.assertRestaurantOwner(restaurantId);
    try {
      const tables = await this.prisma.table.findMany({
        where: { restaurantId, isActive: true },
        orderBy: { tableNumber: 'asc' },
      });
      return { success: true, data: tables };
    } catch (error) {
      this.logger.error('Failed to fetch tables', error);
      throw new InternalServerErrorException('Failed to fetch tables');
    }
  }

  async createTable(dto: CreateTableDto, restaurantId: string): Promise<unknown> {
    await this.assertRestaurantOwner(restaurantId);
    try {
      const table = await this.prisma.table.create({
        data: {
          restaurantId,
          tableNumber: dto.name,
          capacity: dto.capacity,
          status: 'available',
        },
      });
      return { success: true, data: table };
    } catch (error) {
      this.logger.error('Failed to create table', error);
      throw new InternalServerErrorException('Failed to create table');
    }
  }

  async updateTable(id: string, dto: UpdateTableDto, restaurantId: string): Promise<unknown> {
    const table = await this.prisma.table.findUnique({ where: { id } });
    if (!table || table.restaurantId !== restaurantId) {
      throw new NotFoundException('Table not found');
    }
    try {
      const updated = await this.prisma.table.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { tableNumber: dto.name }),
          ...(dto.capacity !== undefined && { capacity: dto.capacity }),
          ...(dto.status !== undefined && { status: dto.status }),
        },
      });
      return { success: true, data: updated };
    } catch (error) {
      this.logger.error('Failed to update table', error);
      throw new InternalServerErrorException('Failed to update table');
    }
  }

  async deleteTable(id: string, restaurantId: string): Promise<unknown> {
    const table = await this.prisma.table.findUnique({ where: { id } });
    if (!table || table.restaurantId !== restaurantId) {
      throw new NotFoundException('Table not found');
    }
    try {
      // Soft-delete so historical reservations remain intact
      await this.prisma.table.update({
        where: { id },
        data: { isActive: false },
      });
      return { success: true, message: 'Table deleted successfully' };
    } catch (error) {
      this.logger.error('Failed to delete table', error);
      throw new InternalServerErrorException('Failed to delete table');
    }
  }

  // ── Reservations ──────────────────────────────────────────────────────────

  async getReservations(restaurantId: string, query: ReservationsQueryDto): Promise<unknown> {
    await this.assertRestaurantOwner(restaurantId);
    try {
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const skip = (page - 1) * limit;

      // Build WHERE clause: join through table to filter by restaurantId
      const where: unknown = {
        table: { restaurantId },
      };

      if (query.status) {
        where.status = query.status;
      }

      if (query.date) {
        // Filter reservations for a specific day (UTC boundaries)
        const dayStart = new Date(`${query.date}T00:00:00`);
        const dayEnd = new Date(`${query.date}T23:59:59`);
        where.reservationTime = { gte: dayStart, lte: dayEnd };
      }

      const [reservations, total] = await Promise.all([
        this.prisma.tableReservation.findMany({
          where,
          include: {
            table: { select: { id: true, tableNumber: true, capacity: true, status: true } },
            customer: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
          },
          orderBy: { reservationTime: 'asc' },
          skip,
          take: limit,
        }),
        this.prisma.tableReservation.count({ where }),
      ]);

      return {
        success: true,
        data: reservations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Failed to fetch reservations', error);
      throw new InternalServerErrorException('Failed to fetch reservations');
    }
  }

  async getReservation(id: string, restaurantId: string): Promise<unknown> {
    const reservation = await this.prisma.tableReservation.findUnique({
      where: { id },
      include: {
        table: true,
        customer: true,
      },
    });
    if (!reservation || reservation.table.restaurantId !== restaurantId) {
      throw new NotFoundException('Reservation not found');
    }
    return { success: true, data: reservation };
  }

  async createReservation(dto: CreateReservationDto, restaurantId: string): Promise<unknown> {
    await this.assertRestaurantOwner(restaurantId);
    try {
      // Validate party size
      if (!Number.isInteger(dto.partySize) || dto.partySize < 1 || dto.partySize > 1000) {
        throw new BadRequestException('Party size must be a positive integer between 1 and 1000');
      }

      // If tableId provided, verify it belongs to this restaurant
      if (dto.tableId) {
        const table = await this.prisma.table.findUnique({ where: { id: dto.tableId } });
        if (!table || table.restaurantId !== restaurantId) {
          throw new NotFoundException('Table not found');
        }
        // Validate table capacity
        if (table.capacity < dto.partySize) {
          throw new BadRequestException(`Party size ${dto.partySize} exceeds table capacity ${table.capacity}`);
        }
      } else {
        // Auto-assign first available table with enough capacity
        const available = await this.prisma.table.findFirst({
          where: {
            restaurantId,
            isActive: true,
            status: 'available',
            capacity: { gte: dto.partySize },
          },
          orderBy: { capacity: 'asc' },
        });
        if (available) {
          dto.tableId = available.id;
        }
      }

      if (!dto.tableId) {
        throw new BadRequestException('No available table found for the requested party size');
      }

      // Find or create customer by phone within this restaurant
      const [firstName, ...rest] = dto.customerName.trim().split(' ');
      const lastName = rest.join(' ') || undefined;

      let customer = await this.prisma.customer.findFirst({
        where: { restaurantId, phone: dto.customerPhone },
      });
      if (!customer) {
        customer = await this.prisma.customer.create({
          data: {
            restaurantId,
            firstName,
            lastName,
            phone: dto.customerPhone,
            email: dto.customerEmail,
          },
        });
      }

      const reservationTime = this.buildReservationTime(dto.date, dto.time);

      const reservation = await this.prisma.tableReservation.create({
        data: {
          tableId: dto.tableId,
          customerId: customer.id,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          customerEmail: dto.customerEmail,
          partySize: dto.partySize,
          reservationTime,
          status: 'confirmed',
          notes: dto.notes,
        },
        include: {
          table: { select: { id: true, tableNumber: true } },
          customer: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      return { success: true, data: reservation };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Failed to create reservation', error);
      throw new InternalServerErrorException('Failed to create reservation');
    }
  }

  async updateReservation(id: string, dto: UpdateReservationDto, restaurantId: string): Promise<unknown> {
    const existing = await this.prisma.tableReservation.findUnique({
      where: { id },
      include: { table: { select: { restaurantId: true } } },
    });
    if (!existing || existing.table.restaurantId !== restaurantId) {
      throw new NotFoundException('Reservation not found');
    }
    try {
      const updated = await this.prisma.tableReservation.update({
        where: { id },
        data: {
          ...(dto.status !== undefined && { status: dto.status }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
        },
        include: {
          table: { select: { id: true, tableNumber: true } },
          customer: { select: { id: true, firstName: true, lastName: true } },
        },
      });
      return { success: true, data: updated };
    } catch (error) {
      this.logger.error('Failed to update reservation', error);
      throw new InternalServerErrorException('Failed to update reservation');
    }
  }

  async cancelReservation(id: string, restaurantId: string): Promise<unknown> {
    const existing = await this.prisma.tableReservation.findUnique({
      where: { id },
      include: { table: { select: { restaurantId: true } } },
    });
    if (!existing || existing.table.restaurantId !== restaurantId) {
      throw new NotFoundException('Reservation not found');
    }
    try {
      const updated = await this.prisma.tableReservation.update({
        where: { id },
        data: { status: 'cancelled' },
      });
      return { success: true, data: updated, message: 'Reservation cancelled' };
    } catch (error) {
      this.logger.error('Failed to cancel reservation', error);
      throw new InternalServerErrorException('Failed to cancel reservation');
    }
  }

  // ── QR Code Generation ──────────────────────────────────────────────────

  /**
   * Generate QR code for a specific table
   */
  async generateTableQR(tableId: string, restaurantId: string): Promise<unknown> {
    const table = await this.prisma.table.findUnique({ where: { id: tableId } });
    if (!table || table.restaurantId !== restaurantId) {
      throw new NotFoundException('Table not found');
    }

    try {
      // Get restaurant slug
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { slug: true, name: true },
      });

      const restaurantSlug = restaurant?.slug || restaurantId;

      // Create menu URL with table parameter
      const menuUrl = `${MENU_BASE_URL}/${restaurantSlug}?table=${table.tableNumber}`;

      // QR payload
      const qrPayload = {
        v: 1,
        id: tableId,
        r: restaurantId,
        s: restaurantSlug,
        t: table.tableNumber,
      };

      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload), {
        width: 400,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
        errorCorrectionLevel: 'H',
      });

      return {
        success: true,
        data: {
          tableId: table.id,
          tableNumber: table.tableNumber,
          tableName: table.name,
          capacity: table.capacity,
          menuUrl,
          qrCodeDataUrl,
          restaurantName: restaurant?.name,
        },
      };
    } catch (error) {
      this.logger.error('Failed to generate QR code', error);
      throw new InternalServerErrorException('Failed to generate QR code');
    }
  }

  /**
   * Generate QR codes for all tables in the restaurant
   */
  async generateAllTableQRCodes(restaurantId: string): Promise<unknown> {
    await this.assertRestaurantOwner(restaurantId);

    try {
      const tables = await this.prisma.table.findMany({
        where: { restaurantId, isActive: true },
        orderBy: { tableNumber: 'asc' },
      });

      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: restaurantId },
        select: { slug: true, name: true },
      });

      const restaurantSlug = restaurant?.slug || restaurantId;

      const qrcodes = await Promise.all(
        tables.map(async (table) => {
          const menuUrl = `${MENU_BASE_URL}/${restaurantSlug}?table=${table.tableNumber}`;
          const qrPayload = {
            v: 1,
            id: table.id,
            r: restaurantId,
            s: restaurantSlug,
            t: table.tableNumber,
          };
          const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload), {
            width: 400,
            margin: 2,
            color: { dark: '#000000', light: '#FFFFFF' },
            errorCorrectionLevel: 'H',
          });

          return {
            tableId: table.id,
            tableNumber: table.tableNumber,
            tableName: table.name,
            capacity: table.capacity,
            menuUrl,
            qrCodeDataUrl,
          };
        })
      );

      return {
        success: true,
        data: {
          restaurantName: restaurant?.name,
          restaurantSlug,
          totalTables: tables.length,
          qrcodes,
        },
      };
    } catch (error) {
      this.logger.error('Failed to generate QR codes', error);
      throw new InternalServerErrorException('Failed to generate QR codes');
    }
  }

  /**
   * Get QR code image for a table
   */
  async getTableQRImage(tableId: string, restaurantId: string): Promise<unknown> {
    return this.generateTableQR(tableId, restaurantId);
  }

  /**
   * Get QR info for a table (without generating the image)
   */
  async getTableQRInfo(tableId: string, restaurantId: string): Promise<unknown> {
    const table = await this.prisma.table.findUnique({ where: { id: tableId } });
    if (!table || table.restaurantId !== restaurantId) {
      throw new NotFoundException('Table not found');
    }

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { slug: true, name: true },
    });

    const restaurantSlug = restaurant?.slug || restaurantId;
    const menuUrl = `${MENU_BASE_URL}/${restaurantSlug}?table=${table.tableNumber}`;

    return {
      success: true,
      data: {
        tableId: table.id,
        tableNumber: table.tableNumber,
        tableName: table.name,
        capacity: table.capacity,
        menuUrl,
        restaurantName: restaurant?.name,
        restaurantSlug,
      },
    };
  }
}
