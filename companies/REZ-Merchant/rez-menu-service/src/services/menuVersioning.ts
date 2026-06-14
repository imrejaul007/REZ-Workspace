/**
 * Menu Versioning Service
 * Version control for menus with templates, publishing, and rollback
 */

import mongoose, { Schema, Document } from 'mongoose';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MenuVersion {
  id: string;
  menuId: string;
  version: number;
  name: string;
  description?: string;
  categories: MenuCategory[];
  items: MenuItem[];
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Date;
  publishedBy?: string;
  changelog: ChangeLogEntry[];
  createdAt: Date;
  createdBy: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  image?: string;
  sortOrder: number;
  available: boolean;
  dietaryIcon?: string;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  available: boolean;
  sortOrder: number;
  variants?: ItemVariant[];
  modifiers?: ItemModifier[];
  dietaryInfo: DietaryInfo;
  allergens?: string[];
  calories?: number;
  preparationTime?: number; // minutes
  addonCategories?: string[]; // IDs of modifier groups
}

export interface ItemVariant {
  id: string;
  name: string;
  price: number;
  available: boolean;
  sku?: string;
  image?: string;
}

export interface ItemModifier {
  id: string;
  name: string;
  options: ModifierOption[];
  minSelections: number;
  maxSelections: number;
  required: boolean;
}

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
  available: boolean;
  isDefault?: boolean;
}

export interface DietaryInfo {
  veg: boolean;
  vegan: boolean;
  glutenFree: boolean;
  nutFree: boolean;
  dairyFree: boolean;
  jain: boolean;
  halal: boolean;
}

export interface ChangeLogEntry {
  id: string;
  action: 'created' | 'updated' | 'deleted' | 'restored';
  field?: string;
  oldValue?: any;
  newValue?: any;
  itemId?: string;
  categoryId?: string;
  description: string;
  timestamp: Date;
  userId: string;
  userName: string;
}

export interface MenuTemplate {
  id: string;
  name: string;
  description: string;
  cuisine: string;
  categories: MenuCategory[];
  sampleItems: MenuItem[];
  createdAt: Date;
  isPublic: boolean;
  usageCount: number;
}

// ── MongoDB Models ─────────────────────────────────────────────────────────────

const MenuVersionSchema = new Schema({
  id: { type: String, required: true, unique: true },
  menuId: { type: String, required: true, index: true },
  version: { type: Number, required: true },
  name: { type: String, required: true },
  description: String,
  categories: [{
    id: String,
    name: String,
    description: String,
    image: String,
    sortOrder: Number,
    available: Boolean,
    dietaryIcon: String,
  }],
  items: [{
    id: String,
    categoryId: String,
    name: String,
    description: String,
    price: Number,
    image: String,
    available: Boolean,
    sortOrder: Number,
    variants: [{
      id: String,
      name: String,
      price: Number,
      available: Boolean,
      sku: String,
      image: String,
    }],
    modifiers: [{
      id: String,
      name: String,
      options: [{
        id: String,
        name: String,
        price: Number,
        available: Boolean,
        isDefault: Boolean,
      }],
      minSelections: Number,
      maxSelections: Number,
      required: Boolean,
    }],
    dietaryInfo: {
      veg: Boolean,
      vegan: Boolean,
      glutenFree: Boolean,
      nutFree: Boolean,
      dairyFree: Boolean,
      jain: Boolean,
      halal: Boolean,
    },
    allergens: [String],
    calories: Number,
    preparationTime: Number,
    addonCategories: [String],
  }],
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  publishedAt: Date,
  publishedBy: String,
  changelog: [{
    id: String,
    action: String,
    field: String,
    oldValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed,
    itemId: String,
    categoryId: String,
    description: String,
    timestamp: Date,
    userId: String,
    userName: String,
  }],
  createdBy: String,
}, { timestamps: true });

MenuVersionSchema.index({ menuId: 1, version: -1 });
MenuVersionSchema.index({ menuId: 1, status: 1 });

const MenuTemplateSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  cuisine: { type: String, required: true, index: true },
  categories: Schema.Types.Mixed,
  sampleItems: Schema.Types.Mixed,
  isPublic: { type: Boolean, default: true },
  usageCount: { type: Number, default: 0 },
}, { timestamps: true });

export const MenuVersion = mongoose.models.MenuVersion || mongoose.model('MenuVersion', MenuVersionSchema);
export const MenuTemplate = mongoose.models.MenuTemplate || mongoose.model('MenuTemplate', MenuTemplateSchema);

// ── Menu Versioning Service ─────────────────────────────────────────────────────

class MenuVersioningService {
  /**
   * Create a new menu version (draft)
   */
  async createVersion(params: {
    menuId: string;
    name: string;
    description?: string;
    categories?: MenuCategory[];
    items?: MenuItem[];
    userId: string;
    userName: string;
  }): Promise<MenuVersion> {
    // Get current latest version
    const latest = await MenuVersion.findOne({ menuId: params.menuId })
      .sort({ version: -1 });

    const newVersion = latest ? latest.version + 1 : 1;

    const version = new MenuVersion({
      id: `${params.menuId}_v${newVersion}_${Date.now()}`,
      menuId: params.menuId,
      version: newVersion,
      name: params.name,
      description: params.description,
      categories: params.categories || [],
      items: params.items || [],
      status: 'draft',
      changelog: [{
        id: `cl_${Date.now()}`,
        action: 'created',
        description: 'Menu version created',
        timestamp: new Date(),
        userId: params.userId,
        userName: params.userName,
      }],
      createdBy: params.userId,
    });

    await version.save();
    return version;
  }

  /**
   * Duplicate an existing version
   */
  async duplicateVersion(
    sourceVersionId: string,
    newName: string,
    userId: string,
    userName: string
  ): Promise<MenuVersion> {
    const source = await MenuVersion.findOne({ id: sourceVersionId });
    if (!source) throw new Error('Source version not found');

    const latest = await MenuVersion.findOne({ menuId: source.menuId })
      .sort({ version: -1 });
    const newVersion = latest ? latest.version + 1 : 1;

    const newVersionDoc = new MenuVersion({
      id: `${source.menuId}_v${newVersion}_${Date.now()}`,
      menuId: source.menuId,
      version: newVersion,
      name: newName,
      description: source.description,
      categories: source.categories,
      items: source.items,
      status: 'draft',
      changelog: [{
        id: `cl_${Date.now()}`,
        action: 'created',
        description: `Duplicated from version ${source.version}`,
        timestamp: new Date(),
        userId,
        userName,
      }],
      createdBy: userId,
    });

    await newVersionDoc.save();
    return newVersionDoc;
  }

  /**
   * Update menu item with changelog
   */
  async updateItem(
    versionId: string,
    itemId: string,
    updates: Partial<MenuItem>,
    userId: string,
    userName: string
  ): Promise<MenuVersion> {
    const version = await MenuVersion.findOne({ id: versionId });
    if (!version) throw new Error('Version not found');
    if (version.status !== 'draft') throw new Error('Can only edit draft versions');

    const itemIndex = version.items.findIndex(i => i.id === itemId);
    if (itemIndex === -1) throw new Error('Item not found');

    const oldItem = { ...version.items[itemIndex] };
    const changes: ChangeLogEntry[] = [];

    // Track each field change
    Object.keys(updates).forEach(key => {
      const oldVal = (oldItem as any)[key];
      const newVal = (updates as any)[key];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes.push({
          id: `cl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          action: 'updated',
          field: key,
          oldValue: oldVal,
          newValue: newVal,
          itemId,
          description: `Updated ${key}: ${JSON.stringify(oldVal)} → ${JSON.stringify(newVal)}`,
          timestamp: new Date(),
          userId,
          userName,
        });
      }
    });

    // Apply updates
    version.items[itemIndex] = { ...version.items[itemIndex], ...updates };
    version.changelog.push(...changes);

    await version.save();
    return version;
  }

  /**
   * Add new item to version
   */
  async addItem(
    versionId: string,
    item: MenuItem,
    userId: string,
    userName: string
  ): Promise<MenuVersion> {
    const version = await MenuVersion.findOne({ id: versionId });
    if (!version) throw new Error('Version not found');
    if (version.status !== 'draft') throw new Error('Can only edit draft versions');

    item.id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    version.items.push(item);

    version.changelog.push({
      id: `cl_${Date.now()}`,
      action: 'created',
      itemId: item.id,
      description: `Added new item: ${item.name}`,
      timestamp: new Date(),
      userId,
      userName,
    });

    await version.save();
    return version;
  }

  /**
   * Delete item from version
   */
  async deleteItem(
    versionId: string,
    itemId: string,
    userId: string,
    userName: string
  ): Promise<MenuVersion> {
    const version = await MenuVersion.findOne({ id: versionId });
    if (!version) throw new Error('Version not found');
    if (version.status !== 'draft') throw new Error('Can only edit draft versions');

    const item = version.items.find(i => i.id === itemId);
    if (!item) throw new Error('Item not found');

    version.items = version.items.filter(i => i.id !== itemId);

    version.changelog.push({
      id: `cl_${Date.now()}`,
      action: 'deleted',
      itemId,
      oldValue: item,
      description: `Deleted item: ${item.name}`,
      timestamp: new Date(),
      userId,
      userName,
    });

    await version.save();
    return version;
  }

  /**
   * Publish version
   */
  async publishVersion(
    versionId: string,
    userId: string,
    userName: string
  ): Promise<MenuVersion> {
    const version = await MenuVersion.findOne({ id: versionId });
    if (!version) throw new Error('Version not found');
    if (version.status !== 'draft') throw new Error('Version already published');

    // Archive current published version
    await MenuVersion.updateMany(
      { menuId: version.menuId, status: 'published' },
      {
        status: 'archived',
        changelog: {
          $push: {
            id: `cl_${Date.now()}`,
            action: 'archived',
            description: `Superseded by version ${version.version}`,
            timestamp: new Date(),
            userId: 'system',
            userName: 'System',
          }
        }
      }
    );

    // Publish new version
    version.status = 'published';
    version.publishedAt = new Date();
    version.publishedBy = userId;
    version.changelog.push({
      id: `cl_${Date.now()}`,
      action: 'updated',
      description: `Version ${version.version} published`,
      timestamp: new Date(),
      userId,
      userName,
    });

    await version.save();
    return version;
  }

  /**
   * Rollback to previous version
   */
  async rollback(
    menuId: string,
    targetVersion: number,
    userId: string,
    userName: string
  ): Promise<MenuVersion> {
    const target = await MenuVersion.findOne({ menuId, version: targetVersion });
    if (!target) throw new Error('Target version not found');

    // Create new version based on target
    const latest = await MenuVersion.findOne({ menuId })
      .sort({ version: -1 });
    const newVersion = latest ? latest.version + 1 : 1;

    const rollbackVersion = new MenuVersion({
      id: `${menuId}_v${newVersion}_${Date.now()}`,
      menuId,
      version: newVersion,
      name: `${target.name} (Rollback)`,
      description: target.description,
      categories: target.categories,
      items: target.items,
      status: 'draft',
      changelog: [{
        id: `cl_${Date.now()}`,
        action: 'restored',
        description: `Rolled back from version ${latest?.version || 1} to version ${targetVersion}`,
        timestamp: new Date(),
        userId,
        userName,
      }],
      createdBy: userId,
    });

    await rollbackVersion.save();
    return rollbackVersion;
  }

  /**
   * Get version history
   */
  async getVersionHistory(menuId: string): Promise<Array<{
    version: number;
    status: string;
    publishedAt?: Date;
    changelogCount: number;
  }>> {
    const versions = await MenuVersion.find({ menuId })
      .select('version status publishedAt changelog')
      .sort({ version: -1 });

    return versions.map(v => ({
      version: v.version,
      status: v.status,
      publishedAt: v.publishedAt,
      changelogCount: v.changelog.length,
    }));
  }

  /**
   * Get specific version
   */
  async getVersion(versionId: string): Promise<MenuVersion | null> {
    return MenuVersion.findOne({ id: versionId });
  }

  /**
   * Get published version
   */
  async getPublishedVersion(menuId: string): Promise<MenuVersion | null> {
    return MenuVersion.findOne({ menuId, status: 'published' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MENU TEMPLATES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create menu from template
   */
  async createFromTemplate(
    templateId: string,
    menuId: string,
    name: string,
    userId: string
  ): Promise<MenuVersion> {
    const template = await MenuTemplate.findOne({ id: templateId });
    if (!template) throw new Error('Template not found');

    // Increment usage count
    await MenuTemplate.updateOne({ id: templateId }, { $inc: { usageCount: 1 } });

    // Create version with template data
    return this.createVersion({
      menuId,
      name,
      description: template.description,
      categories: template.categories as MenuCategory[],
      items: template.sampleItems as MenuItem[],
      userId,
      userName: 'System',
    });
  }

  /**
   * Create a new template
   */
  async createTemplate(params: {
    name: string;
    description: string;
    cuisine: string;
    categories: MenuCategory[];
    sampleItems: MenuItem[];
    isPublic?: boolean;
  }): Promise<MenuTemplate> {
    const template = new MenuTemplate({
      id: `tmpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...params,
      isPublic: params.isPublic ?? true,
    });

    await template.save();
    return template;
  }

  /**
   * Get templates by cuisine
   */
  async getTemplates(cuisine?: string): Promise<MenuTemplate[]> {
    const query = cuisine ? { cuisine } : {};
    return MenuTemplate.find(query).sort({ usageCount: -1 });
  }

  /**
   * Get popular templates
   */
  async getPopularTemplates(limit: number = 10): Promise<MenuTemplate[]> {
    return MenuTemplate.find({ isPublic: true })
      .sort({ usageCount: -1 })
      .limit(limit);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPARISON
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Compare two versions
   */
  async compareVersions(
    versionId1: string,
    versionId2: string
  ): Promise<{
    added: MenuItem[];
    removed: MenuItem[];
    modified: Array<{ item: MenuItem; changes: ChangeLogEntry[] }>;
    categoriesChanged: boolean;
  }> {
    const [v1, v2] = await Promise.all([
      MenuVersion.findOne({ id: versionId1 }),
      MenuVersion.findOne({ id: versionId2 }),
    ]);

    if (!v1 || !v2) throw new Error('Version not found');

    const items1Map = new Map(v1.items.map(i => [i.id, i]));
    const items2Map = new Map(v2.items.map(i => [i.id, i]));

    // Added items (in v2 but not v1)
    const added = v2.items.filter(i => !items1Map.has(i.id));

    // Removed items (in v1 but not v2)
    const removed = v1.items.filter(i => !items2Map.has(i.id));

    // Modified items
    const modified: Array<{ item: MenuItem; changes: ChangeLogEntry[] }> = [];
    v2.items.forEach(item2 => {
      const item1 = items1Map.get(item2.id);
      if (item1) {
        const changes: ChangeLogEntry[] = [];
        Object.keys(item2).forEach(key => {
          if (JSON.stringify((item1 as any)[key]) !== JSON.stringify((item2 as any)[key])) {
            changes.push({
              id: '',
              action: 'updated',
              field: key,
              oldValue: (item1 as any)[key],
              newValue: (item2 as any)[key],
              itemId: item2.id,
              description: '',
              timestamp: new Date(),
              userId: '',
              userName: '',
            });
          }
        });
        if (changes.length > 0) {
          modified.push({ item: item2, changes });
        }
      }
    });

    return {
      added,
      removed,
      modified,
      categoriesChanged: JSON.stringify(v1.categories) !== JSON.stringify(v2.categories),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AVAILABILITY SCHEDULING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Schedule item availability
   */
  async scheduleAvailability(
    versionId: string,
    itemId: string,
    schedule: Array<{
      dayOfWeek: number[]; // 0-6
      startTime: string; // HH:mm
      endTime: string;
      available: boolean;
    }>,
    userId: string,
    userName: string
  ): Promise<MenuVersion> {
    const version = await MenuVersion.findOne({ id: versionId });
    if (!version) throw new Error('Version not found');

    const item = version.items.find(i => i.id === itemId);
    if (!item) throw new Error('Item not found');

    (item as any).availabilitySchedule = schedule;

    version.changelog.push({
      id: `cl_${Date.now()}`,
      action: 'updated',
      field: 'availabilitySchedule',
      itemId,
      description: `Updated availability schedule for ${item.name}`,
      timestamp: new Date(),
      userId,
      userName,
    });

    await version.save();
    return version;
  }

  /**
   * Check if item is currently available based on schedule
   */
  isItemAvailable(item: MenuItem & { availabilitySchedule?: any[] }): boolean {
    if (!item.availabilitySchedule || item.availabilitySchedule.length === 0) {
      return item.available;
    }

    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    for (const slot of item.availabilitySchedule) {
      if (slot.dayOfWeek.includes(dayOfWeek)) {
        if (currentTime >= slot.startTime && currentTime <= slot.endTime) {
          return slot.available;
        }
      }
    }

    return item.available;
  }
}

export const menuVersioningService = new MenuVersioningService();
export default menuVersioningService;
