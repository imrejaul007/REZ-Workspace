import { v4 as uuidv4 } from 'uuid';
import { Product, ProductPricing, ProductInventory, ProductMedia, ProductVariant, WarehouseStock } from '../schemas/product.schema';

export class ProductModel {
  static createProduct(data: any): Product {
    const now = new Date().toISOString();
    return {
      id: uuidv4(),
      sku: data.sku,
      gtin: data.gtin,
      name: data.name,
      slug: data.slug || this.generateSlug(data.name),
      description: data.description || '',
      shortDescription: data.shortDescription,
      brand: data.brand,
      category: data.category,
      subcategory: data.subcategory,
      tags: data.tags || [],
      pricing: this.normalizePricing(data.pricing),
      inventory: this.normalizeInventory(data.inventory),
      media: this.normalizeMedia(data.media),
      attributes: data.attributes || {},
      variants: data.variants,
      status: data.status || 'draft',
      visibility: data.visibility || 'catalog',
      metadata: this.normalizeMetadata(data.metadata),
      createdAt: now,
      updatedAt: now,
    };
  }

  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 100);
  }

  static normalizePricing(pricing: any): ProductPricing {
    return {
      basePrice: pricing?.basePrice || 0,
      currency: pricing?.currency || 'USD',
      costPrice: pricing?.costPrice,
      msrp: pricing?.msrp,
      wholesalePrice: pricing?.wholesalePrice,
      compareAtPrice: pricing?.compareAtPrice,
      specialPrice: pricing?.specialPrice,
    };
  }

  static normalizeInventory(inventory: any): ProductInventory {
    return {
      trackInventory: inventory?.trackInventory ?? true,
      quantity: inventory?.quantity ?? 0,
      lowStockThreshold: inventory?.lowStockThreshold ?? 10,
      outOfStockThreshold: inventory?.outOfStockThreshold ?? 0,
      backorderAllowed: inventory?.backorderAllowed ?? false,
      preorderAllowed: inventory?.preorderAllowed ?? false,
      preorderReleaseDate: inventory?.preorderReleaseDate,
      warehouseLocations: inventory?.warehouseLocations || [],
    };
  }

  static normalizeMedia(media: any): ProductMedia {
    return {
      images: media?.images || [],
      videos: media?.videos || [],
      documents: media?.documents || [],
    };
  }

  static normalizeMetadata(metadata: any): any {
    return {
      weight: metadata?.weight,
      weightUnit: metadata?.weightUnit || 'kg',
      dimensions: metadata?.dimensions,
      warranty: metadata?.warranty,
      returnPolicy: metadata?.returnPolicy,
      countryOfOrigin: metadata?.countryOfOrigin,
      certifications: metadata?.certifications || [],
      ecoRating: metadata?.ecoRating,
    };
  }

  static updateProduct(product: Product, updates: any): Product {
    return {
      ...product,
      ...updates,
      id: product.id,
      sku: updates.sku || product.sku,
      pricing: updates.pricing ? { ...product.pricing, ...updates.pricing } : product.pricing,
      inventory: updates.inventory ? { ...product.inventory, ...updates.inventory } : product.inventory,
      metadata: updates.metadata ? { ...product.metadata, ...updates.metadata } : product.metadata,
      updatedAt: new Date().toISOString(),
    };
  }

  static updatePricing(product: Product, pricing: Partial<ProductPricing>): Product {
    return {
      ...product,
      pricing: { ...product.pricing, ...pricing },
      updatedAt: new Date().toISOString(),
    };
  }

  static updateInventory(product: Product, inventory: Partial<ProductInventory>): Product {
    return {
      ...product,
      inventory: { ...product.inventory, ...inventory },
      updatedAt: new Date().toISOString(),
    };
  }

  static adjustQuantity(product: Product, quantity: number, warehouseId?: string): Product {
    const newQuantity = product.inventory.quantity + quantity;

    if (warehouseId) {
      const locations = product.inventory.warehouseLocations.map(loc => {
        if (loc.warehouseId === warehouseId) {
          return {
            ...loc,
            quantity: loc.quantity + quantity,
            available: Math.max(0, loc.available + quantity),
          };
        }
        return loc;
      });

      return {
        ...product,
        inventory: {
          ...product.inventory,
          quantity: newQuantity,
          warehouseLocations: locations,
        },
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      ...product,
      inventory: {
        ...product.inventory,
        quantity: Math.max(0, newQuantity),
      },
      updatedAt: new Date().toISOString(),
    };
  }

  static setWarehouseStock(product: Product, warehouseId: string, location: string, quantity: number): Product {
    const existingIndex = product.inventory.warehouseLocations.findIndex(
      loc => loc.warehouseId === warehouseId
    );

    let newLocations: WarehouseStock[];
    if (existingIndex >= 0) {
      newLocations = product.inventory.warehouseLocations.map((loc, idx) => {
        if (idx === existingIndex) {
          return { ...loc, location, quantity, available: Math.max(0, quantity - loc.reserved) };
        }
        return loc;
      });
    } else {
      newLocations = [
        ...product.inventory.warehouseLocations,
        { warehouseId, location, quantity, reserved: 0, available: quantity },
      ];
    }

    const totalQuantity = newLocations.reduce((sum, loc) => sum + loc.quantity, 0);

    return {
      ...product,
      inventory: {
        ...product.inventory,
        quantity: totalQuantity,
        warehouseLocations: newLocations,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  static addImage(product: Product, image: Omit<ProductMedia['images'][0], 'id' | 'position'>): Product {
    const newImage = {
      id: uuidv4(),
      ...image,
      position: product.media.images.length,
    };

    return {
      ...product,
      media: {
        ...product.media,
        images: [...product.media.images, newImage],
      },
      updatedAt: new Date().toISOString(),
    };
  }

  static removeImage(product: Product, imageId: string): Product {
    const newImages = product.media.images
      .filter(img => img.id !== imageId)
      .map((img, idx) => ({ ...img, position: idx }));

    return {
      ...product,
      media: {
        ...product.media,
        images: newImages,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  static setPrimaryImage(product: Product, imageId: string): Product {
    const newImages = product.media.images.map(img => ({
      ...img,
      isPrimary: img.id === imageId,
    }));

    return {
      ...product,
      media: {
        ...product.media,
        images: newImages,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  static addVariant(product: Product, variant: Omit<ProductVariant, 'id'>): Product {
    const newVariant = {
      id: uuidv4(),
      ...variant,
    };

    return {
      ...product,
      variants: [...(product.variants || []), newVariant],
      updatedAt: new Date().toISOString(),
    };
  }

  static updateVariant(product: Product, variantId: string, updates: Partial<ProductVariant>): Product {
    const variants = (product.variants || []).map(variant => {
      if (variant.id === variantId) {
        return { ...variant, ...updates };
      }
      return variant;
    });

    return {
      ...product,
      variants,
      updatedAt: new Date().toISOString(),
    };
  }

  static removeVariant(product: Product, variantId: string): Product {
    return {
      ...product,
      variants: (product.variants || []).filter(v => v.id !== variantId),
      updatedAt: new Date().toISOString(),
    };
  }

  static activate(product: Product): Product {
    return {
      ...product,
      status: 'active',
      visibility: 'everywhere',
      updatedAt: new Date().toISOString(),
    };
  }

  static discontinue(product: Product): Product {
    return {
      ...product,
      status: 'discontinued',
      visibility: 'hidden',
      updatedAt: new Date().toISOString(),
    };
  }

  static archive(product: Product): Product {
    return {
      ...product,
      status: 'archived',
      visibility: 'hidden',
      updatedAt: new Date().toISOString(),
    };
  }

  static isInStock(product: Product): boolean {
    if (!product.inventory.trackInventory) return true;
    return product.inventory.quantity > product.inventory.outOfStockThreshold;
  }

  static isLowStock(product: Product): boolean {
    if (!product.inventory.trackInventory) return false;
    return product.inventory.quantity <= product.inventory.lowStockThreshold &&
           product.inventory.quantity > product.inventory.outOfStockThreshold;
  }

  static getStockStatus(product: Product): 'in_stock' | 'low_stock' | 'out_of_stock' | 'preorder' | 'backorder' {
    if (product.inventory.preorderAllowed && product.inventory.preorderReleaseDate) {
      return 'preorder';
    }
    if (!product.inventory.trackInventory) return 'in_stock';
    if (product.inventory.quantity <= product.inventory.outOfStockThreshold) {
      return product.inventory.backorderAllowed ? 'backorder' : 'out_of_stock';
    }
    if (product.inventory.quantity <= product.inventory.lowStockThreshold) {
      return 'low_stock';
    }
    return 'in_stock';
  }

  static getMargin(product: Product): number | null {
    if (!product.pricing.costPrice) return null;
    return ((product.pricing.basePrice - product.pricing.costPrice) / product.pricing.basePrice) * 100;
  }

  static getCurrentPrice(product: Product): number {
    if (product.pricing.compareAtPrice && product.pricing.compareAtPrice < product.pricing.basePrice) {
      return product.pricing.compareAtPrice;
    }
    return product.pricing.basePrice;
  }

  static searchMatch(product: Product, query: string): boolean {
    const searchText = query.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchText) ||
      product.description.toLowerCase().includes(searchText) ||
      product.brand.toLowerCase().includes(searchText) ||
      product.category.toLowerCase().includes(searchText) ||
      product.tags.some(tag => tag.toLowerCase().includes(searchText)) ||
      product.sku.toLowerCase().includes(searchText)
    );
  }
}
