'use client';

import React, { useState } from 'react';

interface QRGeneratorProps {
  storeId: string;
  storeName: string;
  storeSlug: string;
}

export default function QRGenerator({ storeId, storeName, storeSlug }: QRGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [qrCodes, setQrCodes] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (count: number) => {
    setGenerating(true);
    setError(null);

    try {
      // In production, call the API
      // const res = await fetch(`/api/qr/store/${storeId}/bulk`, { method: 'POST', body: JSON.stringify({ count }) });
      // const data = await res.json();

      // Mock response for development
      const mockQRCodes = Array.from({ length: count }, (_, i) => ({
        id: `QR-ABC${i + 1}`,
        payload: {
          intent: 'go-session',
          v: 1,
          storeId,
          action: 'start',
          storeName,
        },
        position: i + 1,
      }));

      setQrCodes(mockQRCodes);
    } catch (err) {
      setError('Failed to generate QR codes');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = (qr: any) => {
    // Open print dialog with QR code
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>REZ Go QR - ${storeName}</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
              .qr-container { border: 2px solid #000; padding: 20px; margin: 20px auto; width: 300px; }
              .qr-placeholder { width: 200px; height: 200px; background: #f0f0f0; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; }
              .store-name { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
              .instructions { font-size: 12px; color: #666; margin-top: 20px; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="store-name">${storeName}</div>
              <div class="qr-placeholder">[QR CODE]</div>
              <p>Scan to start shopping</p>
              <p class="instructions">Powered by REZ Go</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Store QR Codes</h2>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[1, 3, 5].map((count) => (
          <button
            key={count}
            onClick={() => handleGenerate(count)}
            disabled={generating}
            className="px-4 py-3 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-colors"
          >
            <div className="text-2xl font-bold">{count}</div>
            <div className="text-xs">QR Code{count > 1 ? 's' : ''}</div>
          </button>
        ))}
      </div>

      {/* Generated QRs */}
      {qrCodes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Generated QR Codes</h3>
            <button
              onClick={() => setQrCodes([])}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {qrCodes.map((qr) => (
              <div key={qr.id} className="border rounded-lg p-4">
                <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                  <div className="text-gray-400 text-sm">QR {qr.position}</div>
                </div>
                <div className="text-sm font-medium text-gray-900 truncate">{qr.id}</div>
                <button
                  onClick={() => handlePrint(qr)}
                  className="mt-2 w-full px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                >
                  Print
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">How to use:</h4>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Generate QR codes for your store</li>
          <li>Print and display at store entrance</li>
          <li>Customers scan to start shopping</li>
          <li>Each QR code can be used once per customer</li>
        </ol>
      </div>
    </div>
  );
}
