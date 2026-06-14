'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import {
  BuildingStorefrontIcon,
  MagnifyingGlassIcon,
  StarIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface Restaurant {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  cuisine: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED';
  verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  rating: number;
  reviewCount: number;
  totalOrders: number;
  totalRevenue: number;
  registrationDate: string;
  lastOrderDate?: string;
  isVerified: boolean;
  documents: {
    gst: boolean;
    fssai: boolean;
    pan: boolean;
    businessLicense: boolean;
  };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const restaurantsPerPage = 10;

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getAuthToken();
        const params = new URLSearchParams();
        if (searchTerm) params.set('search', searchTerm);
        if (statusFilter) params.set('status', statusFilter);
        if (verificationFilter) params.set('verificationStatus', verificationFilter);
        params.set('page', String(currentPage));
        params.set('limit', String(restaurantsPerPage));

        const res = await fetch(`${API_BASE}/admin/restaurants?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.ok) {
          const data = await res.json();
          setRestaurants(Array.isArray(data) ? data : data.restaurants || []);
        } else if (res.status === 404 || res.status === 403) {
          setRestaurants([]);
        } else {
          setError('Failed to load restaurants. Please try again.');
        }
      } catch {
        setRestaurants([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [searchTerm, statusFilter, verificationFilter, currentPage]);

  const handleAction = async (action: 'approve' | 'reject' | 'suspend', restaurantId: string) => {
    try {
      const token = getAuthToken();
      const statusMap = {
        approve: { status: 'ACTIVE', verificationStatus: 'VERIFIED' },
        reject: { verificationStatus: 'REJECTED' },
        suspend: { status: 'SUSPENDED' },
      };
      const res = await fetch(`${API_BASE}/admin/restaurants/${restaurantId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(statusMap[action]),
      });
      if (res.ok) {
        setRestaurants(prev =>
          prev.map(r => {
            if (r.id !== restaurantId) return r;
            if (action === 'approve') return { ...r, status: 'ACTIVE' as const, verificationStatus: 'VERIFIED' as const };
            if (action === 'reject') return { ...r, verificationStatus: 'REJECTED' as const };
            if (action === 'suspend') return { ...r, status: 'SUSPENDED' as const };
            return r;
          })
        );
      }
    } catch {
      // silently fail
    }
  };

  const stats = {
    total: restaurants.length,
    active: restaurants.filter(r => r.status === 'ACTIVE').length,
    pending: restaurants.filter(r => r.status === 'PENDING_APPROVAL').length,
    suspended: restaurants.filter(r => r.status === 'SUSPENDED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Restaurant Management</h1>
          <p className="text-gray-600 mt-1">Manage restaurant registrations and verifications</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BuildingStorefrontIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Restaurants</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XMarkIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Suspended</p>
              <p className="text-2xl font-bold text-gray-900">{stats.suspended}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search restaurants by name, owner, email, or city..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            <select
              value={verificationFilter}
              onChange={(e) => { setVerificationFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="">All Verification</option>
              <option value="VERIFIED">Verified</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Restaurants Table */}
      <Card>
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-500">Loading restaurants...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <ExclamationTriangleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Could not load restaurants</h3>
            <p className="text-gray-500">{error}</p>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-16">
            <BuildingStorefrontIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No restaurants found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter || verificationFilter
                ? 'Try adjusting your search or filters.'
                : 'No restaurants have registered on the platform yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restaurant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner & Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {restaurants.map((restaurant) => (
                  <tr key={restaurant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <BuildingStorefrontIcon className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            {restaurant.name}
                            {restaurant.isVerified && <CheckIcon className="w-4 h-4 text-blue-500 ml-1" />}
                          </div>
                          <div className="text-xs text-gray-500">
                            Registered: {format(new Date(restaurant.registrationDate), 'MMM dd, yyyy')}
                          </div>
                          {restaurant.rating > 0 && (
                            <div className="flex items-center text-xs text-gray-500">
                              <StarIcon className="w-3 h-3 text-yellow-500 mr-1" />
                              {restaurant.rating} ({restaurant.reviewCount})
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{restaurant.ownerName}</div>
                      <div className="text-xs text-gray-500">{restaurant.email}</div>
                      <div className="text-xs text-gray-500">{restaurant.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        {restaurant.address.city}, {restaurant.address.state}
                      </div>
                      <div className="text-xs mt-1">
                        {restaurant.cuisine.slice(0, 2).join(', ')}
                        {restaurant.cuisine.length > 2 && ` +${restaurant.cuisine.length - 2} more`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          restaurant.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                          restaurant.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                          restaurant.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {restaurant.status.replace('_', ' ')}
                        </span>
                        <br />
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          restaurant.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                          restaurant.verificationStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {restaurant.verificationStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{restaurant.totalOrders} orders</div>
                      <div>₹{restaurant.totalRevenue.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-col space-y-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/admin/restaurants/${restaurant.id}`}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                        {restaurant.status === 'PENDING_APPROVAL' && (
                          <div className="flex space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAction('approve', restaurant.id)}
                              className="text-green-600 border-green-300 hover:bg-green-50"
                            >
                              <CheckIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAction('reject', restaurant.id)}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        {restaurant.status === 'ACTIVE' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction('suspend', restaurant.id)}
                            className="text-red-600 border-red-300 hover:bg-red-50 text-xs"
                          >
                            Suspend
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
