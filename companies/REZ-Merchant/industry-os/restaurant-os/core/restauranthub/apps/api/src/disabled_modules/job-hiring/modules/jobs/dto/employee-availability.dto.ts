import { IsArray, IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmployeeAvailabilityDto {
  @ApiProperty({ example: ['Full-time', 'Part-time'] })
  @IsArray()
  @IsString({ each: true })
  preferredJobTypes!: string[];

  @ApiProperty({ example: ['Mumbai', 'Pune', 'Delhi'] })
  @IsArray()
  @IsString({ each: true })
  preferredLocations!: string[];

  @ApiPropertyOptional({ example: ['Chef', 'Server', 'Kitchen Assistant'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredRoles?: string[];

  @ApiPropertyOptional({ example: 25000 })
  @IsOptional()
  @IsNumber()
  expectedSalaryMin?: number;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  expectedSalaryMax?: number;

  @ApiPropertyOptional({ example: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  availableDays?: string[];

  @ApiPropertyOptional({ example: ['Morning', 'Evening'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredShifts?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  openToRelocation?: boolean;

  @ApiPropertyOptional({ example: 'Looking for opportunities to grow in fine dining' })
  @IsOptional()
  @IsString()
  notes?: string;
}