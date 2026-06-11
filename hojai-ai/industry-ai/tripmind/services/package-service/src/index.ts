/**
 * Package Service - Travel Package Management
 * Part of TRIPMIND - Travel Agency AI
 */

import { v4 as uuidv4 } from 'uuid';

export interface TravelPackage {
  id: string;
  name: string;
  description: string;
  destination: string;
  duration: number; // days
  inclusions: string[];
  exclusions: string[];
  itinerary: { day: number; title: string; activities: string[] }[];
  pricing: {
    perPerson: number;
    childWithBed: number;
    childWithoutBed: number;
    infant: number;
  };
  images: string[];
  rating: number;
  reviewsCount: number;
  category: 'honeymoon' | 'family' | 'adventure' | 'budget' | 'luxury';
  status: 'active' | 'inactive' | 'sold-out';
  availableFrom: string;
  availableTo: string;
  createdAt: string;
}

export interface CustomPackageRequest {
  id: string;
  customerId: string;
  destination: string;
  duration: number;
  travelers: number;
  budget: number;
  preferences: string[];
  status: 'pending' | 'quoted' | 'accepted' | 'rejected';
  quote?: {
    amount: number;
    validUntil: string;
  };
  createdAt: string;
}

export class PackageService {
  private packages: Map<string, TravelPackage> = new Map();
  private requests: Map<string, CustomPackageRequest> = new Map();

  async create(data: Omit<TravelPackage, 'id' | 'createdAt' | 'reviewsCount'>): Promise<TravelPackage> {
    const pkg: TravelPackage = {
      ...data,
      id: uuidv4(),
      reviewsCount: 0,
      createdAt: new Date().toISOString()
    };

    this.packages.set(pkg.id, pkg);
    return pkg;
  }

  async getById(id: string): Promise<TravelPackage | undefined> {
    return this.packages.get(id);
  }

  async getAll(filters?: { category?: string; status?: string; destination?: string }): Promise<TravelPackage[]> {
    let result = Array.from(this.packages.values());

    if (filters?.category) result = result.filter(p => p.category === filters.category);
    if (filters?.status) result = result.filter(p => p.status === filters.status);
    if (filters?.destination) result = result.filter(p => p.destination.toLowerCase().includes(filters.destination!.toLowerCase()));

    return result.sort((a, b) => b.rating - a.rating);
  }

  async search(query: string): Promise<TravelPackage[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.packages.values())
      .filter(p => p.status === 'active')
      .filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.destination.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery)
      );
  }

  async getPopular(limit: number = 10): Promise<TravelPackage[]> {
    return Array.from(this.packages.values())
      .filter(p => p.status === 'active')
      .sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount)
      .slice(0, limit);
  }

  async createCustomRequest(data: Omit<CustomPackageRequest, 'id' | 'status' | 'createdAt'>): Promise<CustomPackageRequest> {
    const request: CustomPackageRequest = {
      ...data,
      id: uuidv4(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    this.requests.set(request.id, request);
    return request;
  }

  async quoteCustomPackage(requestId: string, amount: number, validDays: number = 7): Promise<CustomPackageRequest | undefined> {
    const request = this.requests.get(requestId);
    if (!request) return undefined;

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    request.status = 'quoted';
    request.quote = {
      amount,
      validUntil: validUntil.toISOString()
    };

    this.requests.set(requestId, request);
    return request;
  }

  async getCustomRequests(status?: string): Promise<CustomPackageRequest[]> {
    let result = Array.from(this.requests.values());
    if (status) result = result.filter(r => r.status === status);
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export default PackageService;