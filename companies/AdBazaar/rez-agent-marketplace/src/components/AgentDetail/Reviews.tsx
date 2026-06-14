'use client';

import { Review } from '@/types/agent';
import { Star, ThumbsUp, MessageSquare } from 'lucide-react';

interface ReviewsProps {
  reviews: Review[];
}

export default function Reviews({ reviews }: ReviewsProps) {
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0
      ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100
      : 0,
  }));

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-green-500" />
        Customer Reviews
      </h2>

      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-500">No reviews yet</p>
          <p className="text-sm text-gray-400">Be the first to review this agent</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Rating Summary */}
          <div className="flex flex-col md:flex-row gap-8 pb-6 border-b border-gray-100">
            <div className="text-center md:border-r md:pr-8">
              <p className="text-4xl font-bold text-gray-900">{averageRating.toFixed(1)}</p>
              <div className="flex items-center justify-center gap-0.5 my-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(averageRating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500">{reviews.length} reviews</p>
            </div>

            <div className="flex-1 space-y-2">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 w-6">{rating}</span>
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-8">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Individual Reviews */}
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                      {review.userName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{review.userName}</p>
                      <p className="text-xs text-gray-500">{new Date(review.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 mb-3">{review.comment}</p>
                <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors">
                  <ThumbsUp className="w-4 h-4" />
                  Helpful ({review.helpful})
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
