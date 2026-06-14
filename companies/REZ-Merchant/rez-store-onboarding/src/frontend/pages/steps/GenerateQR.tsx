import React, { useState, useEffect } from 'react';
import { QrCode, Download, Printer, CheckCircle, Loader2, Image } from 'lucide-react';
import api, { QRCode as QRCodeType } from '../../services/api';

interface GenerateQRProps {
  storeId: string;
  initialData?: { qrCodes?: QRCodeType[] };
  onSubmit: (data: { qrCodes: QRCodeType[] }) => void;
  onSkip?: () => void;
  isLoading?: boolean;
}

export const GenerateQR: React.FC<GenerateQRProps> = ({
  storeId,
  initialData,
  onSubmit,
  onSkip,
  isLoading = false,
}) => {
  const [qrCodes, setQRCodes] = useState<QRCodeType[]>(initialData?.qrCodes || []);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedQRCodes, setSelectedQRCodes] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'unprinted' | 'printed'>('all');

  useEffect(() => {
    loadQRCodes();
  }, [storeId]);

  const loadQRCodes = async () => {
    try {
      const codes = await api.getQRCodes(storeId);
      setQRCodes(codes);
    } catch (error) {
      console.error('Failed to load QR codes:', error);
    }
  };

  const handleGenerateQRCodes = async () => {
    setIsGenerating(true);
    try {
      const codes = await api.generateQRCodes(storeId);
      setQRCodes(codes);
    } catch (error) {
      console.error('Failed to generate QR codes:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedQRCodes.size === filteredQRCodes.length) {
      setSelectedQRCodes(new Set());
    } else {
      setSelectedQRCodes(new Set(filteredQRCodes.map(qr => qr.id)));
    }
  };

  const handleSelectQR = (qrId: string) => {
    setSelectedQRCodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(qrId)) {
        newSet.delete(qrId);
      } else {
        newSet.add(qrId);
      }
      return newSet;
    });
  };

  const handleMarkPrinted = async () => {
    if (selectedQRCodes.size === 0) return;

    try {
      await api.markQRCodesPrinted(storeId, Array.from(selectedQRCodes));
      setSelectedQRCodes(new Set());
      await loadQRCodes();
    } catch (error) {
      console.error('Failed to mark QR codes as printed:', error);
    }
  };

  const handleDownloadSelected = async () => {
    if (selectedQRCodes.size === 0) return;

    setIsDownloading(true);
    try {
      const selectedCodes = qrCodes.filter(qr => selectedQRCodes.has(qr.id));

      for (const qr of selectedCodes) {
        if (qr.imageUrl) {
          const link = document.createElement('a');
          link.href = qr.imageUrl;
          link.download = `qr-${qr.shelfCode}.png`;
          link.click();
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      console.error('Failed to download QR codes:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    try {
      for (const qr of qrCodes) {
        if (qr.imageUrl) {
          const link = document.createElement('a');
          link.href = qr.imageUrl;
          link.download = `qr-${qr.shelfCode}.png`;
          link.click();
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    } catch (error) {
      console.error('Failed to download all QR codes:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const filteredQRCodes = qrCodes.filter(qr => {
    if (filter === 'unprinted') return !qr.printedAt;
    if (filter === 'printed') return !!qr.printedAt;
    return true;
  });

  const handleSubmit = () => {
    onSubmit({ qrCodes });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Generate QR Codes</h2>
        <p className="text-gray-600 mt-2">
          Create shelf QR codes for your products
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleGenerateQRCodes}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4" />
                Generate QR Codes
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Filter:</label>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as 'all' | 'unprinted' | 'printed')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All ({qrCodes.length})</option>
              <option value="unprinted">Unprinted ({qrCodes.filter(q => !q.printedAt).length})</option>
              <option value="printed">Printed ({qrCodes.filter(q => q.printedAt).length})</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedQRCodes.size > 0 && (
            <>
              <button
                type="button"
                onClick={handleMarkPrinted}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Mark as Printed ({selectedQRCodes.size})
              </button>
              <button
                type="button"
                onClick={handleDownloadSelected}
                disabled={isDownloading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Selected
              </button>
            </>
          )}
          {qrCodes.length > 0 && (
            <button
              type="button"
              onClick={handleDownloadAll}
              disabled={isDownloading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download All
            </button>
          )}
        </div>
      </div>

      {/* Selection Bar */}
      {filteredQRCodes.length > 0 && (
        <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedQRCodes.size === filteredQRCodes.length}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Select All ({filteredQRCodes.length})
            </span>
          </label>
          <span className="text-sm text-gray-500">
            {selectedQRCodes.size > 0 ? `${selectedQRCodes.size} selected` : 'None selected'}
          </span>
        </div>
      )}

      {/* QR Codes Grid */}
      {filteredQRCodes.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredQRCodes.map(qr => (
            <div
              key={qr.id}
              className={`relative border rounded-lg p-4 transition-all ${
                selectedQRCodes.has(qr.id)
                  ? 'border-blue-500 bg-blue-50'
                  : qr.printedAt
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <label className="absolute top-2 left-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedQRCodes.has(qr.id)}
                  onChange={() => handleSelectQR(qr.id)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </label>

              {qr.printedAt && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              )}

              <div className="flex flex-col items-center">
                {qr.imageUrl ? (
                  <img
                    src={qr.imageUrl}
                    alt={`QR Code for ${qr.shelfCode}`}
                    className="w-32 h-32 object-contain"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gray-100 flex items-center justify-center rounded">
                    <QrCode className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <p className="mt-2 text-sm font-mono font-medium text-gray-900">
                  {qr.shelfCode}
                </p>
                <p className="text-xs text-gray-500">
                  {qr.printedAt ? 'Printed' : 'Not printed'}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <QrCode className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No QR Codes Generated
          </h3>
          <p className="text-gray-600 mb-4">
            Generate QR codes for your products to enable shelf labeling
          </p>
          <button
            type="button"
            onClick={handleGenerateQRCodes}
            disabled={isGenerating}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isGenerating ? 'Generating...' : 'Generate QR Codes'}
          </button>
        </div>
      )}

      {/* Info Banner */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">QR Code Tips</h4>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>Print and place QR codes on shelves for quick product lookup</li>
          <li>Scan QR codes to check price, stock, and product details</li>
          <li>Download QR codes to print in bulk or use custom labels</li>
          <li>Mark QR codes as printed to track your progress</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t mt-8">
        <button
          type="button"
          onClick={onSkip}
          className="text-gray-600 hover:text-gray-800 font-medium"
          disabled={isLoading}
        >
          Skip for now
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            `Continue ${qrCodes.length > 0 ? `(${qrCodes.length} QR codes)` : ''}`
          )}
        </button>
      </div>
    </div>
  );
};

export default GenerateQR;
