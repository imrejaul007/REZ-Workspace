import { IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateJobApplicationDto {
  @ApiPropertyOptional({ example: 'I am very interested in this position and believe my experience...' })
  @IsOptional()
  @IsString()
  coverLetter?: string;

  @ApiPropertyOptional({ example: 'https://example.com/resume.pdf' })
  @IsOptional()
  @IsUrl()
  resume?: string;
}