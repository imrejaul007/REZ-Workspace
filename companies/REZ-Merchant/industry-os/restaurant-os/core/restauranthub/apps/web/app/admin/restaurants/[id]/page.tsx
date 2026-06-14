'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../../components/ui/tabs';
import {
  BuildingStorefrontIcon,
  StarIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  EyeIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

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
  documents?: Record<string, { uploaded: boolean; verified: boolean; url?: string }>;
  operatingHours?: Record<string, { open: string; close: string; closed: boolean }>;
  menuItems?: number;
  employees?: number;
  subscriptionPlan?: string;
  analytics?: {
    monthlyRevenue: number;
    monthlyOrders: number;
    avgOrderValue: number;
    customerRetention: number;
    popularItems: string[];
  };
  auditLog?: {
    id: string;
    action: string;
    performedBy: string;
    timestamp: string;
    details: string;
  }[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export default function RestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRestaurant = async () => {
      if (!params.id) return;
      setIsLoading(true);
      setError(null);
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_BASE}/admin/restaurants/${params.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setRestaurant(data);
        } else if (res.status === 404) {
          setError('not_found');
        } else {
          setError('failed');
          toast.error('Failed to load restaurant details');
        }
      } catch {
        setError('failed');
        toast.error('Failed to load restaurant details');
      } finally {
        setIsLoading(false);
      }
    };

    loadRestaurant();
  }, [params.id]);

  const handleStatusChange = async (newStatus: Restaurant['status']) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/admin/restaurants/${params.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setRestaurant(prev => prev ? { ...prev, status: newStatus } : null);
        toast.success(`Restaurant status updated to ${newStatus}`);
      } else {
        toast.error('Failed to update restaurant status');
      }
    } catch {
      toast.error('Failed to update restaurant status');
    }
  };

  const handleVerificationChange = async (newStatus: Restaurant['verificationStatus']) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/admin/restaurants/${params.id}/verification`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ verificationStatus: newStatus }),
      });
      if (res.ok) {
        setRestaurant(prev => prev ? { ...prev, verificationStatus: newStatus } : null);
        toast.success(`Verification status updated to ${newStatus}`);
      } else {
        toast.error('Failed to update verification status');
      }
    } catch {
      toast.error('Failed to update verification status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error === 'not_found' || !restaurant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Restaurant Not Found</h2>
          <p className="text-gray-600 mb-4">The restaurant you are looking for does not exist.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BuildingStorefrontIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
    { id: 'documents', label: 'Documents', icon: DocumentTextIcon },
    { id: 'employees', label: 'Employees', icon: UserGroupIcon },
    { id: 'orders', label: 'Orders', icon: ShoppingBagIcon },
    { id: 'audit', label: 'Audit Log', icon: ClockIcon },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
              {restaurant.isVerified && <CheckCircleIcon className="w-6 h-6 text-blue-500" />}
            </div>
            <p className="text-gray-600">Managed by {restaurant.ownerName}</p>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`inline-flex mt-1 px-2 py-1 text-xs font-medium rounded-full ${
                restaurant.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                restaurant.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                restaurant.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {restaurant.status.replace('_', ' ')}
              </span>
            </div>
            <div className="space-y-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('ACTIVE')}
                className="text-green-600 border-green-300 hover:bg-green-50 text-xs"
                disabled={restaurant.status === 'ACTIVE'}
              >
                Activate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('SUSPENDED')}
                className="text-red-600 border-red-300 hover:bg-red-50 text-xs"
                disabled={restaurant.status === 'SUSPENDED'}
              >
                Suspend
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Verification</p>
              <span className={`inline-flex mt-1 px-2 py-1 text-xs font-medium rounded-full ${
                restaurant.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                restaurant.verificationStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {restaurant.verificationStatus}
              </span>
            </div>
            <div className="space-y-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleVerificationChange('VERIFIED')}
                className="text-green-600 border-green-300 hover:bg-green-50 text-xs"
                disabled={restaurant.verificationStatus === 'VERIFIED'}
              >
                Verify
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleVerificationChange('REJECTED')}
                className="text-red-600 border-red-300 hover:bg-red-50 text-xs"
                disabled={restaurant.verificationStatus === 'REJECTED'}
              >
                Reject
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-xl font-bold text-gray-900">₹{restaurant.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingBagIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-xl font-bold text-gray-900">{restaurant.totalOrders.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="overview" className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Restaurant Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{restaurant.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <PhoneIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{restaurant.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPinIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">
                      {restaurant.address.street}, {restaurant.address.city}, {restaurant.address.state}
                    </span>
                  </div>
                  {restaurant.rating > 0 && (
                    <div className="flex items-center space-x-2">
                      <StarIcon className="w-5 h-5 text-yellow-400" />
                      <span className="text-gray-900">{restaurant.rating} ({restaurant.reviewCount} reviews)</span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-2">Cuisine Types</p>
                  <div className="flex flex-wrap gap-2">
                    {restaurant.cuisine.map((type) => (
                      <span key={type} className="px-2 py-1 text-xs bg-blue-50 text-blue-800 rounded-full border border-blue-100">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
                {restaurant.subscriptionPlan && (
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Subscription Plan</p>
                    <span className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-full">
                      {restaurant.subscriptionPlan}
                    </span>
                  </div>
                )}
              </div>

              {restaurant.operatingHours && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Operating Hours</h3>
                  <div className="space-y-2">
                    {Object.entries(restaurant.operatingHours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between items-center py-1 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-900 capitalize">{day}</span>
                        <span className="text-sm text-gray-600">
                          {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="p-6">
            {restaurant.analytics ? (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Analytics Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="p-4 text-center">
                    <p className="text-sm text-gray-600">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-green-600">₹{restaurant.analytics.monthlyRevenue.toLocaleString()}</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <p className="text-sm text-gray-600">Monthly Orders</p>
                    <p className="text-2xl font-bold text-blue-600">{restaurant.analytics.monthlyOrders}</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <p className="text-sm text-gray-600">Avg Order Value</p>
                    <p className="text-2xl font-bold text-purple-600">₹{restaurant.analytics.avgOrderValue}</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <p className="text-sm text-gray-600">Customer Retention</p>
                    <p className="text-2xl font-bold text-orange-600">{restaurant.analytics.customerRetention}%</p>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Analytics data not yet available via API.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="p-6">
            {restaurant.documents ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Verification Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(restaurant.documents).map(([docType, doc]) => (
                    <Card key={docType} className="p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 capitalize">{docType.replace(/([A-Z])/g, ' $1').trim()}</h4>
                        <div className="flex items-center space-x-2">
                          {doc.uploaded ? (
                            <CheckCircleIcon className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircleIcon className="w-5 h-5 text-red-500" />
                          )}
                          <span className={`px-2 py-1 text-xs rounded-full ${doc.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {doc.verified ? 'Verified' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Document data not yet available via API.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="employees" className="p-6">
            <div className="text-center py-12">
              <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Employee data not yet available via API.</p>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="p-6">
            <div className="text-center py-12">
              <ShoppingBagIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Order history not yet available via API.</p>
            </div>
          </TabsContent>

          <TabsContent value="audit" className="p-6">
            {restaurant.auditLog && restaurant.auditLog.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Audit Log</h3>
                {restaurant.auditLog.map((log) => (
                  <Card key={log.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{log.action}</h4>
                      <span className="text-sm text-gray-500">
                        {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{log.details}</p>
                    <p className="text-xs text-gray-500">Performed by: {log.performedBy}</p>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No audit log entries available.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </motion.div>
  );
}
