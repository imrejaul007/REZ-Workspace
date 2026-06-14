import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RateEmployeeDto {
  @ApiProperty({ example: 4.5, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({ example: 'Excellent work ethic and team collaboration skills' })
  @IsOptional()
  @IsString()
  review?: string;

  @ApiPropertyOptional({ example: 'Promotion due to consistent performance' })
  @IsOptional()
  @IsString()
  reason?: string;
}