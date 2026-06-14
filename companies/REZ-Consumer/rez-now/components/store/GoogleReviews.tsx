'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { getStoreReviews, type StoreReviews, type GoogleReview } from '@/lib/api/reviews';
import { logger } from '@/lib/utils/logger';

// ── Star helpers ──────────────────────────────────────────────────────────────

interface StarProps {
  fill: 'full' | 'half' | 'empty';
}

function Star({ fill }: StarProps) {
  const id = `half-${crypto.randomUUID().replace(/-/g, '').slice(0, 5)}`;
  if (fill === 'full') {
    return (
      <svg viewBox="0 0 20 20" className="w-4 h-4 text-yellow-400" fill="currentColor" aria-hidden="true">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.16c.969 0 1.371 1.24.588 1.81l-3.366 2.445a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.366-2.445a1 1 0 00-1.175 0L6.04 17.022c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.057 9.384c-.783-.57-.38-1.81.588-1.81h4.16a1 1 0 00.95-.69L9.049 2.927z" />
      </svg>
    );
  }
  if (fill === 'empty') {
    return (
      <svg viewBox="0 0 20 20" className="w-4 h-4 text-gray-300" fill="currentColor" aria-hidden="true">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.16c.969 0 1.371 1.24.588 1.81l-3.366 2.445a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.366-2.445a1 1 0 00-1.175 0L6.04 17.022c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.057 9.384c-.783-.57-.38-1.81.588-1.81h4.16a1 1 0 00.95-.69L9.049 2.927z" />
      </svg>
    );
  }
  // half star via SVG clip
  return (
    <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor" aria-hidden="true">
      <defs>
        <clipPath id={id}>
          <rect x="0" y="0" width="10" height="20" />
        </clipPath>
      </defs>
      <path className="text-gray-300" fill="currentColor" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.16c.969 0 1.371 1.24.588 1.81l-3.366 2.445a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.366-2.445a1 1 0 00-1.175 0L6.04 17.022c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.057 9.384c-.783-.57-.38-1.81.588-1.81h4.16a1 1 0 00.95-.69L9.049 2.927z" />
      <path className="text-yellow-400" fill="currentColor" clipPath={`url(#${id})`} d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.16c.969 0 1.371 1.24.588 1.81l-3.366 2.445a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.366-2.445a1 1 0 00-1.175 0L6.04 17.022c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.057 9.384c-.783-.57-.38-1.81.588-1.81h4.16a1 1 0 00.95-.69L9.049 2.927z" />
    </svg>
  );
}

function StarRow({ rating, label }: { rating: number; label: string }) {
  const stars: Array<'full' | 'half' | 'empty'> = Array.from({ length: 5 }, (_, i) => {
    if (rating >= i + 1) return 'full';
    if (rating >= i + 0.5) return 'half';
    return 'empty';
  });

  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={label}>
      {stars.map((fill, i) => (
        <Star key={i} fill={fill} />
      ))}
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ src, name }: { src?: string; name: string }) {
  const [imgError, setImgError] = useState(false);
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  if (src && !imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        onError={() => setImgError(true)}
        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold flex-shrink-0"
      aria-hidden="true"
    >
      {initials || '?'}
    </div>
  );
}

// ── Relative time ─────────────────────────────────────────────────────────────

function relativeTime(unixSeconds: number): string {
  const diff = Math.floor(Date.now() / 1000) - unixSeconds;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86_400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 7 * 86_400) return `${Math.floor(diff / 86_400)}d ago`;
  if (diff < 30 * 86_400) return `${Math.floor(diff / (7 * 86_400))} weeks ago`;
  if (diff < 365 * 86_400) return `${Math.floor(diff / (30 * 86_400))} months ago`;
  return `${Math.floor(diff / (365 * 86_400))} years ago`;
}

// ── Review card ───────────────────────────────────────────────────────────────

const TRUNCATE_AT = 120;

function ReviewCard({ review }: { review: GoogleReview }) {
  const t = useTranslations('reviews');
  const [expanded, setExpanded] = useState(false);

  const needsTruncation = review.text.length > TRUNCATE_AT;
  const displayText =
    needsTruncation && !expanded ? review.text.slice(0, TRUNCATE_AT).trimEnd() + '…' : review.text;

  return (
    <li className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-start gap-3">
        <Avatar src={review.profilePhoto} name={review.author} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900 truncate">{review.author}</p>
            <span className="text-[11px] text-gray-400 flex-shrink-0">{relativeTime(review.time)}</span>
          </div>
          <StarRow
            rating={review.rating}
            label={`${review.rating} out of 5 stars`}
          />
        </div>
      </div>

      {review.text && (
        <div className="mt-2">
          <p className="text-sm text-gray-700 leading-relaxed">{displayText}</p>
          {needsTruncation && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-indigo-600 font-medium mt-1 hover:underline"
            >
              {expanded ? t('readLess') : t('readMore')}
            </button>
          )}
        </div>
      )}
    </li>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────

interface GoogleReviewsProps {
  storeSlug: string;
}

export default function GoogleReviews({ storeSlug }: GoogleReviewsProps) {
  const t = useTranslations('reviews');
  const [data, setData] = useState<StoreReviews | null>(null);

  useEffect(() => {
    getStoreReviews(storeSlug)
      .then(setData)
      .catch((err) => {
        logger.error('Failed to load Google reviews', { error: err });
        setData({ reviews: [], rating: 0, totalRatings: 0, status: 'error' });
      });
  }, [storeSlug]);

  // Not yet loaded, no reviews, or fetch error
  if (!data || data.reviews.length === 0) {
    if (data?.status === 'error') {
      return (
        <section className="px-4 py-5 mt-2" aria-label={t('title')}>
          <p className="text-sm text-red-500 text-center py-4">
            {t('failedToLoad', { defaultMessage: 'Failed to load reviews.' })}
          </p>
        </section>
      );
    }
    return null;
  }

  const displayedReviews = data.reviews.slice(0, 3);

  return (
    <section className="px-4 py-5 mt-2" aria-label={t('title')}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-gray-900">{t('title')}</h2>
        {data.rating !== null && (
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-bold text-gray-900">{data.rating.toFixed(1)}</span>
            <StarRow
              rating={data.rating}
              label={`Overall rating: ${data.rating} out of 5`}
            />
          </div>
        )}
      </div>

      {data.totalRatings > 0 && (
        <p className="text-xs text-gray-500 mb-4">
          {t('basedOn', { count: data.totalRatings })}
        </p>
      )}

      <ul role="list" className="space-y-3">
        {displayedReviews.map((review, i) => (
          <ReviewCard key={i} review={review} />
        ))}
      </ul>
    </section>
  );
}
