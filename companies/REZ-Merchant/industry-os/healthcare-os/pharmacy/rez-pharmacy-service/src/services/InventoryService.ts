import { v4 as uuidv4 } from 'uuid';
import { Medicine, IMedicine, DrugCategory, MedicineStatus, IDrugInteraction } from '../models/Medicine';

export interface InventoryAlert {
  type: 'LOW_STOCK' | 'EXPIRING' | 'EXPIRED' | 'RECALL';
  medicineId: string;
  medicineName: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface StockUpdate {
  medicineId: string;
  quantity: number;
  reason: 'PURCHASE' | 'SALE' | 'RETURN' | 'ADJUSTMENT' | 'DAMAGE' | 'EXPIRY';
  reference?: string;
  notes?: string;
}

export interface DrugInteractionResult {
  hasInteraction: boolean;
  interactions: {
    medicine1: string;
    medicine2: string;
    severity: 'MILD' | 'MODERATE' | 'SEVERE';
    description: string;
    recommendation: string;
  }[];
}

export class InventoryService {
  /**
   * Add a new medicine to inventory
   */
  async addMedicine(data: Partial<IMedicine>): Promise<IMedicine> {
    const medicineId = `MED-${uuidv4().substring(0, 8).toUpperCase()}`;

    const medicine = new Medicine({
      ...data,
      medicineId,
      status: data.status || MedicineStatus.ACTIVE
    });

    await medicine.save();
    return medicine;
  }

  /**
   * Get medicine by ID
   */
  async getMedicineById(medicineId: string): Promise<IMedicine | null> {
    return Medicine.findOne({ medicineId });
  }

  /**
   * Get medicine by barcode or NDC
   */
  async getMedicineByBarcode(barcode: string): Promise<IMedicine | null> {
    return Medicine.findOne({
      $or: [{ barcode }, { ndc: barcode }]
    });
  }

  /**
   * Search medicines with filters
   */
  async searchMedicines(filters: {
    query?: string;
    category?: DrugCategory;
    status?: MedicineStatus;
    requiresPrescription?: boolean;
    inStock?: boolean;
    expiringWithinDays?: number;
    page?: number;
    limit?: number;
  }): Promise<{ medicines: IMedicine[]; total: number }> {
    const {
      query,
      category,
      status = MedicineStatus.ACTIVE,
      requiresPrescription,
      inStock,
      expiringWithinDays,
      page = 1,
      limit = 20
    } = filters;

    const filter: unknown = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (requiresPrescription !== undefined) filter.requiresPrescription = requiresPrescription;

    if (query) {
      filter.$text = { $search: query };
    }

    if (inStock !== undefined) {
      filter.stock = inStock ? { $gt: 0 } : 0;
    }

    if (expiringWithinDays) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiringWithinDays);
      filter.expiryDate = { $lte: expiryDate };
    }

    const skip = (page - 1) * limit;

    const [medicines, total] = await Promise.all([
      Medicine.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      Medicine.countDocuments(filter)
    ]);

    return { medicines, total };
  }

  /**
   * Update medicine stock
   */
  async updateStock(update: StockUpdate): Promise<IMedicine | null> {
    const { medicineId, quantity, reason, notes } = update;

    const medicine = await Medicine.findOne({ medicineId });
    if (!medicine) {
      throw new Error(`Medicine ${medicineId} not found`);
    }

    let newStock: number;

    switch (reason) {
      case 'PURCHASE':
      case 'RETURN':
        newStock = medicine.stock + quantity;
        break;
      case 'SALE':
        newStock = medicine.stock - quantity;
        if (newStock < 0) {
          throw new Error(`Insufficient stock for ${medicine.name}. Available: ${medicine.stock}, Requested: ${quantity}`);
        }
        break;
      case 'DAMAGE':
      case 'EXPIRY':
      case 'ADJUSTMENT':
        newStock = medicine.stock - quantity;
        break;
      default:
        throw new Error(`Unknown stock update reason: ${reason}`);
    }

    medicine.stock = Math.max(0, newStock);

    // Update status if out of stock
    if (newStock === 0) {
      medicine.status = MedicineStatus.OUT_OF_STOCK;
    } else if (medicine.status === MedicineStatus.OUT_OF_STOCK) {
      medicine.status = MedicineStatus.ACTIVE;
    }

    await medicine.save();
    return medicine;
  }

  /**
   * Batch update stock for multiple medicines
   */
  async batchUpdateStock(updates: StockUpdate[]): Promise<IMedicine[]> {
    const results: IMedicine[] = [];

    for (const update of updates) {
      try {
        const result = await this.updateStock(update);
        if (result) results.push(result);
      } catch (error) {
        throw new Error(`Failed to update stock for ${update.medicineId}: ${error}`);
      }
    }

    return results;
  }

  /**
   * Check drug interactions between medicines
   */
  async checkDrugInteractions(medicineIds: string[]): Promise<DrugInteractionResult> {
    if (medicineIds.length < 2) {
      return { hasInteraction: false, interactions: [] };
    }

    const medicines = await Medicine.find({
      medicineId: { $in: medicineIds }
    });

    const interactions: DrugInteractionResult['interactions'] = [];

    // Check each pair of medicines
    for (let i = 0; i < medicines.length; i++) {
      for (let j = i + 1; j < medicines.length; j++) {
        const med1 = medicines[i];
        const med2 = medicines[j];

        // Check if med1 has interaction with med2
        const interaction = med1.drugInteractions.find(
          (d: IDrugInteraction) => d.drugId === med2.medicineId
        );

        if (interaction) {
          interactions.push({
            medicine1: med1.name,
            medicine2: med2.name,
            severity: interaction.severity as 'MILD' | 'MODERATE' | 'SEVERE',
            description: interaction.description,
            recommendation: this.getInteractionRecommendation(interaction.severity)
          });
        }

        // Check if med2 has interaction with med1
        const reverseInteraction = med2.drugInteractions.find(
          (d: IDrugInteraction) => d.drugId === med1.medicineId
        );

        if (reverseInteraction && !interaction) {
          interactions.push({
            medicine1: med2.name,
            medicine2: med1.name,
            severity: reverseInteraction.severity as 'MILD' | 'MODERATE' | 'SEVERE',
            description: reverseInteraction.description,
            recommendation: this.getInteractionRecommendation(reverseInteraction.severity)
          });
        }
      }
    }

    return {
      hasInteraction: interactions.length > 0,
      interactions
    };
  }

  /**
   * Get recommendation based on interaction severity
   */
  private getInteractionRecommendation(severity: string): string {
    switch (severity) {
      case 'SEVERE':
        return 'AVOID combination. Consult physician immediately. Alternative medication recommended.';
      case 'MODERATE':
        return 'Use with caution. Monitor patient closely. May require dose adjustment.';
      case 'MILD':
        return 'Generally safe. Monitor for unknown unusual symptoms.';
      default:
        return 'Consult pharmacist for advice.';
    }
  }

  /**
   * Get inventory alerts (low stock, expiring, expired)
   */
  async getInventoryAlerts(): Promise<InventoryAlert[]> {
    const alerts: InventoryAlert[] = [];
    const now = new Date();

    // Low stock alerts
    const lowStockMedicines = await Medicine.find({
      status: MedicineStatus.ACTIVE,
      stock: { $lte: '$reorderLevel' }
    });

    for (const med of lowStockMedicines) {
      if (med.stock <= med.reorderLevel) {
        const severity = med.stock === 0 ? 'CRITICAL' :
                        med.stock <= med.minStockLevel ? 'HIGH' : 'MEDIUM';

        alerts.push({
          type: 'LOW_STOCK',
          medicineId: med.medicineId,
          medicineName: med.name,
          message: `${med.name} stock is low (${med.stock} units, reorder level: ${med.reorderLevel})`,
          severity
        });
      }
    }

    // Expiring soon (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringMedicines = await Medicine.find({
      status: MedicineStatus.ACTIVE,
      expiryDate: { $lte: thirtyDaysFromNow, $gt: now },
      stock: { $gt: 0 }
    });

    for (const med of expiringMedicines) {
      const daysUntilExpiry = Math.ceil(
        (med.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      alerts.push({
        type: 'EXPIRING',
        medicineId: med.medicineId,
        medicineName: med.name,
        message: `${med.name} expires in ${daysUntilExpiry} days (${med.expiryDate.toLocaleDateString()})`,
        severity: daysUntilExpiry <= 7 ? 'CRITICAL' : daysUntilExpiry <= 14 ? 'HIGH' : 'MEDIUM'
      });
    }

    // Expired medicines
    const expiredMedicines = await Medicine.find({
      expiryDate: { $lte: now },
      stock: { $gt: 0 }
    });

    for (const med of expiredMedicines) {
      alerts.push({
        type: 'EXPIRED',
        medicineId: med.medicineId,
        medicineName: med.name,
        message: `${med.name} expired on ${med.expiryDate.toLocaleDateString()}`,
        severity: 'CRITICAL'
      });
    }

    // Recalled medicines
    const recalledMedicines = await Medicine.find({
      status: MedicineStatus.RECALL,
      stock: { $gt: 0 }
    });

    for (const med of recalledMedicines) {
      alerts.push({
        type: 'RECALL',
        medicineId: med.medicineId,
        medicineName: med.name,
        message: `${med.name} has been recalled. Remove from shelves immediately.`,
        severity: 'CRITICAL'
      });
    }

    return alerts;
  }

  /**
   * Get expiry report
   */
  async getExpiryReport(monthsAhead: number = 6): Promise<{
    expired: IMedicine[];
    expiringThisMonth: IMedicine[];
    expiringNextMonth: IMedicine[];
    expiringLater: IMedicine[];
  }> {
    const now = new Date();
    const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + monthsAhead);

    const [expired, expiringThisMonth, expiringNextMonth, expiringLater] = await Promise.all([
      Medicine.find({ expiryDate: { $lte: now }, stock: { $gt: 0 } }).sort({ expiryDate: 1 }),
      Medicine.find({
        expiryDate: { $gt: now, $lte: endOfThisMonth },
        stock: { $gt: 0 }
      }).sort({ expiryDate: 1 }),
      Medicine.find({
        expiryDate: { $gt: startOfNextMonth, $lte: endOfNextMonth },
        stock: { $gt: 0 }
      }).sort({ expiryDate: 1 }),
      Medicine.find({
        expiryDate: { $gt: endOfNextMonth, $lte: futureDate },
        stock: { $gt: 0 }
      }).sort({ expiryDate: 1 })
    ]);

    return { expired, expiringThisMonth, expiringNextMonth, expiringLater };
  }

  /**
   * Get fast moving medicines
   */
  async getFastMovingMedicines(days: number = 30, limit: number = 20): Promise<unknown[]> {
    // This would typically use sales/order data
    // For now, returning medicines with highest stock turnover rate
    const medicines = await Medicine.find({
      status: MedicineStatus.ACTIVE,
      stock: { $gt: 0 }
    })
      .sort({ stock: -1 })
      .limit(limit);

    return medicines;
  }

  /**
   * Update medicine details
   */
  async updateMedicine(medicineId: string, updates: Partial<IMedicine>): Promise<IMedicine | null> {
    return Medicine.findOneAndUpdate(
      { medicineId },
      { $set: updates },
      { new: true }
    );
  }

  /**
   * Mark medicine as discontinued
   */
  async discontinueMedicine(medicineId: string): Promise<IMedicine | null> {
    return Medicine.findOneAndUpdate(
      { medicineId },
      { $set: { status: MedicineStatus.DISCONTINUED } },
      { new: true }
    );
  }

  /**
   * Record medicine recall
   */
  async recallMedicine(medicineId: string, reason: string): Promise<IMedicine | null> {
    return Medicine.findOneAndUpdate(
      { medicineId },
      {
        $set: { status: MedicineStatus.RECALL },
        $push: { flags: `RECALLED: ${reason} at ${new Date().toISOString()}` }
      },
      { new: true }
    );
  }
}

export const inventoryService = new InventoryService();
