import {
  IsString,
  IsInt,
  IsOptional,
  IsEmail,
  IsDateString,
  IsIn,
  Min,
  Max,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Tables ──────────────────────────────────────────────────────────────────

export class CreateTableDto {
  @IsString()
  name!: string; // tableNumber in DB

  @IsInt()
  @Min(1)
  capacity!: number;

  @IsOptional()
  @IsString()
  section?: string; // stored as part of metadata; not a DB column

  @IsOptional()
  @IsNumber()
  posX?: number;

  @IsOptional()
  @IsNumber()
  posY?: number;
}

export class UpdateTableDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsNumber()
  posX?: number;

  @IsOptional()
  @IsNumber()
  posY?: number;

  @IsOptional()
  @IsString()
  @IsIn(['available', 'occupied', 'reserved', 'cleaning'])
  status?: string;
}

// ── Reservations ─────────────────────────────────────────────────────────────

export class CreateReservationDto {
  @IsOptional()
  @IsString()
  tableId?: string;

  @IsInt()
  @Min(1)
  @Max(100)
  partySize!: number;

  @IsString()
  customerName!: string;

  @IsString()
  customerPhone!: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  /** ISO date string, e.g. "2025-04-10" */
  @IsDateString()
  date!: string;

  /** HH:mm, e.g. "19:00" */
  @IsString()
  time!: string;

  @IsOptional()
  @IsString()
  occasion?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  internalNotes?: string;
}

export class UpdateReservationDto {
  @IsOptional()
  @IsString()
  @IsIn(['confirmed', 'arrived', 'completed', 'cancelled', 'no_show'])
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  internalNotes?: string;
}

// ── Query ─────────────────────────────────────────────────────────────────────

export class ReservationsQueryDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
