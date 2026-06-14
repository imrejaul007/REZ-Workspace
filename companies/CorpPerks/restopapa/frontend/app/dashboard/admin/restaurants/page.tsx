'use client';

import React, { useState } from 'react';
import { 
  BuildingStorefrontIcon,
  UsersIcon,
  ChartBarIcon,
  CreditCardIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  StarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  EyeIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Cog6ToothIcon,
  BanknotesIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface Restaurant {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  cuisine: string[];
  rating: number;
  totalReviews: number;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  verificationStatus: 'verified' | 'pending' | 'rejected';
  subscriptionPlan: 'basic' | 'premium' | 'enterprise';
  subscriptionStatus: 'active' | 'expired' | 'cancelled';
  monthlyRevenue: number;
  totalOrders: number;
  employeeCount: number;
  joinedDate: string;
  lastActive: string;
  documents: {
    fssai: boolean;
    gst: boolean;
    businessLicense: boolean;
  };
  performance: {
    orderFulfillment: number;
    customerSatisfaction: number;
    averageDeliveryTime: number;
  };
}

const RestaurantsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSubscription, setFilterSubscription] = useState<string>('all');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  const [restaurants] = useState<Restaurant[]>([
    {
      id: '1',
      name: 'Spice Garden Indian Restaurant',
      ownerName: 'Rajesh Kumar',
      email: 'rajesh@spicegarden.com',
      phone: '+91-9876543210',
      address: 'MG Road, Bangalore, Karnataka 560001',
      cuisine: ['Indian', 'North Indian', 'South Indian'],
      rating: 4.5,
      totalReviews: 1240,
      status: 'active',
      verificationStatus: 'verified',
      subscriptionPlan: 'premium',
      subscriptionStatus: 'active',
      monthlyRevenue: 125000,
      totalOrders: 450,
      employeeCount: 12,
      joinedDate: '2024-01-15',
      lastActive: '2 hours ago',
      documents: { fssai: true, gst: true, businessLicense: true },
      performance: { orderFulfillment: 98, customerSatisfaction: 94, averageDeliveryTime: 28 }
    },
    {
      id: '2',
      name: 'Pizza Corner',
      ownerName: 'Marco Rossi',
      email: 'marco@pizzacorner.com',
      phone: '+91-9876543211',
      address: 'Koramangala, Bangalore, Karnataka 560034',
      cuisine: ['Italian', 'Pizza', 'Fast Food'],
      rating: 4.2,
      totalReviews: 890,
      status: 'active',
      verificationStatus: 'verified',
      subscriptionPlan: 'basic',
      subscriptionStatus: 'active',
      monthlyRevenue: 85000,
      totalOrders: 320,
      employeeCount: 8,
      joinedDate: '2024-02-01',
      lastActive: '1 day ago',
      documents: { fssai: true, gst: false, businessLicense: true },
      performance: { orderFulfillment: 92, customerSatisfaction: 88, averageDeliveryTime: 35 }
    },
    {
      id: '3',
      name: 'Green Leaf Cafe',
      ownerName: 'Priya Sharma',
      email: 'priya@greenleaf.com',
      phone: '+91-9876543212',
      address: 'Whitefield, Bangalore, Karnataka 560066',
      cuisine: ['Healthy', 'Vegan', 'Organic'],
      rating: 4.7,
      totalReviews: 450,
      status: 'pending',
      verificationStatus: 'pending',
      subscriptionPlan: 'basic',
      subscriptionStatus: 'active',
      monthlyRevenue: 35000,
      totalOrders: 150,
      employeeCount: 4,
      joinedDate: '2024-03-10',
      lastActive: '3 hours ago',
      documents: { fssai: false, gst: false, businessLicense: true },
      performance: { orderFulfillment: 85, customerSatisfaction: 92, averageDeliveryTime: 25 }
    },
    {
      id: '4',
      name: 'Biryani Palace',
      ownerName: 'Ahmed Ali',
      email: 'ahmed@biryanipalace.com',
      phone: '+91-9876543213',
      address: 'HSR Layout, Bangalore, Karnataka 560102',
      cuisine: ['Biryani', 'Hyderabadi', 'Mughlai'],
      rating: 4.3,
      totalReviews: 2100,
      status: 'suspended',
      verificationStatus: 'verified',
      subscriptionPlan: 'enterprise',
      subscriptionStatus: 'active',
      monthlyRevenue: 0,
      totalOrders: 0,
      employeeCount: 15,
      joinedDate: '2023-12-01',
      lastActive: '1 week ago',
      documents: { fssai: true, gst: true, businessLicense: true },
      performance: { orderFulfillment: 75, customerSatisfaction: 82, averageDeliveryTime: 45 }
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

  const getSubscriptionBadge = (plan: string) => {
    const badges = {
      basic: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-indigo-100 text-indigo-800'
    };
    return badges[plan as keyof typeof badges] || badges.basic;
  };

  const handleViewDetails = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
  };

  const handleApprove = (id: string) => {
    logger.info('Approving restaurant:', id);
  };

  const handleSuspend = (id: string) => {
    logger.info('Suspending restaurant:', id);
  };

  const handleEdit = (id: string) => {
    logger.info('Editing restaurant:', id);
  };

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || restaurant.status === filterStatus;
    const matchesSubscription = filterSubscription === 'all' || restaurant.subscriptionPlan === filterSubscription;
    
    return matchesSearch && matchesStatus && matchesSubscription;
  });

  if (selectedRestaurant) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setSelectedRestaurant(null)}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{selectedRestaurant.name}</h1>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedRestaurant.status)}`}>
            {selectedRestaurant.status}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <UsersIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Owner:</span>
                <span className="text-sm text-gray-900">{selectedRestaurant.ownerName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900">{selectedRestaurant.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <PhoneIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900">{selectedRestaurant.phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPinIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900">{selectedRestaurant.address}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Joined:</span>
                <span className="text-sm text-gray-900">{new Date(selectedRestaurant.joinedDate).toLocaleDateString()}</span>
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
                  <span className="text-gray-900">{selectedRestaurant.performance.orderFulfillment}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${selectedRestaurant.performance.orderFulfillment}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Customer Satisfaction</span>
                  <span className="text-gray-900">{selectedRestaurant.performance.customerSatisfaction}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${selectedRestaurant.performance.customerSatisfaction}%` }}
                  ></div>
                </div>
              </div>
              <div className="pt-2">
                <div className="text-sm text-gray-600">Avg. Delivery Time</div>
                <div className="text-2xl font-bold text-gray-900">{selectedRestaurant.performance.averageDeliveryTime} min</div>
              </div>
            </div>
          </div>

          {/* Revenue & Stats */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Business Stats</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Monthly Revenue</div>
                <div className="text-2xl font-bold text-green-600">₹{selectedRestaurant.monthlyRevenue.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Orders (This Month)</div>
                <div className="text-xl font-semibold text-gray-900">{selectedRestaurant.totalOrders}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Employee Count</div>
                <div className="text-xl font-semibold text-gray-900">{selectedRestaurant.employeeCount}</div>
              </div>
              <div className="flex items-center space-x-2">
                <StarIcon className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-lg font-semibold">{selectedRestaurant.rating}</span>
                <span className="text-sm text-gray-600">({selectedRestaurant.totalReviews} reviews)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Documents & Verification */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Documents & Verification</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">FSSAI License</span>
                {selectedRestaurant.documents.fssai ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                ) : (
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">GST Certificate</span>
                {selectedRestaurant.documents.gst ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                ) : (
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Business License</span>
                {selectedRestaurant.documents.businessLicense ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                ) : (
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Verification Status</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getVerificationBadge(selectedRestaurant.verificationStatus)}`}>
                  {selectedRestaurant.verificationStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Details</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Plan</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getSubscriptionBadge(selectedRestaurant.subscriptionPlan)}`}>
                  {selectedRestaurant.subscriptionPlan}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedRestaurant.subscriptionStatus)}`}>
                  {selectedRestaurant.subscriptionStatus}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Active</span>
                <span className="text-sm text-gray-900">{selectedRestaurant.lastActive}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t space-y-2">
              {selectedRestaurant.status === 'pending' && (
                <button 
                  onClick={() => handleApprove(selectedRestaurant.id)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                  Approve Restaurant
                </button>
              )}
              {selectedRestaurant.status === 'active' && (
                <button 
                  onClick={() => handleSuspend(selectedRestaurant.id)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                >
                  Suspend Restaurant
                </button>
              )}
              <button 
                onClick={() => handleEdit(selectedRestaurant.id)}
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
          <h1 className="text-2xl font-bold text-gray-900">Restaurant Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage restaurant partnerships, verifications, and performance
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <BuildingStorefrontIcon className="w-4 h-4" />
            <span>Add Restaurant</span>
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
              <p className="text-sm font-medium text-gray-600">Total Restaurants</p>
              <p className="text-2xl font-bold text-gray-900">{restaurants.length}</p>
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
              <p className="text-2xl font-bold text-gray-900">{restaurants.filter(r => r.status === 'active').length}</p>
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
              <p className="text-2xl font-bold text-gray-900">{restaurants.filter(r => r.status === 'pending').length}</p>
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
              <p className="text-2xl font-bold text-gray-900">₹{restaurants.reduce((sum, r) => sum + r.monthlyRevenue, 0).toLocaleString()}</p>
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
            placeholder="Search restaurants..."
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
          value={filterSubscription}
          onChange={(e) => setFilterSubscription(e.target.value)}
        >
          <option value="all">All Plans</option>
          <option value="basic">Basic</option>
          <option value="premium">Premium</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {/* Restaurants Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Restaurant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRestaurants.map((restaurant) => (
                <tr key={restaurant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{restaurant.name}</div>
                      <div className="text-sm text-gray-500">{restaurant.cuisine.join(', ')}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{restaurant.ownerName}</div>
                      <div className="text-sm text-gray-500">{restaurant.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(restaurant.status)}`}>
                      {restaurant.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getSubscriptionBadge(restaurant.subscriptionPlan)}`}>
                      {restaurant.subscriptionPlan}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{restaurant.monthlyRevenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <StarIcon className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                      <span className="text-sm text-gray-900">{restaurant.rating}</span>
                      <span className="text-sm text-gray-500 ml-1">({restaurant.totalReviews})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button 
                      onClick={() => handleViewDetails(restaurant)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleEdit(restaurant.id)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-900">
                      <Cog6ToothIcon className="w-4 h-4" />
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

export default RestaurantsPage;