import { IsString, IsDateString, IsOptional, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HireEmployeeDto {
  @ApiProperty({ example: 'Senior Chef' })
  @IsString()
  position!: string;

  @ApiProperty({ example: 'Kitchen' })
  @IsString()
  department!: string;

  @ApiProperty({ example: '2024-12-01' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ example: 35000 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  salary?: number;

  @ApiPropertyOptional({ example: 'Permanent' })
  @IsOptional()
  @IsString()
  employmentType?: string;

  @ApiPropertyOptional({ example: 'Welcome to our team! Please report to HR on your first day.' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'MAIN' })
  @IsOptional()
  @IsString()
  branchId?: string;
}