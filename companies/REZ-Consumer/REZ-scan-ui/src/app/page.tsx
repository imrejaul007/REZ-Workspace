'use client';

/**
 * REZ Scan UI - QR Scanner
 */

import { useState } from 'react';
import { scanApi } from '../services/api';

const qrTypes = [
  { id: 'payment', name: 'Payment', icon: '💳' },
  { id: 'restaurant', name: 'Restaurant', icon: '🍽️' },
  { id: 'product', name: 'Product', icon: '📦' },
  { id: 'verify', name: 'Verify', icon: '✅' },
  { id: 'event', name: 'Event', icon: '🎫' },
];

export default function ScanPage() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleScan = async (qrContent: string) => {
    setScanning(true);
    const response = await scanApi.scan(qrContent, 'user-1');
    if (response.success) {
      setResult(response.data);
    }
    setScanning(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900">REZ Scan</h1>
        <p className="text-sm text-gray-500">Scan QR codes</p>
      </header>

      {/* Scanner Placeholder */}
      <div className="p-4">
        <div className="bg-gray-900 rounded-xl aspect-square flex items-center justify-center">
          {scanning ? (
            <p className="text-white">Scanning...</p>
          ) : (
            <p className="text-white">Camera View</p>
          )}
        </div>

        {/* QR Types */}
        <div className="mt-4 grid grid-cols-5 gap-2">
          {qrTypes.map(type => (
            <div key={type.id} className="bg-white rounded-lg p-3 text-center">
              <span className="text-2xl">{type.icon}</span>
              <p className="text-xs mt-1">{type.name}</p>
            </div>
          ))}
        </div>

        {/* Result */}
        {result && (
          <div className="mt-4 bg-white rounded-lg p-4">
            <p className="font-medium">{result.action}</p>
            <p className="text-sm text-gray-500 mt-1">{result.scan.qr_type}</p>
          </div>
        )}
      </div>
    </div>
  );
}
