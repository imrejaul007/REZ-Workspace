'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CatalogItem, StaffMember } from '@/lib/types';
import { cn } from '@/lib/utils/cn';
import Button from '@/components/ui/Button';

interface ServiceCardProps {
  item: CatalogItem;
  onBookService: (item: CatalogItem, staff?: StaffMember) => void;
  onViewDetails?: (item: CatalogItem) => void;
  className?: string;
}

export default function ServiceCard({ item, onBookService, onViewDetails, className }: ServiceCardProps) {
  const [imageError, setImageError] = useState(false);
  const topStaff = item.staff?.sort((a, b) => b.rating - a.rating)[0];
  const hasDiscount = item.mrp && item.basePrice < item.mrp;
  const savings = hasDiscount ? item.mrp! - item.basePrice : 0;

  return (
    <article
      className={cn(
        'bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-indigo-100 transition-all',
        !item.isAvailable && 'opacity-70',
        className
      )}
      aria-label={item.name}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-50">
        {item.images.length > 0 && !imageError ? (
          <Image
            src={item.images[0]}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {item.tags.includes('popular') && (
            <span className="px-2 py-0.5 bg-amber-400 text-amber-900 text-xs font-bold rounded-full">
              Popular
            </span>
          )}
          {item.tags.includes('new') && (
            <span className="px-2 py-0.5 bg-indigo-500 text-white text-xs font-bold rounded-full">
              New
            </span>
          )}
          {item.tags.includes('bestseller') && (
            <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
              Best Seller
            </span>
          )}
        </div>

        {/* Unavailable overlay */}
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <span className="bg-white px-3 py-1 rounded-full text-sm font-semibold text-gray-700">
              Currently Unavailable
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Name and description */}
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{item.name}</h3>
          {item.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
          )}
        </div>

        {/* Price row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg font-bold text-gray-900">{item.formattedPrice}</span>
          {hasDiscount && (
            <>
              <span className="text-sm text-gray-400 line-through">{item.formattedMrp}</span>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                Save {((savings / item.mrp!) * 100).toFixed(0)}%
              </span>
            </>
          )}
          {item.durationMinutes && (
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full ml-auto">
              {item.durationMinutes} min
            </span>
          )}
        </div>

        {/* Deposit warning */}
        {item.bookingRequiresDeposit && item.depositAmount && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Deposit: ₹{(item.depositAmount / 100).toFixed(0)} required</span>
          </div>
        )}

        {/* Top staff */}
        {topStaff && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Top rated:</span>
            <span className="font-medium text-gray-900">{topStaff.name}</span>
            <span className="text-yellow-500">★ {topStaff.rating.toFixed(1)}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {item.staff && item.staff.length > 1 && (
            <select
              className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-2 text-gray-700"
              onChange={(e) => {
                const staff = item.staff?.find((s) => s.id === e.target.value);
                onBookService(item, staff);
              }}
            >
              <option value="">Any available</option>
              {item.staff?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ★{s.rating.toFixed(1)}
                </option>
              ))}
            </select>
          )}
          <Button
            size="sm"
            onClick={() => onBookService(item)}
            className="flex-1"
            disabled={!item.isAvailable}
          >
            Book Now
          </Button>
        </div>

        {/* View Details */}
        {onViewDetails && (
          <button
            type="button"
            onClick={() => onViewDetails(item)}
            className="w-full text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            View Details
          </button>
        )}
      </div>
    </article>
  );
}
