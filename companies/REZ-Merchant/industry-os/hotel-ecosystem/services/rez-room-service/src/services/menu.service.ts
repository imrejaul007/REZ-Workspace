import { v4 as uuidv4 } from 'uuid';
import { MenuItem, MenuCategory, IMenuItem } from '../models/menu.model';

export class MenuService {
  async getMenu(hotelId: string, category?: string): Promise<{
    categories: any[];
    items: any[];
  }> {
    const query: any = { hotelId, active: true };

    const categories = await MenuCategory.find(query).sort({ sortOrder: 1 });
    const itemsQuery: any = { hotelId, available: true };
    if (category) {
      itemsQuery.categoryId = category;
    }
    const items = await MenuItem.find(itemsQuery).sort({ isPopular: -1, name: 1 });

    return { categories, items };
  }

  async getItem(itemId: string): Promise<IMenuItem | null> {
    return MenuItem.findOne({ itemId });
  }

  async createItem(hotelId: string, data: Partial<IMenuItem>): Promise<IMenuItem> {
    const itemId = `MI-${uuidv4().substring(0, 8).toUpperCase()}`;

    const item = new MenuItem({
      ...data,
      itemId,
      hotelId,
    });

    await item.save();
    return item;
  }

  async updateItem(itemId: string, updates: Partial<IMenuItem>): Promise<IMenuItem | null> {
    return MenuItem.findOneAndUpdate({ itemId }, { $set: updates }, { new: true });
  }

  async deleteItem(itemId: string): Promise<void> {
    await MenuItem.findOneAndUpdate({ itemId }, { $set: { available: false } });
  }

  async getCategories(hotelId: string): Promise<any[]> {
    return MenuCategory.find({ hotelId, active: true }).sort({ sortOrder: 1 });
  }

  async createCategory(hotelId: string, data: Partial<MenuCategory>): Promise<MenuCategory> {
    const categoryId = `MC-${uuidv4().substring(0, 8).toUpperCase()}`;
    const maxOrder = await MenuCategory.findOne({ hotelId }).sort({ sortOrder: -1 });
    const sortOrder = maxOrder ? maxOrder.sortOrder + 1 : 0;

    const category = new MenuCategory({
      ...data,
      categoryId,
      hotelId,
      sortOrder: data.sortOrder ?? sortOrder,
    });

    await category.save();
    return category;
  }

  async getPopularItems(hotelId: string, startDate: Date, endDate: Date, limit: number = 10): Promise<any[]> {
    // Mock popular items - in production, query order history
    const items = await MenuItem.find({ hotelId, available: true, isPopular: true }).limit(limit);

    return items.map(item => ({
      itemId: item.itemId,
      name: item.name,
      categoryId: item.categoryId,
      price: item.price,
      orderCount: Math.floor(Math.random() * 100) + 10,
      revenue: (Math.floor(Math.random() * 100) + 10) * item.price,
    }));
  }

  async toggleAvailability(itemId: string, available: boolean): Promise<IMenuItem | null> {
    return MenuItem.findOneAndUpdate({ itemId }, { $set: { available } }, { new: true });
  }

  async markPopular(itemId: string, isPopular: boolean): Promise<IMenuItem | null> {
    return MenuItem.findOneAndUpdate({ itemId }, { $set: { isPopular } }, { new: true });
  }
}
