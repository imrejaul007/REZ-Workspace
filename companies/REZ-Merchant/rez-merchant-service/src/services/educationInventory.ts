// Education inventory extends BaseInventory
import { BaseInventory } from '@rez/base-services/inventory';

export class EducationInventoryService extends BaseInventory {
  /**
   * Track course materials inventory
   */
  async trackCourseMaterials(courseId: string, available: number): Promise<void> {
    await this.updateInventory({
      itemId: courseId,
      itemType: 'course_materials',
      available,
      updatedAt: new Date(),
    });
  }

  /**
   * Track equipment inventory
   */
  async trackEquipment(equipmentId: string, available: number): Promise<void> {
    await this.updateInventory({
      itemId: equipmentId,
      itemType: 'equipment',
      available,
      updatedAt: new Date(),
    });
  }

  /**
   * Get low stock alerts for education items
   */
  async getLowStockAlerts(): Promise<LowStockAlert[]> {
    const inventory = await this.getAllInventory();
    return inventory
      .filter((item) => item.available < item.threshold)
      .map((item) => ({
        itemId: item.itemId,
        itemType: item.itemType,
        available: item.available,
        threshold: item.threshold,
        severity: item.available === 0 ? 'critical' : 'warning',
      }));
  }
}

interface LowStockAlert {
  itemId: string;
  itemType: string;
  available: number;
  threshold: number;
  severity: 'warning' | 'critical';
}
