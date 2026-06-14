'use client';

import { useState, useRef, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { logger } from '@/lib/utils/logger';
import type { WebQRScannerFallbackProps, ManualEntryData } from './types';

/**
 * WebQRScannerFallback - Fallback UI when camera is unavailable
 * Provides manual entry, image upload, and link options
 */
export default function WebQRScannerFallback({
  onManualEntry,
  onImageUpload,
  onContinueWithLink,
  className = '',
}: WebQRScannerFallbackProps) {
  const [activeTab, setActiveTab] = useState<'manual' | 'upload' | 'link'>('manual');
  const [manualValue, setManualValue] = useState('');
  const [linkValue, setLinkValue] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle manual entry submission
  const handleManualSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!manualValue.trim()) return;

    const entryType = determineManualEntryType(manualValue.trim());
    const data: ManualEntryData = {
      type: entryType,
      value: manualValue.trim(),
    };

    onManualEntry?.(data);
  }, [manualValue, onManualEntry]);

  // Determine what type of manual entry this is
  const determineManualEntryType = (value: string): ManualEntryData['type'] => {
    // Check if it looks like a campaign code
    if (/^campaign[:_-]?\w+$/i.test(value) || /^promo[:_-]?\w+$/i.test(value)) {
      return 'campaign-code';
    }

    // Check if it looks like a room code
    if (/^room[:_-]?\w+$/i.test(value) || /^RZ-ROOM-/i.test(value)) {
      return 'room-code';
    }

    // Default to store slug
    return 'store-slug';
  };

  // Handle link submission
  const handleLinkSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!linkValue.trim()) return;

    // Ensure URL has protocol
    let url = linkValue.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    onContinueWithLink?.(url);
  }, [linkValue, onContinueWithLink]);

  // Handle image file selection
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      logger.warn('[WebQRScannerFallback] Invalid file type:', { fileType: file.type });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      logger.warn('[WebQRScannerFallback] File too large:', { fileSize: file.size });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Process the image
    setIsProcessingImage(true);

    try {
      const codeReader = new BrowserMultiFormatReader();
      const imageUrl = URL.createObjectURL(file);

      // For now, pass the file to the parent handler
      // The parent will decode it using @zxing/library
      onImageUpload?.(file);

      URL.revokeObjectURL(imageUrl);
    } catch (err) {
      logger.error('[WebQRScannerFallback] Failed to decode image:', { error: err });
    } finally {
      setIsProcessingImage(false);
    }
  }, [onImageUpload]);

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      {/* Tab navigation */}
      <div className="flex border-b border-gray-700 mb-6">
        <TabButton
          active={activeTab === 'manual'}
          onClick={() => setActiveTab('manual')}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          }
        >
          Enter Code
        </TabButton>
        <TabButton
          active={activeTab === 'upload'}
          onClick={() => setActiveTab('upload')}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        >
          Upload QR
        </TabButton>
        <TabButton
          active={activeTab === 'link'}
          onClick={() => setActiveTab('link')}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          }
        >
          Open Link
        </TabButton>
      </div>

      {/* Manual entry form */}
      {activeTab === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label htmlFor="manual-code" className="block text-sm font-medium text-gray-300 mb-2">
              Enter store code
            </label>
            <input
              id="manual-code"
              type="text"
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              placeholder="e.g. central-cafe"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <button
            type="submit"
            disabled={!manualValue.trim()}
            className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Go to Store
          </button>
          <p className="text-center text-xs text-gray-500">
            Ask your waiter for the store code, or find it on your bill.
          </p>
        </form>
      )}

      {/* Image upload */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {!imagePreview ? (
            <button
              onClick={handleUploadClick}
              className="w-full border-2 border-dashed border-gray-600 rounded-xl py-12 flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-colors"
            >
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium">Tap to select QR code image</span>
              <span className="text-xs text-gray-500">PNG, JPG up to 10MB</span>
            </button>
          ) : (
            <div className="relative">
              <img
                src={imagePreview}
                alt="QR code preview"
                className="w-full max-w-xs mx-auto rounded-xl"
              />
              {isProcessingImage && (
                <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <button
                onClick={() => {
                  setImagePreview(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white/80 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <p className="text-center text-xs text-gray-500">
            Take a screenshot or save the QR code to upload it later.
          </p>
        </div>
      )}

      {/* Link entry */}
      {activeTab === 'link' && (
        <form onSubmit={handleLinkSubmit} className="space-y-4">
          <div>
            <label htmlFor="link-input" className="block text-sm font-medium text-gray-300 mb-2">
              Paste link or URL
            </label>
            <input
              id="link-input"
              type="url"
              value={linkValue}
              onChange={(e) => setLinkValue(e.target.value)}
              placeholder="https://now.rez.money/your-store"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              autoCapitalize="none"
              autoCorrect="off"
            />
          </div>
          <button
            type="submit"
            disabled={!linkValue.trim()}
            className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Open Link
          </button>
          <p className="text-center text-xs text-gray-500">
            Paste a link from a QR code you scanned earlier.
          </p>
        </form>
      )}
    </div>
  );
}

// Tab button component
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function TabButton({ active, onClick, icon, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
        active
          ? 'text-indigo-400 border-indigo-400'
          : 'text-gray-400 border-transparent hover:text-gray-300'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </button>
  );
}
