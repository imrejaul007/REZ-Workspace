'use client';

import { useState, useCallback, useEffect } from 'react';
import type { ManualEntryProps, ManualEntryData, RecentScan } from './types';
import { STORAGE_KEYS, MAX_RECENT_SCANS } from './types';

/**
 * Generate a secure random ID using browser crypto API
 */
function generateSecureId(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback for older browsers (should not be used in production)
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * ManualEntry - Manual code entry component with recent scans history
 */
export default function ManualEntry({
  onSubmit,
  onRecentScanSelect,
  recentScans: initialRecentScans,
  className = '',
}: ManualEntryProps) {
  const [activeTab, setActiveTab] = useState<'store' | 'room' | 'campaign'>('store');
  const [storeSlug, setStoreSlug] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [campaignCode, setCampaignCode] = useState('');
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);

  // Load recent scans from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RECENT_SCANS);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentScan[];
        setRecentScans(parsed);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Save to recent scans
  const saveToRecentScans = useCallback((data: ManualEntryData, storeSlug?: string) => {
    const newScan: RecentScan = {
      id: `${Date.now()}-${generateSecureId()}`,
      code: data.value,
      type: mapEntryTypeToQRType(data.type),
      timestamp: Date.now(),
      storeSlug,
    };

    const updated = [newScan, ...recentScans.filter(s => s.code !== data.value)].slice(0, MAX_RECENT_SCANS);
    setRecentScans(updated);

    try {
      localStorage.setItem(STORAGE_KEYS.RECENT_SCANS, JSON.stringify(updated));
    } catch {
      // Ignore localStorage errors
    }
  }, [recentScans]);

  // Handle form submissions
  const handleStoreSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!storeSlug.trim()) return;

    const slug = storeSlug.trim().toLowerCase().replace(/\s+/g, '-');
    const data: ManualEntryData = {
      type: 'store-slug',
      value: slug,
    };

    saveToRecentScans(data, slug);
    onSubmit?.(data);
  }, [storeSlug, saveToRecentScans, onSubmit]);

  const handleRoomSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) return;

    const code = roomCode.trim().toUpperCase();
    const data: ManualEntryData = {
      type: 'room-code',
      value: code,
    };

    saveToRecentScans(data);
    onSubmit?.(data);
  }, [roomCode, saveToRecentScans, onSubmit]);

  const handleCampaignSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignCode.trim()) return;

    const code = campaignCode.trim().toUpperCase();
    const data: ManualEntryData = {
      type: 'campaign-code',
      value: code,
    };

    saveToRecentScans(data);
    onSubmit?.(data);
  }, [campaignCode, saveToRecentScans, onSubmit]);

  // Handle recent scan selection
  const handleRecentScanClick = (scan: RecentScan) => {
    onRecentScanSelect?.(scan);
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  // Get type label
  const getTypeLabel = (type: RecentScan['type']): string => {
    const labels: Record<RecentScan['type'], string> = {
      'room-hub': 'Room',
      'menu-qr': 'Store',
      'rez-now': 'REZ',
      'ads-qr': 'Campaign',
      'safe-qr': 'Safe QR',
      'legacy': 'Legacy',
      'unknown': 'Unknown',
    };
    return labels[type] || 'Unknown';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Tab navigation */}
      <div className="flex border-b border-gray-700">
        <TabButton
          active={activeTab === 'store'}
          onClick={() => setActiveTab('store')}
          label="Store"
        />
        <TabButton
          active={activeTab === 'room'}
          onClick={() => setActiveTab('room')}
          label="Room Code"
        />
        <TabButton
          active={activeTab === 'campaign'}
          onClick={() => setActiveTab('campaign')}
          label="Campaign"
        />
      </div>

      {/* Store slug form */}
      {activeTab === 'store' && (
        <form onSubmit={handleStoreSubmit} className="space-y-4">
          <div>
            <label htmlFor="store-slug" className="block text-sm font-medium text-gray-300 mb-2">
              Store name or code
            </label>
            <input
              id="store-slug"
              type="text"
              value={storeSlug}
              onChange={(e) => setStoreSlug(e.target.value)}
              placeholder="e.g. central-cafe or starbucks-nyc"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <button
            type="submit"
            disabled={!storeSlug.trim()}
            className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Go to Store
          </button>
        </form>
      )}

      {/* Room code form */}
      {activeTab === 'room' && (
        <form onSubmit={handleRoomSubmit} className="space-y-4">
          <div>
            <label htmlFor="room-code" className="block text-sm font-medium text-gray-300 mb-2">
              Room code
            </label>
            <input
              id="room-code"
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="e.g. ROOM-1234"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-mono"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <p className="text-xs text-gray-500">
            Find the room code on your hotel room's TV screen or welcome card.
          </p>
          <button
            type="submit"
            disabled={!roomCode.trim()}
            className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Access Room Service
          </button>
        </form>
      )}

      {/* Campaign code form */}
      {activeTab === 'campaign' && (
        <form onSubmit={handleCampaignSubmit} className="space-y-4">
          <div>
            <label htmlFor="campaign-code" className="block text-sm font-medium text-gray-300 mb-2">
              Campaign or promo code
            </label>
            <input
              id="campaign-code"
              type="text"
              value={campaignCode}
              onChange={(e) => setCampaignCode(e.target.value.toUpperCase())}
              placeholder="e.g. SUMMER2024 or CAMPAIGN-ABC123"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors font-mono"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <p className="text-xs text-gray-500">
            Enter the campaign or promotion code from the QR code or voucher.
          </p>
          <button
            type="submit"
            disabled={!campaignCode.trim()}
            className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Redeem Campaign
          </button>
        </form>
      )}

      {/* Recent scans */}
      {recentScans.length > 0 && (
        <div className="pt-4 border-t border-gray-800">
          <h4 className="text-sm font-medium text-gray-400 mb-3">Recent Scans</h4>
          <div className="space-y-2">
            {recentScans.slice(0, 5).map((scan) => (
              <button
                key={scan.id}
                onClick={() => handleRecentScanClick(scan)}
                className="w-full flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-800 rounded-xl transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    scan.type === 'room-hub' ? 'bg-blue-500/20 text-blue-400' :
                    scan.type === 'menu-qr' ? 'bg-green-500/20 text-green-400' :
                    scan.type === 'ads-qr' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {getTypeLabel(scan.type)}
                  </span>
                  <span className="text-sm text-white font-mono">
                    {scan.storeSlug || scan.code}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(scan.timestamp)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Tab button component
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

function TabButton({ active, onClick, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
        active
          ? 'text-indigo-400 border-indigo-400'
          : 'text-gray-400 border-transparent hover:text-gray-300'
      }`}
    >
      {label}
    </button>
  );
}

// Helper function to map entry type to QR type
function mapEntryTypeToQRType(type: ManualEntryData['type']): RecentScan['type'] {
  const mapping: Record<ManualEntryData['type'], RecentScan['type']> = {
    'store-slug': 'menu-qr',
    'room-code': 'room-hub',
    'campaign-code': 'ads-qr',
  };
  return mapping[type];
}
