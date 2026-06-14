'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import Button from '@/components/ui/Button';

interface Review {
  id: string;
  authorName: string;
  authorAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  service?: string;
}

interface RatingSummary {
  average: number;
  total: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface ReviewsWidgetProps {
  reviews: Review[];
  summary?: RatingSummary;
  storeSlug: string;
  onWriteReview?: () => void;
  className?: string;
}

function StarIcon({ filled, half }: { filled: boolean; half?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('w-4 h-4', filled ? 'text-amber-400 fill-amber-400' : half ? 'text-amber-400' : 'text-gray-300')}
      aria-hidden="true"
    >
      {half ? (
        <>
          <defs>
            <linearGradient id="half-star">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#d1d5db" />
            </linearGradient>
          </defs>
          <path fill="url(#half-star)" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </>
      ) : (
        <path
          fill={filled ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={1.5}
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        />
      )}
    </svg>
  );
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const stars = [];
  const starSize = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

  for (let i = 1; i <= 5; i++) {
    const filled = i <= Math.floor(rating);
    const half = !filled && i === Math.ceil(rating) && rating % 1 >= 0.5;
    stars.push(
      <StarIcon key={i} filled={filled || half} half={half && !filled} />
    );
  }

  return (
    <div className={cn('flex gap-0.5', starSize.includes('w-5') ? 'gap-1' : 'gap-0.5')}>
      {stars}
    </div>
  );
}

function RatingBar({ count, total, label }: { count: number; total: number; label: string }) {
  const percent = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-3 text-right text-gray-600">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <span className="w-8 text-right text-gray-500 text-xs">{count}</span>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const initials = review.authorName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  const formattedDate = new Date(review.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <article className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
          {review.authorAvatar ? (
            <img
              src={review.authorAvatar}
              alt={review.authorName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-sm font-bold text-indigo-600">{initials}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-900 text-sm">{review.authorName}</p>
              {review.service && (
                <p className="text-xs text-gray-500">{review.service}</p>
              )}
            </div>
            <time className="text-xs text-gray-400 flex-shrink-0" dateTime={review.date}>
              {formattedDate}
            </time>
          </div>

          <div className="mt-1">
            <StarRating rating={review.rating} />
          </div>

          <p className="mt-2 text-sm text-gray-700 leading-relaxed">{review.comment}</p>
        </div>
      </div>
    </article>
  );
}

export default function ReviewsWidget({
  reviews,
  summary,
  storeSlug,
  onWriteReview,
  className,
}: ReviewsWidgetProps) {
  const [showAll, setShowAll] = useState(false);

  if (reviews.length === 0) {
    return (
      <section className={cn('py-8 px-4', className)} aria-labelledby="reviews-heading">
        <div className="max-w-3xl mx-auto">
          <h2 id="reviews-heading" className="text-xl font-bold text-gray-900 mb-4">
            Reviews
          </h2>
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">No reviews yet</p>
            <p className="text-gray-500 text-sm mt-1">Be the first to share your experience</p>
            {onWriteReview && (
              <Button
                variant="primary"
                size="sm"
                className="mt-4"
                onClick={onWriteReview}
              >
                Write a Review
              </Button>
            )}
          </div>
        </div>
      </section>
    );
  }

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);
  const total = summary?.total ?? reviews.length;

  return (
    <section className={cn('py-8 px-4', className)} aria-labelledby="reviews-heading">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 id="reviews-heading" className="text-xl font-bold text-gray-900">
            Reviews
          </h2>
          {onWriteReview && (
            <Button variant="secondary" size="sm" onClick={onWriteReview}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Write Review
            </Button>
          )}
        </div>

        {/* Rating Summary */}
        {summary && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Average */}
              <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl sm:w-32">
                <p className="text-4xl font-black text-gray-900">{summary.average.toFixed(1)}</p>
                <div className="mt-1">
                  <StarRating rating={summary.average} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{total} reviews</p>
              </div>

              {/* Distribution */}
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => (
                  <RatingBar
                    key={star}
                    label={`${star}`}
                    count={summary.distribution[star as keyof typeof summary.distribution] ?? 0}
                    total={total}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-3">
          {displayedReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>

        {/* Show More */}
        {reviews.length > 3 && (
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show Less' : `Show All ${total} Reviews`}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
