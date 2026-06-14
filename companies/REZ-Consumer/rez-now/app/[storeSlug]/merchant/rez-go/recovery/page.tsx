'use client';

import React, { useState, useCallback } from 'react';

interface RecoveryTransfer {
  transferId: string;
  sessionId: string;
  status: string;
  cart: {
    items: {
      name: string;
      price: number;
      quantity: number;
    }[];
    total: number;
    cashbackEarned: number;
  };
  customer: {
    userId: string;
  };
  initiatedAt: string;
  expiresAt: string;
}

export default function RecoveryPage() {
  const [pendingTransfers, setPendingTransfers] = useState<RecoveryTransfer[]>([]);
  const [selectedTransfer, setSelectedTransfer] = useState<RecoveryTransfer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);

  // Simulate QR scan
  const handleQRScan = useCallback(async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      // In production, call the API
      // const res = await fetch('/api/verify/recovery', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ transferId: code })
      // });
      // const data = await res.json();

      // Mock response
      if (code.startsWith('RCV-') || code.includes('go-recovery')) {
        const mockTransfer: RecoveryTransfer = {
          transferId: code.startsWith('RCV-') ? code : 'RCV-ABC123',
          sessionId: 'GOS-XYZ789',
          status: 'pending',
          cart: {
            items: [
              { name: 'Amul Butter 500g', price: 275, quantity: 1 },
              { name: 'Tata Salt 1kg', price: 22, quantity: 2 },
              { name: 'Maggi 2-Minute Noodles', price: 12, quantity: 3 },
            ],
            total: 333,
            cashbackEarned: 8,
          },
          customer: { userId: 'user_abc123' },
          initiatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        };
        setScanResult({ valid: true, transfer: mockTransfer });
        setSelectedTransfer(mockTransfer);
      } else {
        setError('Invalid recovery QR code');
        setScanResult({ valid: false, error: 'Invalid QR format' });
      }
    } catch (err) {
      setError('Failed to verify QR');
      setScanResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleComplete = async () => {
    if (!selectedTransfer) return;

    setLoading(true);
    try {
      // In production, call the API
      // await fetch(`/api/recovery/${selectedTransfer.transferId}/complete`, {
      //   method: 'POST',
      //   body: JSON.stringify({ cashierId: 'CASHIER001' })
      // });

      alert(`Transfer ${selectedTransfer.transferId} completed successfully!`);
      setSelectedTransfer(null);
      setScanResult(null);
    } catch (err) {
      setError('Failed to complete transfer');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    setSelectedTransfer(null);
    setScanResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">REZ Go Recovery</h1>
          <p className="text-sm text-gray-500">
            Scan customer recovery QR codes to complete their purchase
          </p>
        </div>

        {/* Scan Area */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Scan Recovery QR</h2>

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
            {loading ? (
              <div className="text-gray-500">Scanning...</div>
            ) : (
              <>
                <div className="text-6xl mb-4">📷</div>
                <p className="text-gray-500 mb-4">
                  Point camera at customer&apos;s recovery QR code
                </p>
                <div className="flex justify-center gap-4">
                  <input
                    type="text"
                    placeholder="Or enter code manually..."
                    className="border border-gray-300 rounded-lg px-4 py-2 w-64"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleQRScan((e.target as HTMLInputElement).value);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleQRScan('RCV-TEST123')}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    Simulate Scan
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Pending Transfers */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pending Transfers ({pendingTransfers.length})
          </h2>

          {pendingTransfers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No pending transfers</p>
          ) : (
            <div className="space-y-4">
              {pendingTransfers.map((transfer) => (
                <div
                  key={transfer.transferId}
                  className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedTransfer(transfer)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{transfer.transferId}</div>
                      <div className="text-sm text-gray-500">
                        {transfer.cart.items.length} items
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">₹{transfer.cart.total}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(transfer.expiresAt).toLocaleTimeString()} expires
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scan Result */}
        {scanResult && (
          <div className={`rounded-xl shadow-sm p-6 ${scanResult.valid ? 'bg-green-50' : 'bg-red-50'}`}>
            {scanResult.valid ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">✅</span>
                  <div>
                    <div className="font-semibold text-green-800">Valid Recovery</div>
                    <div className="text-sm text-green-600">
                      Transfer ID: {scanResult.transfer?.transferId}
                    </div>
                  </div>
                </div>

                {selectedTransfer && (
                  <div className="space-y-4">
                    {/* Cart Items */}
                    <div className="bg-white rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Cart Items</h3>
                      <div className="space-y-2">
                        {selectedTransfer.cart.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.name}</span>
                            <span>₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t mt-3 pt-3 flex justify-between font-semibold">
                        <span>Total</span>
                        <span>₹{selectedTransfer.cart.total}</span>
                      </div>
                      {selectedTransfer.cart.cashbackEarned > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Cashback earned</span>
                          <span>+₹{selectedTransfer.cart.cashbackEarned}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                      <button
                        onClick={handleComplete}
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {loading ? 'Processing...' : 'Complete at Counter'}
                      </button>
                      <button
                        onClick={handleReject}
                        className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-3xl">❌</span>
                <div>
                  <div className="font-semibold text-red-800">Invalid QR</div>
                  <div className="text-sm text-red-600">{scanResult.error}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
