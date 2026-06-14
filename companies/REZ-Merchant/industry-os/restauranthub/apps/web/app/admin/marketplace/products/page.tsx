'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  TrendingUp,
  Star,
  Award,
  Clock,
  Eye,
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  RefreshCw,
  Download,
  Settings,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface Supplier {
  id: string;
  name: string;
  category: string;
  rating: number;
  isActive: boolean;
  isTrending?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
}

interface Category {
  id: string;
  name: string;
  productCount: number;
  isActive?: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export default function MarketplaceProductsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'suppliers' | 'categories'>('suppliers');
  const [searchTerm, setSearchTerm] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [suppliersRes, categoriesRes] = await Promise.allSettled([
        fetch(`${API_BASE}/marketplace/suppliers`, { headers }),
        fetch(`${API_BASE}/marketplace/categories`, { headers }),
      ]);

      if (suppliersRes.status === 'fulfilled' && suppliersRes.value.ok) {
        const data = await suppliersRes.value.json();
        setSuppliers(Array.isArray(data) ? data : data.suppliers || []);
      }

      if (categoriesRes.status === 'fulfilled' && categoriesRes.value.ok) {
        const data = await categoriesRes.value.json();
        setCategories(Array.isArray(data) ? data : data.categories || []);
      }
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggle = (id: string, field: 'isTrending' | 'isNew' | 'isBestSeller') => {
    setSuppliers(prev =>
      prev.map(s => s.id === id ? { ...s, [field]: !s[field] } : s)
    );
    toast({ title: 'Promotion Updated', description: `Supplier promotion flag toggled.` });
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const supplierStats = {
    total: suppliers.length,
    active: suppliers.filter(s => s.isActive).length,
    trending: suppliers.filter(s => s.isTrending).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marketplace Management</h1>
          <p className="mt-2 text-gray-600">Manage suppliers, categories, and promotion flags</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Data
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as unknown)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="suppliers" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Suppliers</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Categories</span>
          </TabsTrigger>
        </TabsList>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Suppliers</CardTitle>
                <div className="text-2xl font-bold">{loading ? '...' : supplierStats.total}</div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
                <div className="text-2xl font-bold text-green-600">{loading ? '...' : supplierStats.active}</div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Trending
                </CardTitle>
                <div className="text-2xl font-bold text-orange-600">{loading ? '...' : supplierStats.trending}</div>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Suppliers ({filteredSuppliers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                  <p className="text-gray-500">Loading suppliers...</p>
                </div>
              ) : filteredSuppliers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers found</h3>
                  <p className="text-gray-500">
                    {searchTerm ? 'Try a different search term.' : 'No suppliers are registered in the marketplace yet.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left p-3">Supplier</th>
                        <th className="text-left p-3">Category</th>
                        <th className="text-left p-3">Rating</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Promotions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSuppliers.map((supplier) => (
                        <tr key={supplier.id} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div className="font-medium">{supplier.name}</div>
                            <div className="text-gray-500 text-xs">ID: {supplier.id}</div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="capitalize">
                              {supplier.category}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center">
                              <Star className="h-3 w-3 text-yellow-400 mr-1" />
                              {supplier.rating?.toFixed(1) ?? '—'}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              supplier.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {supplier.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={!!supplier.isTrending}
                                  onCheckedChange={() => handleToggle(supplier.id, 'isTrending')}
                                />
                                <span className="text-xs">Trending</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={!!supplier.isBestSeller}
                                  onCheckedChange={() => handleToggle(supplier.id, 'isBestSeller')}
                                />
                                <span className="text-xs">Best Seller</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Categories ({filteredCategories.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                  <p className="text-gray-500">Loading categories...</p>
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
                  <p className="text-gray-500">
                    {searchTerm ? 'Try a different search term.' : 'No categories have been created yet.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCategories.map((category) => (
                    <div key={category.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="font-medium text-gray-900">{category.name}</div>
                      {category.productCount != null && (
                        <div className="text-sm text-gray-500 mt-1">{category.productCount} products</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
