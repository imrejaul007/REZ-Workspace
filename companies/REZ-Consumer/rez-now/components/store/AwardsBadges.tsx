'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

type BadgeType = 'award' | 'certification' | 'membership' | 'achievement';

interface Badge {
  id: string;
  name: string;
  description?: string;
  issuer?: string;
  type: BadgeType;
  image?: string;
  icon?: string;
  /** Year the badge was earned/valid */
  year?: number;
  /** Expiration date if applicable */
  expiresAt?: string;
  /** Link for more details */
  url?: string;
}

interface AwardsBadgesProps {
  badges: Badge[];
  /** Layout style */
  layout?: 'grid' | 'row' | 'carousel';
  /** Maximum badges to show (for carousel) */
  maxVisible?: number;
  className?: string;
}

function BadgeIcon({ type }: { type: BadgeType }) {
  switch (type) {
    case 'award':
      return (
        <svg className="w-8 h-8 text-amber-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    case 'certification':
      return (
        <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      );
    case 'membership':
      return (
        <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case 'achievement':
      return (
        <svg className="w-8 h-8 text-purple-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 15l-2-2m0 0l2-2m-2 2h9m-9 0a4 4 0 100-8 4 4 0 000 8zm10.414-8.414L14.828 8l1.414-1.414 1.414 1.414-1.414 1.414z" />
        </svg>
      );
  }
}

function BadgeCard({ badge }: { badge: Badge }) {
  const [imageError, setImageError] = useState(false);
  const isExpired = badge.expiresAt && new Date(badge.expiresAt) < new Date();

  return (
    <div
      className={cn(
        'relative bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow',
        isExpired && 'opacity-60'
      )}
    >
      {/* Badge Image or Icon */}
      <div className="relative w-16 h-16 mb-3">
        {badge.image && !imageError ? (
          <Image
            src={badge.image}
            alt={badge.name}
            fill
            sizes="64px"
            className="object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <BadgeIcon type={badge.type} />
        )}
        {isExpired && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-red-600 bg-white px-1 rounded">Expired</span>
          </div>
        )}
      </div>

      {/* Badge Name */}
      <h4 className="font-semibold text-gray-900 text-sm leading-tight">{badge.name}</h4>

      {/* Issuer */}
      {badge.issuer && (
        <p className="text-xs text-gray-500 mt-0.5">{badge.issuer}</p>
      )}

      {/* Year */}
      {badge.year && (
        <p className="text-xs text-indigo-600 font-medium mt-1">{badge.year}</p>
      )}

      {/* Description */}
      {badge.description && (
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">{badge.description}</p>
      )}

      {/* View Details Link */}
      {badge.url && (
        <a
          href={badge.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          View Details
        </a>
      )}
    </div>
  );
}

function CarouselView({ badges, maxVisible = 4 }: { badges: Badge[]; maxVisible: number }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const visibleBadges = badges.slice(currentIndex, currentIndex + maxVisible);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex + maxVisible < badges.length;

  return (
    <div className="relative">
      <div className="flex gap-4 overflow-hidden">
        {visibleBadges.map((badge) => (
          <div key={badge.id} className="flex-1 min-w-0">
            <BadgeCard badge={badge} />
          </div>
        ))}
      </div>

      {/* Navigation */}
      {badges.length > maxVisible && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={!hasPrev}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
              hasPrev
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-gray-50 text-gray-300 cursor-not-allowed'
            )}
            aria-label="Previous badges"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => Math.min(badges.length - maxVisible, prev + 1))}
            disabled={!hasNext}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
              hasNext
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-gray-50 text-gray-300 cursor-not-allowed'
            )}
            aria-label="Next badges"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default function AwardsBadges({
  badges,
  layout = 'grid',
  maxVisible = 4,
  className,
}: AwardsBadgesProps) {
  if (badges.length === 0) {
    return null;
  }

  return (
    <section className={cn('py-8 px-4', className)} aria-labelledby="awards-heading">
      <div className="max-w-3xl mx-auto">
        <h2 id="awards-heading" className="text-xl font-bold text-gray-900 mb-4">
          Awards & Certifications
        </h2>

        {layout === 'carousel' ? (
          <CarouselView badges={badges} maxVisible={maxVisible} />
        ) : (
          <div className={cn(
            'grid gap-4',
            layout === 'row'
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
              : 'grid-cols-2 sm:grid-cols-3'
          )}>
            {badges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        )}

        {/* Trust indicators */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Verified badges</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Secure verification</span>
          </div>
        </div>
      </div>
    </section>
  );
}
