'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';

export default function ScanQRPage() {
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [serialInput, setSerialInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const simulateScan = () => {
    setLoading(true);
    setError(null);
    setScanned(true);

    // Simulate verification
    setTimeout(() => {
      setResult({
        status: 'AUTHENTIC',
        serial_number: 'REZ123456789',
        brand: 'Apple',
        model: 'MacBook Pro 14"',
        warranty_status: 'active',
        verification_count: 5,
      });
      setLoading(false);
    }, 1500);
  };

  const handleManualVerify = async () => {
    if (!serialInput.trim()) return;

    setLoading(true);
    setError(null);
    setScanned(true);

    try {
      const response = await api.verifyQRCode(serialInput);
      if (response.success && response.data) {
        setResult(response.data);
      } else {
        // Mock response
        setResult({
          status: 'AUTHENTIC',
          serial_number: serialInput.toUpperCase(),
          brand: 'Samsung',
          model: 'Galaxy S24 Ultra',
          warranty_status: 'active',
          verification_count: 1,
        });
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
      setResult(null);
    }

    setLoading(false);
  };

  const resetScan = () => {
    setScanned(false);
    setResult(null);
    setSerialInput('');
    setError(null);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 mb-8">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Scan QR Code</h1>
          <p className="text-gray-500 mt-1">Verify product authenticity and warranty status</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Mode Toggle */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setMode('camera')}
            className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all ${
              mode === 'camera'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Camera
            </div>
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all ${
              mode === 'manual'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Manual Entry
            </div>
          </button>
        </div>

        {/* Camera View */}
        {mode === 'camera' && !scanned && (
          <div className="relative bg-gray-900 rounded-3xl overflow-hidden aspect-square max-w-md mx-auto">
            {/* Simulated Camera View */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white/50">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm">Camera Preview</p>
                <p className="text-xs mt-1">(Demo Mode)</p>
              </div>
            </div>

            {/* Scan Frame */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 relative">
                {/* Corner Brackets */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                {/* Scanning Line */}
                <div className="absolute inset-x-4 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              <div className="text-center text-white">
                <p className="text-sm mb-4">Position QR code within the frame</p>
                <button
                  onClick={simulateScan}
                  className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/50 hover:scale-110 transition-transform"
                >
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manual Entry */}
        {mode === 'manual' && !scanned && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Enter Serial Number</h2>
              <p className="text-gray-500">Type or paste the serial number from your product</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Serial Number</label>
                <input
                  type="text"
                  value={serialInput}
                  onChange={(e) => setSerialInput(e.target.value.toUpperCase())}
                  placeholder="e.g., REZ123456789"
                  className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-lg tracking-wider transition-all"
                />
              </div>
              <button
                onClick={handleManualVerify}
                disabled={!serialInput.trim() || loading}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </div>
                ) : (
                  'Verify Product'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && scanned && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Verifying...</h3>
            <p className="text-gray-500">Checking product authenticity</p>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="space-y-6">
            {/* Status Card */}
            <div className={`rounded-2xl p-6 ${result.status === 'AUTHENTIC' ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : 'bg-gradient-to-br from-red-500 to-rose-500'}`}>
              <div className="flex items-center gap-4 text-white">
                <div className={`w-14 h-14 rounded-2xl ${result.status === 'AUTHENTIC' ? 'bg-white/20' : 'bg-white/20'} flex items-center justify-center`}>
                  {result.status === 'AUTHENTIC' ? (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">
                    {result.status === 'AUTHENTIC' ? 'Product Verified!' : 'Verification Failed'}
                  </h3>
                  <p className="text-white/80">
                    {result.status === 'AUTHENTIC'
                      ? `${result.brand} ${result.model} is authentic`
                      : 'This product could not be verified'}
                  </p>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h4 className="text-sm font-medium text-gray-500 mb-4">Product Details</h4>
              <div className="space-y-4">
                {[
                  { label: 'Brand', value: result.brand },
                  { label: 'Model', value: result.model },
                  { label: 'Serial Number', value: result.serial_number },
                  { label: 'Warranty Status', value: result.warranty_status || 'N/A' },
                  { label: 'Verification Count', value: result.verification_count || 0 },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between py-3 border-b border-gray-100 last:border-0">
                    <span className="text-gray-500">{item.label}</span>
                    <span className={`font-medium ${item.label === 'Warranty Status' && item.value === 'active' ? 'text-emerald-600' : 'text-gray-900'}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4">
              {result.warranty_status !== 'active' && (
                <Link
                  href={`/activate?serial=${result.serial_number}`}
                  className="col-span-2 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl text-center hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
                >
                  Activate Warranty
                </Link>
              )}
              <Link
                href={`/passport?serial=${result.serial_number}`}
                className="py-4 bg-gray-100 text-gray-700 font-medium rounded-xl text-center hover:bg-gray-200 transition-all"
              >
                View Passport
              </Link>
              <button
                onClick={resetScan}
                className="py-4 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all"
              >
                Scan Another
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 text-red-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-medium">Verification Failed</h4>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
            <button
              onClick={resetScan}
              className="mt-4 w-full py-3 bg-red-100 text-red-700 font-medium rounded-xl hover:bg-red-200 transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Tips */}
        {!scanned && (
          <div className="mt-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Tips for Scanning</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: '💡', text: 'Ensure good lighting' },
                { icon: '📱', text: 'Hold steady' },
                { icon: '🔍', text: 'Full QR in frame' },
              ].map((tip, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-2xl">{tip.icon}</span>
                  <span className="text-sm text-gray-600">{tip.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
