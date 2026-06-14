/**
 * nextaBizz Integration
 * Connect PeopleOS Benefits Marketplace to nextaBizz supplier network
 */

const NEXTABIZZ_API = process.env.NEXTABIZZ_API || 'https://nextabizz.rezapp.com/api';

// ─── Types ──────────────────────────────────────────────────────────────

export interface Supplier {
  id: string;
  name: string;
  category: 'wellness' | 'learning' | 'food' | 'travel' | 'subscription' | 'software';
  logo: string;
  rating: number;
  employees: number;
  verified: boolean;
}

export interface Product {
  id: string;
  supplierId: string;
  supplierName: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  benefits: string[];
  corporateDiscount: number;
  employeePrice: number;
}

export interface Order {
  productId: string;
  employeeId: string;
  quantity: number;
  total: number;
  walletType: 'wellness' | 'learning' | 'food' | 'travel';
}

// ─── Supplier API ───────────────────────────────────────────────────

export async function getSuppliers(category?: string): Promise<Supplier[]> {
  try {
    const url = category
      ? `${NEXTABIZZ_API}/suppliers?category=${category}`
      : `${NEXTABIZZ_API}/suppliers`;
    const response = await fetch(url);
    const data = await response.json();
    return data.suppliers || [];
  } catch {
    return [];
  }
}

export async function getSupplier(id: string): Promise<Supplier | null> {
  try {
    const response = await fetch(`${NEXTABIZZ_API}/suppliers/${id}`);
    const data = await response.json();
    return data.supplier || null;
  } catch {
    return null;
  }
}

// ─── Products API ───────────────────────────────────────────────

export async function getProducts(params: {
  category?: string;
  supplierId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}): Promise<Product[]> {
  try {
    const searchParams = new URLSearchParams();
    if (params.category) searchParams.append('category', params.category);
    if (params.supplierId) searchParams.append('supplierId', params.supplierId);
    if (params.search) searchParams.append('search', params.search);
    if (params.minPrice) searchParams.append('minPrice', params.minPrice.toString());
    if (params.maxPrice) searchParams.append('maxPrice', params.maxPrice.toString());

    const url = `${NEXTABIZZ_API}/products?${searchParams.toString()}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.products || [];
  } catch {
    return [];
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    const response = await fetch(`${NEXTABIZZ_API}/products/${id}`);
    const data = await response.json();
    return data.product || null;
  } catch {
    return null;
  }
}

// ─── Corporate Deals API ──────────────────────────────────────

export async function getCorporateDeals(companyId: string): Promise<Product[]> {
  try {
    const response = await fetch(
      `${NEXTABIZZ_API}/corporate/${companyId}/deals`
    );
    const data = await response.json();
    return data.deals || [];
  } catch {
    return [];
  }
}

export async function getFeaturedDeals(): Promise<Product[]> {
  try {
    const response = await fetch(`${NEXTABIZZ_API}/deals/featured`);
    const data = await response.json();
    return data.deals || [];
  } catch {
    return [];
  }
}

// ─── Orders API ──────────────────────────────────────────────

export async function createOrder(order: Order): Promise<{
  success: boolean;
  orderId?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${NEXTABIZZ_API}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    const data = await response.json();
    return { success: true, orderId: data.orderId };
  } catch (error) {
    return { success: false, error: 'Order failed' };
  }
}

export async function getOrders(employeeId: string): Promise<Order[]> {
  try {
    const response = await fetch(
      `${NEXTABIZZ_API}/orders?employeeId=${employeeId}`
    );
    const data = await response.json();
    return data.orders || [];
  } catch {
    return [];
  }
}

// ─── Redeem from Benefit Wallet ─────────────────────────────────

export async function redeemWithWallet(params: {
  productId: string;
  employeeId: string;
  walletType: 'wellness' | 'learning' | 'travel' | 'food';
  companyId: string;
}): Promise<{
  success: boolean;
  transactionId?: string;
  remainingBalance?: number;
}> {
  try {
    const response = await fetch(`${NEXTABIZZ_API}/redeem/wallet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await response.json();
    return {
      success: true,
      transactionId: data.transactionId,
      remainingBalance: data.remainingBalance,
    };
  } catch {
    return { success: false };
  }
}

// ─── Categories ─────────────────────────────────────────────

export const BENEFIT_CATEGORIES = [
  { id: 'wellness', name: 'Wellness', icon: '💪', description: 'Gym, therapy, fitness apps' },
  { id: 'learning', name: 'Learning', icon: '📚', description: 'Courses, certifications, books' },
  { id: 'food', name: 'Food & Dining', icon: '🍽️', description: 'Swiggy, Zomato, meal plans' },
  { id: 'travel', name: 'Travel', icon: '✈️', description: 'Flights, hotels, workations' },
  { id: 'subscription', name: 'Subscriptions', icon: '📱', description: 'Spotify, Netflix, apps' },
  { id: 'software', name: 'Software', icon: '💻', description: 'GitHub, Notion, tools' },
];

// ─── Featured Suppliers (Demo) ─────────────────────────────────

export const FEATURED_SUPPLIERS: Supplier[] = [
  {
    id: 'supp-1',
    name: 'FitIndia Gym Network',
    category: 'wellness',
    logo: '🏋️',
    rating: 4.5,
    employees: 10000,
    verified: true,
  },
  {
    id: 'supp-2',
    name: 'Coursera Business',
    category: 'learning',
    logo: '🎓',
    rating: 4.8,
    employees: 50000,
    verified: true,
  },
  {
    id: 'supp-3',
    name: 'Swiggy Corporate',
    category: 'food',
    logo: '🍕',
    rating: 4.3,
    employees: 100000,
    verified: true,
  },
  {
    id: 'supp-4',
    name: 'MakeMyTrip Biz',
    category: 'travel',
    logo: '✈️',
    rating: 4.1,
    employees: 25000,
    verified: true,
  },
  {
    id: 'supp-5',
    name: 'Spotify Business',
    category: 'subscription',
    logo: '🎵',
    rating: 4.6,
    employees: 50000,
    verified: true,
  },
  {
    id: 'supp-6',
    name: 'GitHub Education',
    category: 'software',
    logo: '💻',
    rating: 4.9,
    employees: 80000,
    verified: true,
  },
];
