import crypto from 'crypto';
import { ProductStock, Warehouse, StockMovement, StockTransfer } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class InventoryCore {
  private stocks: Map<string, ProductStock> = new Map();
  private warehouses: Map<string, Warehouse> = new Map();
  private movements: StockMovement[] = [];

  createWarehouse(warehouse: Warehouse): Warehouse {
    this.warehouses.set(warehouse.id, warehouse);
    logger.info(`Warehouse created: ${warehouse.name}`);
    return warehouse;
  }

  getWarehouse(id: string): Warehouse | undefined {
    return this.warehouses.get(id);
  }

  getAllWarehouses(): Warehouse[] {
    return Array.from(this.warehouses.values());
  }

  addStock(stock: ProductStock): ProductStock {
    const key = `${stock.productId}:${stock.warehouseId}`;
    stock.availableQuantity = stock.quantity - stock.reservedQuantity;
    this.stocks.set(key, stock);
    logger.info(`Stock added: ${stock.sku} in warehouse ${stock.warehouseId}`);
    return stock;
  }

  getStock(productId: string, warehouseId?: string): ProductStock | ProductStock[] | undefined {
    if (warehouseId) {
      return this.stocks.get(`${productId}:${warehouseId}`);
    }
    return Array.from(this.stocks.values()).filter(s => s.productId === productId);
  }

  getTotalStock(productId: string): number {
    const stocks = Array.from(this.stocks.values()).filter(s => s.productId === productId);
    return stocks.reduce((sum, s) => sum + s.availableQuantity, 0);
  }

  async reserveStock(productId: string, warehouseId: string, quantity: number): Promise<boolean> {
    const key = `${productId}:${warehouseId}`;
    const stock = this.stocks.get(key);
    if (!stock || stock.availableQuantity < quantity) {
      return false;
    }
    stock.reservedQuantity += quantity;
    stock.availableQuantity = stock.quantity - stock.reservedQuantity;
    this.stocks.set(key, stock);
    logger.info(`Reserved ${quantity} of ${productId} in ${warehouseId}`);
    return true;
  }

  async releaseReservation(productId: string, warehouseId: string, quantity: number): Promise<void> {
    const key = `${productId}:${warehouseId}`;
    const stock = this.stocks.get(key);
    if (stock) {
      stock.reservedQuantity = Math.max(0, stock.reservedQuantity - quantity);
      stock.availableQuantity = stock.quantity - stock.reservedQuantity;
      this.stocks.set(key, stock);
    }
  }

  async consumeStock(productId: string, warehouseId: string, quantity: number): Promise<boolean> {
    const key = `${productId}:${warehouseId}`;
    const stock = this.stocks.get(key);
    if (!stock || stock.quantity < quantity) {
      return false;
    }
    stock.quantity -= quantity;
    stock.availableQuantity = stock.quantity - stock.reservedQuantity;

    this.recordMovement({
      productId,
      warehouseId,
      type: 'out',
      quantity: -quantity
    });

    this.stocks.set(key, stock);
    logger.info(`Consumed ${quantity} of ${productId} from ${warehouseId}`);
    return true;
  }

  async receiveStock(productId: string, warehouseId: string, quantity: number): Promise<void> {
    const key = `${productId}:${warehouseId}`;
    let stock = this.stocks.get(key);
    if (!stock) {
      stock = {
        productId,
        sku: productId,
        warehouseId,
        quantity,
        reservedQuantity: 0,
        availableQuantity: quantity,
        reorderPoint: 10,
        reorderQuantity: 100
      };
    } else {
      stock.quantity += quantity;
      stock.availableQuantity = stock.quantity - stock.reservedQuantity;
    }

    this.recordMovement({
      productId,
      warehouseId,
      type: 'in',
      quantity
    });

    this.stocks.set(key, stock);
    logger.info(`Received ${quantity} of ${productId} into ${warehouseId}`);
  }

  transferStock(transfer: StockTransfer): StockTransfer {
    const id = crypto.randomUUID();
    const fullTransfer = { ...transfer, id };

    const fromKey = `${transfer.productId}:${transfer.fromWarehouseId}`;
    const fromStock = this.stocks.get(fromKey);
    if (fromStock && fromStock.quantity >= transfer.quantity) {
      fromStock.quantity -= transfer.quantity;
      fromStock.availableQuantity = fromStock.quantity - fromStock.reservedQuantity;
      this.stocks.set(fromKey, fromStock);

      const toKey = `${transfer.productId}:${transfer.toWarehouseId}`;
      let toStock = this.stocks.get(toKey);
      if (!toStock) {
        toStock = {
          productId: transfer.productId,
          sku: transfer.productId,
          warehouseId: transfer.toWarehouseId,
          quantity: transfer.quantity,
          reservedQuantity: 0,
          availableQuantity: transfer.quantity,
          reorderPoint: 10,
          reorderQuantity: 100
        };
      } else {
        toStock.quantity += transfer.quantity;
        toStock.availableQuantity = toStock.quantity - toStock.reservedQuantity;
      }
      this.stocks.set(toKey, toStock);

      fullTransfer.status = 'completed';
      logger.info(`Transfer completed: ${transfer.quantity} of ${transfer.productId}`);
    } else {
      fullTransfer.status = 'cancelled';
    }

    return fullTransfer;
  }

  private recordMovement(movement: StockMovement): void {
    this.movements.push({
      ...movement,
      id: crypto.randomUUID(),
      createdAt: new Date()
    });
  }

  getMovements(productId?: string, warehouseId?: string): StockMovement[] {
    return this.movements.filter(m => {
      if (productId && m.productId !== productId) return false;
      if (warehouseId && m.warehouseId !== warehouseId) return false;
      return true;
    });
  }

  getLowStockItems(): ProductStock[] {
    return Array.from(this.stocks.values()).filter(s => s.availableQuantity <= s.reorderPoint);
  }

  getInventoryValue(): { total: number; byWarehouse: Record<string, number> } {
    let total = 0;
    const byWarehouse: Record<string, number> = {};

    for (const stock of this.stocks.values()) {
      total += stock.quantity;
      byWarehouse[stock.warehouseId] = (byWarehouse[stock.warehouseId] || 0) + stock.quantity;
    }

    return { total, byWarehouse };
  }
}

export const inventoryCore = new InventoryCore();
