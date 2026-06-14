import { IsDateString, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum InterviewType {
  IN_PERSON = 'IN_PERSON',
  VIDEO_CALL = 'VIDEO_CALL',
  PHONE = 'PHONE'
}

export class ScheduleInterviewDto {
  @ApiProperty({ example: '2024-12-15T10:00:00Z' })
  @IsDateString()
  scheduledFor!: string;

  @ApiProperty({ enum: InterviewType, example: InterviewType.IN_PERSON })
  @IsEnum(InterviewType)
  interviewType!: InterviewType;

  @ApiPropertyOptional({ example: 'Restaurant Main Branch - Conference Room 1' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'Please bring your ID and work permit documents' })
  @IsOptional()
  @IsString()
  notes?: string;
}