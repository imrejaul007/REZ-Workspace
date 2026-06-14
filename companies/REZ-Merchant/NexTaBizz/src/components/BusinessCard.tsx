'use client';

import Link from 'next/link';
import { Business } from '@/types';
import { clsx } from 'clsx';
import {
  Store,
  MapPin,
  Phone,
  Mail,
  TrendingUp,
  Users,
  ShoppingBag,
  MoreVertical,
  Settings,
  BarChart3
} from 'lucide-react';

interface BusinessCardProps {
  business: Business;
  onEdit?: (business: Business) => void;
  onDelete?: (business: Business) => void;
  onViewAnalytics?: (business: Business) => void;
}

export default function BusinessCard({
  business,
  onEdit,
  onDelete,
  onViewAnalytics
}: BusinessCardProps) {
  const industryIcons: Record<string, string> = {
    restaurant: '🍽️',
    hotel: '🏨',
    salon: '💇',
    retail: '🛍️',
    gym: '🏋️',
    spa: '🧘',
    healthcare: '🏥',
    education: '🎓',
    real_estate: '🏠',
    automotive: '🚗',
    grocery: '🛒',
    pharmacy: '💊',
    fashion: '👗',
    fitness: '🧘',
    other: '📦'
  };

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
              style={{ backgroundColor: `${business.industry === 'restaurant' ? '#FF6B6B' : business.industry === 'hotel' ? '#4ECDC4' : '#95E1D3'}20` }}
            >
              {industryIcons[business.industry] || '📦'}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 line-clamp-1">
                {business.name}
              </h3>
              <p className="text-sm text-gray-500 capitalize">
                {business.industry.replace('_', ' ')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onViewAnalytics?.(business)}
              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="View Analytics"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit?.(business)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Location & Contact */}
      <div className="p-4 space-y-2">
        {business.location?.city && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="line-clamp-1">
              {business.location.address && `${business.location.address}, `}
              {business.location.city}
              {business.location.state && `, ${business.location.state}`}
            </span>
          </div>
        )}
        {business.contact?.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="w-4 h-4 text-gray-400" />
            <span>{business.contact.phone}</span>
          </div>
        )}
        {business.contact?.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="line-clamp-1">{business.contact.email}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center gap-1 text-primary-600 mb-1">
              <TrendingUp className="w-3 h-3" />
            </div>
            <p className="text-xs font-medium text-gray-900">
              {formatCurrency(business.stats.totalRevenue, business.currency)}
            </p>
            <p className="text-xs text-gray-400">Revenue</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
              <ShoppingBag className="w-3 h-3" />
            </div>
            <p className="text-xs font-medium text-gray-900">
              {business.stats.totalOrders.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">Orders</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
              <Users className="w-3 h-3" />
            </div>
            <p className="text-xs font-medium text-gray-900">
              {business.stats.totalCustomers.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">Customers</p>
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="px-4 pb-4">
        <div className="flex flex-wrap gap-1">
          {business.modules.slice(0, 4).map((module) => (
            <span
              key={module}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full capitalize"
            >
              {module.replace('_', ' ')}
            </span>
          ))}
          {business.modules.length > 4 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
              +{business.modules.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <Link
          href={`/business/${business.businessId}`}
          className="flex items-center justify-center gap-2 w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          <Store className="w-4 h-4" />
          Manage Business
        </Link>
      </div>
    </div>
  );
}
