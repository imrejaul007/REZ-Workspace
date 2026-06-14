'use client';

import React, { useState } from 'react';

export interface HousekeepingItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: 'linens' | 'toiletries' | 'equipment' | 'cleaning' | 'extras';
  description?: string;
  price?: number;
  available: boolean;
}

export interface HousekeepingSpecialRequestProps {
  hotelSlug: string;
  roomId: string;
  roomToken: string;
  bookingId: string;
  onSuccess?: (requestId: string) => void;
  onCancel?: () => void;
}

const HOUSEKEEPING_ITEMS: HousekeepingItem[] = [
  // Linens
  {
    id: 'extra-towels',
    name: 'Extra Towels',
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18M8 18v4M16 18v4" /></svg>,
    category: 'linens',
    description: 'Bath & hand towels',
    available: true,
  },
  {
    id: 'bed-sheets',
    name: 'Fresh Bed Sheets',
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 8h20M2 16h20" /></svg>,
    category: 'linens',
    description: 'Fresh linens for bed',
    available: true,
  },
  {
    id: 'extra-pillows',
    name: 'Extra Pillows',
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="4" y="8" width="16" height="8" rx="4" /></svg>,
    category: 'linens',
    description: 'Firm or soft',
    available: true,
  },
  {
    id: 'extra-blankets',
    name: 'Extra Blankets',
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M4 6h16M4 10h16M4 14h16M4 18h16" /><rect x="2" y="4" width="20" height="16" rx="2" /></svg>,
    category: 'linens',
    description: 'Blanket or comforter',
    available: true,
  },
  // Toiletries
  {
    id: 'toiletries-kit',
    name: 'Toiletries Kit',
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M9 2h6v6H9zM12 8v4M9 12h6M9 16h6" /><circle cx="12" cy="18" r="2" /></svg>,
    category: 'toiletries',
    description: 'Shampoo, soap, etc.',
    available: true,
  },
  {
    id: 'dental-kit',
    name: 'Dental Kit',
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M12 4v8M8 6l4-2 4 2M8 20l4-4 4 4" /></svg>,
    category: 'toiletries',
    description: 'Toothbrush & paste',
    available: true,
  },
  {
    id: 'razor-kit',
    name: 'Razor Kit',
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="8" y="4" width="8" height="6" rx="1" /><path d="M12 10v10" /><path d="M8 18h8" /></svg>,
    category: 'toiletries',
    description: 'Razor & shaving cream',
    available: true,
  },
  // Equipment
  {
    id: 'iron-board',
    name: 'Iron & Board',
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M4 20h16M6 20v-4l2-8h8l2 8v4M12 4v4M10 8h4" /></svg>,
    category: 'equipment',
    description: 'Press clothes',
    available: true,
  },
  {
    id: 'hair-dryer',
    name: 'Hair Dryer',
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><ellipse cx="8" cy="12" rx="5" ry="6" /><path d="M13 12h8M21 8v8" /></svg>,
    category: 'equipment',
    description: 'Blow dryer',
    available: true,
  },
  {
    id: 'safe-box',
    name: 'Safe Box Access',
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="6" width="18" height="14" rx="2" /><circle cx="12" cy="13" r="3" /><path d="M12 16v2" /></svg>,
    category: 'equipment',
    description: 'Room safe',
    available: true,
  },
  // Cleaning
  {
    id: 'room-cleaning',
    name: 'Room Cleaning',
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z" /></svg>,
    category: 'cleaning',
    description: 'Full room tidy',
    available: true,
  },
  {
    id: 'deep-cleaning',
    name: 'Deep Cleaning',
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z" /><circle cx="12" cy="12" r="8" strokeDasharray="4 2" /></svg>,
    category: 'cleaning',
    description: 'Thorough cleaning',
    available: true,
  },
  {
    id: 'turndown-service',
    name: 'Turndown Service',
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M4 20h16M6 20V8l6-4 6 4v12M10 20v-6h4v6" /></svg>,
    category: 'cleaning',
    description: 'Evening bed service',
    available: true,
  },
  // Extras
  {
    id: 'slippers',
    name: 'Slippers',
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M4 18c0-2 2-4 6-4h6c2 0 4 1 4 3v1H4v-0z" /><path d="M8 14c0-2 2-4 4-4s4 2 4 4" /></svg>,
    category: 'extras',
    description: 'Disposable slippers',
    available: true,
  },
  {
    id: 'bathrobe',
    name: 'Bathrobe',
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M8 4h8l2 4v12h-4v-8H10v8H6V8l2-4z" /></svg>,
    category: 'extras',
    description: 'Bathrobe for guests',
    available: true,
  },
  {
    id: 'shoe-shine',
    name: 'Shoe Shine Kit',
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M4 14l2-4h4l2 4M6 14h4M14 14l2-4h4l-2 4M14 14h4" /><rect x="10" y="14" width="4" height="6" /></svg>,
    category: 'extras',
    description: 'Polish & brush',
    available: true,
  },
];

const CATEGORY_LABELS: Record<HousekeepingItem['category'], { label: string; icon: React.ReactNode }> = {
  linens: {
    label: 'Linens & Bedding',
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="4" width="20" height="16" rx="2" /></svg>,
  },
  toiletries: {
    label: 'Toiletries',
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 2h6v6H9z" /></svg>,
  },
  equipment: {
    label: 'Equipment',
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" /></svg>,
  },
  cleaning: {
    label: 'Cleaning',
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z" /></svg>,
  },
  extras: {
    label: 'Extras',
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" /></svg>,
  },
};

export function HousekeepingSpecialRequest({
  hotelSlug,
  roomId,
  roomToken,
  bookingId,
  onSuccess,
  onCancel,
}: HousekeepingSpecialRequestProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [quantity, setQuantity] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleItem = (itemId: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
        if (!quantity[itemId]) {
          setQuantity((q) => ({ ...q, [itemId]: 1 }));
        }
      }
      return next;
    });
  };

  const updateQuantity = (itemId: string, qty: number) => {
    if (qty < 1) return;
    setQuantity((prev) => ({ ...prev, [itemId]: qty }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.size === 0) {
      setError('Please select at least one item');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const items = Array.from(selectedItems).map((id) => {
        const item = HOUSEKEEPING_ITEMS.find((i) => i.id === id)!;
        return {
          id: item.id,
          name: item.name,
          price: item.price ?? 0,
          quantity: quantity[id] ?? 1,
          category: item.category,
        };
      });

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
          serviceType: 'housekeeping',
          description: notes || 'Housekeeping special request',
          items,
          priority: 'now',
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

  const groupedItems = HOUSEKEEPING_ITEMS.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<HousekeepingItem['category'], HousekeepingItem[]>);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Items by Category */}
      {Object.entries(CATEGORY_LABELS).map(([catKey, catInfo]) => {
        const items = groupedItems[catKey as HousekeepingItem['category']];
        if (!items?.length) return null;

        return (
          <div key={catKey}>
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <span className="text-gray-400">{catInfo.icon}</span>
              {catInfo.label}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {items.map((item) => {
                const isSelected = selectedItems.has(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    disabled={!item.available}
                    className={`relative p-3 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    } ${!item.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`mb-2 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`}>
                      {item.icon}
                    </div>
                    <p className={`text-sm font-medium ${isSelected ? 'text-indigo-700' : 'text-gray-900'}`}>
                      {item.name}
                    </p>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                    )}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Quantity Controls */}
      {selectedItems.size > 0 && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Quantities</h4>
          <div className="space-y-2">
            {Array.from(selectedItems).map((id) => {
              const item = HOUSEKEEPING_ITEMS.find((i) => i.id === id)!;
              const qty = quantity[id] ?? 1;
              return (
                <div key={id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(id, qty - 1)}
                      className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" d="M5 12h14" />
                      </svg>
                    </button>
                    <span className="w-8 text-center font-medium text-gray-900">{qty}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(id, qty + 1)}
                      className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any specific requests or preferences..."
          rows={2}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      {/* Error */}
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
          disabled={submitting || selectedItems.size === 0}
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
              Request {selectedItems.size} Item{selectedItems.size > 1 ? 's' : ''}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default HousekeepingSpecialRequest;
