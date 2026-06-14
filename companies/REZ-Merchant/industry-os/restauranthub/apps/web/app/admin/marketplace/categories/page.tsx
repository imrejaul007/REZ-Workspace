'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Tag,
  Package,
  Store,
  TrendingUp,
  Eye,
  EyeOff,
  Save,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api/client';

interface Category {
  id: string;
  name: string;
  description: string;
  type: 'vendor' | 'product' | 'service';
  isActive: boolean;
  productCount: number;
  vendorCount: number;
  createdAt: string;
  icon?: string;
  color?: string;
}

export default function CategoryManagementPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await apiClient.get('/marketplace/categories');
        const data = response.data;
        const list: Category[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.categories)
          ? data.categories
          : [];
        setCategories(list);
      } catch {
        // silently handle — show empty state
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'vendor' | 'product' | 'service'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'product' as const,
    icon: '',
    color: 'blue'
  });

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || category.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCategory) {
      // Update existing category
      setCategories(prev => prev.map(cat => 
        cat.id === editingCategory.id 
          ? {
              ...cat,
              ...formData,
              updatedAt: new Date().toISOString()
            }
          : cat
      ));
      toast({
        title: "Category Updated",
        description: `${formData.name} has been updated successfully.`,
      });
    } else {
      // Create new category
      const newCategory: Category = {
        id: Date.now().toString(),
        ...formData,
        isActive: true,
        productCount: 0,
        vendorCount: 0,
        createdAt: new Date().toISOString().split('T')[0] || new Date().toISOString()
      };
      setCategories(prev => [newCategory, ...prev]);
      toast({
        title: "Category Created",
        description: `${formData.name} has been created successfully.`,
      });
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'product',
      icon: '',
      color: 'blue'
    });
    setEditingCategory(null);
    setShowForm(false);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      type: category.type as "product",
      icon: category.icon || '',
      color: category.color || 'blue'
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    const category = categories.find(c => c.id === id);
    if (category && (category.productCount > 0 || category.vendorCount > 0)) {
      toast({
        title: "Cannot Delete",
        description: "This category has associated products or vendors. Please reassign them first.",
        variant: "error"
      });
      return;
    }
    
    setCategories(prev => prev.filter(cat => cat.id !== id));
    toast({
      title: "Category Deleted",
      description: "The category has been deleted successfully.",
    });
  };

  const handleToggleActive = (id: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === id 
        ? { ...cat, isActive: !cat.isActive }
        : cat
    ));
    
    const category = categories.find(c => c.id === id);
    toast({
      title: category?.isActive ? "Category Deactivated" : "Category Activated",
      description: `${category?.name} has been ${category?.isActive ? 'deactivated' : 'activated'}.`,
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vendor': return 'bg-blue-100 text-blue-800';
      case 'product': return 'bg-green-100 text-green-800';
      case 'service': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'vendor': return Store;
      case 'product': return Package;
      case 'service': return Tag;
      default: return Tag;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
          <p className="mt-2 text-gray-600">
            Manage marketplace categories for products, vendors, and services
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(true)} 
          className="mt-4 sm:mt-0"
          size="lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Categories</CardTitle>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Categories</CardTitle>
            <div className="text-2xl font-bold text-green-600">
              {categories.filter(c => c.isActive).length}
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Products</CardTitle>
            <div className="text-2xl font-bold">
              {categories.reduce((sum, cat) => sum + cat.productCount, 0)}
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Vendors</CardTitle>
            <div className="text-2xl font-bold">
              {categories.reduce((sum, cat) => sum + cat.vendorCount, 0)}
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {['all', 'vendor', 'product', 'service'].map((type) => (
                <Button
                  key={type}
                  variant={selectedType === type ? 'default' : 'outline'}
                  
                  onClick={() => setSelectedType(type as unknown)}
                  className="capitalize"
                >
                  {type === 'all' ? 'All' : type}s
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Categories Grid */}
      {loadingCategories ? (
        <div className="flex items-center justify-center py-16 text-gray-500 text-sm">
          Loading categories...
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-gray-500 text-sm">
          {searchTerm || selectedType !== 'all' ? 'No categories match your filters.' : 'No categories found.'}
        </div>
      ) : null}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!loadingCategories && filteredCategories.map((category) => {
          const TypeIcon = getTypeIcon(category.type);
          
          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{category.icon || '📁'}</div>
                      <div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getTypeColor(category.type)}>
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {category.type}
                          </Badge>
                          <div className="flex items-center">
                            {category.isActive ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {category.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Products:</span>
                      <span className="font-medium">{category.productCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Vendors:</span>
                      <span className="font-medium">{category.vendorCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Created:</span>
                      <span className="font-medium">{category.createdAt}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={category.isActive}
                        onCheckedChange={() => handleToggleActive(category.id)}
                      />
                      <span className="text-sm text-gray-600">
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        
                        onClick={() => handleEdit(category)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        
                        onClick={() => handleDelete(category.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Add/Edit Category Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h2>
                <Button variant="ghost"  onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter category name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter category description"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as unknown }))}
                    required
                  >
                    <option value="product">Product</option>
                    <option value="vendor">Vendor</option>
                    <option value="service">Service</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Icon (Emoji)</label>
                  <Input
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="🏷️"
                    maxLength={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Color Theme</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  >
                    <option value="blue">Blue</option>
                    <option value="green">Green</option>
                    <option value="purple">Purple</option>
                    <option value="orange">Orange</option>
                    <option value="red">Red</option>
                    <option value="cyan">Cyan</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button type="submit" className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    {editingCategory ? 'Update Category' : 'Create Category'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}