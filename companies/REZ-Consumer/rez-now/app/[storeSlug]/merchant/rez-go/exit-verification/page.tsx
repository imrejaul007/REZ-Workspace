'use client';

import React, { useState, useCallback } from 'react';

interface ExitVerification {
  sessionId: string;
  userId: string;
  userName?: string;
  cartTotal: number;
  itemCount: number;
  exitToken?: string;
  expiresAt?: string;
  verified: boolean;
}

export default function ExitVerificationPage() {
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ExitVerification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');

  const handleScan = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);
    setScanResult(null);

    try {
      // In production, call the API
      // const res = await fetch('/api/verify/exit', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ exitToken: code })
      // });
      // const data = await res.json();

      // Mock response
      if (code.startsWith('REZG:') || code.length > 20) {
        const mockExit: ExitVerification = {
          sessionId: 'GOS-ABC123',
          userId: 'user_xyz789',
          userName: 'Rahul S.',
          cartTotal: 1250,
          itemCount: 8,
          exitToken: code,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          verified: false,
        };
        setScanResult(mockExit);
      } else {
        setError('Invalid exit QR code');
      }
    } catch (err) {
      setError('Failed to verify exit QR');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleVerify = async () => {
    if (!scanResult) return;

    setLoading(true);
    try {
      // In production, call the API
      // await fetch('/api/checkout/exit-verify', {
      //   method: 'POST',
      //   body: JSON.stringify({ sessionId: scanResult.sessionId, exitToken: scanResult.exitToken })
      // });

      setScanResult({ ...scanResult, verified: true });
      alert('Exit verified successfully!');
    } catch (err) {
      setError('Failed to verify exit');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    setScanResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Exit Verification</h1>
          <p className="text-sm text-gray-500">
            Scan customer exit QR to verify their purchase
          </p>
        </div>

        {/* Scan Area */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Scan Exit QR</h2>

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
            {loading ? (
              <div className="text-gray-500">Scanning...</div>
            ) : (
              <>
                <div className="text-6xl mb-4">📷</div>
                <p className="text-gray-500 mb-4">
                  Point camera at customer&apos;s exit QR code
                </p>
                <div className="flex justify-center gap-4">
                  <input
                    type="text"
                    placeholder="Or enter code manually..."
                    className="border border-gray-300 rounded-lg px-4 py-2 w-64"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && manualCode) {
                        handleScan(manualCode);
                        setManualCode('');
                      }
                    }}
                  />
                  <button
                    onClick={() => handleScan(manualCode)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    Verify
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Simulate scan buttons for testing */}
          <div className="mt-4 flex justify-center gap-4">
            <button
              onClick={() => handleScan('REZG:test-token-123')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Simulate Valid QR
            </button>
            <button
              onClick={() => handleScan('INVALID')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Simulate Invalid QR
            </button>
          </div>
        </div>

        {/* Scan Result */}
        {scanResult && (
          <div className={`rounded-xl shadow-sm p-6 ${scanResult.verified ? 'bg-green-50' : 'bg-white'}`}>
            {scanResult.verified ? (
              /* Verified State */
              <div className="text-center">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-xl font-bold text-green-800 mb-2">Exit Verified!</h3>
                <p className="text-green-600 mb-4">
                  Customer {scanResult.userName || scanResult.userId} has been verified
                </p>
                <div className="bg-white rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div>
                      <div className="text-sm text-gray-500">Session</div>
                      <div className="font-medium">{scanResult.sessionId}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Items</div>
                      <div className="font-medium">{scanResult.itemCount}</div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleReject}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Scan Next Customer
                </button>
              </div>
            ) : (
              /* Pending Verification */
              <>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">🛒</span>
                  <div>
                    <div className="font-semibold text-gray-900">Exit QR Scanned</div>
                    <div className="text-sm text-gray-500">
                      {scanResult.userName || `Customer: ${scanResult.userId.slice(0, 8)}...`}
                    </div>
                  </div>
                </div>

                {/* Cart Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {scanResult.itemCount}
                      </div>
                      <div className="text-sm text-gray-500">Items</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-emerald-600">
                        ₹{scanResult.cartTotal}
                      </div>
                      <div className="text-sm text-gray-500">Total</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {scanResult.sessionId.slice(0, 8)}
                      </div>
                      <div className="text-sm text-gray-500">Session</div>
                    </div>
                  </div>
                </div>

                {/* Token Info */}
                {scanResult.expiresAt && (
                  <div className="bg-yellow-50 rounded-lg p-3 mb-4 flex items-center gap-2">
                    <span className="text-yellow-600">⏱️</span>
                    <span className="text-sm text-yellow-700">
                      Token expires: {new Date(scanResult.expiresAt).toLocaleTimeString()}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-4">
                  <button
                    onClick={handleVerify}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : '✅ Verify Exit'}
                  </button>
                  <button
                    onClick={handleReject}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>

                {/* Help text */}
                <p className="mt-4 text-sm text-gray-500 text-center">
                  After verifying, the customer can leave the store.
                  <br />
                  This QR code can only be used once.
                </p>
              </>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">❌</span>
              <div>
                <div className="font-semibold text-red-800">Invalid QR</div>
                <div className="text-sm text-red-600">{error}</div>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-xl shadow-sm p-6 mt-6">
          <h3 className="font-semibold text-blue-900 mb-3">How Exit Verification Works</h3>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>Customer scans exit QR at their phone after completing payment</li>
            <li>QR contains HMAC-signed token with session info</li>
            <li>You scan the QR to verify the purchase</li>
            <li>Verified customers can leave the store</li>
            <li>Each QR code can only be used once</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
