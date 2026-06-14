'use client';

import React, { useState } from 'react';
import { 
  PlusIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  TagIcon,
  TruckIcon,
  ClockIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChatBubbleLeftRightIcon,
  StarIcon
} from '@heroicons/react/24/outline';

interface Product {
  id: string;
  title: string;
  description: string;
  category: 'surplus_inventory' | 'signature_products' | 'catering_services' | 'used_equipment';
  subcategory: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  unit: string;
  images: string[];
  status: 'active' | 'paused' | 'sold' | 'draft';
  condition?: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  specifications?: { [key: string]: string };
  tags: string[];
  createdAt: string;
  views: number;
  inquiries: number;
  sales: number;
  revenue: number;
  gstApplicable: boolean;
  negotiable: boolean;
  pickupAvailable: boolean;
  deliveryAvailable: boolean;
  deliveryCharge?: number;
  minOrderQuantity?: number;
}

interface SalesAnalytics {
  totalRevenue: number;
  totalSales: number;
  totalViews: number;
  totalInquiries: number;
  topSellingProduct: string;
  monthlyGrowth: number;
}

const RestaurantSellingPage = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'analytics' | 'orders' | 'inquiries'>('products');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [products] = useState<Product[]>([
    {
      id: '1',
      title: 'Premium Basmati Rice - Surplus Stock',
      description: 'High-quality aged basmati rice, perfect for biryani and pulao. Excess inventory from bulk purchase.',
      category: 'surplus_inventory',
      subcategory: 'Raw Materials',
      price: 45,
      originalPrice: 52,
      quantity: 500,
      unit: 'kg',
      images: ['/api/placeholder/300/200', '/api/placeholder/300/200'],
      status: 'active',
      specifications: {
        'Origin': 'Punjab, India',
        'Grain Length': '6-7mm',
        'Aging': '2 years',
        'Packing': '25kg bags'
      },
      tags: ['basmati', 'rice', 'bulk', 'premium'],
      createdAt: '2024-03-10',
      views: 245,
      inquiries: 12,
      sales: 8,
      revenue: 18000,
      gstApplicable: true,
      negotiable: true,
      pickupAvailable: true,
      deliveryAvailable: true,
      deliveryCharge: 500,
      minOrderQuantity: 50
    },
    {
      id: '2',
      title: 'Signature Butter Chicken Masala Paste',
      description: 'Our restaurant\'s signature butter chicken masala paste. Made with authentic spices and traditional recipe.',
      category: 'signature_products',
      subcategory: 'Ready-to-Cook',
      price: 180,
      quantity: 100,
      unit: 'bottles (500ml)',
      images: ['/api/placeholder/300/200'],
      status: 'active',
      specifications: {
        'Volume': '500ml',
        'Shelf Life': '6 months',
        'Storage': 'Refrigerated',
        'Serves': '4-6 people'
      },
      tags: ['masala', 'butter chicken', 'signature', 'authentic'],
      createdAt: '2024-03-08',
      views: 189,
      inquiries: 8,
      sales: 15,
      revenue: 2700,
      gstApplicable: true,
      negotiable: false,
      pickupAvailable: true,
      deliveryAvailable: true,
      deliveryCharge: 100
    },
    {
      id: '3',
      title: 'Used Commercial Tandoor Oven',
      description: 'Well-maintained commercial tandoor oven. Used for 2 years, excellent condition. Selling due to kitchen upgrade.',
      category: 'used_equipment',
      subcategory: 'Kitchen Equipment',
      price: 45000,
      originalPrice: 85000,
      quantity: 1,
      unit: 'piece',
      images: ['/api/placeholder/300/200', '/api/placeholder/300/200', '/api/placeholder/300/200'],
      status: 'active',
      condition: 'good',
      specifications: {
        'Capacity': '15-20 naan/rotis',
        'Fuel Type': 'Gas',
        'Material': 'Clay lined with steel',
        'Dimensions': '4ft x 3ft x 5ft',
        'Age': '2 years'
      },
      tags: ['tandoor', 'commercial', 'gas', 'kitchen equipment'],
      createdAt: '2024-03-05',
      views: 156,
      inquiries: 23,
      sales: 0,
      revenue: 0,
      gstApplicable: true,
      negotiable: true,
      pickupAvailable: true,
      deliveryAvailable: false
    },
    {
      id: '4',
      title: 'Corporate Catering Services',
      description: 'Professional catering services for corporate events, parties, and functions. Specializing in Indian cuisine.',
      category: 'catering_services',
      subcategory: 'Event Catering',
      price: 250,
      quantity: 999,
      unit: 'per person',
      images: ['/api/placeholder/300/200', '/api/placeholder/300/200'],
      status: 'active',
      specifications: {
        'Minimum Order': '20 people',
        'Advance Notice': '48 hours',
        'Service Area': 'Bangalore',
        'Cuisine': 'Indian, Chinese, Continental'
      },
      tags: ['catering', 'corporate', 'events', 'indian cuisine'],
      createdAt: '2024-03-12',
      views: 324,
      inquiries: 18,
      sales: 5,
      revenue: 31250,
      gstApplicable: true,
      negotiable: true,
      pickupAvailable: false,
      deliveryAvailable: true
    }
  ]);

  const [analytics] = useState<SalesAnalytics>({
    totalRevenue: 52950,
    totalSales: 28,
    totalViews: 914,
    totalInquiries: 61,
    topSellingProduct: 'Signature Butter Chicken Masala Paste',
    monthlyGrowth: 15.8
  });

  const categoryOptions = [
    { value: 'surplus_inventory', label: 'Surplus Inventory', color: 'bg-blue-100 text-blue-800' },
    { value: 'signature_products', label: 'Signature Products', color: 'bg-purple-100 text-purple-800' },
    { value: 'catering_services', label: 'Catering Services', color: 'bg-green-100 text-green-800' },
    { value: 'used_equipment', label: 'Used Equipment', color: 'bg-orange-100 text-orange-800' }
  ];

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      sold: 'bg-gray-100 text-gray-800',
      draft: 'bg-gray-100 text-gray-600'
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  const getCategoryBadge = (category: string) => {
    const categoryData = categoryOptions.find(opt => opt.value === category);
    return categoryData?.color || 'bg-gray-100 text-gray-800';
  };

  const getConditionColor = (condition: string) => {
    const colors = {
      new: 'text-green-600',
      like_new: 'text-blue-600',
      good: 'text-yellow-600',
      fair: 'text-orange-600',
      poor: 'text-red-600'
    };
    return colors[condition as keyof typeof colors] || 'text-gray-600';
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleEditProduct = (id: string) => {
    logger.info('Editing product:', id);
  };

  const handleDeleteProduct = (id: string) => {
    logger.info('Deleting product:', id);
  };

  const handleToggleStatus = (id: string) => {
    logger.info('Toggling status for product:', id);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (selectedProduct) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setSelectedProduct(null)}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{selectedProduct.title}</h1>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedProduct.status)}`}>
            {selectedProduct.status}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Images */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Product Images</h3>
              <div className="grid grid-cols-2 gap-4">
                {selectedProduct.images.map((image, index) => (
                  <img 
                    key={index}
                    src={image} 
                    alt={`Product ${index + 1}`}
                    className="w-full h-48 rounded-lg object-cover border border-gray-200"
                  />
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
              <p className="text-gray-700">{selectedProduct.description}</p>
              
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.tags.map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {selectedProduct.specifications && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(selectedProduct.specifications).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-sm font-medium text-gray-500">{key}</dt>
                      <dd className="mt-1 text-sm text-gray-900">{value}</dd>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing & Availability</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Price</span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-green-600">₹{selectedProduct.price}</span>
                    <span className="text-sm text-gray-500">/{selectedProduct.unit}</span>
                    {selectedProduct.originalPrice && (
                      <div className="text-sm text-gray-500 line-through">₹{selectedProduct.originalPrice}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Available Quantity</span>
                  <span className="text-sm font-medium text-gray-900">{selectedProduct.quantity} {selectedProduct.unit}</span>
                </div>
                {selectedProduct.minOrderQuantity && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Minimum Order</span>
                    <span className="text-sm font-medium text-gray-900">{selectedProduct.minOrderQuantity} {selectedProduct.unit}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Category</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryBadge(selectedProduct.category)}`}>
                    {categoryOptions.find(c => c.value === selectedProduct.category)?.label}
                  </span>
                </div>
                {selectedProduct.condition && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Condition</span>
                    <span className={`text-sm font-medium capitalize ${getConditionColor(selectedProduct.condition)}`}>
                      {selectedProduct.condition.replace('_', ' ')}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center space-x-4 text-sm">
                  {selectedProduct.negotiable && (
                    <span className="text-blue-600">💬 Negotiable</span>
                  )}
                  {selectedProduct.gstApplicable && (
                    <span className="text-green-600">📄 GST Applicable</span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Options</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pickup Available</span>
                  <span className={`text-sm font-medium ${selectedProduct.pickupAvailable ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedProduct.pickupAvailable ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Delivery Available</span>
                  <span className={`text-sm font-medium ${selectedProduct.deliveryAvailable ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedProduct.deliveryAvailable ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
                {selectedProduct.deliveryCharge && selectedProduct.deliveryAvailable && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Delivery Charge</span>
                    <span className="text-sm font-medium text-gray-900">₹{selectedProduct.deliveryCharge}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Views</span>
                  <span className="text-sm font-medium text-gray-900">{selectedProduct.views}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Inquiries</span>
                  <span className="text-sm font-medium text-gray-900">{selectedProduct.inquiries}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Sales</span>
                  <span className="text-sm font-medium text-gray-900">{selectedProduct.sales}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Revenue</span>
                  <span className="text-sm font-medium text-green-600">₹{selectedProduct.revenue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <button 
                onClick={() => handleEditProduct(selectedProduct.id)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Edit Product
              </button>
              <button 
                onClick={() => handleToggleStatus(selectedProduct.id)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${
                  selectedProduct.status === 'active' 
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {selectedProduct.status === 'active' ? 'Pause' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">B2B Marketplace - Selling</h1>
          <p className="mt-1 text-sm text-gray-500">
            List and manage your products, surplus inventory, and services for other businesses
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <PlusIcon className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{analytics.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingBagIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalSales}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <EyeIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalViews}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inquiries</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalInquiries}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'products', label: 'My Products', count: products.length },
            { key: 'analytics', label: 'Sales Analytics', count: 0 },
            { key: 'orders', label: 'Orders', count: 5 },
            { key: 'inquiries', label: 'Inquiries', count: analytics.totalInquiries }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'products' && (
        <>
          {/* Search and Filters */}
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="sold">Sold</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="relative">
                  <img 
                    src={product.images[0]} 
                    alt={product.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(product.status)}`}>
                      {product.status}
                    </span>
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryBadge(product.category)}`}>
                      {categoryOptions.find(c => c.value === product.category)?.label}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-green-600">₹{product.price}</span>
                      <span className="text-sm text-gray-500">/{product.unit}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-400 line-through">₹{product.originalPrice}</span>
                      )}
                    </div>
                    {product.negotiable && (
                      <span className="text-xs text-blue-600 font-medium">Negotiable</span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mb-3">
                    <div className="flex items-center">
                      <EyeIcon className="w-3 h-3 mr-1" />
                      {product.views}
                    </div>
                    <div className="flex items-center">
                      <ChatBubbleLeftRightIcon className="w-3 h-3 mr-1" />
                      {product.inquiries}
                    </div>
                    <div className="flex items-center">
                      <ShoppingBagIcon className="w-3 h-3 mr-1" />
                      {product.sales}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleViewProduct(product)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium"
                    >
                      View Details
                    </button>
                    <button 
                      onClick={() => handleEditProduct(product.id)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(product.id)}
                      className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search terms or filters.
              </p>
            </div>
          )}
        </>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Monthly Growth</span>
                  <div className="flex items-center space-x-1">
                    <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-semibold text-green-600">{analytics.monthlyGrowth}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Conversion Rate</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {((analytics.totalSales / analytics.totalViews) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg. Order Value</span>
                  <span className="text-sm font-semibold text-gray-900">
                    ₹{Math.round(analytics.totalRevenue / analytics.totalSales)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Category Performance</h3>
              <div className="space-y-3">
                {categoryOptions.map(category => {
                  const categoryProducts = products.filter(p => p.category === category.value);
                  const categoryRevenue = categoryProducts.reduce((sum, p) => sum + p.revenue, 0);
                  
                  return (
                    <div key={category.value} className="flex items-center justify-between">
                      <span className="text-sm text-gray-900">{category.label}</span>
                      <span className="text-sm font-medium text-gray-900">₹{categoryRevenue.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Product</h3>
              <div className="space-y-2">
                <p className="font-medium text-gray-900">{analytics.topSellingProduct}</p>
                <div className="flex items-center space-x-2">
                  <StarIcon className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">
                    {products.find(p => p.title === analytics.topSellingProduct)?.sales} sales
                  </span>
                </div>
                <p className="text-sm text-green-600 font-medium">
                  ₹{products.find(p => p.title === analytics.topSellingProduct)?.revenue.toLocaleString()} revenue
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h3>
          <div className="text-center py-8 text-gray-500">
            <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2">Order management interface will be displayed here</p>
          </div>
        </div>
      )}

      {activeTab === 'inquiries' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Product Inquiries</h3>
          <div className="text-center py-8 text-gray-500">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2">Customer inquiries and messages will be displayed here</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantSellingPage;