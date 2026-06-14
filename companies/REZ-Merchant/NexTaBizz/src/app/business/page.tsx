'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { businessApi } from '@/lib/api';
import { CreateBusinessData, IndustryType } from '@/types';
import { clsx } from 'clsx';
import {
  Store,
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function BusinessListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState<IndustryType | ''>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create business form state
  const [formData, setFormData] = useState<CreateBusinessData>({
    name: '',
    industry: IndustryType.RESTAURANT,
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    zipCode: '',
    timezone: 'Asia/Kolkata',
    currency: 'INR'
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['businesses', page, search, industryFilter],
    queryFn: () =>
      businessApi.listBusinesses({
        page,
        limit: 12,
        search: search || undefined,
        industry: industryFilter || undefined
      })
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateBusinessData) => businessApi.createBusiness(data),
    onSuccess: (newBusiness) => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      setShowCreateModal(false);
      setFormData({
        name: '',
        industry: IndustryType.RESTAURANT,
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        country: 'India',
        zipCode: '',
        timezone: 'Asia/Kolkata',
        currency: 'INR'
      });
      router.push(`/business/${newBusiness.businessId}`);
    }
  });

  const handleCreateBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const industries = Object.values(IndustryType).map((type) => ({
    value: type,
    label: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <a
                href="/dashboard"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </a>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">My Businesses</h1>
                  <p className="text-sm text-gray-500">{data?.pagination.total || 0} businesses</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Business
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search businesses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Industry Filter */}
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value as IndustryType | '')}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Industries</option>
              {industries.map((ind) => (
                <option key={ind.value} value={ind.value}>
                  {ind.label}
                </option>
              ))}
            </select>

            {/* View Mode */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={clsx(
                  'p-2 rounded-md transition-colors',
                  viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500'
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={clsx(
                  'p-2 rounded-md transition-colors',
                  viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Business List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl h-64" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading businesses</h3>
            <p className="text-gray-500">Please try again later.</p>
          </div>
        ) : data?.data.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {search || industryFilter ? 'No businesses found' : 'No businesses yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {search || industryFilter
                ? 'Try adjusting your search or filters.'
                : 'Get started by creating your first business.'}
            </p>
            {!search && !industryFilter && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Create Business
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={clsx(
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            )}>
              {data?.data.map((business) => (
                <a
                  key={business.businessId}
                  href={`/business/${business.businessId}`}
                  className={clsx(
                    'bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow',
                    viewMode === 'grid' ? '' : 'flex items-center p-4'
                  )}
                >
                  <div className={clsx(
                    'p-4',
                    viewMode === 'grid' ? '' : 'flex items-center gap-4 flex-1'
                  )}>
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                      style={{ backgroundColor: '#f0f0f0' }}
                    >
                      {business.industry === 'restaurant' && '🍽️'}
                      {business.industry === 'hotel' && '🏨'}
                      {business.industry === 'salon' && '💇'}
                      {business.industry === 'retail' && '🛍️'}
                      {business.industry === 'gym' && '🏋️'}
                      {!['restaurant', 'hotel', 'salon', 'retail', 'gym'].includes(business.industry) && '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{business.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">
                        {business.industry.replace('_', ' ')}
                      </p>
                      {business.location?.city && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          <MapPin className="w-3 h-3" />
                          {business.location.city}
                        </div>
                      )}
                    </div>
                  </div>
                  {viewMode === 'grid' && (
                    <div className="px-4 pb-4">
                      <div className="flex flex-wrap gap-1">
                        {business.modules.slice(0, 3).map((module) => (
                          <span
                            key={module}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full capitalize"
                          >
                            {module.replace('_', ' ')}
                          </span>
                        ))}
                        {business.modules.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                            +{business.modules.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </a>
              ))}
            </div>

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!data.pagination.hasPrev}
                  className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600">
                  Page {data.pagination.page} of {data.pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!data.pagination.hasNext}
                  className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Create Business Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Create New Business</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBusiness} className="p-6 space-y-6">
              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter business name"
                />
              </div>

              {/* Industry */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry *
                </label>
                <select
                  required
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value as IndustryType })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {industries.map((ind) => (
                    <option key={ind.value} value={ind.value}>
                      {ind.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="+91-9876543210"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="contact@business.com"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="123 Main Street"
                />
              </div>

              {/* City, State, Country */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Mumbai"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Maharashtra"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="India"
                  />
                </div>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="INR">Indian Rupee (INR)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="GBP">British Pound (GBP)</option>
                </select>
              </div>

              {/* Error Message */}
              {createMutation.isError && (
                <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  <span>{createMutation.error?.message || 'Failed to create business'}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Create Business
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
