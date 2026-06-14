'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import ReviewSystem from '@/components/reviews/review-system';
import { useAuth } from '@/lib/auth/auth-provider';
import toast from '@/lib/toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

const emptyStats = {
  totalReviews: 0,
  averageRating: 0,
  ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  categoryAverages: { food: 0, service: 0, ambiance: 0, value: 0, cleanliness: 0 },
  verifiedReviews: 0,
  responseRate: 0,
  averageResponseTime: 0,
  recentTrend: 'up' as const,
  topTags: [],
};

export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<unknown[]>([]);
  const [stats, setStats] = useState(emptyStats);
  const [targetInfo, setTargetInfo] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const token = getAuthToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Try to get reviews for the current user's restaurant/profile
        const [reviewsRes, statsRes] = await Promise.allSettled([
          fetch(`${API_BASE}/reviews`, { headers }),
          fetch(`${API_BASE}/reviews/stats`, { headers }),
        ]);

        if (reviewsRes.status === 'fulfilled' && reviewsRes.value.ok) {
          const data = await reviewsRes.value.json();
          setReviews(Array.isArray(data) ? data : data.reviews || []);
        }

        if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
          const data = await statsRes.value.json();
          setStats({ ...emptyStats, ...data });
        }

        // Set target info from user context
        if (user) {
          setTargetInfo({
            id: user.id,
            name: user.profile?.firstName ? `${user.profile.firstName} ${user.profile.lastName}` : 'Your Profile',
            type: user.role || 'restaurant',
          });
        }
      } catch {
        // API not yet available — show empty state
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [user]);

  const handleSubmitReview = async (newReview) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newReview),
      });
      if (res.ok) {
        const created = await res.json();
        setReviews(prev => [created, ...prev]);
        setStats(prev => ({
          ...prev,
          totalReviews: prev.totalReviews + 1,
          averageRating: ((prev.averageRating * prev.totalReviews) + newReview.rating) / (prev.totalReviews + 1),
        }));
        return;
      }
    } catch {
      // fall through
    }
    // Optimistic local add
    const review = {
      ...newReview,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      replies: [],
      helpfulVotes: 0,
      reportCount: 0,
    };
    setReviews(prev => [review, ...prev]);
    setStats(prev => ({
      ...prev,
      totalReviews: prev.totalReviews + 1,
      averageRating: ((prev.averageRating * prev.totalReviews) + newReview.rating) / (prev.totalReviews + 1),
    }));
  };

  const handleReplyToReview = (reviewId: string, reply) => {
    const newReply = {
      ...reply,
      id: Date.now().toString(),
      reviewId,
      createdAt: new Date().toISOString(),
      isEdited: false,
    };
    setReviews(prev =>
      prev.map(r => r.id === reviewId ? { ...r, replies: [...(r.replies || []), newReply] } : r)
    );
  };

  const handleLikeReview = (reviewId: string, isLike: boolean) => {
    setReviews(prev =>
      prev.map(r =>
        r.id === reviewId
          ? { ...r, likes: isLike ? r.likes + 1 : r.likes, dislikes: !isLike ? r.dislikes + 1 : r.dislikes }
          : r
      )
    );
  };

  const handleReportReview = (reviewId: string, reason: string) => {
    setReviews(prev =>
      prev.map(r =>
        r.id === reviewId
          ? { ...r, reportCount: r.reportCount + 1 }
          : r
      )
    );
    toast.warning('Review Reported', `Review has been reported for: ${reason}`);
  };

  const handleModerateReview = (reviewId: string, action: string) => {
    if (action === 'delete') {
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      setStats(prev => ({ ...prev, totalReviews: Math.max(0, prev.totalReviews - 1) }));
    } else {
      const newStatus = action === 'hide' ? 'hidden' : action === 'approve' ? 'active' : 'flagged';
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: newStatus } : r));
    }
  };

  const handleMarkHelpful = (reviewId: string) => {
    setReviews(prev =>
      prev.map(r => r.id === reviewId ? { ...r, helpfulVotes: r.helpfulVotes + 1 } : r)
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // If no target info yet, use a default
  const resolvedTargetInfo = targetInfo || {
    id: 'unknown',
    name: 'Reviews',
    type: 'restaurant' as const,
  };

  return (
    <DashboardLayout>
      <ReviewSystem
        reviews={reviews}
        stats={stats}
        userRole={(user?.role as unknown) || 'customer'}
        currentUserId={user?.id}
        targetInfo={resolvedTargetInfo}
        onSubmitReview={handleSubmitReview}
        onReplyToReview={handleReplyToReview}
        onLikeReview={handleLikeReview}
        onReportReview={handleReportReview}
        onModerateReview={handleModerateReview}
        onMarkHelpful={handleMarkHelpful}
      />
    </DashboardLayout>
  );
}
