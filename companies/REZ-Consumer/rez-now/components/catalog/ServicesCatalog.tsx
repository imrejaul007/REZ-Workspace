'use client';

import { useState, useEffect, useCallback } from 'react';
import { StoreInfo, CatalogItem } from '@/lib/types';
import { getCatalog } from '@/lib/api/catalog';
import ServiceCard from './ServiceCard';
import ServiceDetail from './ServiceDetail';
import ServicePackages, { type ServicePackage } from './ServicePackages';
import { cn } from '@/lib/utils/cn';
import Spinner from '@/components/ui/Spinner';
import { logger } from '@/lib/utils/logger';

interface ServicesCatalogProps {
  store: StoreInfo;
}

export default function ServicesCatalog({ store }: ServicesCatalogProps) {
  const [services, setServices] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<CatalogItem | null>(null);
  const [activeTab, setActiveTab] = useState<'services' | 'packages'>('services');

  // Mock packages for demo (would come from backend in real implementation)
  const packages = [
    {
      id: 'pkg-1',
      name: 'Complete Makeover',
      description: 'Full hair and makeup package',
      includedServices: services.slice(0, 2).map(s => s.id),
      totalValue: services.slice(0, 2).reduce((sum, s) => sum + s.basePrice, 0),
      packagePrice: services.slice(0, 2).reduce((sum, s) => sum + s.basePrice, 0) * 0.8,
      formattedPrice: '₹2,400',
      formattedTotalValue: '₹3,000',
      savings: 600,
      formattedSavings: '₹600',
      durationMinutes: 120,
      isPopular: true,
      services: services.slice(0, 2),
    },
  ];

  useEffect(() => {
    async function loadCatalog() {
      setLoading(true);
      setError(null);
      try {
        const items = await getCatalog(store.slug);
        setServices(items.filter((item) => item.type === 'service'));
      } catch (err) {
        setError('Failed to load services. Please try again.');
        logger.error('Error loading catalog:', { error: err });
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, [store.slug]);

  const handleBookService = useCallback((item: CatalogItem) => {
    setSelectedService(item);
    // In a full implementation, this would open the AppointmentBooking component
    logger.info('Book service', { serviceName: item.name });
  }, []);

  const handleViewDetails = useCallback((item: CatalogItem) => {
    setSelectedService(item);
  }, []);

  const handlePackageSelect = useCallback((pkg: ServicePackage) => {
    logger.info('Selected package', { packageName: pkg.name });
    // In a full implementation, this would open the AppointmentBooking with package services
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4">
        <div className="flex gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={cn(
              'py-4 text-sm font-semibold border-b-2 transition-colors',
              activeTab === 'services'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            Services
          </button>
          {packages.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('packages')}
              className={cn(
                'py-4 text-sm font-semibold border-b-2 transition-colors',
                activeTab === 'packages'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              Packages
            </button>
          )}
        </div>
      </div>

      {/* Services Grid */}
      {activeTab === 'services' && (
        <div className="p-4">
          {services.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <p className="text-gray-500">No services available at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  item={service}
                  onBookService={handleBookService}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Packages */}
      {activeTab === 'packages' && packages.length > 0 && (
        <ServicePackages
          packages={packages}
          availableServices={services}
          onSelectPackage={handlePackageSelect}
        />
      )}

      {/* Service Detail Modal */}
      <ServiceDetail
        service={selectedService || services[0]}
        open={!!selectedService}
        onClose={() => setSelectedService(null)}
        onBookNow={handleBookService}
      />
    </div>
  );
}
