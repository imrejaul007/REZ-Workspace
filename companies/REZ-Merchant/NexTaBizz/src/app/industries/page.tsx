'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { industryApi } from '@/lib/api';
import { IndustryWithModules, IndustryType } from '@/types';
import { clsx } from 'clsx';
import {
  Store,
  ChevronLeft,
  Check,
  ArrowRight,
  Sparkles,
  Settings,
  Users,
  ShoppingCart,
  Filter
} from 'lucide-react';

export default function IndustriesPage() {
  const searchParams = useSearchParams();
  const selectedParam = searchParams.get('selected');
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryWithModules | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const { data: industries, isLoading } = useQuery({
    queryKey: ['industries'],
    queryFn: industryApi.getAllIndustries
  });

  // Auto-select industry from URL param
  useState(() => {
    if (selectedParam && industries) {
      const industry = industries.find((i) => i.type === selectedParam);
      if (industry) setSelectedIndustry(industry);
    }
  });

  const filteredIndustries = industries?.filter((industry) => {
    if (filterCategory === 'all') return true;
    const hasCategory = industry.modules.some((m) => m.category === filterCategory);
    return hasCategory;
  });

  const categories = [
    { id: 'all', label: 'All Industries' },
    { id: 'core', label: 'Core', icon: Sparkles },
    { id: 'operations', label: 'Operations', icon: Settings },
    { id: 'customer', label: 'Customer', icon: Users },
    { id: 'management', label: 'Management', icon: ShoppingCart }
  ];

  const handleSelectIndustry = (industry: IndustryWithModules) => {
    setSelectedIndustry(industry);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </a>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Industries</h1>
                  <p className="text-sm text-gray-500">
                    Choose your industry to get started
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filter */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setFilterCategory(category.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                filterCategory === category.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              )}
            >
              {category.icon && <category.icon className="w-4 h-4" />}
              {category.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Industry List */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-white rounded-xl h-32" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {filteredIndustries?.map((industry) => (
                  <button
                    key={industry.type}
                    onClick={() => handleSelectIndustry(industry)}
                    className={clsx(
                      'p-6 rounded-xl border-2 transition-all duration-200 text-left',
                      selectedIndustry?.type === industry.type
                        ? 'border-primary-500 bg-primary-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-md'
                    )}
                    style={{ borderLeftColor: industry.color, borderLeftWidth: '4px' }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{industry.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{industry.name}</h3>
                        <p className="text-xs text-gray-500">
                          {industry.modules.length} modules
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {industry.description}
                    </p>
                    {selectedIndustry?.type === industry.type && (
                      <div className="mt-3 flex items-center gap-1 text-primary-600">
                        <Check className="w-4 h-4" />
                        <span className="text-sm font-medium">Selected</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Industry Details */}
          <div className="lg:col-span-1">
            {selectedIndustry ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-4xl">{selectedIndustry.icon}</span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedIndustry.name}
                    </h2>
                    <p className="text-sm text-gray-500">{selectedIndustry.description}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Included Modules
                  </h3>
                  <div className="space-y-2">
                    {selectedIndustry.modules.map((module) => (
                      <div
                        key={module.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="text-xl">{module.icon}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {module.name}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {module.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Features
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedIndustry.features).map(([key, value]) => (
                      <div
                        key={key}
                        className={clsx(
                          'flex items-center gap-2 p-2 rounded-lg text-xs',
                          value ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'
                        )}
                      >
                        {value ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <span className="w-3 h-3">-</span>
                        )}
                        <span className="capitalize">
                          {key.replace(/has/g, '')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <a
                  href={`/business/new?industry=${selectedIndustry.type}`}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  Create {selectedIndustry.name} Business
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center sticky top-24">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Store className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select an Industry
                </h3>
                <p className="text-sm text-gray-500">
                  Choose an industry from the list to see its details and available modules.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
