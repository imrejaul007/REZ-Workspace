'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Calendar,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  RefreshCw,
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  Archive,
  Zap,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency, cn } from '@/lib/utils';

interface InventoryItem {
  id: string;
  productId: string;
  name: string;
  description: string;
  category: string;
  brand?: string;
  sku: string;
  barcode?: string;
  images: string[];
  pricing: {
    cost: number;
    sellingPrice: number;
    margin: number;
    currency: string;
  };
  stock: {
    current: number;
    reserved: number;
    available: number;
    unit: string;
    location: string;
    minThreshold: number;
    maxCapacity: number;
  };
  supplier: {
    id: string;
    name: string;
    contact: string;
  };
  status: 'active' | 'inactive' | 'discontinued' | 'out_of_stock';
  quality: {
    grade: string;
    expiryDate?: string;
    batchNumber?: string;
    certifications: string[];
  };
  analytics: {
    demand: 'high' | 'medium' | 'low';
    velocity: number; // items sold per day
    turnoverRate: number; // times per month
    profitability: 'high' | 'medium' | 'low';
  };
  lastUpdated: string;
  createdAt: string;
}

interface StockMovement {
  id: string;
  itemId: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  reason: string;
  reference?: string;
  performedBy: string;
  timestamp: string;
  notes?: string;
}

interface InventoryManagementProps {
  items: InventoryItem[];
  movements: StockMovement[];
  userRole: 'restaurant' | 'vendor' | 'admin';
  onUpdateItem: (item: InventoryItem) => void;
  onDeleteItem: (itemId: string) => void;
  onStockMovement: (movement: Omit<StockMovement, 'id' | 'timestamp'>) => void;
  onReorder: (itemId: string, quantity: number) => void;
}

export default function InventoryManagement({
  items,
  movements,
  userRole,
  onUpdateItem,
  onDeleteItem,
  onStockMovement,
  onReorder
}: InventoryManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'analytics'>('grid');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);

  // Filter and sort items
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'stock':
        return b.stock.current - a.stock.current;
      case 'value':
        return (b.stock.current * b.pricing.sellingPrice) - (a.stock.current * a.pricing.sellingPrice);
      case 'updated':
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      default:
        return 0;
    }
  });

  // Get inventory statistics
  const getInventoryStats = () => {
    const totalItems = items.length;
    const activeItems = items.filter(i => i.status === 'active').length;
    const lowStockItems = items.filter(i => i.stock.current <= i.stock.minThreshold).length;
    const outOfStockItems = items.filter(i => i.stock.current === 0).length;
    const totalValue = items.reduce((sum, item) => sum + (item.stock.current * item.pricing.sellingPrice), 0);
    const highDemandItems = items.filter(i => i.analytics.demand === 'high').length;

    return {
      totalItems,
      activeItems,
      lowStockItems,
      outOfStockItems,
      totalValue,
      highDemandItems
    };
  };

  const stats = getInventoryStats();

  // Get categories
  const categories = [...new Set(items.map(item => item.category))];

  const getStatusColor = (status: InventoryItem['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'discontinued': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'out_of_stock': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getDemandColor = (demand: InventoryItem['analytics']['demand']) => {
    switch (demand) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-muted-foreground';
    }
  };

  const getStockLevel = (item: InventoryItem) => {
    const { current, minThreshold, maxCapacity } = item.stock;
    const percentage = (current / maxCapacity) * 100;
    
    if (current === 0) return { level: 'out', color: 'bg-red-500', label: 'Out of Stock' };
    if (current <= minThreshold) return { level: 'low', color: 'bg-orange-500', label: 'Low Stock' };
    if (percentage >= 80) return { level: 'high', color: 'bg-green-500', label: 'Well Stocked' };
    return { level: 'medium', color: 'bg-blue-500', label: 'Adequate' };
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {sortedItems.map((item) => {
        const stockLevel = getStockLevel(item);
        const expiringSoon = isExpiringSoon(item.quality.expiryDate);
        
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group"
          >
            <Card className="hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground line-clamp-1">{item.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                    </div>
                    
                    <div className="flex items-center space-x-1 ml-2">
                      <Button
                        variant="ghost"
                        
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setSelectedItem(item)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Image placeholder */}
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>

                  {/* Stock Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Stock</span>
                      <div className="flex items-center space-x-2">
                        <div className={cn('w-2 h-2 rounded-full', stockLevel.color)} />
                        <span className="text-sm font-medium">
                          {item.stock.current} {item.stock.unit}
                        </span>
                      </div>
                    </div>
                    
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className={cn('h-1.5 rounded-full transition-all', stockLevel.color)}
                        style={{ 
                          width: `${Math.min((item.stock.current / item.stock.maxCapacity) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>

                  {/* Pricing & SKU */}
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-muted-foreground">Price</p>
                      <p className="font-medium">{formatCurrency(item.pricing.sellingPrice)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">SKU</p>
                      <p className="font-mono text-xs">{item.sku}</p>
                    </div>
                  </div>

                  {/* Status & Alerts */}
                  <div className="flex items-center justify-between">
                    <Badge className={cn('text-xs', getStatusColor(item.status))}>
                      {item.status.replace('_', ' ')}
                    </Badge>
                    
                    <div className="flex items-center space-x-1">
                      {expiringSoon && (
                        <Badge variant="destructive" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Expiring
                        </Badge>
                      )}
                      {item.stock.current <= item.stock.minThreshold && (
                        <Badge variant="outline" className="text-xs text-orange-600">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Low
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button  variant="outline" className="flex-1">
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Reorder
                    </Button>
                    <Button  variant="outline">
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );

  const renderListView = () => (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr className="text-left">
                <th className="p-4 font-medium text-muted-foreground">Product</th>
                <th className="p-4 font-medium text-muted-foreground">SKU</th>
                <th className="p-4 font-medium text-muted-foreground">Category</th>
                <th className="p-4 font-medium text-muted-foreground">Stock</th>
                <th className="p-4 font-medium text-muted-foreground">Value</th>
                <th className="p-4 font-medium text-muted-foreground">Status</th>
                <th className="p-4 font-medium text-muted-foreground">Demand</th>
                <th className="p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item, index) => {
                const stockLevel = getStockLevel(item);
                const totalValue = item.stock.current * item.pricing.sellingPrice;
                
                return (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-border hover:bg-accent/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{item.name}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {item.sku}
                      </code>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <div className={cn('w-2 h-2 rounded-full', stockLevel.color)} />
                          <span className="text-sm font-medium">
                            {item.stock.current} {item.stock.unit}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{stockLevel.label}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{formatCurrency(totalValue)}</p>
                        <p className="text-xs text-muted-foreground">
                          @ {formatCurrency(item.pricing.sellingPrice)}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={cn('text-xs', getStatusColor(item.status))}>
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        {item.analytics.demand === 'high' ? (
                          <TrendingUp className="h-4 w-4 text-red-600" />
                        ) : item.analytics.demand === 'low' ? (
                          <TrendingDown className="h-4 w-4 text-green-600" />
                        ) : (
                          <BarChart3 className="h-4 w-4 text-yellow-600" />
                        )}
                        <span className={cn('text-sm capitalize', getDemandColor(item.analytics.demand))}>
                          {item.analytics.demand}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          
                          className="h-8 w-8 p-0"
                          onClick={() => setSelectedItem(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost"  className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost"  className="h-8 w-8 p-0">
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderAnalyticsView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Products by Value */}
      <Card>
        <CardHeader>
          <CardTitle>Top Products by Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedItems.slice(0, 5).map((item, index) => {
              const totalValue = item.stock.current * item.pricing.sellingPrice;
              const maxValue = Math.max(...sortedItems.map(i => i.stock.current * i.pricing.sellingPrice));
              
              return (
                <div key={item.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.stock.current} {item.stock.unit}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold">{formatCurrency(totalValue)}</p>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${(totalValue / maxValue) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stock Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.filter(item => 
              item.stock.current <= item.stock.minThreshold || 
              isExpiringSoon(item.quality.expiryDate)
            ).slice(0, 8).map((item) => (
              <div key={item.id} className="flex items-center space-x-3 p-2 rounded-lg bg-accent/50">
                <div className="flex-shrink-0">
                  {item.stock.current === 0 ? (
                    <XCircle className="h-5 w-5 text-red-600" />
                  ) : item.stock.current <= item.stock.minThreshold ? (
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-1">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.stock.current === 0 ? 'Out of stock' :
                     item.stock.current <= item.stock.minThreshold ? 
                     `Low stock: ${item.stock.current} ${item.stock.unit}` :
                     `Expires: ${formatDate(item.quality.expiryDate!)}`
                    }
                  </p>
                </div>
                <Button  variant="outline">
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Movement History */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent Stock Movements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {movements.slice(0, 10).map((movement) => {
              const item = items.find(i => i.id === movement.itemId);
              
              return (
                <div key={movement.id} className="flex items-center space-x-4 p-3 rounded-lg border border-border">
                  <div className={cn(
                    'p-2 rounded-full',
                    movement.type === 'in' ? 'bg-green-100 text-green-600' :
                    movement.type === 'out' ? 'bg-red-100 text-red-600' :
                    movement.type === 'adjustment' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-blue-600'
                  )}>
                    {movement.type === 'in' ? <TrendingUp className="h-4 w-4" /> :
                     movement.type === 'out' ? <TrendingDown className="h-4 w-4" /> :
                     movement.type === 'adjustment' ? <Target className="h-4 w-4" /> :
                     <RefreshCw className="h-4 w-4" />
                    }
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {item?.name || 'Unknown Item'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {movement.reason} • {movement.performedBy}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className={cn(
                      'text-sm font-semibold',
                      movement.type === 'in' ? 'text-green-600' :
                      movement.type === 'out' ? 'text-red-600' :
                      'text-yellow-600'
                    )}>
                      {movement.type === 'out' ? '-' : '+'}
                      {movement.quantity}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(movement.timestamp, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Inventory Management</h2>
          <p className="text-muted-foreground mt-1">
            Track and manage your inventory levels, stock movements, and alerts
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button variant="outline" >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAddItemModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <Package className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats.totalItems}</p>
              <p className="text-xs text-muted-foreground">Total Items</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats.activeItems}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats.lowStockItems}</p>
              <p className="text-xs text-muted-foreground">Low Stock</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats.outOfStockItems}</p>
              <p className="text-xs text-muted-foreground">Out of Stock</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{stats.highDemandItems}</p>
              <p className="text-xs text-muted-foreground">High Demand</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <Zap className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-lg font-bold text-foreground">{formatCurrency(stats.totalValue, 'INR').slice(0, -3)}K</p>
              <p className="text-xs text-muted-foreground">Total Value</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products, SKU, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="discontinued">Discontinued</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="name">Name</option>
                <option value="stock">Stock Level</option>
                <option value="value">Total Value</option>
                <option value="updated">Last Updated</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
          {['grid', 'list', 'analytics'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as unknown)}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors capitalize',
                viewMode === mode 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {mode}
            </button>
          ))}
        </div>
        
        <p className="text-sm text-muted-foreground">
          Showing {sortedItems.length} of {items.length} items
        </p>
      </div>

      {/* Content */}
      {viewMode === 'grid' && renderGridView()}
      {viewMode === 'list' && renderListView()}
      {viewMode === 'analytics' && renderAnalyticsView()}

      {/* Empty State */}
      {sortedItems.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No items found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Start by adding your first inventory item'
            }
          </p>
          <Button onClick={() => setShowAddItemModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Item
          </Button>
        </div>
      )}
    </div>
  );
}