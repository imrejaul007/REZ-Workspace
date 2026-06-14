import { v4 as uuidv4 } from 'uuid';
import { Supplier, RFQ, Quote, PurchaseOrder, Contract } from '../models/procurement';

class ProcurementService {
  private suppliers: Map<string, Supplier> = new Map();
  private rfqs: Map<string, RFQ> = new Map();
  private quotes: Map<string, Quote> = new Map();
  private purchaseOrders: Map<string, PurchaseOrder> = new Map();
  private contracts: Map<string, Contract> = new Map();

  // Supplier operations
  createSupplier(data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Supplier {
    const now = new Date().toISOString();
    const supplier: Supplier = { ...data, id: uuidv4(), createdAt: now, updatedAt: now };
    this.suppliers.set(supplier.id, supplier);
    return supplier;
  }

  getSupplier(id: string): Supplier | undefined {
    return this.suppliers.get(id);
  }

  getAllSuppliers(filters?: { status?: string; category?: string }): Supplier[] {
    let result = Array.from(this.suppliers.values());
    if (filters?.status) result = result.filter(s => s.status === filters.status);
    if (filters?.category) result = result.filter(s => s.categories.includes(filters.category as string));
    return result;
  }

  updateSupplier(id: string, data: Partial<Supplier>): Supplier | undefined {
    const supplier = this.suppliers.get(id);
    if (!supplier) return undefined;
    const updated = { ...supplier, ...data, updatedAt: new Date().toISOString() };
    this.suppliers.set(id, updated);
    return updated;
  }

  // RFQ operations
  createRFQ(data: Omit<RFQ, 'id' | 'rfqNumber' | 'createdAt' | 'updatedAt'>): RFQ {
    const now = new Date().toISOString();
    const rfqNumber = `RFQ-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const rfq: RFQ = { ...data, id: uuidv4(), rfqNumber, createdAt: now, updatedAt: now };
    this.rfqs.set(rfq.id, rfq);
    return rfq;
  }

  getRFQ(id: string): RFQ | undefined {
    return this.rfqs.get(id);
  }

  getAllRFQs(filters?: { status?: string; buyerId?: string }): RFQ[] {
    let result = Array.from(this.rfqs.values());
    if (filters?.status) result = result.filter(r => r.status === filters.status);
    if (filters?.buyerId) result = result.filter(r => r.buyerId === filters.buyerId);
    return result;
  }

  updateRFQStatus(id: string, status: RFQ['status']): RFQ | undefined {
    const rfq = this.rfqs.get(id);
    if (!rfq) return undefined;
    const updated = { ...rfq, status, updatedAt: new Date().toISOString() };
    this.rfqs.set(id, updated);
    return updated;
  }

  // Quote operations
  submitQuote(data: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt'>): Quote {
    const quoteNumber = `QT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const quote: Quote = { ...data, id: uuidv4(), quoteNumber, createdAt: new Date().toISOString() };
    this.quotes.set(quote.id, quote);
    // Update RFQ response count
    const rfq = this.rfqs.get(quote.rfqId);
    if (rfq) {
      rfq.responses++;
      this.rfqs.set(rfq.id, rfq);
    }
    return quote;
  }

  getQuotesByRFQ(rfqId: string): Quote[] {
    return Array.from(this.quotes.values())
      .filter(q => q.rfqId === rfqId)
      .sort((a, b) => (a.rank || 999) - (b.rank || 999));
  }

  updateQuoteStatus(id: string, status: Quote['status']): Quote | undefined {
    const quote = this.quotes.get(id);
    if (!quote) return undefined;
    const updated = { ...quote, status };
    this.quotes.set(id, updated);
    return updated;
  }

  // Purchase Order operations
  createPO(data: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt' | 'updatedAt'>): PurchaseOrder {
    const now = new Date().toISOString();
    const poNumber = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const po: PurchaseOrder = { ...data, id: uuidv4(), poNumber, createdAt: now, updatedAt: now };
    this.purchaseOrders.set(po.id, po);
    return po;
  }

  getPurchaseOrder(id: string): PurchaseOrder | undefined {
    return this.purchaseOrders.get(id);
  }

  getPOsBySupplier(supplierId: string): PurchaseOrder[] {
    return Array.from(this.purchaseOrders.values()).filter(po => po.supplierId === supplierId);
  }

  updatePOStatus(id: string, status: PurchaseOrder['status']): PurchaseOrder | undefined {
    const po = this.purchaseOrders.get(id);
    if (!po) return undefined;
    const updated = { ...po, status, updatedAt: new Date().toISOString() };
    this.purchaseOrders.set(id, updated);
    return updated;
  }

  // Contract operations
  createContract(data: Omit<Contract, 'id' | 'createdAt'>): Contract {
    const contract: Contract = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    this.contracts.set(contract.id, contract);
    return contract;
  }

  getContractsBySupplier(supplierId: string): Contract[] {
    return Array.from(this.contracts.values()).filter(c => c.supplierId === supplierId);
  }

  getExpiringContracts(daysAhead: number = 30): Contract[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + daysAhead);
    return Array.from(this.contracts.values()).filter(c => {
      const renewalDate = new Date(c.renewalDate || c.endDate);
      return c.status === 'active' && renewalDate <= cutoff;
    });
  }

  // Stats
  getStats() {
    return {
      totalSuppliers: this.suppliers.size,
      activeSuppliers: Array.from(this.suppliers.values()).filter(s => s.status === 'active').length,
      totalRFQs: this.rfqs.size,
      openRFQs: Array.from(this.rfqs.values()).filter(r => r.status === 'published').length,
      totalQuotes: this.quotes.size,
      totalPOs: this.purchaseOrders.size,
      pendingPOs: Array.from(this.purchaseOrders.values()).filter(po => po.status === 'created').length,
      activeContracts: Array.from(this.contracts.values()).filter(c => c.status === 'active').length,
      expiringContracts: this.getExpiringContracts().length
    };
  }
}

export default new ProcurementService();
