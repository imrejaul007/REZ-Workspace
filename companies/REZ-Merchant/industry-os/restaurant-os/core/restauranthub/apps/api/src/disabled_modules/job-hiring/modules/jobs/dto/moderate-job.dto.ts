import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ModerationAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  REQUEST_CHANGES = 'REQUEST_CHANGES',
  FLAG = 'FLAG',
  SUSPEND = 'SUSPEND'
}

export enum ModerationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM', 
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export class ModerateJobDto {
  @ApiProperty({ enum: ModerationAction, example: ModerationAction.APPROVE })
  @IsEnum(ModerationAction)
  action!: ModerationAction;

  @ApiProperty({ example: 'Job approved - meets all quality standards' })
  @IsString()
  moderatorNotes!: string;

  @ApiPropertyOptional({ example: 'Salary range needs clarification' })
  @IsOptional()
  @IsString()
  feedback?: string;

  @ApiPropertyOptional({ enum: ModerationPriority, example: ModerationPriority.MEDIUM })
  @IsOptional()
  @IsEnum(ModerationPriority)
  priority?: ModerationPriority;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  requiresFollowUp?: boolean;

  @ApiPropertyOptional({ example: ['misleading-salary', 'incomplete-description'] })
  @IsOptional()
  @IsString({ each: true })
  flagReasons?: string[];
}