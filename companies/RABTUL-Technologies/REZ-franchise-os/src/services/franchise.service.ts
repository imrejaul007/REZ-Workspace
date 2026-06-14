import { v4 as uuidv4 } from 'uuid';
import { Franchise, Location, Performance, RoyaltyPayment } from '../models/franchise';

class FranchiseService {
  private franchises: Map<string, Franchise> = new Map();
  private locations: Map<string, Location> = new Map();
  private performance: Map<string, Performance> = new Map();
  private royaltyPayments: Map<string, RoyaltyPayment> = new Map();

  // Franchise operations
  createFranchise(data: Omit<Franchise, 'id' | 'createdAt' | 'updatedAt'>): Franchise {
    const now = new Date().toISOString();
    const franchise: Franchise = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    };
    this.franchises.set(franchise.id, franchise);
    return franchise;
  }

  getFranchise(id: string): Franchise | undefined {
    return this.franchises.get(id);
  }

  getFranchiseByCode(code: string): Franchise | undefined {
    return Array.from(this.franchises.values()).find(f => f.code === code);
  }

  getAllFranchises(filters?: { status?: string; brand?: string; type?: string }): Franchise[] {
    let result = Array.from(this.franchises.values());
    if (filters?.status) {
      result = result.filter(f => f.status === filters.status);
    }
    if (filters?.brand) {
      result = result.filter(f => f.brand === filters.brand);
    }
    if (filters?.type) {
      result = result.filter(f => f.type === filters.type);
    }
    return result;
  }

  updateFranchise(id: string, data: Partial<Franchise>): Franchise | undefined {
    const franchise = this.franchises.get(id);
    if (!franchise) return undefined;
    const updated = { ...franchise, ...data, updatedAt: new Date().toISOString() };
    this.franchises.set(id, updated);
    return updated;
  }

  deleteFranchise(id: string): boolean {
    return this.franchises.delete(id);
  }

  // Location operations
  addLocation(franchiseId: string, data: Omit<Location, 'id' | 'franchiseId' | 'createdAt'>): Location | undefined {
    const franchise = this.franchises.get(franchiseId);
    if (!franchise) return undefined;
    const location: Location = {
      ...data,
      id: uuidv4(),
      franchiseId,
      createdAt: new Date().toISOString()
    };
    this.locations.set(location.id, location);
    franchise.locations.push(location);
    this.franchises.set(franchiseId, franchise);
    return location;
  }

  getLocation(id: string): Location | undefined {
    return this.locations.get(id);
  }

  getLocationsByFranchise(franchiseId: string): Location[] {
    return Array.from(this.locations.values()).filter(l => l.franchiseId === franchiseId);
  }

  updateLocation(id: string, data: Partial<Location>): Location | undefined {
    const location = this.locations.get(id);
    if (!location) return undefined;
    const updated = { ...location, ...data };
    this.locations.set(id, updated);
    return updated;
  }

  // Performance operations
  recordPerformance(data: Omit<Performance, 'id' | 'createdAt'>): Performance {
    const performance: Performance = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };
    this.performance.set(performance.id, performance);
    return performance;
  }

  getPerformance(franchiseId: string, period?: string): Performance[] {
    let results = Array.from(this.performance.values()).filter(p => p.franchiseId === franchiseId);
    if (period) {
      results = results.filter(p => p.period === period);
    }
    return results;
  }

  getPerformanceByLocation(locationId: string): Performance[] {
    return Array.from(this.performance.values()).filter(p => p.locationId === locationId);
  }

  // Royalty operations
  createRoyaltyPayment(data: Omit<RoyaltyPayment, 'id' | 'createdAt'>): RoyaltyPayment {
    const payment: RoyaltyPayment = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };
    this.royaltyPayments.set(payment.id, payment);
    return payment;
  }

  getRoyaltyPayments(franchiseId: string): RoyaltyPayment[] {
    return Array.from(this.royaltyPayments.values()).filter(r => r.franchiseId === franchiseId);
  }

  updateRoyaltyStatus(id: string, status: RoyaltyPayment['status'], paidDate?: string): RoyaltyPayment | undefined {
    const payment = this.royaltyPayments.get(id);
    if (!payment) return undefined;
    const updated = { ...payment, status, ...(paidDate && { paidDate }) };
    this.royaltyPayments.set(id, updated);
    return updated;
  }

  // Stats
  getStats() {
    const allFranchises = Array.from(this.franchises.values());
    const allLocations = Array.from(this.locations.values());
    return {
      totalFranchises: allFranchises.length,
      activeFranchises: allFranchises.filter(f => f.status === 'active').length,
      totalLocations: allLocations.length,
      openLocations: allLocations.filter(l => l.status === 'open').length,
      totalRevenue: allLocations.reduce((sum, l) => sum + l.currentSales, 0),
      totalTargets: allLocations.reduce((sum, l) => sum + l.salesTarget, 0),
      pendingRoyalties: Array.from(this.royaltyPayments.values()).filter(r => r.status === 'pending').length
    };
  }
}

export default new FranchiseService();
