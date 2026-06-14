import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsPhoneNumber, IsEnum } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({ example: '9876543210', description: 'Phone number (Indian format)' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '9876543210', description: 'Phone number' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP' })
  @IsString()
  @IsNotEmpty()
  @IsEnum(['restaurant', 'employee', 'vendor'])
  role?: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP' })
  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class OAuthGoogleDto {
  @ApiProperty({ description: 'Google OAuth token' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ enum: ['restaurant', 'employee', 'vendor'], description: 'User role' })
  @IsString()
  @IsOptional()
  role?: string;
}

export class LinkRABTULDto {
  @ApiProperty({ description: 'RABTUL user ID' })
  @IsString()
  @IsNotEmpty()
  rabtulUserId: string;

  @ApiProperty({ example: '9876543210', description: 'Phone number', required: false })
  @IsString()
  @IsOptional()
  phone?: string;
}
