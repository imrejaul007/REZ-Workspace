'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, ShoppingCart, Bell, Filter, Star, Package, Truck, Users, ShieldCheck, ArrowRight, Repeat, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import RfqModal from './rfq-modal';

interface MarketplaceCategory {
  id: string;
  name: string;
  icon?: string;
  productCount?: number;
}

interface MarketplaceSupplier {
  id: string;
  name: string;
  category: string;
  cities: string[];
  rating?: number;
  verified: boolean;
  rezVerified: boolean;
  productCount: number;
  demandSignal?: string;
}

interface DemandSignal {
  category: string;
  city: string;
  merchantCount: number;
  avgMonthlyQuantity: number;
  avgUnitPrice: number;
  lastUpdated: string;
}

interface PastOrder {
  id: string;
  supplierId?: string;
  status: string;
  totalAmount: number;
  currency: string;
  items: Array<{ productId: string; productName: string; quantity: number; unitPrice: number; totalPrice: number }>;
  createdAt: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  'fresh produce': '🥬',
  ingredients: '🧂',
  equipment: '🍳',
  cleaning: '🧹',
  beverages: '🥤',
  'frozen foods': '❄️',
  packaging: '📦',
  proteins: '🥩',
  'cooking oil': '🫙',
};

function getCategoryIcon(name: string): string {
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_ICONS)) {
    if (key.includes(k)) return v;
  }
  return '📦';
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

export default function MarketplacePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [suppliers, setSuppliers] = useState<MarketplaceSupplier[]>([]);
  const [demandSignals, setDemandSignals] = useState<DemandSignal[]>([]);
  const [pastOrders, setPastOrders] = useState<PastOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [rfqSupplier, setRfqSupplier] = useState<MarketplaceSupplier | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [cats, sups, signals, orders] = await Promise.all([
      fetchJson<MarketplaceCategory[]>('/api/marketplace/categories'),
      fetchJson<MarketplaceSupplier[]>(`/api/marketplace/suppliers${selectedCategory ? `?category=${encodeURIComponent(selectedCategory)}` : ''}`),
      fetchJson<DemandSignal[]>('/api/marketplace/demand-signals?city=bangalore'),
      fetchJson<PastOrder[]>('/api/marketplace/order-history'),
    ]);
    if (cats) setCategories(cats);
    if (sups) setSuppliers(sups);
    if (signals) setDemandSignals(signals);
    if (orders) setPastOrders(orders);
    setLoading(false);
  }, [selectedCategory]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/marketplace/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleCategoryClick = (name: string) => {
    setSelectedCategory(prev => (prev === name ? null : name));
  };

  const getDemandLabel = (supplier: MarketplaceSupplier): string | undefined => {
    const signal = demandSignals.find(
      (s) => s.category.toLowerCase() === supplier.category.toLowerCase(),
    );
    if (!signal) return undefined;
    return `${signal.merchantCount}+ restaurants in ${signal.city} buy this monthly`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-2xl relative">
              <Input
                type="text"
                placeholder="Search suppliers, categories, products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 pr-24"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Button
                size="sm"
                onClick={handleSearch}
                className="absolute right-1 top-1/2 -translate-y-1/2"
              >
                Search
              </Button>
            </div>
            <Button variant="ghost" size="icon" onClick={() => router.push('/notifications')}>
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => router.push('/marketplace/cart')}>
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Categories */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Categories</h2>
            <Button variant="ghost" size="sm" onClick={() => router.push('/marketplace/categories')}>
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          {loading ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-28 h-20 bg-gray-200 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.name)}
                  className={`flex-shrink-0 flex flex-col items-center justify-center gap-1 w-28 h-20 rounded-xl border-2 transition-colors font-medium text-sm ${
                    selectedCategory === cat.name
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-400'
                  }`}
                >
                  <span className="text-2xl">{getCategoryIcon(cat.name)}</span>
                  <span className="text-xs text-center leading-tight">{cat.name}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Demand Signal Banner */}
        {demandSignals.length > 0 && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 text-white flex items-center gap-4">
            <TrendingUp className="h-8 w-8 flex-shrink-0" />
            <div>
              <p className="font-semibold">Real Demand in Your City</p>
              <p className="text-blue-100 text-sm">
                {demandSignals[0].merchantCount}+ restaurants in {demandSignals[0].city} are actively buying {demandSignals[0].category} monthly — find the right supplier below.
              </p>
            </div>
          </div>
        )}

        {/* Suppliers */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {selectedCategory ? `${selectedCategory} Suppliers` : 'All Suppliers'}
            </h2>
            {selectedCategory && (
              <Button variant="outline" size="sm" onClick={() => setSelectedCategory(null)}>
                <Filter className="mr-1 h-4 w-4" /> Clear filter
              </Button>
            )}
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : suppliers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                No suppliers found. Try a different filter.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map((supplier) => {
                const demandLabel = getDemandLabel(supplier);
                return (
                  <Card key={supplier.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{supplier.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{supplier.category}</p>
                        </div>
                        <div className="flex gap-1">
                          {supplier.rezVerified && (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                              REZ Verified
                            </Badge>
                          )}
                        </div>
                      </div>

                      {supplier.rating && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span>{supplier.rating.toFixed(1)}</span>
                        </div>
                      )}

                      {supplier.cities.length > 0 && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                          <Truck className="h-4 w-4" />
                          <span>{supplier.cities.slice(0, 2).join(', ')}</span>
                        </div>
                      )}

                      {demandLabel && (
                        <div className="flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-2 py-1">
                          <Users className="h-3 w-3" />
                          {demandLabel}
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="default"
                          className="flex-1"
                          onClick={() => setRfqSupplier(supplier)}
                        >
                          Request Quote
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/marketplace/supplier/${supplier.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Order Again — REZ purchase history */}
        {pastOrders.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Repeat className="h-5 w-5 text-blue-600" /> Order Again
              </h2>
              <Badge variant="secondary" className="text-xs">Sourced from your REZ purchase history</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastOrders.slice(0, 6).map((order) => (
                <Card key={order.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {order.items[0]?.productName ?? 'Order'}
                        {order.items.length > 1 && ` +${order.items.length - 1} more`}
                      </span>
                      <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'} className="text-xs capitalize">
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {order.currency} {order.totalAmount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        const item = order.items[0];
                        if (item) {
                          router.push(`/marketplace/search?q=${encodeURIComponent(item.productName)}`);
                        }
                      }}
                    >
                      <Repeat className="h-4 w-4 mr-1" /> Reorder
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-200 dark:border-gray-700">
          {[
            { icon: ShieldCheck, label: 'REZ Verified Suppliers', color: 'text-blue-600' },
            { icon: Truck, label: 'Reliable Delivery', color: 'text-green-600' },
            { icon: Package, label: 'Bulk Pricing Available', color: 'text-purple-600' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-center">
              <Icon className={`h-8 w-8 ${color}`} />
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* RFQ Modal */}
      {rfqSupplier && (
        <RfqModal
          supplier={rfqSupplier}
          onClose={() => setRfqSupplier(null)}
        />
      )}
    </div>
  );
}
