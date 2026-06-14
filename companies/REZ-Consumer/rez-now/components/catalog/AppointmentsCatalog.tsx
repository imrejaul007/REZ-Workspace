'use client';

import { useState, useEffect, useCallback } from 'react';
import { StoreInfo, CatalogItem, StaffMember } from '@/lib/types';
import { getCatalog, getAppointmentSlots, bookAppointment } from '@/lib/api/catalog';
import ServiceCard from './ServiceCard';
import ServiceDetail from './ServiceDetail';
import AppointmentBooking from './AppointmentBooking';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';
import Spinner from '@/components/ui/Spinner';

interface AppointmentsCatalogProps {
  store: StoreInfo;
}

export default function AppointmentsCatalog({ store }: AppointmentsCatalogProps) {
  const [services, setServices] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<CatalogItem | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | undefined>();
  const [showBooking, setShowBooking] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);

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

  const handleBookService = useCallback((item: CatalogItem, staff?: StaffMember) => {
    setSelectedService(item);
    setSelectedStaff(staff);
    setShowBooking(true);
  }, []);

  const handleViewDetails = useCallback((item: CatalogItem) => {
    setSelectedService(item);
  }, []);

  const handleBookingComplete = useCallback(() => {
    setBookingComplete(true);
    setShowBooking(false);
    setSelectedService(null);
    setSelectedStaff(undefined);
  }, []);

  const handleBookingClose = useCallback(() => {
    setShowBooking(false);
    setSelectedService(null);
    setSelectedStaff(undefined);
  }, []);

  const fetchSlots = useCallback(
    async (storeSlug: string, date: string, serviceId: string) => {
      return getAppointmentSlots(storeSlug, date, serviceId);
    },
    []
  );

  const createBooking = useCallback(
    async (storeSlug: string, payload: Parameters<typeof bookAppointment>[1]) => {
      const result = await bookAppointment(storeSlug, payload);
      return {
        confirmationCode: `APT-${Date.now().toString(36).toUpperCase()}`,
        date: payload.date,
        time: payload.startTime,
        serviceName: selectedService?.name || '',
        staffName: selectedStaff?.name,
      };
    },
    [selectedService, selectedStaff]
  );

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
      {/* Booking Success Banner */}
      {bookingComplete && (
        <div className="bg-green-50 border-b border-green-200 p-4">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-green-800">Booking Confirmed!</p>
              <p className="text-sm text-green-700">You will receive a confirmation SMS shortly.</p>
            </div>
            <button
              type="button"
              onClick={() => setBookingComplete(false)}
              className="text-green-600 hover:text-green-800"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-6 text-white">
        <h1 className="text-xl font-bold mb-1">Book an Appointment</h1>
        <p className="text-indigo-100 text-sm">Select a service to get started</p>
      </div>

      {/* Services Grid */}
      <div className="p-4">
        {services.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500">No appointment services available at the moment</p>
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

      {/* Service Detail Modal */}
      <ServiceDetail
        service={selectedService || services[0]}
        open={!!selectedService && !showBooking}
        onClose={() => setSelectedService(null)}
        onBookNow={handleBookService}
      />

      {/* Appointment Booking Modal */}
      {selectedService && (
        <AppointmentBooking
          open={showBooking}
          onClose={handleBookingClose}
          service={selectedService}
          staff={selectedStaff}
          storeSlug={store.slug}
          onBookingComplete={handleBookingComplete}
          fetchSlots={fetchSlots}
          createBooking={createBooking}
        />
      )}
    </div>
  );
}
