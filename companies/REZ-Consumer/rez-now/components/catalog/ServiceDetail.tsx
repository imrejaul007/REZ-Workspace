'use client';

import { useState } from 'react';
import Image from 'next/image';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import type { CatalogItem, StaffMember } from '@/lib/types';

interface ServiceDetailProps {
  service: CatalogItem;
  open: boolean;
  onClose: () => void;
  onBookNow: (service: CatalogItem, staff?: StaffMember) => void;
  /** Optional before/after gallery images */
  galleryImages?: { before?: string; after?: string };
}

export default function ServiceDetail({
  service,
  open,
  onClose,
  onBookNow,
  galleryImages,
}: ServiceDetailProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | undefined>();

  const hasDiscount = service.mrp && service.basePrice < service.mrp;
  const savings = hasDiscount ? service.mrp! - service.basePrice : 0;
  const sortedStaff = [...(service.staff ?? [])].sort((a, b) => b.rating - a.rating);

  return (
    <Modal open={open} onClose={onClose} title={service.name} className="max-w-lg">
      <div className="space-y-4">
        {/* Image Gallery */}
        {service.images.length > 0 && (
          <div className="space-y-2">
            {/* Main Image */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
              <Image
                src={service.images[selectedImageIndex]}
                alt={service.name}
                fill
                sizes="(max-width: 768px) 100vw, 512px"
                className="object-cover"
              />
            </div>

            {/* Thumbnails */}
            {service.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {service.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={cn(
                      'relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors',
                      selectedImageIndex === idx ? 'border-indigo-500' : 'border-gray-200'
                    )}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <Image
                      src={img}
                      alt={`${service.name} ${idx + 1}`}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Price and Duration */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-2xl font-bold text-gray-900">{service.formattedPrice}</span>
          {hasDiscount && (
            <>
              <span className="text-lg text-gray-400 line-through">{service.formattedMrp}</span>
              <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                Save {((savings / service.mrp!) * 100).toFixed(0)}%
              </span>
            </>
          )}
          {service.durationMinutes && (
            <span className="ml-auto text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {service.durationMinutes} minutes
            </span>
          )}
        </div>

        {/* Description */}
        {service.description && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-1">Description</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{service.description}</p>
          </div>
        )}

        {/* Tags */}
        {service.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {service.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-full capitalize"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Staff Selection */}
        {sortedStaff.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Choose Stylist</h4>
            <div className="space-y-2">
              {/* Any available option */}
              <label
                className={cn(
                  'flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors',
                  !selectedStaff
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <input
                  type="radio"
                  name="staff"
                  value=""
                  checked={!selectedStaff}
                  onChange={() => setSelectedStaff(undefined)}
                  className="sr-only"
                />
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Any Available</p>
                  <p className="text-xs text-gray-500">First available stylist</p>
                </div>
                {selectedStaff === undefined && (
                  <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </label>

              {sortedStaff.map((staff) => (
                <label
                  key={staff.id}
                  className={cn(
                    'flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors',
                    selectedStaff?.id === staff.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <input
                    type="radio"
                    name="staff"
                    value={staff.id}
                    checked={selectedStaff?.id === staff.id}
                    onChange={() => setSelectedStaff(staff)}
                    className="sr-only"
                  />
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 font-bold">
                    {staff.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{staff.name}</p>
                    <p className="text-xs text-gray-500">Rating: {staff.rating.toFixed(1)} / 5</p>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-medium">{staff.rating.toFixed(1)}</span>
                  </div>
                  {selectedStaff?.id === staff.id && (
                    <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Before/After Gallery */}
        {galleryImages?.before || galleryImages?.after ? (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Results Gallery</h4>
            <div className="grid grid-cols-2 gap-2">
              {galleryImages.before && (
                <div className="relative aspect-square rounded-lg overflow-hidden">
                  <Image
                    src={galleryImages.before}
                    alt="Before"
                    fill
                    sizes="(max-width: 768px) 50vw, 256px"
                    className="object-cover"
                  />
                  <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                    Before
                  </span>
                </div>
              )}
              {galleryImages.after && (
                <div className="relative aspect-square rounded-lg overflow-hidden">
                  <Image
                    src={galleryImages.after}
                    alt="After"
                    fill
                    sizes="(max-width: 768px) 50vw, 256px"
                    className="object-cover"
                  />
                  <span className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                    After
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Deposit Info */}
        {service.bookingRequiresDeposit && service.depositAmount && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">Booking Deposit Required</p>
                <p className="text-sm text-amber-700 mt-0.5">
                  A deposit of ₹{(service.depositAmount / 100).toFixed(0)} is required to secure your appointment.
                  This amount will be deducted from your final bill.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Book Button */}
        <div className="pt-2 border-t border-gray-100">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!service.isAvailable}
            onClick={() => {
              onBookNow(service, selectedStaff);
              onClose();
            }}
          >
            {service.isAvailable ? 'Book Appointment' : 'Currently Unavailable'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
