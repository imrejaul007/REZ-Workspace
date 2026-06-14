import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create restaurant profile' })
  @ApiResponse({ status: 201, description: 'Restaurant created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only restaurant users allowed' })
  create(@Request() req, @Body() createRestaurantDto: CreateRestaurantDto) {
    return this.restaurantsService.create(req.user.id, createRestaurantDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all restaurants' })
  @ApiResponse({ status: 200, description: 'Restaurants retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'category', required: false, type: String, example: 'fine_dining' })
  @ApiQuery({ name: 'city', required: false, type: String, example: 'Mumbai' })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'pizza' })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('category') category?: string,
    @Query('city') city?: string,
    @Query('search') search?: string,
  ) {
    const filters = { category, city, search };
    return this.restaurantsService.findAll(page, limit, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get restaurant by ID' })
  @ApiResponse({ status: 200, description: 'Restaurant retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  findOne(@Param('id') id: string) {
    return this.restaurantsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/private')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get restaurant with private details (owner only)' })
  @ApiResponse({ status: 200, description: 'Restaurant retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  findOnePrivate(@Param('id') id: string) {
    return this.restaurantsService.findOne(id, true);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update restaurant profile' })
  @ApiResponse({ status: 200, description: 'Restaurant updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - You can only update your own restaurant' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateRestaurantDto: UpdateRestaurantDto,
  ) {
    return this.restaurantsService.update(id, req.user.id, updateRestaurantDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete restaurant profile' })
  @ApiResponse({ status: 200, description: 'Restaurant deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - You can only delete your own restaurant' })
  @ApiResponse({ status: 404, description: 'Restaurant not found' })
  remove(@Param('id') id: string, @Request() req) {
    return this.restaurantsService.remove(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/analytics')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get restaurant analytics (owner only)' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Restaurant not found or access denied' })
  getAnalytics(@Param('id') id: string, @Request() req) {
    return this.restaurantsService.getAnalytics(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/subscription')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update restaurant subscription' })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Restaurant not found or access denied' })
  updateSubscription(
    @Param('id') id: string,
    @Request() req,
    @Body() subscriptionData: any,
  ) {
    return this.restaurantsService.updateSubscription(id, req.user.id, subscriptionData);
  }
}