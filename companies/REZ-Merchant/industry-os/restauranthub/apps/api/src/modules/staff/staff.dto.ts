import { IsString, IsOptional, IsNumber, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class CreateEmployeeDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  phone!: string;

  @IsString()
  role!: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  salary?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;
}

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {}

export class CreateShiftDto {
  @IsString()
  employeeId!: string;

  @IsDateString()
  date!: string;

  @IsString()
  startTime!: string;

  @IsString()
  endTime!: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateShiftDto extends PartialType(CreateShiftDto) {
  @IsString()
  @IsOptional()
  status?: string;
}

export class StaffQueryDto {
  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
