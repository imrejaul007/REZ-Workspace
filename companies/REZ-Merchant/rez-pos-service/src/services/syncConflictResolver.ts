export interface Sale {
  id: string;
  items: SaleItem[];
  total: number;
  timestamp: Date;
  status: 'pending' | 'completed' | 'refunded';
  version: number;
}

export interface SaleItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export interface Stock {
  productId: string;
  quantity: number;
  reserved: number;
  lastUpdated: Date;
  version: number;
  locationId?: string;
}

export interface PriceRule {
  productId: string;
  basePrice: number;
  currentPrice: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  version: number;
}

export interface ConflictResult<T> {
  resolved: T;
  strategy: 'local' | 'remote' | 'merge' | 'manual_required';
  hasConflict: boolean;
  conflicts?: ConflictDetail[];
}

export interface ConflictDetail {
  field: string;
  localValue: unknown;
  remoteValue: unknown;
  resolution: 'local' | 'remote' | 'merged' | 'manual';
}

export interface SyncResult<T> {
  resolved: T[];
  conflicts: ConflictDetail[][];
  manualReviewRequired: T[];
  autoResolved: number;
  manualRequired: number;
}

export class ConflictResolver {
  private manualConflicts: Map<string, unknown[]> = new Map();
  private autoResolveEnabled: boolean = true;

  constructor(options?: { autoResolve?: boolean }) {
    if (options?.autoResolve !== undefined) {
      this.autoResolveEnabled = options.autoResolve;
    }
  }

  resolvePriceConflict(local: Sale, remote: Sale): ConflictResult<Sale> {
    const conflicts: ConflictDetail[] = [];

    // Check for price changes in sale items
    const localItemMap = new Map(local.items.map((item) => [item.productId, item]));
    const remoteItemMap = new Map(remote.items.map((item) => [item.productId, item]));

    // Find items with price differences
    for (const [productId, localItem] of localItemMap) {
      const remoteItem = remoteItemMap.get(productId);
      if (remoteItem && localItem.unitPrice !== remoteItem.unitPrice) {
        conflicts.push({
          field: `items.${productId}.unitPrice`,
          localValue: localItem.unitPrice,
          remoteValue: remoteItem.unitPrice,
          resolution: 'manual',
        });
      }
    }

    if (conflicts.length > 0 && !this.autoResolveEnabled) {
      return {
        resolved: local,
        strategy: 'manual_required',
        hasConflict: true,
        conflicts,
      };
    }

    // Auto-resolve: Use the more recent version's prices
    const resolvedItems = local.items.map((localItem) => {
      const remoteItem = remoteItemMap.get(localItem.productId);
      if (remoteItem && localItem.unitPrice !== remoteItem.unitPrice) {
        // Use higher price (more conservative for revenue)
        return {
          ...localItem,
          unitPrice: Math.max(localItem.unitPrice, remoteItem.unitPrice),
        };
      }
      return localItem;
    });

    const resolvedTotal = resolvedItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice - item.discount,
      0
    );

    return {
      resolved: {
        ...local,
        items: resolvedItems,
        total: resolvedTotal,
        version: Math.max(local.version, remote.version) + 1,
      },
      strategy: 'merge',
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  }

  resolveStockConflict(local: Stock, remote: Stock): ConflictResult<Stock> {
    const conflicts: ConflictDetail[] = [];

    // Check quantity conflict
    if (local.quantity !== remote.quantity) {
      conflicts.push({
        field: 'quantity',
        localValue: local.quantity,
        remoteValue: remote.quantity,
        resolution: 'manual',
      });
    }

    // Check reserved quantity conflict
    if (local.reserved !== remote.reserved) {
      conflicts.push({
        field: 'reserved',
        localValue: local.reserved,
        remoteValue: remote.reserved,
        resolution: 'manual',
      });
    }

    // Check available = quantity - reserved consistency
    const localAvailable = local.quantity - local.reserved;
    const remoteAvailable = remote.quantity - remote.reserved;

    if (localAvailable !== remoteAvailable) {
      conflicts.push({
        field: 'available',
        localValue: localAvailable,
        remoteValue: remoteAvailable,
        resolution: 'manual',
      });
    }

    if (conflicts.length > 0 && !this.autoResolveEnabled) {
      return {
        resolved: local,
        strategy: 'manual_required',
        hasConflict: true,
        conflicts,
      };
    }

    // Auto-resolve: Use the most conservative available quantity
    // (prevents overselling by taking the lower available stock)
    const resolvedAvailable = Math.min(localAvailable, remoteAvailable);
    const resolvedQuantity = Math.max(local.quantity, remote.quantity);
    const resolvedReserved = resolvedQuantity - resolvedAvailable;

    return {
      resolved: {
        productId: local.productId,
        quantity: resolvedQuantity,
        reserved: Math.max(0, resolvedReserved),
        lastUpdated: new Date(),
        version: Math.max(local.version, remote.version) + 1,
        locationId: local.locationId || remote.locationId,
      },
      strategy: 'merge',
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  }

  resolveAll(local: Sale[] | Stock[], remote: Sale[] | Stock[]): {
    resolved: (Sale | Stock)[];
    conflicts: ConflictDetail[][];
  } {
    const resolved: (Sale | Stock)[] = [];
    const conflicts: ConflictDetail[][] = [];

    const localMap = new Map(local.map((item: any) => [item.id || item._id, item]));
    const remoteMap = new Map(remote.map((item: any) => [item.id || item._id, item]));

    // Process all unique IDs
    const allIds = new Set([...localMap.keys(), ...remoteMap.keys()]);

    for (const id of allIds) {
      const localItem = localMap.get(id) as any;
      const remoteItem = remoteMap.get(id) as any;

      if (localItem && remoteItem) {
        // Both exist - potential conflict
        const result = this.isSale(localItem)
          ? this.resolvePriceConflict(localItem as Sale, remoteItem as Sale)
          : this.resolveStockConflict(localItem as Stock, remoteItem as Stock);

        resolved.push(result.resolved);
        if (result.conflicts) {
          conflicts.push(result.conflicts);
        }
      } else if (localItem) {
        // Only local - no conflict
        resolved.push(localItem);
        conflicts.push([]);
      } else if (remoteItem) {
        // Only remote - no conflict
        resolved.push(remoteItem);
        conflicts.push([]);
      }
    }

    return { resolved, conflicts };
  }

  resolveMultipleSales(local: Sale[], remote: Sale[]): SyncResult<Sale> {
    const result = this.resolveAll(local, remote);
    const manualReviewRequired: Sale[] = [];

    // Check for unresolved conflicts
    result.conflicts.forEach((conflictList, index) => {
      if (conflictList.some((c) => c.resolution === 'manual')) {
        manualReviewRequired.push(result.resolved[index] as Sale);
      }
    });

    return {
      resolved: result.resolved as Sale[],
      conflicts: result.conflicts,
      manualReviewRequired,
      autoResolved: result.resolved.length - manualReviewRequired.length,
      manualRequired: manualReviewRequired.length,
    };
  }

  resolveMultipleStocks(local: Stock[], remote: Stock[]): SyncResult<Stock> {
    const result = this.resolveAll(local, remote);
    const manualReviewRequired: Stock[] = [];

    result.conflicts.forEach((conflictList, index) => {
      if (conflictList.some((c) => c.resolution === 'manual')) {
        manualReviewRequired.push(result.resolved[index] as Stock);
      }
    });

    return {
      resolved: result.resolved as Stock[],
      conflicts: result.conflicts,
      manualReviewRequired,
      autoResolved: result.resolved.length - manualReviewRequired.length,
      manualRequired: manualReviewRequired.length,
    };
  }

  setManualResolution(id: string, resolvedData: Sale | Stock): void {
    this.manualConflicts.set(id, [resolvedData]);
  }

  getManualConflicts(): Map<string, unknown[]> {
    return this.manualConflicts;
  }

  clearManualConflicts(): void {
    this.manualConflicts.clear();
  }

  setAutoResolve(enabled: boolean): void {
    this.autoResolveEnabled = enabled;
  }

  private isSale(item: Sale | Stock): item is Sale {
    return 'items' in item && 'total' in item;
  }
}

// Singleton instance
let conflictResolverInstance: ConflictResolver | null = null;

export function getConflictResolver(options?: { autoResolve?: boolean }): ConflictResolver {
  if (!conflictResolverInstance) {
    conflictResolverInstance = new ConflictResolver(options);
  }
  return conflictResolverInstance;
}

export default ConflictResolver;
