'use client';

import type { QRResultProps, QRType } from './types';
import { getQRTypeLabel } from './utils/detectQRType';

/**
 * QRResult - Display component for scan results
 */
export default function QRResult({
  result,
  isProcessing = false,
  onContinue,
  onRetry,
  className = '',
}: QRResultProps) {
  const qrType = getQRTypeFromContent(result.text);
  const typeLabel = getQRTypeLabel(qrType);

  return (
    <div className={`bg-gray-900 rounded-2xl p-6 ${className}`}>
      {/* Success indicator */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
          <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">QR Code Scanned</h3>
          <p className="text-sm text-gray-400">{typeLabel}</p>
        </div>
      </div>

      {/* Result details */}
      <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Content</p>
            <p className="text-sm text-white break-all">{result.text}</p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-700/50">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Format: {result.format}</span>
            <span>Type: {typeLabel}</span>
          </div>
        </div>
      </div>

      {/* Processing state */}
      {isProcessing && (
        <div className="flex items-center justify-center gap-3 py-4">
          <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-indigo-300">Opening...</span>
        </div>
      )}

      {/* Actions */}
      {!isProcessing && (
        <div className="flex gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 py-3 px-4 border border-gray-600 rounded-xl text-gray-300 font-medium hover:bg-gray-800 transition-colors"
            >
              Scan Again
            </button>
          )}
          {onContinue && (
            <button
              onClick={onContinue}
              className="flex-1 py-3 px-4 bg-indigo-600 rounded-xl text-white font-semibold hover:bg-indigo-700 transition-colors"
            >
              Continue
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to get QR type from content
function getQRTypeFromContent(content: string): QRType {
  // Simple heuristic based on content
  if (content.startsWith('http')) {
    if (content.includes('now.rez.money') || content.includes('reznow.app')) {
      return 'rez-now';
    }
    if (content.includes('menu') || content.includes('order')) {
      return 'menu-qr';
    }
    if (content.includes('ads') || content.includes('campaign')) {
      return 'ads-qr';
    }
    return 'menu-qr';
  }

  if (content.includes('RZ-ROOM') || content.includes('room-')) {
    return 'room-hub';
  }

  if (/^[A-Z0-9]{8,}$/.test(content)) {
    return 'legacy';
  }

  return 'menu-qr';
}
