import {
  IsString,
  IsOptional,
  IsNumber,
  IsUrl,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

type RestaurantCategory = 'fine_dining' | 'qsr' | 'cafe' | 'cloud_kitchen' | 'bar' | 'food_truck';

class CreateRestaurantAddressDto {
  @ApiProperty({ example: '123 Main Street' })
  @IsString()
  addressLine1: string;

  @ApiProperty({ example: 'Suite 456', required: false })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiProperty({ example: 'Mumbai' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'Maharashtra' })
  @IsString()
  state: string;

  @ApiProperty({ example: '400001' })
  @IsString()
  pincode: string;

  @ApiProperty({ example: 'India', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  isPrimary?: boolean;

  @ApiProperty({ example: 19.0760, required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ example: 72.8777, required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class CreateRestaurantDto {
  @ApiProperty({ example: 'Tasty Bites Restaurant' })
  @IsString()
  businessName: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  ownerName: string;

  @ApiProperty({ example: 'fine_dining' })
  @IsString()
  category: string;

  @ApiProperty({ example: '27AAAAA1234A1Z5', required: false })
  @IsOptional()
  @IsString()
  gstNumber?: string;

  @ApiProperty({ example: '12345678901234', required: false })
  @IsOptional()
  @IsString()
  fssaiLicense?: string;

  @ApiProperty({ example: '10L-50L', required: false })
  @IsOptional()
  @IsString()
  revenueRange?: string;

  @ApiProperty({ example: 25, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  totalEmployees?: number;

  @ApiProperty({ example: 'https://tastybites.com', required: false })
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @ApiProperty({ 
    example: 'A fine dining restaurant serving authentic Indian cuisine', 
    required: false 
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [CreateRestaurantAddressDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRestaurantAddressDto)
  addresses?: CreateRestaurantAddressDto[];
}