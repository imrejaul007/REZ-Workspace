'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import Button from '@/components/ui/Button';
import type { CatalogItem } from '@/lib/types';

export interface ServicePackage {
  id: string;
  name: string;
  description?: string;
  /** List of service IDs included in this package */
  includedServices: string[];
  /** Total price of all included services if booked separately */
  totalValue: number;
  /** Package price */
  packagePrice: number;
  /** Formatted price string from the API */
  formattedPrice: string;
  /** Formatted total value string */
  formattedTotalValue: string;
  /** Savings amount in paise */
  savings: number;
  /** Formatted savings string */
  formattedSavings: string;
  /** Duration in minutes */
  durationMinutes?: number;
  /** Whether this is a recommended/popular package */
  isPopular?: boolean;
  /** Badge text */
  badge?: string;
  /** Services detail */
  services?: CatalogItem[];
}

interface ServicePackagesProps {
  packages: ServicePackage[];
  availableServices: CatalogItem[];
  onSelectPackage: (pkg: ServicePackage) => void;
  className?: string;
}

interface PackageCardProps {
  pkg: ServicePackage;
  availableServices: CatalogItem[];
  onSelect: () => void;
  isSelected?: boolean;
}

function PackageCard({ pkg, availableServices, onSelect, isSelected }: PackageCardProps) {
  const savingsPercent = Math.round((pkg.savings / pkg.totalValue) * 100);

  return (
    <article
      className={cn(
        'relative bg-white rounded-2xl border-2 overflow-hidden transition-all',
        isSelected
          ? 'border-indigo-500 shadow-lg'
          : 'border-gray-100 hover:border-indigo-200 hover:shadow-md'
      )}
      aria-label={`${pkg.name} package`}
    >
      {/* Popular Badge */}
      {pkg.isPopular && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center py-1.5 text-sm font-bold">
          {pkg.badge || 'Most Popular'}
        </div>
      )}

      <div className={cn('p-5', pkg.isPopular && 'pt-14')}>
        {/* Package Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{pkg.name}</h3>
            {pkg.description && (
              <p className="text-sm text-gray-500 mt-1">{pkg.description}</p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold text-indigo-600">{pkg.formattedPrice}</p>
            {pkg.savings > 0 && (
              <p className="text-sm text-gray-400 line-through">{pkg.formattedTotalValue}</p>
            )}
          </div>
        </div>

        {/* Savings Banner */}
        {pkg.savings > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-green-800">
                  Save {pkg.formattedSavings} ({savingsPercent}% off)
                </p>
                <p className="text-xs text-green-700">
                  Book separately: {pkg.formattedTotalValue}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Included Services */}
        <div className="space-y-2 mb-4">
          <h4 className="text-sm font-semibold text-gray-700">What&apos;s Included</h4>
          {pkg.services && pkg.services.length > 0 ? (
            <ul className="space-y-1.5">
              {pkg.services.map((service) => (
                <li key={service.id} className="flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">{service.name}</span>
                  <span className="text-gray-400 ml-auto">{service.formattedPrice}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">
              {pkg.includedServices.length} services included
            </p>
          )}
        </div>

        {/* Duration */}
        {pkg.durationMinutes && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Total duration: ~{pkg.durationMinutes} min</span>
          </div>
        )}

        {/* Select Button */}
        <Button
          variant={pkg.isPopular ? 'primary' : 'secondary'}
          fullWidth
          onClick={onSelect}
        >
          Select Package
        </Button>
      </div>
    </article>
  );
}

export default function ServicePackages({
  packages,
  availableServices,
  onSelectPackage,
  className,
}: ServicePackagesProps) {
  // Enrich packages with service details
  const enrichedPackages = useMemo(() => {
    return packages.map((pkg) => ({
      ...pkg,
      services: pkg.includedServices
        .map((id) => availableServices.find((s) => s.id === id))
        .filter(Boolean) as CatalogItem[],
    }));
  }, [packages, availableServices]);

  if (packages.length === 0) {
    return null;
  }

  const popularPackage = enrichedPackages.find((p) => p.isPopular);

  return (
    <section className={cn('py-8 px-4', className)} aria-labelledby="packages-heading">
      <div className="max-w-3xl mx-auto">
        <h2 id="packages-heading" className="text-xl font-bold text-gray-900 mb-2">
          Packages & Combos
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Save more with our curated service packages
        </p>

        {/* Packages Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {enrichedPackages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              availableServices={availableServices}
              onSelect={() => onSelectPackage(pkg)}
            />
          ))}
        </div>

        {/* Savings Summary */}
        {enrichedPackages.length > 1 && (
          <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-indigo-900">Save with Packages</p>
                <p className="text-sm text-indigo-700">
                  Bundling services can save you up to{' '}
                  <span className="font-bold">
                    {Math.max(...enrichedPackages.map((p) => Math.round((p.savings / p.totalValue) * 100)))}%
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Note */}
        {popularPackage && enrichedPackages.length > 1 && (
          <p className="mt-4 text-xs text-gray-500 text-center">
            Not sure which package to choose?{' '}
            <span className="font-medium text-indigo-600">
              {popularPackage.name}
            </span>{' '}
            is our most popular option with the highest savings.
          </p>
        )}
      </div>
    </section>
  );
}
