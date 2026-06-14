'use client';

import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface LostItem {
  postId: string;
  shortcode: string;
  mode: string;
  title: string;
  description: string;
  photo: string | null;
  location: string;
  reward: { message?: string; amount?: number; currency?: string };
  helperCount: number;
  scanCount: number;
  status: string;
  createdAt: string;
}

const MODE_CONFIG: Record<string, { icon: string; color: string; name: string }> = {
  pet: { icon: '🐕', color: '#f59e0b', name: 'Pet' },
  device: { icon: '💻', color: '#10b981', name: 'Device' },
  vehicle: { icon: '🚗', color: '#3b82f6', name: 'Vehicle' },
  bicycle: { icon: '🚲', color: '#f97316', name: 'Bicycle' },
  key: { icon: '🔑', color: '#84cc16', name: 'Key' },
  luggage: { icon: '🧳', color: '#06b6d4', name: 'Luggage' },
  child: { icon: '👶', color: '#ec4899', name: 'Child' },
  other: { icon: '📦', color: '#6366f1', name: 'Other' },
};

export default function LostItemsPage() {
  const [items, setItems] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<LostItem | null>(null);
  const [reporting, setReporting] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  useEffect(() => {
    fetchLostItems();
  }, [selectedMode]);

  async function fetchLostItems() {
    setLoading(true);
    try {
      const url = selectedMode
        ? `${API_URL}/karma/feed?mode=${selectedMode}`
        : `${API_URL}/karma/feed`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setItems(data.data.posts);
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  }

  async function reportSighting(item: LostItem, location: string, description: string) {
    setReporting(true);
    try {
      const response = await fetch(`${API_URL}/karma/feed/${item.shortcode}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, description }),
      });
      const data = await response.json();
      if (data.success) {
        setReportSent(true);
        setTimeout(() => {
          setReportSent(false);
          setSelectedItem(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to report:', error);
    } finally {
      setReporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-6 pt-16">
        <h1 className="text-2xl font-bold">Lost Items</h1>
        <p className="text-red-100 mt-1">Help find lost pets, devices, and more</p>
      </div>

      {/* Stats */}
      <div className="bg-white px-4 py-4 border-b">
        <div className="flex gap-4">
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold text-gray-900">{items.length}</p>
            <p className="text-sm text-gray-500">Lost Items</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {items.reduce((sum, i) => sum + i.helperCount, 0)}
            </p>
            <p className="text-sm text-gray-500">Helpers</p>
          </div>
        </div>
      </div>

      {/* Mode Filter */}
      <div className="bg-white px-4 py-3 border-b overflow-x-auto">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedMode(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              !selectedMode ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            All
          </button>
          {Object.entries(MODE_CONFIG).map(([mode, config]) => (
            <button
              key={mode}
              onClick={() => setSelectedMode(mode)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-1 ${
                selectedMode === mode ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <span>{config.icon}</span>
              <span>{config.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Items List */}
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <span className="text-4xl">🔍</span>
            <p className="text-gray-500 mt-2">No lost items in this category</p>
          </div>
        ) : (
          items.map((item) => {
            const config = MODE_CONFIG[item.mode] || MODE_CONFIG.other;
            return (
              <div
                key={item.postId}
                className="bg-white rounded-xl overflow-hidden shadow-sm"
              >
                {/* Image/Icon Header */}
                <div
                  className="h-32 flex items-center justify-center"
                  style={{ backgroundColor: config.color + '20' }}
                >
                  {item.photo ? (
                    <img src={item.photo} alt={item.title} className="h-full object-cover" />
                  ) : (
                    <span className="text-6xl">{config.icon}</span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                    </div>
                    <span
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ backgroundColor: config.color + '20', color: config.color }}
                    >
                      {config.icon} {config.name}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 mt-4 text-sm text-gray-500">
                    <span>👁️ {item.scanCount} scans</span>
                    <span>🤝 {item.helperCount} helpers</span>
                    <span>📍 {item.location || 'Unknown'}</span>
                  </div>

                  {/* Reward */}
                  {item.reward && (
                    <div className="mt-3 bg-amber-50 rounded-lg p-3 flex items-center gap-2">
                      <span className="text-2xl">🎁</span>
                      <div>
                        <p className="font-semibold text-amber-800">
                          {item.reward.message || 'Reward Offered'}
                        </p>
                        {item.reward.amount && (
                          <p className="text-sm text-amber-600">
                            {item.reward.currency} {item.reward.amount}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold"
                    >
                      🆘 I Can Help!
                    </button>
                    <button className="px-4 py-3 bg-gray-100 rounded-lg">
                      📤 Share
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Report Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
            {reportSent ? (
              <div className="text-center py-8">
                <span className="text-6xl">✅</span>
                <h2 className="text-xl font-bold mt-4">Thank You!</h2>
                <p className="text-gray-500 mt-2">
                  Your report has been submitted. You earned karma points!
                </p>
              </div>
            ) : (
              <div>
                <p className="text-gray-500 mt-1">{selectedItem.title}</p>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Where did you see it?
                    </label>
                    <input
                      type="text"
                      id="location"
                      placeholder="e.g., Near City Park, Main Street"
                      className="w-full border rounded-lg px-4 py-3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional details (optional)
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      placeholder="Any other information that might help..."
                      className="w-full border rounded-lg px-4 py-3"
                    />
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      🎁 Help find this item and earn <strong>5 karma points</strong>!
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="flex-1 py-3 border rounded-lg font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const location = (document.getElementById('location') as HTMLInputElement).value;
                        const description = (document.getElementById('description') as HTMLTextAreaElement).value;
                        reportSighting(selectedItem, location, description);
                      }}
                      disabled={reporting}
                      className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
                    >
                      {reporting ? 'Sending...' : 'Submit Report'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
