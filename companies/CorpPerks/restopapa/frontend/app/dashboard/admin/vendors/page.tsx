'use client';

import React, { useState } from 'react';
import { 
  BuildingStorefrontIcon,
  ShoppingBagIcon,
  StarIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  BanknotesIcon,
  CreditCardIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  TagIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface Vendor {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  businessType: 'food_supplier' | 'equipment_supplier' | 'packaging' | 'cleaning' | 'other';
  category: string[];
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  verificationStatus: 'verified' | 'pending' | 'rejected';
  rating: number;
  totalReviews: number;
  totalProducts: number;
  totalOrders: number;
  monthlyRevenue: number;
  commissionRate: number;
  paymentTerms: string;
  deliveryAreas: string[];
  joinedDate: string;
  lastActive: string;
  documents: {
    gst: boolean;
    fssai: boolean;
    businessLicense: boolean;
    bankDetails: boolean;
  };
  performance: {
    orderFulfillment: number;
    onTimeDelivery: number;
    qualityRating: number;
    responseTime: number;
  };
  products: {
    featured: number;
    active: number;
    outOfStock: number;
  };
}

const VendorsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const [vendors] = useState<Vendor[]>([
    {
      id: '1',
      businessName: 'Fresh Farm Supplies',
      ownerName: 'Ravi Patel',
      email: 'ravi@freshfarm.com',
      phone: '+91-9876543210',
      address: 'Whitefield, Bangalore, Karnataka 560066',
      businessType: 'food_supplier',
      category: ['Vegetables', 'Fruits', 'Dairy', 'Grains'],
      status: 'active',
      verificationStatus: 'verified',
      rating: 4.6,
      totalReviews: 89,
      totalProducts: 250,
      totalOrders: 1240,
      monthlyRevenue: 450000,
      commissionRate: 8.5,
      paymentTerms: 'Net 15',
      deliveryAreas: ['Bangalore', 'Chennai', 'Hyderabad'],
      joinedDate: '2024-01-10',
      lastActive: '1 hour ago',
      documents: { gst: true, fssai: true, businessLicense: true, bankDetails: true },
      performance: { orderFulfillment: 96, onTimeDelivery: 92, qualityRating: 94, responseTime: 2.3 },
      products: { featured: 12, active: 235, outOfStock: 15 }
    },
    {
      id: '2',
      businessName: 'Kitchen Pro Equipment',
      ownerName: 'Sunita Kumar',
      email: 'sunita@kitchenpro.com',
      phone: '+91-9876543211',
      address: 'HSR Layout, Bangalore, Karnataka 560102',
      businessType: 'equipment_supplier',
      category: ['Kitchen Equipment', 'Utensils', 'Appliances'],
      status: 'active',
      verificationStatus: 'verified',
      rating: 4.4,
      totalReviews: 156,
      totalProducts: 85,
      totalOrders: 340,
      monthlyRevenue: 320000,
      commissionRate: 12.0,
      paymentTerms: 'Net 30',
      deliveryAreas: ['Bangalore', 'Mysore'],
      joinedDate: '2023-11-15',
      lastActive: '3 hours ago',
      documents: { gst: true, fssai: false, businessLicense: true, bankDetails: true },
      performance: { orderFulfillment: 89, onTimeDelivery: 85, qualityRating: 91, responseTime: 4.1 },
      products: { featured: 8, active: 78, outOfStock: 7 }
    },
    {
      id: '3',
      businessName: 'Eco Pack Solutions',
      ownerName: 'Ahmed Hassan',
      email: 'ahmed@ecopack.com',
      phone: '+91-9876543212',
      address: 'Electronic City, Bangalore, Karnataka 560100',
      businessType: 'packaging',
      category: ['Food Packaging', 'Eco-friendly', 'Containers'],
      status: 'pending',
      verificationStatus: 'pending',
      rating: 0,
      totalReviews: 0,
      totalProducts: 45,
      totalOrders: 0,
      monthlyRevenue: 0,
      commissionRate: 10.0,
      paymentTerms: 'Net 15',
      deliveryAreas: ['Bangalore'],
      joinedDate: '2024-03-05',
      lastActive: '2 days ago',
      documents: { gst: true, fssai: false, businessLicense: true, bankDetails: false },
      performance: { orderFulfillment: 0, onTimeDelivery: 0, qualityRating: 0, responseTime: 0 },
      products: { featured: 0, active: 45, outOfStock: 0 }
    },
    {
      id: '4',
      businessName: 'Spice Masters Trading',
      ownerName: 'Lakshmi Iyer',
      email: 'lakshmi@spicemasters.com',
      phone: '+91-9876543213',
      address: 'Jayanagar, Bangalore, Karnataka 560041',
      businessType: 'food_supplier',
      category: ['Spices', 'Condiments', 'Herbs'],
      status: 'suspended',
      verificationStatus: 'verified',
      rating: 3.8,
      totalReviews: 67,
      totalProducts: 120,
      totalOrders: 580,
      monthlyRevenue: 0,
      commissionRate: 9.5,
      paymentTerms: 'Net 15',
      deliveryAreas: ['Bangalore', 'Chennai'],
      joinedDate: '2023-08-20',
      lastActive: '1 week ago',
      documents: { gst: true, fssai: true, businessLicense: true, bankDetails: true },
      performance: { orderFulfillment: 75, onTimeDelivery: 68, qualityRating: 72, responseTime: 6.8 },
      products: { featured: 3, active: 0, outOfStock: 120 }
    }
  ]);

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800'
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const getVerificationBadge = (status: string) => {
    const badges = {
      verified: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const getBusinessTypeBadge = (type: string) => {
    const badges = {
      food_supplier: 'bg-green-100 text-green-800',
      equipment_supplier: 'bg-blue-100 text-blue-800',
      packaging: 'bg-purple-100 text-purple-800',
      cleaning: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return badges[type as keyof typeof badges] || badges.other;
  };

  const formatBusinessType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleViewDetails = (vendor: Vendor) => {
    setSelectedVendor(vendor);
  };

  const handleApprove = (id: string) => {
    logger.info('Approving vendor:', id);
  };

  const handleSuspend = (id: string) => {
    logger.info('Suspending vendor:', id);
  };

  const handleEdit = (id: string) => {
    logger.info('Editing vendor:', id);
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.category.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || vendor.status === filterStatus;
    const matchesType = filterType === 'all' || vendor.businessType === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  if (selectedVendor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setSelectedVendor(null)}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{selectedVendor.businessName}</h1>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedVendor.status)}`}>
            {selectedVendor.status}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Business Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Business Information</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <UserIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Owner:</span>
                <span className="text-sm text-gray-900">{selectedVendor.ownerName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900">{selectedVendor.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <PhoneIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900">{selectedVendor.phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPinIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900">{selectedVendor.address}</span>
              </div>
              <div className="flex items-center space-x-2">
                <TagIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Type:</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBusinessTypeBadge(selectedVendor.businessType)}`}>
                  {formatBusinessType(selectedVendor.businessType)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Joined:</span>
                <span className="text-sm text-gray-900">{new Date(selectedVendor.joinedDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Order Fulfillment</span>
                  <span className="text-gray-900">{selectedVendor.performance.orderFulfillment}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${selectedVendor.performance.orderFulfillment}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">On-Time Delivery</span>
                  <span className="text-gray-900">{selectedVendor.performance.onTimeDelivery}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${selectedVendor.performance.onTimeDelivery}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Quality Rating</span>
                  <span className="text-gray-900">{selectedVendor.performance.qualityRating}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${selectedVendor.performance.qualityRating}%` }}
                  ></div>
                </div>
              </div>
              <div className="pt-2">
                <div className="text-sm text-gray-600">Avg. Response Time</div>
                <div className="text-2xl font-bold text-gray-900">{selectedVendor.performance.responseTime}h</div>
              </div>
            </div>
          </div>

          {/* Business Stats */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Business Stats</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Monthly Revenue</div>
                <div className="text-2xl font-bold text-green-600">₹{selectedVendor.monthlyRevenue.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Orders</div>
                <div className="text-xl font-semibold text-gray-900">{selectedVendor.totalOrders}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Products</div>
                <div className="text-xl font-semibold text-gray-900">{selectedVendor.totalProducts}</div>
              </div>
              <div className="flex items-center space-x-2">
                <StarIcon className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-lg font-semibold">{selectedVendor.rating}</span>
                <span className="text-sm text-gray-600">({selectedVendor.totalReviews} reviews)</span>
              </div>
              <div>
                <div className="text-sm text-gray-600">Commission Rate</div>
                <div className="text-lg font-semibold text-purple-600">{selectedVendor.commissionRate}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Categories & Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Categories & Products</h3>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-600 block mb-2">Categories:</span>
                <div className="flex flex-wrap gap-2">
                  {selectedVendor.category.map((cat, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{selectedVendor.products.featured}</div>
                  <div className="text-sm text-gray-600">Featured</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{selectedVendor.products.active}</div>
                  <div className="text-sm text-gray-600">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{selectedVendor.products.outOfStock}</div>
                  <div className="text-sm text-gray-600">Out of Stock</div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Payment Terms</span>
                    <span className="text-gray-900">{selectedVendor.paymentTerms}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Delivery Areas</span>
                    <span className="text-gray-900">{selectedVendor.deliveryAreas.join(', ')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Documents & Actions</h3>
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">GST Certificate</span>
                {selectedVendor.documents.gst ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                ) : (
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">FSSAI License</span>
                {selectedVendor.documents.fssai ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                ) : (
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Business License</span>
                {selectedVendor.documents.businessLicense ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                ) : (
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Bank Details</span>
                {selectedVendor.documents.bankDetails ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                ) : (
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Verification Status</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getVerificationBadge(selectedVendor.verificationStatus)}`}>
                  {selectedVendor.verificationStatus}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Active</span>
                <span className="text-sm text-gray-900">{selectedVendor.lastActive}</span>
              </div>
            </div>
            
            <div className="mt-6 space-y-2">
              {selectedVendor.status === 'pending' && (
                <button 
                  onClick={() => handleApprove(selectedVendor.id)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                  Approve Vendor
                </button>
              )}
              {selectedVendor.status === 'active' && (
                <button 
                  onClick={() => handleSuspend(selectedVendor.id)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                >
                  Suspend Vendor
                </button>
              )}
              <button 
                onClick={() => handleEdit(selectedVendor.id)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Edit Details
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
          <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage vendor partnerships, product listings, and performance tracking
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <BuildingStorefrontIcon className="w-4 h-4" />
            <span>Add Vendor</span>
          </button>
          <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <ChartBarIcon className="w-4 h-4" />
            <span>Analytics</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BuildingStorefrontIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Vendors</p>
              <p className="text-2xl font-bold text-gray-900">{vendors.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{vendors.filter(v => v.status === 'active').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{vendors.filter(v => v.status === 'pending').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BanknotesIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{vendors.reduce((sum, v) => sum + v.monthlyRevenue, 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search vendors..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="food_supplier">Food Supplier</option>
          <option value="equipment_supplier">Equipment Supplier</option>
          <option value="packaging">Packaging</option>
          <option value="cleaning">Cleaning</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{vendor.businessName}</div>
                      <div className="text-sm text-gray-500">{vendor.category.join(', ')}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{vendor.ownerName}</div>
                      <div className="text-sm text-gray-500">{vendor.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(vendor.status)}`}>
                      {vendor.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBusinessTypeBadge(vendor.businessType)}`}>
                      {formatBusinessType(vendor.businessType)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{vendor.monthlyRevenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <StarIcon className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                      <span className="text-sm text-gray-900">{vendor.rating}</span>
                      <span className="text-sm text-gray-500 ml-1">({vendor.totalReviews})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {vendor.totalProducts}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button 
                      onClick={() => handleViewDetails(vendor)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleEdit(vendor.id)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VendorsPage;