'use client';

import React, { useState } from 'react';

export type ServiceRequestPriority = 'low' | 'normal' | 'urgent';
export type ServiceCategory = 'housekeeping' | 'room_service' | 'laundry' | 'transport' | 'spa' | 'maintenance' | 'concierge' | 'fitness';

export interface ServiceRequestItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

export interface ServiceRequestFormData {
  category: ServiceCategory;
  priority: ServiceRequestPriority;
  scheduledTime?: string;
  scheduledDate?: string;
  items: ServiceRequestItem[];
  description: string;
  specialInstructions?: string;
}

export interface ServiceRequestFormProps {
  hotelSlug: string;
  roomId: string;
  roomToken: string;
  bookingId: string;
  onSuccess?: (requestId: string) => void;
  onCancel?: () => void;
}

const PRIORITY_OPTIONS: Array<{ value: ServiceRequestPriority; label: string; description: string; color: string }> = [
  { value: 'low', label: 'Low', description: 'Within 2 hours', color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'normal', label: 'Normal', description: 'Within 1 hour', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'urgent', label: 'Urgent', description: 'Immediately', color: 'text-red-600 bg-red-50 border-red-200' },
];

const CATEGORY_ICONS: Record<ServiceCategory, React.ReactNode> = {
  housekeeping: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z" />
      <path d="M5 3L5.5 5L7 5.5L5.5 6L5 8L4.5 6L3 5.5L4.5 5L5 3Z" />
      <path d="M19 17L19.5 19L21 19.5L19.5 20L19 22L18.5 20L17 19.5L18.5 19L19 17Z" />
    </svg>
  ),
  room_service: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
    </svg>
  ),
  laundry: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z" />
    </svg>
  ),
  maintenance: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  spa: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2a3 3 0 00-3 3c0 1.5 1 2.5 3 3s3 1.5 3 3-1 2.5-3 3-3 1.5-3 3a3 3 0 006 0" />
    </svg>
  ),
  transport: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17a2 2 0 104 0 2 2 0 00-4 0zm10 0a2 2 0 104 0 2 2 0 00-4 0zM3 9l2-4h14l2 4M5 17H3v-5l1-2m14 7h2l1-2-1-5v5" />
    </svg>
  ),
  concierge: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
    </svg>
  ),
  fitness: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5h11M6.5 17.5h11M3 9h3m-3 6h3M18 9h3m-3 6h3M6 9h.01M6 15h.01M18 9h.01M18 15h.01" />
    </svg>
  ),
};

export function RoomServiceRequest({
  hotelSlug,
  roomId,
  roomToken,
  bookingId,
  onSuccess,
  onCancel,
}: ServiceRequestFormProps) {
  const [category, setCategory] = useState<ServiceCategory>('housekeeping');
  const [priority, setPriority] = useState<ServiceRequestPriority>('normal');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [description, setDescription] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const scheduledAt = scheduledDate && scheduledTime
        ? `${scheduledDate}T${scheduledTime}:00`
        : undefined;

      const response = await fetch(`/api/hotel-room/${hotelSlug}/${roomId}?token=${encodeURIComponent(roomToken)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-room-token': roomToken,
        },
        body: JSON.stringify({
          action: 'create-request',
          bookingId,
          roomId,
          serviceType: category,
          description: description || undefined,
          items: [],
          priority: priority === 'urgent' ? 'now' : priority,
          scheduledAt,
          specialInstructions,
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.id) {
        onSuccess?.(data.data.id);
      } else {
        setError(data.message || 'Failed to submit request');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const categories: ServiceCategory[] = ['housekeeping', 'room_service', 'laundry', 'maintenance', 'spa', 'transport', 'concierge', 'fitness'];
  const categoryLabels: Record<ServiceCategory, string> = {
    housekeeping: 'Housekeeping',
    room_service: 'Room Service',
    laundry: 'Laundry',
    maintenance: 'Maintenance',
    spa: 'Spa & Wellness',
    transport: 'Transport',
    concierge: 'Concierge',
    fitness: 'Fitness',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Category Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">Service Category</label>
        <div className="grid grid-cols-4 gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                category === cat
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'
              }`}
            >
              <span className={category === cat ? 'text-indigo-600' : 'text-gray-400'}>
                {CATEGORY_ICONS[cat]}
              </span>
              <span className="text-xs font-medium text-center leading-tight">{categoryLabels[cat]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Priority Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">Request Priority</label>
        <div className="flex gap-3">
          {PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPriority(opt.value)}
              className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${
                priority === opt.value
                  ? opt.color
                  : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
              }`}
            >
              <p className="font-semibold text-sm">{opt.label}</p>
              <p className="text-xs opacity-75 mt-0.5">{opt.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Scheduled Request */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Schedule (Optional)
          <span className="block text-xs font-normal text-gray-500 mt-0.5">Request for a specific time</span>
        </label>
        <div className="flex gap-3">
          <input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="time"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="w-32 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what you need..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      {/* Special Instructions */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Special Instructions
          <span className="block text-xs font-normal text-gray-500 mt-0.5">Allergies, accessibility needs, etc.</span>
        </label>
        <input
          type="text"
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
          placeholder="Any special requirements..."
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Submit Request
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default RoomServiceRequest;
