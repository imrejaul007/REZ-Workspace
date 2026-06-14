import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MenuService } from './menu.service';
import {
  CreateMenuCategoryDto,
  UpdateMenuCategoryDto,
  CreateMenuItemDto,
  UpdateMenuItemDto,
} from './menu.dto';

@Controller('menu')
@UseGuards(JwtAuthGuard)
export class MenuController {
  private readonly logger = new Logger(MenuController.name);

  constructor(private readonly menuService: MenuService) {}

  private getRestaurantId(req): string {
    const restaurantId = req?.user?.restaurantId;
    if (!restaurantId) {
      throw new ForbiddenException('User does not have an associated restaurant');
    }
    return restaurantId;
  }

  // ─── Category Endpoints ───────────────────────────────────────────────────────

  @Get('categories')
  async getCategories(@Request() req) {
    const restaurantId = this.getRestaurantId(req);
    return this.menuService.getCategories(restaurantId);
  }

  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  async createCategory(
    @Body() dto: CreateMenuCategoryDto,
    @Request() req,
  ) {
    const restaurantId = this.getRestaurantId(req);
    return this.menuService.createCategory(dto, restaurantId);
  }

  @Patch('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateMenuCategoryDto,
    @Request() req,
  ) {
    const restaurantId = this.getRestaurantId(req);
    return this.menuService.updateCategory(id, dto, restaurantId);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.OK)
  async deleteCategory(@Param('id') id: string, @Request() req) {
    const restaurantId = this.getRestaurantId(req);
    return this.menuService.deleteCategory(id, restaurantId);
  }

  // ─── Menu Item Endpoints ──────────────────────────────────────────────────────

  @Get('items')
  async getMenuItems(
    @Request() req,
    @Query('categoryId') categoryId?: string,
  ) {
    const restaurantId = this.getRestaurantId(req);
    return this.menuService.getMenuItems(restaurantId, categoryId);
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  async createMenuItem(
    @Body() dto: CreateMenuItemDto,
    @Request() req,
  ) {
    const restaurantId = this.getRestaurantId(req);
    return this.menuService.createMenuItem(dto, restaurantId);
  }

  @Get('items/:id')
  async getMenuItem(@Param('id') id: string, @Request() req) {
    const restaurantId = this.getRestaurantId(req);
    return this.menuService.getMenuItem(id, restaurantId);
  }

  @Patch('items/:id')
  async updateMenuItem(
    @Param('id') id: string,
    @Body() dto: UpdateMenuItemDto,
    @Request() req,
  ) {
    const restaurantId = this.getRestaurantId(req);
    return this.menuService.updateMenuItem(id, dto, restaurantId);
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.OK)
  async deleteMenuItem(@Param('id') id: string, @Request() req) {
    const restaurantId = this.getRestaurantId(req);
    return this.menuService.deleteMenuItem(id, restaurantId);
  }

  @Patch('items/:id/toggle-availability')
  async toggleAvailability(@Param('id') id: string, @Request() req) {
    const restaurantId = this.getRestaurantId(req);
    return this.menuService.toggleAvailability(id, restaurantId);
  }
}
