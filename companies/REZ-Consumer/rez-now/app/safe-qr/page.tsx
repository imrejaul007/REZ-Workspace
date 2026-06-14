'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BrowserMultiFormatReader } from '@zxing/library';
import Link from 'next/link';
import { logger } from '@/lib/utils/logger';

const API_URL = process.env.NEXT_PUBLIC_SAFE_QR_API || 'http://localhost:4000/api';

interface SafeQRPayload {
  v: number;
  type: 'safe';
  mode: string;
  id: string;
  shortcode: string;
}

interface SafeQRProfile {
  shortcode: string;
  mode: string;
  status: string;
  profile?: {
    name?: string;
    displayName?: string;
    brand?: string;
    description?: string;
    breed?: string;
    species?: string;
    model?: string;
  };
  templates?: Array<{
    id: string;
    label: string;
    message: string;
    icon?: string;
  }>;
  settings?: {
    allowMessages: boolean;
    allowContactRequests: boolean;
  };
}

const MODE_CONFIG: Record<string, { icon: string; color: string; name: string }> = {
  pet: { icon: '🐕', color: '#f59e0b', name: 'Pet' },
  personal: { icon: '👤', color: '#6366f1', name: 'Personal' },
  device: { icon: '💻', color: '#10b981', name: 'Device' },
  medical: { icon: '🏥', color: '#ef4444', name: 'Medical' },
  helmet: { icon: '⛑️', color: '#8b5cf6', name: 'Helmet' },
  child: { icon: '👶', color: '#ec4899', name: 'Child' },
  vehicle: { icon: '🚗', color: '#3b82f6', name: 'Vehicle' },
  bicycle: { icon: '🚲', color: '#f97316', name: 'Bicycle' },
  key: { icon: '🔑', color: '#84cc16', name: 'Key' },
  luggage: { icon: '🧳', color: '#06b6d4', name: 'Luggage' },
  home: { icon: '🏠', color: '#14b8a6', name: 'Home' },
  office: { icon: '🏢', color: '#64748b', name: 'Office' },
  event: { icon: '🎉', color: '#d946ef', name: 'Event' },
  student: { icon: '🎒', color: '#0ea5e9', name: 'Student' },
  package: { icon: '📦', color: '#a855f7', name: 'Package' },
};

export default function SafeQRPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shortcodeFromUrl = searchParams.get('code') || searchParams.get('shortcode');

  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState<SafeQRProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [manualCode, setManualCode] = useState(shortcodeFromUrl || '');

  // Start camera scanning
  const startScanning = async () => {
    setScanning(true);
    setError(null);

    try {
      const reader = new BrowserMultiFormatReader();
      const video = document.getElementById('scanner-video') as HTMLVideoElement;

      const devices = await reader.listVideoInputDevices();
      if (devices.length === 0) {
        setError('No camera found');
        setScanning(false);
        return;
      }

      reader.decodeFromVideoDevice(devices[0].deviceId, video, async (result, err) => {
        if (result) {
          reader.reset();
          await handleScannedCode(result.getText());
        }
      });
    } catch (err) {
      logger.error('Scanner error:', { error: err });
      setError('Failed to start camera');
      setScanning(false);
    }
  };

  // Handle scanned code
  const handleScannedCode = async (code: string) => {
    setScanning(false);
    setLoading(true);

    try {
      let shortcode = code.toUpperCase().trim();

      // Parse JSON payload
      if (code.startsWith('{')) {
        const payload: SafeQRPayload = JSON.parse(code);
        if (payload.shortcode) {
          shortcode = payload.shortcode;
        }
      }

      // Parse URL
      if (code.includes('/s/') || code.includes('/qr/')) {
        const parts = code.split('/');
        shortcode = parts[parts.length - 1].split('?')[0].toUpperCase();
      }

      // Fetch QR data
      const response = await fetch(`${API_URL}/scan/${shortcode}`);
      const result = await response.json();

      if (result.success) {
        setQrData(result.data);
        setManualCode(shortcode);
      } else {
        setError('QR code not found');
      }
    } catch (err) {
      logger.error('Fetch error:', { error: err });
      setError('Failed to load QR data');
    } finally {
      setLoading(false);
    }
  };

  // Manual entry
  const handleManualSubmit = async () => {
    if (!manualCode.trim()) return;
    await handleScannedCode(manualCode.trim());
  };

  // Send message
  const sendMessage = async () => {
    if (!qrData) return;
    if (!selectedTemplate && !customMessage.trim()) {
      setError('Please select a template or write a message');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const content = selectedTemplate
        ? qrData.templates?.find((t) => t.id === selectedTemplate)?.message || ''
        : customMessage.trim();

      const response = await fetch(`${API_URL}/scan/${qrData.shortcode}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          type: selectedTemplate ? 'template' : 'text',
          templateId: selectedTemplate,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSent(true);
      } else {
        setError(result.error?.message || 'Failed to send');
      }
    } catch (err) {
      logger.error('Send error:', { error: err });
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Render
  const modeConfig = qrData ? (MODE_CONFIG[qrData.mode] || MODE_CONFIG.pet) : MODE_CONFIG.pet;

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h1>
          <p className="text-gray-600 mb-6">
            The owner will be notified and can reply to your message.
          </p>
          <button
            onClick={() => {
              setSent(false);
              setQrData(null);
              setSelectedTemplate(null);
              setCustomMessage('');
            }}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700"
          >
            Scan Another QR
          </button>
        </div>
      </div>
    );
  }

  if (qrData) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-indigo-600 text-white p-6 pt-16">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{modeConfig.icon}</span>
            <div>
              <h1 className="text-2xl font-bold">{modeConfig.name}</h1>
              <p className="text-indigo-200">{qrData.shortcode}</p>
            </div>
          </div>
          {qrData.status === 'lost' && (
            <div className="bg-red-500 text-white px-3 py-1 rounded text-sm font-bold inline-block">
              LOST ITEM
            </div>
          )}
        </div>

        <div className="max-w-lg mx-auto p-4">
          {/* Profile */}
          <div className="bg-white rounded-xl p-4 mb-4 shadow">
            <h2 className="text-xl font-bold text-gray-900">
              {qrData.profile?.name ||
               qrData.profile?.displayName ||
               qrData.profile?.brand ||
               qrData.shortcode}
            </h2>
            {qrData.profile?.breed && (
              <p className="text-gray-600">{qrData.profile.breed}</p>
            )}
            {qrData.profile?.description && (
              <p className="text-gray-500 text-sm mt-2">{qrData.profile.description}</p>
            )}
          </div>

          {/* Lost Alert */}
          {qrData.status === 'lost' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="text-red-700 font-semibold">⚠️ This item is reported lost</p>
              <p className="text-red-600 text-sm">Please help find it and contact the owner</p>
            </div>
          )}

          {/* Medical Info */}
          {qrData.mode === 'medical' && (
            <div className="bg-white rounded-xl p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Emergency Information</h3>
              {qrData.profile && (
                <p className="text-gray-700">Please assist this person in an emergency.</p>
              )}
            </div>
          )}

          {/* Templates */}
          {qrData.settings?.allowMessages && qrData.templates && qrData.templates.length > 0 && (
            <div className="bg-white rounded-xl p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">Quick Messages</h3>
              <div className="grid grid-cols-2 gap-2">
                {qrData.templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-colors ${
                      selectedTemplate === template.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <span className="text-lg mr-2">{template.icon || '💬'}</span>
                    <span className="text-sm text-gray-700">{template.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Message */}
          {qrData.settings?.allowMessages && (
            <div className="bg-white rounded-xl p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">Or Write Your Own</h3>
              <textarea
                value={customMessage}
                onChange={(e) => {
                  setCustomMessage(e.target.value);
                  setSelectedTemplate(null);
                }}
                placeholder="Type your message..."
                className="w-full border rounded-xl p-3 text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px]"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Send Button */}
          {qrData.settings?.allowMessages && (
            <button
              onClick={sendMessage}
              disabled={sending}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 mb-4"
            >
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          )}

          {/* Scan Another */}
          <button
            onClick={() => {
              setQrData(null);
              setSelectedTemplate(null);
              setCustomMessage('');
              setError(null);
            }}
            className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-300"
          >
            Scan Another QR
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-6 pt-16">
        <h1 className="text-2xl font-bold">Safe QR Scanner</h1>
        <p className="text-indigo-200">Scan unknown ReZ Safe QR code</p>
      </div>

      <div className="max-w-lg mx-auto p-4">
        {/* Camera Scanner */}
        {scanning ? (
          <div className="bg-black rounded-xl overflow-hidden mb-4">
            <video
              id="scanner-video"
              className="w-full aspect-square"
              autoPlay
              playsInline
              muted
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-4 border-indigo-500 rounded-2xl" />
            </div>
            <button
              onClick={() => setScanning(false)}
              className="absolute top-4 right-4 bg-white text-gray-900 px-4 py-2 rounded-lg font-medium"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 mb-4 shadow text-center">
            <div className="w-24 h-24 mx-auto bg-indigo-100 rounded-2xl flex items-center justify-center text-4xl mb-4">
              📷
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Ready to Scan</h2>
            <p className="text-gray-600 mb-4">Point your camera at a Safe QR code</p>
            <button
              onClick={startScanning}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700"
            >
              Start Camera
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-xl p-8 mb-4 shadow text-center">
            <div className="animate-spin w-12 h-12 mx-auto border-4 border-indigo-600 border-t-transparent rounded-full mb-4" />
            <p className="text-gray-600">Loading QR data...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Manual Entry */}
        <div className="bg-white rounded-xl p-6 shadow">
          <h3 className="font-semibold text-gray-900 mb-3">Enter Code Manually</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="REZP01"
              maxLength={6}
              className="flex-1 border rounded-xl px-4 py-3 text-lg font-bold tracking-widest text-center uppercase"
            />
            <button
              onClick={handleManualSubmit}
              disabled={!manualCode.trim() || loading}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              Go
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>Safe QR codes start with: REZP, REZN, REZD, REZM, etc.</p>
        </div>
      </div>
    </div>
  );
}
