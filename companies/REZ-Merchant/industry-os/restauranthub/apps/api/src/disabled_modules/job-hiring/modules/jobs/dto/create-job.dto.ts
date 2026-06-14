import { IsString, IsArray, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateJobDto {
  @ApiProperty({ example: 'Senior Chef' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'We are looking for an experienced chef to lead our kitchen team...' })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ example: ['5+ years cooking experience', 'Knowledge of Indian cuisine'] })
  @IsOptional()
  @IsArray()
  requirements?: string[];

  @ApiPropertyOptional({ example: ['Cooking', 'Team Leadership', 'Menu Planning'] })
  @IsOptional()
  @IsArray()
  skills?: string[];

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  experienceMin?: number;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsNumber()
  experienceMax?: number;

  @ApiPropertyOptional({ example: 25000 })
  @IsOptional()
  @IsNumber()
  salaryMin?: number;

  @ApiPropertyOptional({ example: 40000 })
  @IsOptional()
  @IsNumber()
  salaryMax?: number;

  @ApiProperty({ example: 'Mumbai, Maharashtra' })
  @IsString()
  location!: string;

  @ApiProperty({ example: 'Full-time' })
  @IsString()
  jobType!: string;

  @ApiProperty({ example: '2024-12-31' })
  @IsDateString()
  validTill!: string;
}