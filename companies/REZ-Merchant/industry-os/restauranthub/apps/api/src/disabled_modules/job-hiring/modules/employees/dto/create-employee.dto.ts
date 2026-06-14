import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty()
  @IsString()
  userId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiProperty({ example: 'Manager' })
  @IsString()
  designation!: string;

  @ApiPropertyOptional({ example: 'Kitchen' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 25000 })
  @IsOptional()
  @IsNumber()
  salary?: number;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  joiningDate!: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  relievingDate?: string;
}