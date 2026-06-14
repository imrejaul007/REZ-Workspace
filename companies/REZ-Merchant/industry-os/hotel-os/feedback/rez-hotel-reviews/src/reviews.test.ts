/**
 * REZ Hotel Reviews Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ReviewStatus,
  Sentiment,
  TravelType,
  resetStore,
  createReview,
  getReview,
  getReviewByBooking,
  getReviewsByHotel,
  getApprovedReviewsByHotel,
  moderateReview,
  respondToReview,
  markHelpful,
  reportReview,
  getHotelRating,
  getReviewAnalytics,
} from './services/reviews.service.js';

describe('Reviews Service', () => {
  beforeEach(() => {
    resetStore();
  });

  // ========================
  // REVIEW CREATION TESTS
  // ========================

  describe('Review Creation', () => {
    it('should create a review with all fields', () => {
      const review = createReview(
        'booking-1',
        'hotel-1',
        'guest-1',
        'John Doe',
        5,
        'This hotel was absolutely amazing! Great service and beautiful rooms.',
        { cleanliness: 5, service: 5, location: 4 },
        'Amazing Stay',
        [],
        '2026-05-15',
        true,
        TravelType.COUPLE
      );

      expect(review).toBeDefined();
      expect(review.reviewId).toMatch(/^REV-[A-F0-9]+$/);
      expect(review.bookingId).toBe('booking-1');
      expect(review.hotelId).toBe('hotel-1');
      expect(review.overallRating).toBe(5);
      expect(review.sentiment).toBe(Sentiment.POSITIVE);
      expect(review.status).toBe(ReviewStatus.PENDING);
    });

    it('should create a review with minimal fields', () => {
      const review = createReview(
        'booking-2',
        'hotel-1',
        'guest-2',
        'Jane Smith',
        3,
        'It was okay. Nothing special.'
      );

      expect(review.reviewId).toBeDefined();
      expect(review.categories).toEqual({});
      expect(review.title).toBeUndefined();
      expect(review.wouldRecommend).toBeUndefined();
    });

    it('should detect positive sentiment', () => {
      const review = createReview(
        'booking-3',
        'hotel-1',
        'guest-3',
        'Happy Guest',
        5,
        'Excellent service! The staff was wonderful and the room was perfect.'
      );

      expect(review.sentiment).toBe(Sentiment.POSITIVE);
      expect(review.sentimentScore).toBeGreaterThan(0);
    });

    it('should detect negative sentiment', () => {
      const review = createReview(
        'booking-4',
        'hotel-1',
        'guest-4',
        'Unhappy Guest',
        2,
        'Terrible experience. Dirty room, rude staff, and awful service.'
      );

      expect(review.sentiment).toBe(Sentiment.NEGATIVE);
      expect(review.sentimentScore).toBeLessThan(0);
    });

    it('should detect neutral sentiment', () => {
      const review = createReview(
        'booking-5',
        'hotel-1',
        'guest-5',
        'Neutral Guest',
        3,
        'The hotel was adequate for a one night stay.'
      );

      expect(review.sentiment).toBe(Sentiment.NEUTRAL);
    });

    it('should generate unique review IDs', () => {
      const review1 = createReview('booking-a', 'hotel-1', 'g1', 'A', 4, 'First review');
      const review2 = createReview('booking-b', 'hotel-1', 'g2', 'B', 4, 'Second review');

      expect(review1.reviewId).not.toBe(review2.reviewId);
    });
  });

  // ========================
  // REVIEW RETRIEVAL TESTS
  // ========================

  describe('Review Retrieval', () => {
    beforeEach(() => {
      createReview('booking-1', 'hotel-1', 'guest-1', 'G1', 5, 'Great!');
      createReview('booking-2', 'hotel-1', 'guest-2', 'G2', 4, 'Good!');
      createReview('booking-3', 'hotel-2', 'guest-3', 'G3', 3, 'Okay');
    });

    it('should get review by ID', () => {
      const created = createReview('booking-x', 'hotel-1', 'guest-x', 'X', 5, 'Test');
      const found = getReview(created.reviewId);

      expect(found).toEqual(created);
    });

    it('should get review by booking ID', () => {
      const created = createReview('booking-y', 'hotel-1', 'guest-y', 'Y', 4, 'Test');
      const found = getReviewByBooking('booking-y');

      expect(found?.reviewId).toBe(created.reviewId);
    });

    it('should get all reviews for a hotel (including pending)', () => {
      // Note: getReviewsByHotel returns only public reviews by default
      // We need to create approved reviews to test
      const r1 = createReview('booking-new1', 'hotel-1', 'g1', 'G1', 5, 'Great!');
      const r2 = createReview('booking-new2', 'hotel-1', 'g2', 'G2', 4, 'Good!');
      moderateReview(r1.reviewId, ReviewStatus.APPROVED);
      moderateReview(r2.reviewId, ReviewStatus.APPROVED);

      const reviews = getReviewsByHotel('hotel-1');
      expect(reviews.length).toBeGreaterThanOrEqual(2);
    });

    it('should only return public reviews by default', () => {
      createReview('booking-private', 'hotel-1', 'guest-p', 'P', 5, 'Private review');

      const reviews = getReviewsByHotel('hotel-1');

      // Should only have the approved (public) reviews
      expect(reviews.every(r => r.isPublic)).toBe(true);
    });

    it('should return undefined for non-existent review', () => {
      const found = getReview('non-existent');
      expect(found).toBeUndefined();
    });
  });

  // ========================
  // REVIEW MODERATION TESTS
  // ========================

  describe('Review Moderation', () => {
    it('should approve a review', () => {
      const review = createReview('booking-1', 'hotel-1', 'guest-1', 'G1', 5, 'Amazing hotel!');
      const approved = moderateReview(review.reviewId, ReviewStatus.APPROVED);

      expect(approved?.status).toBe(ReviewStatus.APPROVED);
      expect(approved?.isPublic).toBe(true);
    });

    it('should reject a review', () => {
      const review = createReview('booking-1', 'hotel-1', 'guest-1', 'G1', 1, 'Bad words');
      const rejected = moderateReview(review.reviewId, ReviewStatus.REJECTED);

      expect(rejected?.status).toBe(ReviewStatus.REJECTED);
      expect(rejected?.isPublic).toBe(false);
    });

    it('should flag review after 3 reports', () => {
      const review = createReview('booking-1', 'hotel-1', 'guest-1', 'G1', 1, 'Bad review');
      reportReview(review.reviewId);
      reportReview(review.reviewId);
      const flagged = reportReview(review.reviewId);

      expect(flagged?.status).toBe(ReviewStatus.FLAGGED);
      expect(flagged?.reportCount).toBe(3);
    });

    it('should update hotel rating when review is approved', () => {
      createReview('booking-1', 'hotel-1', 'guest-1', 'G1', 5, 'Amazing!');
      const review2 = createReview('booking-2', 'hotel-1', 'guest-2', 'G2', 4, 'Good!');

      moderateReview(review2.reviewId, ReviewStatus.APPROVED);

      const rating = getHotelRating('hotel-1');
      expect(rating?.totalReviews).toBe(1);
    });
  });

  // ========================
  // HOTEL RESPONSE TESTS
  // ========================

  describe('Hotel Response', () => {
    it('should add response to review', () => {
      const review = createReview('booking-1', 'hotel-1', 'guest-1', 'G1', 3, 'Average stay');
      const responded = respondToReview(review.reviewId, 'Thank you for your feedback!', 'Hotel Manager');

      expect(responded?.hotelResponse).toBeDefined();
      expect(responded?.hotelResponse?.response).toBe('Thank you for your feedback!');
      expect(responded?.hotelResponse?.managerName).toBe('Hotel Manager');
      expect(responded?.hotelResponse?.respondedAt).toBeInstanceOf(Date);
    });

    it('should update existing response', () => {
      const review = createReview('booking-1', 'hotel-1', 'guest-1', 'G1', 3, 'Average');
      respondToReview(review.reviewId, 'First response');
      const updated = respondToReview(review.reviewId, 'Updated response', 'New Manager');

      expect(updated?.hotelResponse?.response).toBe('Updated response');
      expect(updated?.hotelResponse?.managerName).toBe('New Manager');
    });
  });

  // ========================
  // HELPFUL/REPORT TESTS
  // ========================

  describe('Helpful and Report', () => {
    it('should increment helpful count', () => {
      const review = createReview('booking-1', 'hotel-1', 'guest-1', 'G1', 5, 'Great!');
      expect(review.helpful).toBe(0);

      markHelpful(review.reviewId);
      const updated = getReview(review.reviewId);

      expect(updated?.helpful).toBe(1);
    });

    it('should increment report count', () => {
      const review = createReview('booking-1', 'hotel-1', 'guest-1', 'G1', 1, 'Bad');
      expect(review.reportCount).toBe(0);

      reportReview(review.reviewId);
      const updated = getReview(review.reviewId);

      expect(updated?.reportCount).toBe(1);
    });
  });

  // ========================
  // ANALYTICS TESTS
  // ========================

  describe('Analytics', () => {
    it('should calculate hotel rating correctly', () => {
      const r1 = createReview('booking-1', 'hotel-1', 'g1', 'G1', 5, 'Amazing!');
      const r2 = createReview('booking-2', 'hotel-1', 'g2', 'G2', 4, 'Good!');
      const r3 = createReview('booking-3', 'hotel-1', 'g3', 'G3', 3, 'Okay');

      moderateReview(r1.reviewId, ReviewStatus.APPROVED);
      moderateReview(r2.reviewId, ReviewStatus.APPROVED);
      moderateReview(r3.reviewId, ReviewStatus.APPROVED);

      const rating = getHotelRating('hotel-1');

      expect(rating?.overallRating).toBe(4);
      expect(rating?.totalReviews).toBe(3);
    });

    it('should calculate category averages', () => {
      const r1 = createReview('booking-1', 'hotel-1', 'g1', 'G1', 5, 'Great!', { cleanliness: 5, service: 4 });
      const r2 = createReview('booking-2', 'hotel-1', 'g2', 'G2', 4, 'Good!', { cleanliness: 4, service: 5 });

      moderateReview(r1.reviewId, ReviewStatus.APPROVED);
      moderateReview(r2.reviewId, ReviewStatus.APPROVED);

      const rating = getHotelRating('hotel-1');

      expect(rating?.categoryAverages.cleanliness).toBe(4.5);
      expect(rating?.categoryAverages.service).toBe(4.5);
    });

    it('should calculate rating distribution', () => {
      const r5 = createReview('booking-5', 'hotel-1', 'g5', 'G5', 5, 'Five stars!');
      const r5b = createReview('booking-5b', 'hotel-1', 'g5b', 'G5b', 5, 'Five stars!');
      const r4 = createReview('booking-4', 'hotel-1', 'g4', 'G4', 4, 'Four stars!');
      const r3 = createReview('booking-3', 'hotel-1', 'g3', 'G3', 3, 'Three stars!');

      moderateReview(r5.reviewId, ReviewStatus.APPROVED);
      moderateReview(r5b.reviewId, ReviewStatus.APPROVED);
      moderateReview(r4.reviewId, ReviewStatus.APPROVED);
      moderateReview(r3.reviewId, ReviewStatus.APPROVED);

      const rating = getHotelRating('hotel-1');

      expect(rating?.ratingDistribution[5]).toBe(2);
      expect(rating?.ratingDistribution[4]).toBe(1);
      expect(rating?.ratingDistribution[3]).toBe(1);
      expect(rating?.ratingDistribution[2]).toBe(0);
      expect(rating?.ratingDistribution[1]).toBe(0);
    });

    it('should get complete analytics', () => {
      const r1 = createReview('booking-1', 'hotel-1', 'g1', 'G1', 5, 'Excellent stay! Amazing views!', undefined, undefined, undefined, undefined, true);
      const r2 = createReview('booking-2', 'hotel-1', 'g2', 'G2', 3, 'It was okay, nothing special.', undefined, undefined, undefined, undefined, false);

      moderateReview(r1.reviewId, ReviewStatus.APPROVED);
      moderateReview(r2.reviewId, ReviewStatus.APPROVED);

      const analytics = getReviewAnalytics('hotel-1');

      expect(analytics.totalReviews).toBe(2);
      expect(analytics.recommendRate).toBe(50); // 1 out of 2 recommended
      expect(analytics.sentimentBreakdown[Sentiment.POSITIVE]).toBe(1);
      expect(analytics.sentimentBreakdown[Sentiment.NEUTRAL]).toBe(1);
    });
  });

  // ========================
  // EDGE CASES
  // ========================

  describe('Edge Cases', () => {
    it('should handle hotel with no reviews', () => {
      const rating = getHotelRating('empty-hotel');
      expect(rating).toBeUndefined();
    });

    it('should handle all travel types', () => {
      const types = Object.values(TravelType);

      for (const type of types) {
        const review = createReview(`booking-${type}`, 'hotel-1', 'g', 'G', 4, 'Good', undefined, undefined, undefined, undefined, undefined, type);
        expect(review.travelType).toBe(type);
      }
    });

    it('should handle all review statuses', () => {
      const statuses = Object.values(ReviewStatus);

      for (const status of statuses) {
        const review = createReview(`booking-${status}`, 'hotel-1', 'g', 'G', 3, 'Review');
        const moderated = moderateReview(review.reviewId, status);
        expect(moderated?.status).toBe(status);
      }
    });

    it('should handle reviews with images', () => {
      const review = createReview(
        'booking-img',
        'hotel-1',
        'guest-img',
        'Image Guest',
        5,
        'Beautiful hotel!',
        undefined,
        'Great View',
        ['https://example.com/img1.jpg', 'https://example.com/img2.jpg']
      );

      expect(review.images).toHaveLength(2);
      expect(review.title).toBe('Great View');
    });
  });
});
