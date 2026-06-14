import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateMenuCategoryDto,
  UpdateMenuCategoryDto,
  CreateMenuItemDto,
  UpdateMenuItemDto,
} from './menu.dto';

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Category Methods ────────────────────────────────────────────────────────

  async getCategories(restaurantId: string) {
    this.logger.log(`Fetching categories for restaurant ${restaurantId}`);
    return this.prisma.menuCategory.findMany({
      where: { restaurantId },
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: { select: { menuItems: true } },
      },
    });
  }

  async createCategory(dto: CreateMenuCategoryDto, restaurantId: string) {
    this.logger.log(`Creating category "${dto.name}" for restaurant ${restaurantId}`);
    return this.prisma.menuCategory.create({
      data: {
        ...dto,
        restaurantId,
      },
    });
  }

  async updateCategory(id: string, dto: UpdateMenuCategoryDto, restaurantId: string) {
    await this.assertCategoryOwnership(id, restaurantId);
    this.logger.log(`Updating category ${id} for restaurant ${restaurantId}`);
    return this.prisma.menuCategory.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCategory(id: string, restaurantId: string) {
    await this.assertCategoryOwnership(id, restaurantId);
    this.logger.log(`Deleting category ${id} for restaurant ${restaurantId}`);
    await this.prisma.menuCategory.delete({ where: { id } });
    return { message: 'Category deleted successfully' };
  }

  // ─── Menu Item Methods ────────────────────────────────────────────────────────

  async getMenuItems(restaurantId: string, categoryId?: string) {
    this.logger.log(
      `Fetching menu items for restaurant ${restaurantId}${categoryId ? `, category ${categoryId}` : ''}`,
    );
    return this.prisma.menuItem.findMany({
      where: {
        restaurantId,
        ...(categoryId ? { categoryId } : {}),
      },
      orderBy: [{ categoryId: 'asc' }, { displayOrder: 'asc' }],
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async getMenuItem(id: string, restaurantId: string) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id, restaurantId },
      include: {
        category: { select: { id: true, name: true } },
        modifiers: {
          include: { options: true },
          orderBy: { displayOrder: 'asc' },
        },
        variants: true,
      },
    });
    if (!item) {
      throw new NotFoundException(`Menu item ${id} not found`);
    }
    return item;
  }

  async createMenuItem(dto: CreateMenuItemDto, restaurantId: string) {
    await this.assertCategoryOwnership(dto.categoryId, restaurantId);
    this.logger.log(`Creating menu item "${dto.name}" for restaurant ${restaurantId}`);
    return this.prisma.menuItem.create({
      data: {
        ...dto,
        restaurantId,
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    });
  }

  async updateMenuItem(id: string, dto: UpdateMenuItemDto, restaurantId: string) {
    const item = await this.assertMenuItemOwnership(id, restaurantId);
    // Prevent updates to deleted items
    if (item && (item as unknown).deletedAt) {
      throw new NotFoundException(`Menu item ${id} has been deleted`);
    }
    if (dto.categoryId) {
      await this.assertCategoryOwnership(dto.categoryId, restaurantId);
    }
    this.logger.log(`Updating menu item ${id} for restaurant ${restaurantId}`);
    return this.prisma.menuItem.update({
      where: { id },
      data: dto,
      include: {
        category: { select: { id: true, name: true } },
      },
    });
  }

  async deleteMenuItem(id: string, restaurantId: string) {
    const item = await this.assertMenuItemOwnership(id, restaurantId);
    this.logger.log(`Deleting menu item ${id} for restaurant ${restaurantId}`);
    // Use soft delete to preserve order history
    await this.prisma.menuItem.update({
      where: { id },
      data: { isAvailable: false },
    });
    return { message: 'Menu item deleted successfully' };
  }

  async toggleAvailability(id: string, restaurantId: string) {
    const item = await this.assertMenuItemOwnership(id, restaurantId);
    const updated = await this.prisma.menuItem.update({
      where: { id },
      data: { isAvailable: !item.isAvailable },
      select: { id: true, name: true, isAvailable: true },
    });
    this.logger.log(
      `Toggled availability of item ${id} to ${updated.isAvailable} for restaurant ${restaurantId}`,
    );
    return updated;
  }

  // ─── Private Guards ───────────────────────────────────────────────────────────

  private async assertCategoryOwnership(categoryId: string, restaurantId: string) {
    const category = await this.prisma.menuCategory.findFirst({
      where: { id: categoryId, restaurantId },
      select: { id: true },
    });
    if (!category) {
      throw new NotFoundException(`Category ${categoryId} not found`);
    }
    return category;
  }

  private async assertMenuItemOwnership(itemId: string, restaurantId: string) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id: itemId, restaurantId },
      select: { id: true, name: true, isAvailable: true },
    });
    if (!item) {
      throw new NotFoundException(`Menu item ${itemId} not found`);
    }
    return item;
  }
}
