export interface ManufacturingOrder {
  id: string;
  orderNumber: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
 BomId?: string;
  workstation?: string;
  operator?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bom {
  id: string;
  productId: string;
  productName: string;
  version: string;
  status: 'draft' | 'active' | 'archived';
  components: BomComponent[];
  operations: BomOperation[];
  createdAt: string;
  updatedAt: string;
}

export interface BomComponent {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  isRawMaterial: boolean;
  scrapRate: number;
}

export interface BomOperation {
  sequence: number;
  name: string;
  workstation: string;
  timeInMinutes: number;
  setupTime: number;
}

export interface Workstation {
  id: string;
  code: string;
  name: string;
  type: 'assembly' | 'machining' | 'packaging' | 'quality-control' | 'storage';
  status: 'available' | 'occupied' | 'maintenance' | 'offline';
  currentOrder?: string;
  capacity: number;
  efficiency: number;
  location: string;
}

export interface InventoryItem {
  id: string;
  itemId: string;
  name: string;
  type: 'raw-material' | 'work-in-progress' | 'finished-goods';
  quantity: number;
  unit: string;
  warehouse: string;
  location: string;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  lastUpdated: string;
}

export interface QualityCheck {
  id: string;
  orderId: string;
  type: 'incoming' | 'in-process' | 'final';
  status: 'pending' | 'passed' | 'failed' | 'conditional';
  inspector: string;
  checkedAt: string;
  parameters: QualityParameter[];
  notes?: string;
}

export interface QualityParameter {
  name: string;
  standard: string;
  actual: string;
  tolerance: string;
  status: 'pass' | 'fail';
}

export interface ProductionReport {
  id: string;
  date: string;
  workstation: string;
  operator: string;
  ordersCompleted: number;
  unitsProduced: number;
  unitsRejected: number;
  efficiency: number;
  downtime: number;
  notes?: string;
  createdAt: string;
}
