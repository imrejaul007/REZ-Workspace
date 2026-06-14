'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, Search, AlertTriangle, TrendingDown, Edit, Trash2, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/lib/auth/auth-provider';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

interface InventoryItem {
  id: number | string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  costPerUnit: number;
  supplier: string;
  lastOrdered: string;
  expiryDate: string;
  status: string;
}

const categories = ['Vegetables', 'Meat', 'Dairy', 'Pantry', 'Beverages', 'Spices', 'Frozen'];

export default function InventoryManagement() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const restaurantId = user?.restaurant?.id;

  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    currentStock: '',
    minStock: '',
    maxStock: '',
    unit: '',
    costPerUnit: '',
    supplier: '',
    expiryDate: '',
  });

  const getStockStatus = (item: { currentStock: number; minStock: number }) => {
    if (item.currentStock === 0) return 'out';
    if (item.currentStock <= item.minStock * 0.5) return 'critical';
    if (item.currentStock <= item.minStock) return 'low';
    return 'good';
  };

  const fetchInventory = useCallback(async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const batches = await apiFetch<unknown[]>(
        `/inventory/batches?restaurantId=${encodeURIComponent(restaurantId)}`,
      );
      const items: InventoryItem[] = (batches ?? []).map((batch) => {
        const currentStock = batch.quantity ?? 0;
        const minStock = batch.product?.minStock ?? 0;
        const maxStock = batch.product?.maxStock ?? (currentStock * 2 || 100);
        const itemForStatus = { currentStock, minStock };
        return {
          id: batch.id,
          name: batch.product?.name ?? 'Unknown',
          category: batch.product?.category?.name ?? 'Uncategorised',
          currentStock,
          minStock,
          maxStock,
          unit: batch.product?.unit ?? 'units',
          costPerUnit: batch.costPrice ?? batch.product?.costPrice ?? 0,
          supplier: batch.supplier?.companyName ?? 'Unknown',
          lastOrdered: batch.receivedDate
            ? new Date(batch.receivedDate).toISOString().split('T')[0]
            : '',
          expiryDate: batch.expiryDate
            ? new Date(batch.expiryDate).toISOString().split('T')[0]
            : '',
          status: getStockStatus(itemForStatus),
        };
      });
      setInventory(items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const updateItemStock = (itemId: number | string, newStock: number) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              currentStock: newStock,
              status: getStockStatus({ currentStock: newStock, minStock: item.minStock }),
            }
          : item,
      ),
    );
  };

  const addItem = () => {
    if (newItem.name && newItem.category && newItem.currentStock) {
      const currentStock = parseInt(newItem.currentStock);
      const minStock = parseInt(newItem.minStock) || 10;
      const item: InventoryItem = {
        id: `local-${Date.now()}`,
        name: newItem.name,
        category: newItem.category,
        currentStock,
        minStock,
        maxStock: parseInt(newItem.maxStock) || 100,
        unit: newItem.unit || 'units',
        costPerUnit: parseFloat(newItem.costPerUnit) || 0,
        supplier: newItem.supplier || 'TBD',
        lastOrdered: new Date().toISOString().split('T')[0],
        expiryDate: newItem.expiryDate || '',
        status: getStockStatus({ currentStock, minStock }),
      };
      setInventory((prev) => [...prev, item]);
      setNewItem({
        name: '', category: '', currentStock: '', minStock: '', maxStock: '',
        unit: '', costPerUnit: '', supplier: '', expiryDate: '',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-500';
      case 'low': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      case 'out': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    totalItems: inventory.length,
    lowStock: inventory.filter((i) => i.status === 'low' || i.status === 'critical').length,
    totalValue: inventory.reduce((sum, item) => sum + item.currentStock * item.costPerUnit, 0),
    outOfStock: inventory.filter((i) => i.status === 'out').length,
  };

  if (!restaurantId && !loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-64 text-center space-y-3">
          <p className="text-lg font-semibold">No restaurant linked</p>
          <p className="text-sm text-muted-foreground">
            Your account is not associated with a restaurant.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}{' '}
              <button
                onClick={fetchInventory}
                className="underline ml-1 text-sm font-medium"
              >
                Retry
              </button>
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Inventory Management</h1>
            <p className="text-muted-foreground">Track and manage restaurant inventory</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Inventory Item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="itemName">Item Name</Label>
                    <Input
                      id="itemName"
                      value={newItem.name}
                      onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Fresh Basil"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newItem.category}
                      onValueChange={(value) => setNewItem((prev) => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="currentStock">Current Stock</Label>
                      <Input
                        id="currentStock"
                        type="number"
                        value={newItem.currentStock}
                        onChange={(e) => setNewItem((prev) => ({ ...prev, currentStock: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="unit">Unit</Label>
                      <Input
                        id="unit"
                        value={newItem.unit}
                        onChange={(e) => setNewItem((prev) => ({ ...prev, unit: e.target.value }))}
                        placeholder="lbs, bottles, etc."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="minStock">Min Stock</Label>
                      <Input
                        id="minStock"
                        type="number"
                        value={newItem.minStock}
                        onChange={(e) => setNewItem((prev) => ({ ...prev, minStock: e.target.value }))}
                        placeholder="10"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxStock">Max Stock</Label>
                      <Input
                        id="maxStock"
                        type="number"
                        value={newItem.maxStock}
                        onChange={(e) => setNewItem((prev) => ({ ...prev, maxStock: e.target.value }))}
                        placeholder="100"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="costPerUnit">Cost per Unit</Label>
                    <Input
                      id="costPerUnit"
                      type="number"
                      step="0.01"
                      value={newItem.costPerUnit}
                      onChange={(e) => setNewItem((prev) => ({ ...prev, costPerUnit: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      value={newItem.supplier}
                      onChange={(e) => setNewItem((prev) => ({ ...prev, supplier: e.target.value }))}
                      placeholder="Supplier name"
                    />
                  </div>
                  <Button onClick={addItem} className="w-full">
                    Add Item
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {stats.lowStock > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {stats.lowStock} item{stats.lowStock !== 1 ? 's' : ''} with low stock levels need attention.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Items', value: stats.totalItems, icon: <Package className="h-8 w-8 text-blue-500" /> },
            { label: 'Low Stock', value: stats.lowStock, icon: <TrendingDown className="h-8 w-8 text-yellow-500" />, color: 'text-yellow-600' },
            { label: 'Total Value', value: `₹${stats.totalValue.toLocaleString()}`, icon: <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center"><span className="text-green-600 font-bold">₹</span></div> },
            { label: 'Out of Stock', value: stats.outOfStock, icon: <AlertTriangle className="h-8 w-8 text-red-500" />, color: 'text-red-600' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <h3 className={`text-2xl font-bold mt-2 ${stat.color ?? ''}`}>{stat.value}</h3>
                    </div>
                    {stat.icon}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle>Inventory Items</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredInventory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                  <Package className="h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-semibold text-foreground">No inventory items found</p>
                  <p className="text-sm text-muted-foreground">
                    {inventory.length === 0
                      ? 'No inventory batches have been recorded yet. Add your first item to get started.'
                      : 'No items match your current filters. Try adjusting the search or category.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredInventory.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold">{item.name}</h3>
                            <Badge variant="outline">{item.category}</Badge>
                            <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm text-gray-600">
                            <div><span className="font-medium">Stock: </span>{item.currentStock} {item.unit}</div>
                            <div><span className="font-medium">Min: </span>{item.minStock} {item.unit}</div>
                            <div><span className="font-medium">Cost: </span>₹{item.costPerUnit}/{item.unit}</div>
                            <div><span className="font-medium">Supplier: </span>{item.supplier}</div>
                            <div>
                              <span className="font-medium">Received: </span>
                              {item.lastOrdered ? new Date(item.lastOrdered).toLocaleDateString() : '—'}
                            </div>
                            <div>
                              <span className="font-medium">Expires: </span>
                              {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Stock Level</span>
                              <span>{item.currentStock} / {item.maxStock}</span>
                            </div>
                            <Progress value={(item.currentStock / Math.max(item.maxStock, 1)) * 100} className="h-2" />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Input
                            type="number"
                            value={item.currentStock}
                            onChange={(e) => updateItemStock(item.id, parseInt(e.target.value) || 0)}
                            className="w-20"
                          />
                          <Button variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            className="text-red-600"
                            onClick={() => setInventory((prev) => prev.filter((i) => i.id !== item.id))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
