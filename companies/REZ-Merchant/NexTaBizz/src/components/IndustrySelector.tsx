'use client';

import { useQuery } from '@tanstack/react-query';
import { industryApi } from '@/lib/api';
import { IndustryWithModules } from '@/types';
import { clsx } from 'clsx';

interface IndustrySelectorProps {
  onSelect: (industry: IndustryWithModules) => void;
  selectedIndustry?: string;
  className?: string;
}

export default function IndustrySelector({
  onSelect,
  selectedIndustry,
  className
}: IndustrySelectorProps) {
  const { data: industries, isLoading } = useQuery({
    queryKey: ['industries'],
    queryFn: industryApi.getAllIndustries
  });

  if (isLoading) {
    return (
      <div className={clsx('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4', className)}>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse bg-gray-200 rounded-xl h-32"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={clsx('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4', className)}>
      {industries?.map((industry) => (
        <button
          key={industry.type}
          onClick={() => onSelect(industry)}
          className={clsx(
            'p-4 rounded-xl border-2 transition-all duration-200 text-left',
            'hover:shadow-lg hover:scale-105 active:scale-95',
            selectedIndustry === industry.type
              ? 'border-primary-500 bg-primary-50 shadow-md'
              : 'border-gray-200 bg-white hover:border-primary-300'
          )}
          style={{ borderLeftColor: industry.color, borderLeftWidth: '4px' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{industry.icon}</span>
            <h3 className="font-semibold text-gray-900">{industry.name}</h3>
          </div>
          <p className="text-sm text-gray-500 line-clamp-2">
            {industry.description}
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
            <span>{industry.modules.length} modules</span>
          </div>
        </button>
      ))}
    </div>
  );
}
