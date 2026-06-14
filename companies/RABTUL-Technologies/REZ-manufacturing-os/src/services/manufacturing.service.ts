import { v4 as uuidv4 } from 'uuid';
import { ManufacturingOrder, Bom, Workstation, InventoryItem, QualityCheck, ProductionReport } from '../models/manufacturing';

class ManufacturingService {
  private orders: Map<string, ManufacturingOrder> = new Map();
  private boms: Map<string, Bom> = new Map();
  private workstations: Map<string, Workstation> = new Map();
  private inventory: Map<string, InventoryItem> = new Map();
  private qualityChecks: Map<string, QualityCheck> = new Map();
  private productionReports: Map<string, ProductionReport> = new Map();

  // Order operations
  createOrder(data: Omit<ManufacturingOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): ManufacturingOrder {
    const now = new Date().toISOString();
    const orderNumber = `MO-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const order: ManufacturingOrder = {
      ...data,
      id: uuidv4(),
      orderNumber,
      createdAt: now,
      updatedAt: now
    };
    this.orders.set(order.id, order);
    return order;
  }

  getOrder(id: string): ManufacturingOrder | undefined {
    return this.orders.get(id);
  }

  getAllOrders(filters?: { status?: string; priority?: string }): ManufacturingOrder[] {
    let result = Array.from(this.orders.values());
    if (filters?.status) {
      result = result.filter(o => o.status === filters.status);
    }
    if (filters?.priority) {
      result = result.filter(o => o.priority === filters.priority);
    }
    return result.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  updateOrder(id: string, data: Partial<ManufacturingOrder>): ManufacturingOrder | undefined {
    const order = this.orders.get(id);
    if (!order) return undefined;
    const updated = { ...order, ...data, updatedAt: new Date().toISOString() };
    this.orders.set(id, updated);
    return updated;
  }

  updateOrderStatus(id: string, status: ManufacturingOrder['status']): ManufacturingOrder | undefined {
    const order = this.orders.get(id);
    if (!order) return undefined;
    const updates: Partial<ManufacturingOrder> = { status, updatedAt: new Date().toISOString() };
    if (status === 'in-progress' && !order.actualStart) {
      updates.actualStart = new Date().toISOString();
    }
    if (status === 'completed' && !order.actualEnd) {
      updates.actualEnd = new Date().toISOString();
    }
    const updated = { ...order, ...updates };
    this.orders.set(id, updated);
    return updated;
  }

  // BOM operations
  createBom(data: Omit<Bom, 'id' | 'createdAt' | 'updatedAt'>): Bom {
    const now = new Date().toISOString();
    const bom: Bom = { ...data, id: uuidv4(), createdAt: now, updatedAt: now };
    this.boms.set(bom.id, bom);
    return bom;
  }

  getBom(id: string): Bom | undefined {
    return this.boms.get(id);
  }

  getBomsByProduct(productId: string): Bom[] {
    return Array.from(this.boms.values()).filter(b => b.productId === productId && b.status === 'active');
  }

  // Workstation operations
  createWorkstation(data: Omit<Workstation, 'id'>): Workstation {
    const workstation: Workstation = { ...data, id: uuidv4() };
    this.workstations.set(workstation.id, workstation);
    return workstation;
  }

  getWorkstation(id: string): Workstation | undefined {
    return this.workstations.get(id);
  }

  getAllWorkstations(filters?: { status?: string; type?: string }): Workstation[] {
    let result = Array.from(this.workstations.values());
    if (filters?.status) {
      result = result.filter(w => w.status === filters.status);
    }
    if (filters?.type) {
      result = result.filter(w => w.type === filters.type);
    }
    return result;
  }

  updateWorkstationStatus(id: string, status: Workstation['status']): Workstation | undefined {
    const workstation = this.workstations.get(id);
    if (!workstation) return undefined;
    const updated = { ...workstation, status };
    this.workstations.set(id, updated);
    return updated;
  }

  // Inventory operations
  addInventoryItem(data: Omit<InventoryItem, 'id' | 'lastUpdated'>): InventoryItem {
    const item: InventoryItem = { ...data, id: uuidv4(), lastUpdated: new Date().toISOString() };
    this.inventory.set(item.id, item);
    return item;
  }

  getInventoryItem(id: string): InventoryItem | undefined {
    return this.inventory.get(id);
  }

  updateInventoryQuantity(id: string, quantity: number): InventoryItem | undefined {
    const item = this.inventory.get(id);
    if (!item) return undefined;
    const updated = { ...item, quantity, lastUpdated: new Date().toISOString() };
    this.inventory.set(id, updated);
    return updated;
  }

  getLowStockItems(): InventoryItem[] {
    return Array.from(this.inventory.values()).filter(i => i.quantity <= i.reorderPoint);
  }

  // Quality check operations
  createQualityCheck(data: Omit<QualityCheck, 'id'>): QualityCheck {
    const check: QualityCheck = { ...data, id: uuidv4() };
    this.qualityChecks.set(check.id, check);
    return check;
  }

  getQualityChecks(orderId: string): QualityCheck[] {
    return Array.from(this.qualityChecks.values()).filter(q => q.orderId === orderId);
  }

  // Production report operations
  createProductionReport(data: Omit<ProductionReport, 'id' | 'createdAt'>): ProductionReport {
    const report: ProductionReport = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    this.productionReports.set(report.id, report);
    return report;
  }

  getProductionReports(filters?: { date?: string; workstation?: string }): ProductionReport[] {
    let result = Array.from(this.productionReports.values());
    if (filters?.date) {
      result = result.filter(r => r.date === filters.date);
    }
    if (filters?.workstation) {
      result = result.filter(r => r.workstation === filters.workstation);
    }
    return result;
  }

  // Stats
  getStats() {
    const allOrders = Array.from(this.orders.values());
    const allWorkstations = Array.from(this.workstations.values());
    return {
      totalOrders: allOrders.length,
      pendingOrders: allOrders.filter(o => o.status === 'planned').length,
      inProgressOrders: allOrders.filter(o => o.status === 'in-progress').length,
      completedOrders: allOrders.filter(o => o.status === 'completed').length,
      totalWorkstations: allWorkstations.length,
      availableWorkstations: allWorkstations.filter(w => w.status === 'available').length,
      occupiedWorkstations: allWorkstations.filter(w => w.status === 'occupied').length,
      lowStockItems: this.getLowStockItems().length,
      qualityChecks: this.qualityChecks.size,
      productionReports: this.productionReports.size
    };
  }
}

export default new ManufacturingService();
