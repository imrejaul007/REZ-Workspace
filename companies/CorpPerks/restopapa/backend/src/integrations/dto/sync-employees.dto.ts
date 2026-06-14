import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SyncEmployeeDto {
  @ApiPropertyOptional({ description: 'External employee ID from ReZ Merchant' })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiProperty({ description: 'Employee full name' })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ description: 'Employee email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Employee phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Employee role/position' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: 'Employee skills array' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ description: 'Whether employee is verified' })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}

export class SyncEmployeesDto {
  @ApiProperty({ description: 'Restaurant ID to sync employees to' })
  @IsString()
  restaurantId: string;

  @ApiProperty({
    description: 'Array of employees to sync',
    type: [SyncEmployeeDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncEmployeeDto)
  employees: SyncEmployeeDto[];
}
