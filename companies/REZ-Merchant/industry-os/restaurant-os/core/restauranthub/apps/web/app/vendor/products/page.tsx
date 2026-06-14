'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Star,
  Eye,
  MoreHorizontal,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { cn } from '@/lib/utils';
import {
  vendorProductsApi,
  VendorProduct,
  CreateProductPayload,
} from '@/lib/api/vendor-products';

const CATEGORIES = [
  'All Categories',
  'Fresh Produce',
  'Grains & Cereals',
  'Spices & Seasonings',
  'Oils & Fats',
  'Dairy Products',
  'Meat & Poultry',
  'Beverages',
  'Kitchen Equipment',
];

const EMPTY_FORM: CreateProductPayload = {
  name: '',
  description: '',
  price: 0,
  category: '',
  unit: 'kg',
  stockQuantity: 0,
  minOrderQty: 1,
  status: 'active',
  tags: [],
  inStock: true,
};

export default function VendorProductsPage() {
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<VendorProduct | null>(null);
  const [formData, setFormData] = useState<CreateProductPayload>(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await vendorProductsApi.listProducts();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = products.filter((product) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      product.name.toLowerCase().includes(q) ||
      product.description.toLowerCase().includes(q);
    const matchesCategory =
      selectedCategory === 'All Categories' || product.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    total: products.length,
    active: products.filter((p) => p.status === 'active').length,
    inactive: products.filter((p) => p.status === 'inactive').length,
    pending: products.filter((p) => p.status === 'pending').length,
    totalViews: products.reduce((sum, p) => sum + p.views, 0),
    totalOrders: products.reduce((sum, p) => sum + p.orders, 0),
    revenue: products.reduce((sum, p) => sum + p.price * p.orders, 0),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-3 w-3" />;
      case 'inactive': return <XCircle className="h-3 w-3" />;
      case 'pending': return <AlertCircle className="h-3 w-3" />;
      default: return null;
    }
  };

  const openAddForm = () => {
    setEditingProduct(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (product: VendorProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      category: product.category,
      unit: product.unit,
      stockQuantity: product.stockQuantity,
      minOrderQty: product.minOrderQty,
      maxOrderQty: product.maxOrderQty,
      inStock: product.inStock,
      tags: product.tags,
      discount: product.discount,
      status: product.status,
    });
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      if (editingProduct) {
        const updated = await vendorProductsApi.updateProduct(editingProduct.id, formData);
        setProducts((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p))
        );
      } else {
        const created = await vendorProductsApi.createProduct(formData);
        setProducts((prev) => [created, ...prev]);
      }
      closeForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await vendorProductsApi.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      // Error is shown by the API client; just clear deleting state
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Product Management</h1>
            <p className="text-muted-foreground">
              Manage your marketplace products and inventory
            </p>
          </div>
          <Button onClick={openAddForm}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Package className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
                </div>
                <Eye className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold">₹{stats.revenue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="lg:w-48">
                <select
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:w-32">
                <select
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results summary */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Showing {filteredProducts.length} products
          </p>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="flex items-center space-x-1">
              <div className={cn('w-2 h-2 rounded-full', getStatusColor('active'))} />
              <span>Active: {stats.active}</span>
            </Badge>
            <Badge variant="secondary" className="flex items-center space-x-1">
              <div className={cn('w-2 h-2 rounded-full', getStatusColor('inactive'))} />
              <span>Inactive: {stats.inactive}</span>
            </Badge>
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && error && (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
              <p className="text-sm font-medium text-destructive">{error}</p>
              <Button variant="outline" className="mt-4" onClick={loadProducts}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Products Table */}
        {!loading && !error && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">Product</th>
                      <th className="text-left p-4 font-medium">Price</th>
                      <th className="text-left p-4 font-medium">Stock</th>
                      <th className="text-left p-4 font-medium">Performance</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <motion.tr
                        key={product.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b hover:bg-muted/50 transition-colors"
                      >
                        {/* Product Info */}
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center shrink-0">
                              {product.images?.[0] ? (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                              ) : (
                                <Package className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-foreground truncate">
                                {product.name}
                              </h4>
                              <p className="text-sm text-muted-foreground">{product.category}</p>
                              <div className="flex items-center space-x-1 mt-1">
                                <Star className="h-3 w-3 fill-current text-yellow-400" />
                                <span className="text-xs text-muted-foreground">
                                  {product.rating} ({product.reviewCount})
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="p-4">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold">₹{product.price}</span>
                              {product.originalPrice && (
                                <span className="text-sm text-muted-foreground line-through">
                                  ₹{product.originalPrice}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">per {product.unit}</p>
                            {product.discount && (
                              <Badge variant="secondary" className="text-xs">
                                -{product.discount}%
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* Stock */}
                        <td className="p-4">
                          <div className="space-y-1">
                            <span
                              className={cn(
                                'font-medium',
                                product.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'
                              )}
                            >
                              {product.stockQuantity} {product.unit}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              Min: {product.minOrderQty} {product.unit}
                            </p>
                          </div>
                        </td>

                        {/* Performance */}
                        <td className="p-4">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Eye className="h-3 w-3 text-blue-500" />
                              <span className="text-sm">{product.views}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <ShoppingCart className="h-3 w-3 text-green-500" />
                              <span className="text-sm">{product.orders}</span>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <Badge
                            variant="secondary"
                            className={cn(
                              'flex items-center space-x-1 w-fit',
                              product.status === 'active' && 'text-green-700 bg-green-100',
                              product.status === 'inactive' && 'text-red-700 bg-red-100',
                              product.status === 'pending' && 'text-yellow-700 bg-yellow-100'
                            )}
                          >
                            {getStatusIcon(product.status)}
                            <span className="capitalize">{product.status}</span>
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditForm(product)}
                              title="Edit product"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDelete(product.id)}
                              disabled={deletingId === product.id}
                              title="Delete product"
                            >
                              {deletingId === product.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredProducts.length === 0 && (
                <div className="p-12 text-center">
                  <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No products found
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery || selectedCategory !== 'All Categories' || selectedStatus !== 'all'
                      ? 'Try adjusting your filters to find products.'
                      : 'Start by adding your first product to the marketplace.'}
                  </p>
                  {!searchQuery && selectedCategory === 'All Categories' && selectedStatus === 'all' && (
                    <Button onClick={openAddForm}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Product
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h2>
              <Button variant="ghost" size="icon" onClick={closeForm}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-center space-x-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Product Name *</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. Organic Tomatoes"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData((d) => ({ ...d, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Describe your product..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price (₹) *</label>
                  <input
                    required
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.price || ''}
                    onChange={(e) =>
                      setFormData((d) => ({ ...d, price: parseFloat(e.target.value) || 0 }))
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Original Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.originalPrice || ''}
                    onChange={(e) =>
                      setFormData((d) => ({
                        ...d,
                        originalPrice: parseFloat(e.target.value) || undefined,
                      }))
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category *</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData((d) => ({ ...d, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.filter((c) => c !== 'All Categories').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unit *</label>
                  <input
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData((d) => ({ ...d, unit: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="kg, litre, piece..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Stock Quantity *</label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={formData.stockQuantity || ''}
                    onChange={(e) =>
                      setFormData((d) => ({
                        ...d,
                        stockQuantity: parseInt(e.target.value, 10) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Min Order Qty *</label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={formData.minOrderQty || ''}
                    onChange={(e) =>
                      setFormData((d) => ({
                        ...d,
                        minOrderQty: parseInt(e.target.value, 10) || 1,
                      }))
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData((d) => ({
                      ...d,
                      status: e.target.value as CreateProductPayload['status'],
                    }))
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <Button type="button" variant="outline" onClick={closeForm} disabled={formLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : editingProduct ? (
                    'Save Changes'
                  ) : (
                    'Add Product'
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
