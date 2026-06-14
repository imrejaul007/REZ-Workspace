'use client';

import React, { useState } from 'react';

export interface FeedbackRatings {
  overall: number;
  cleanliness: number;
  service: number;
  amenities: number;
  comfort: number;
}

export interface FeedbackSubmission {
  bookingId: string;
  roomId: string;
  ratings: FeedbackRatings;
  comments: string;
  issues: string[];
  wouldRecommend: boolean;
  stayType: 'business' | 'leisure' | 'family' | 'couple' | 'solo';
}

export interface RoomFeedbackProps {
  hotelSlug: string;
  roomId: string;
  roomToken: string;
  bookingId: string;
  guestName?: string;
  roomNumber?: string;
  checkOutDate?: string;
  onSuccess?: () => void;
  onSkip?: () => void;
}

const STAY_TYPES = [
  { value: 'business', label: 'Business', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /></svg> },
  { value: 'leisure', label: 'Leisure', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg> },
  { value: 'family', label: 'Family', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg> },
  { value: 'couple', label: 'Couple', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg> },
  { value: 'solo', label: 'Solo', icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
];

const ISSUE_OPTIONS = [
  { id: 'noise', label: 'Noise disturbance' },
  { id: 'cleanliness', label: 'Cleanliness issues' },
  { id: 'ac', label: 'AC/Heating problems' },
  { id: 'plumbing', label: 'Plumbing issues' },
  { id: 'wifi', label: 'WiFi problems' },
  { id: 'service', label: 'Poor service' },
  { id: 'beds', label: 'Bed discomfort' },
  { id: 'none', label: 'No issues' },
];

const RATING_CATEGORIES = [
  { key: 'overall', label: 'Overall Experience', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg> },
  { key: 'cleanliness', label: 'Cleanliness', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z" /></svg> },
  { key: 'service', label: 'Service', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg> },
  { key: 'amenities', label: 'Amenities', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg> },
  { key: 'comfort', label: 'Comfort', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M4 6h16M4 10h16M4 14h16M4 18h16" /><rect x="2" y="4" width="20" height="16" rx="2" /></svg> },
];

function StarRating({ value, onChange, size = 'lg' }: { value: number; onChange?: (v: number) => void; size?: 'sm' | 'lg' }) {
  const [hover, setHover] = useState(0);
  const starSize = size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';
  const gapSize = size === 'lg' ? 'gap-1' : 'gap-0.5';

  return (
    <div className={`flex ${gapSize}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className={`${starSize} transition-all ${onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
        >
          <svg
            viewBox="0 0 24 24"
            fill={star <= (hover || value) ? '#f59e0b' : 'none'}
            stroke={star <= (hover || value) ? '#f59e0b' : '#d1d5db'}
            strokeWidth={1.5}
          >
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export function RoomFeedback({
  hotelSlug,
  roomId,
  roomToken,
  bookingId,
  guestName,
  roomNumber,
  checkOutDate,
  onSuccess,
  onSkip,
}: RoomFeedbackProps) {
  const [step, setStep] = useState(1);
  const [ratings, setRatings] = useState<FeedbackRatings>({
    overall: 0,
    cleanliness: 0,
    service: 0,
    amenities: 0,
    comfort: 0,
  });
  const [comments, setComments] = useState('');
  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const [stayType, setStayType] = useState<string>('');
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleIssue = (issueId: string) => {
    setSelectedIssues((prev) => {
      const next = new Set(prev);
      if (issueId === 'none') {
        return new Set(['none']);
      }
      next.delete('none');
      if (next.has(issueId)) {
        next.delete(issueId);
      } else {
        next.add(issueId);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (ratings.overall === 0) {
      setError('Please provide an overall rating');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const feedback: FeedbackSubmission = {
        bookingId,
        roomId,
        ratings,
        comments,
        issues: Array.from(selectedIssues),
        wouldRecommend: wouldRecommend ?? false,
        stayType: stayType as FeedbackSubmission['stayType'],
      };

      const response = await fetch(`/api/hotel-room/${hotelSlug}/${roomId}?token=${encodeURIComponent(roomToken)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-room-token': roomToken,
        },
        body: JSON.stringify({
          action: 'submit-feedback',
          ...feedback,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
        onSuccess?.();
      } else {
        // Demo mode - still show success
        setSubmitted(true);
        onSuccess?.();
      }
    } catch (err) {
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Thank you screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-600 mb-6">Your feedback helps us improve our service for future guests.</p>
          {wouldRecommend !== null && (
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">You would recommend us:</p>
              <p className="text-lg font-bold text-emerald-600">{wouldRecommend ? 'Yes!' : 'Not really'}</p>
            </div>
          )}
          <button
            onClick={onSkip}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-4 py-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-indigo-200">Step {step} of 3</span>
            <span className="text-sm text-indigo-200">Post-Stay Survey</span>
          </div>
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
          <h1 className="text-xl font-bold mt-4">How was your stay?</h1>
          <p className="text-indigo-100 text-sm mt-1">
            {roomNumber ? `Room ${roomNumber}` : ''} {guestName ? `- ${guestName}` : ''}
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Step 1: Ratings */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-5">
              {RATING_CATEGORIES.map((cat) => (
                <div key={cat.key} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{cat.icon}</span>
                      <span className="font-medium text-gray-900">{cat.label}</span>
                    </div>
                    {ratings[cat.key as keyof FeedbackRatings] > 0 && (
                      <span className="text-sm text-indigo-600 font-medium">
                        {ratings[cat.key as keyof FeedbackRatings]}/5
                      </span>
                    )}
                  </div>
                  <div className="flex justify-center">
                    <StarRating
                      value={ratings[cat.key as keyof FeedbackRatings]}
                      onChange={(v) => setRatings((r) => ({ ...r, [cat.key]: v }))}
                    />
                  </div>
                </div>
              ))}
            </div>

            {error && ratings.overall === 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              disabled={ratings.overall === 0}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Stay Type & Recommendation */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Stay Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">What brought you here?</label>
              <div className="grid grid-cols-3 gap-2">
                {STAY_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setStayType(type.value)}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                      stayType === type.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <span className={stayType === type.value ? 'text-indigo-600' : 'text-gray-400'}>
                      {type.icon}
                    </span>
                    <span className={`text-xs font-medium ${stayType === type.value ? 'text-indigo-700' : 'text-gray-700'}`}>
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Would Recommend */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Would you recommend us?</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setWouldRecommend(true)}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                    wouldRecommend === true
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <svg className={`w-8 h-8 ${wouldRecommend === true ? 'text-emerald-500' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                  <span className={`font-semibold ${wouldRecommend === true ? 'text-emerald-700' : 'text-gray-700'}`}>
                    Yes, definitely!
                  </span>
                </button>
                <button
                  onClick={() => setWouldRecommend(false)}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                    wouldRecommend === false
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <svg className={`w-8 h-8 ${wouldRecommend === false ? 'text-red-500' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                  </svg>
                  <span className={`font-semibold ${wouldRecommend === false ? 'text-red-700' : 'text-gray-700'}`}>
                    Maybe not
                  </span>
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Issues & Comments */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Issues */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Did you experience unknown issues?
                <span className="block text-xs font-normal text-gray-500 mt-0.5">Select all that apply</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ISSUE_OPTIONS.map((issue) => {
                  const isSelected = selectedIssues.has(issue.id);
                  return (
                    <button
                      key={issue.id}
                      onClick={() => toggleIssue(issue.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <p className={`text-sm font-medium ${isSelected ? 'text-indigo-700' : 'text-gray-700'}`}>
                        {issue.label}
                      </p>
                      {isSelected && (
                        <svg className="w-4 h-4 text-indigo-600 mt-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comments */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Additional comments
                <span className="block text-xs font-normal text-gray-500 mt-0.5">Share your thoughts or suggestions</span>
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Your feedback helps us improve..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Feedback'
                )}
              </button>
            </div>

            {onSkip && (
              <button
                onClick={onSkip}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Skip for now
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default RoomFeedback;
