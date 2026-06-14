'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { businessApi, analyticsApi, industryApi } from '@/lib/api';
import { ModuleType, ModuleInfo } from '@/types';
import ModuleToggle from '@/components/ModuleToggle';
import Dashboard from '@/components/Dashboard';
import { clsx } from 'clsx';
import {
  Store,
  ChevronLeft,
  Settings,
  BarChart3,
  Grid3X3,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Globe,
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';

type TabType = 'overview' | 'modules' | 'analytics';

export default function BusinessDetailPage() {
  const params = useParams();
  const businessId = params.id as string;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');

  const { data: business, isLoading, error } = useQuery({
    queryKey: ['business', businessId],
    queryFn: () => businessApi.getBusinessById(businessId)
  });

  const { data: modulesResponse } = useQuery({
    queryKey: ['business-modules', businessId],
    queryFn: () => businessApi.getBusinessModules(businessId),
    enabled: activeTab === 'modules'
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics', businessId, analyticsPeriod],
    queryFn: () => analyticsApi.getBusinessAnalytics(businessId, analyticsPeriod),
    enabled: activeTab === 'analytics' && !!business
  });

  const { data: industryModules } = useQuery({
    queryKey: ['industry-modules', business?.industry],
    queryFn: () => industryApi.getModulesForIndustry(business!.industry),
    enabled: activeTab === 'modules' && !!business?.industry
  });

  const enableModuleMutation = useMutation({
    mutationFn: (moduleId: ModuleType) => businessApi.enableModule(businessId, moduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', businessId] });
      queryClient.invalidateQueries({ queryKey: ['business-modules', businessId] });
    }
  });

  const disableModuleMutation = useMutation({
    mutationFn: (moduleId: ModuleType) => businessApi.disableModule(businessId, moduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', businessId] });
      queryClient.invalidateQueries({ queryKey: ['business-modules', businessId] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => businessApi.deleteBusiness(businessId),
    onSuccess: () => {
      window.location.href = '/business';
    }
  });

  const handleModuleToggle = async (moduleId: ModuleType, enabled: boolean) => {
    if (enabled) {
      await enableModuleMutation.mutateAsync(moduleId);
    } else {
      await disableModuleMutation.mutateAsync(moduleId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Business not found</h2>
          <p className="text-gray-500 mb-6">The business you're looking for doesn't exist.</p>
          <a
            href="/business"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Businesses
          </a>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Grid3X3 },
    { id: 'modules' as const, label: 'Modules', icon: Grid3X3 },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 }
  ];

  const enabledModules = new Set(modulesResponse?.enabled || business.modules);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <a
                href="/business"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </a>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-2xl">
                  {business.industry === 'restaurant' && '🍽️'}
                  {business.industry === 'hotel' && '🏨'}
                  {business.industry === 'salon' && '💇'}
                  {business.industry === 'retail' && '🛍️'}
                  {business.industry === 'gym' && '🏋️'}
                  {!['restaurant', 'hotel', 'salon', 'retail', 'gym'].includes(business.industry) && '📦'}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{business.name}</h1>
                  <p className="text-sm text-gray-500 capitalize">
                    {business.industry.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <Edit className="w-4 h-4" />
                Edit
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Business Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {business.location?.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Address</p>
                        <p className="text-sm text-gray-600">
                          {business.location.address}
                          {business.location.city && `, ${business.location.city}`}
                          {business.location.state && `, ${business.location.state}`}
                          {business.location.country && `, ${business.location.country}`}
                        </p>
                      </div>
                    </div>
                  )}
                  {business.contact?.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Phone</p>
                        <p className="text-sm text-gray-600">{business.contact.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {business.contact?.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Email</p>
                        <p className="text-sm text-gray-600">{business.contact.email}</p>
                      </div>
                    </div>
                  )}
                  {business.contact?.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Website</p>
                        <p className="text-sm text-gray-600">{business.contact.website}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: business.currency || 'INR',
                    minimumFractionDigits: 0
                  }).format(business.stats.totalRevenue)}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {business.stats.totalOrders.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-sm text-gray-500 mb-1">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {business.stats.totalCustomers.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <p className="text-sm text-gray-500 mb-1">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900">
                  {business.stats.totalStaff}
                </p>
              </div>
            </div>

            {/* Enabled Modules Preview */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Enabled Modules</h2>
                <button
                  onClick={() => setActiveTab('modules')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Manage Modules
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {business.modules.map((module) => (
                  <span
                    key={module}
                    className="px-3 py-1.5 bg-primary-50 text-primary-700 text-sm rounded-full capitalize"
                  >
                    {module.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modules Tab */}
        {activeTab === 'modules' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Module Management
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Enable or disable modules for your {business.industry.replace('_', ' ')} business.
                Modules help you customize NexTaBizz for your specific needs.
              </p>

              {industryModules && modulesResponse ? (
                <div className="space-y-3">
                  {industryModules.map((module) => (
                    <ModuleToggle
                      key={module.id}
                      module={module}
                      isEnabled={enabledModules.has(module.id)}
                      isAvailable={modulesResponse.available.includes(module.id)}
                      onToggle={handleModuleToggle}
                      loading={
                        enableModuleMutation.isPending ||
                        disableModuleMutation.isPending
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto" />
                  <p className="text-gray-500 mt-2">Loading modules...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <Dashboard
            analytics={analytics || null}
            business={business}
            period={analyticsPeriod}
            onPeriodChange={setAnalyticsPeriod}
          />
        )}
      </main>
    </div>
  );
}
