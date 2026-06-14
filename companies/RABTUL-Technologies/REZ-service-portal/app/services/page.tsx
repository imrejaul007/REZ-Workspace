'use client';

import { useEffect, useState } from 'react';
import { Search, Filter, RefreshCw, Server } from 'lucide-react';
import { apiClient } from '@/lib/api';
import type { Service, ServiceCategory } from '@/lib/types';
import { ServiceCard } from '@/components/ServiceCard';
import { cn, getCategoryLabel } from '@/lib/utils';

const categories: (ServiceCategory | 'all')[] = [
  'all',
  'infrastructure',
  'payments',
  'identity',
  'analytics',
  'commerce',
  'marketing',
  'media',
  'intelligence',
  'support',
];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'healthy' | 'degraded' | 'down'>('all');

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getServices();
      setServices(data);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    const interval = setInterval(fetchServices, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(search.toLowerCase()) ||
      service.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || service.category === selectedCategory;
    const matchesStatus =
      statusFilter === 'all' || service.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const healthyCount = services.filter((s) => s.status === 'healthy').length;
  const degradedCount = services.filter((s) => s.status === 'degraded').length;
  const downCount = services.filter((s) => s.status === 'down').length;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Services</h1>
              <p className="mt-1 text-sm text-slate-400">
                {services.length} services across the REZ ecosystem
              </p>
            </div>
            <button
              onClick={fetchServices}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="p-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-500" />
            <div className="flex gap-1">
              {(['all', 'healthy', 'degraded', 'down'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    statusFilter === status
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                  {status !== 'all' && (
                    <span className="ml-1.5 text-xs text-slate-500">
                      ({status === 'healthy' ? healthyCount : status === 'degraded' ? degradedCount : downCount})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                selectedCategory === category
                  ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                  : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600 hover:text-white'
              )}
            >
              {category === 'all' ? 'All Categories' : getCategoryLabel(category)}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        {loading && services.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 animate-spin text-brand-500" />
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Server className="h-12 w-12 text-slate-600" />
            <h3 className="mt-4 text-lg font-medium text-white">No services found</h3>
            <p className="mt-1 text-sm text-slate-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
