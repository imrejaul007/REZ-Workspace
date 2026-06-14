'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, NotFoundException, Result } from '@zxing/library';
import { logger } from '@/lib/utils/logger';
import type {
  WebQRScannerProps,
  QRCodeData,
  CameraStatus,
  ScanResult,
} from './types';
import { detectQRType } from './utils/detectQRType';
import { playScanSound, triggerVibration } from './utils/scannerFeedback';

/**
 * WebQRScanner - Camera-based QR scanner for web browsers
 * Uses navigator.mediaDevices.getUserMedia() and @zxing/library
 */
export default function WebQRScanner({
  onScanSuccess,
  onScanError,
  onNavigate,
  enableSound = true,
  enableVibration = true,
  showManualEntry = true,
  className = '',
}: WebQRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('checking');
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showManualFallback, setShowManualFallback] = useState(false);

  // Track if we're already processing a result to prevent double-processing
  const processingRef = useRef(false);
  // Track mounted state for cleanup
  const mountedRef = useRef(true);

  const handleScanResult = useCallback((result: Result) => {
    if (processingRef.current) return;
    processingRef.current = true;

    const rawText = result.getText();
    const format = result.getBarcodeFormat().toString();

    // Play feedback
    if (enableSound) {
      playScanSound();
    }
    if (enableVibration && 'vibrate' in navigator) {
      triggerVibration();
    }

    // Detect QR type
    const qrData: QRCodeData = {
      raw: rawText,
      type: detectQRType(rawText),
      metadata: extractMetadata(rawText),
    };

    setLastResult({
      text: rawText,
      format,
      timestamp: Date.now(),
    });

    // Notify parent
    onScanSuccess?.(qrData);

    // Reset processing flag after a delay to allow re-scanning
    setTimeout(() => {
      processingRef.current = false;
    }, 2000);
  }, [enableSound, enableVibration, onScanSuccess]);

  // Extract metadata from QR code
  const extractMetadata = (raw: string): QRCodeData['metadata'] => {
    const metadata: QRCodeData['metadata'] = {};

    // Extract store slug from URL
    try {
      if (raw.startsWith('http://') || raw.startsWith('https://')) {
        const url = new URL(raw);
        const segments = url.pathname.split('/').filter(Boolean);
        if (segments.length >= 1) {
          metadata.storeSlug = segments[0];
        }
      }
    } catch {
      // Not a valid URL
    }

    // Extract room code (format: RZ-ROOM-XXXX or similar)
    const roomMatch = raw.match(/RZ-ROOM-([A-Z0-9]+)/i);
    if (roomMatch) {
      metadata.roomCode = roomMatch[1];
    }

    // Extract campaign ID
    const campaignMatch = raw.match(/campaign[_-]?id[=:](\w+)/i);
    if (campaignMatch) {
      metadata.campaignId = campaignMatch[1];
    }

    return metadata;
  };

  // Initialize camera and start scanning
  useEffect(() => {
    mountedRef.current = true;
    const reader = new BrowserMultiFormatReader();
    codeReaderRef.current = reader;

    async function startScanner() {
      if (!mountedRef.current) return;

      try {
        // Check if getUserMedia is supported
        if (!navigator.mediaDevices?.getUserMedia) {
          setCameraStatus('unavailable');
          setErrorMessage('Camera not supported in this browser');
          setShowManualFallback(true);
          return;
        }

        // List available video devices
        const devices = await reader.listVideoInputDevices();

        if (!mountedRef.current) return;

        if (devices.length === 0) {
          setCameraStatus('not-found');
          setErrorMessage('No camera found on this device');
          setShowManualFallback(true);
          return;
        }

        // Prefer back camera on mobile
        const backCamera = devices.find((d) =>
          d.label.toLowerCase().includes('back') ||
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        );
        const deviceId = backCamera?.deviceId ?? devices[0].deviceId;

        setCameraStatus('available');

        // Start decoding from video device
        await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current!,
          (result: Result | null, err: Error | undefined) => {
            if (!mountedRef.current) return;

            if (result) {
              handleScanResult(result);
            }
            if (err && !(err instanceof NotFoundException)) {
              // NotFoundException is expected when no QR is in frame - ignore it
              logger.debug('[WebQRScanner] decode error', { error: err?.message });
            }
          }
        );

        if (mountedRef.current) {
          setIsScanning(true);
        }
      } catch (err) {
        if (!mountedRef.current) return;

        const error = err as Error;
        const errorMsg = error.message || String(err);

        if (
          errorMsg.includes('Permission denied') ||
          errorMsg.includes('NotAllowedError') ||
          errorMsg.includes('Permission dismissed')
        ) {
          setCameraStatus('permission-denied');
          setErrorMessage('Camera access denied. Please allow camera access in your browser settings.');
        } else if (
          errorMsg.includes('NotFoundError') ||
          errorMsg.includes('DevicesNotFoundError')
        ) {
          setCameraStatus('not-found');
          setErrorMessage('No camera found. Please connect a camera or use manual entry.');
        } else if (
          errorMsg.includes('NotReadableError') ||
          errorMsg.includes('TrackStartError')
        ) {
          setCameraStatus('unavailable');
          setErrorMessage('Camera is already in use by another application.');
        } else {
          setCameraStatus('unavailable');
          setErrorMessage(`Camera error: ${errorMsg}`);
        }

        setShowManualFallback(true);
        onScanError?.(errorMsg);
      }
    }

    startScanner();

    // Cleanup function
    return () => {
      mountedRef.current = false;
      reader.reset();
    };
  }, [handleScanResult, onScanError]);

  // Handle manual fallback toggle
  const handleManualToggle = () => {
    setShowManualFallback(!showManualFallback);
    if (!showManualFallback && codeReaderRef.current) {
      codeReaderRef.current.reset();
      setIsScanning(false);
    }
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Scanner viewport */}
      {!showManualFallback && (
        <div className="relative w-full aspect-square max-w-md mx-auto bg-black rounded-xl overflow-hidden">
          {/* Video feed */}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />

          {/* Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {/* Scan frame */}
            <div className="relative w-48 h-48">
              {/* Corner markers */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />

              {/* Scan line animation */}
              {isScanning && (
                <div
                  className="absolute left-2 right-2 h-0.5 bg-indigo-400"
                  style={{
                    top: '50%',
                    animation: 'scanLine 2s ease-in-out infinite',
                  }}
                />
              )}
            </div>

            {/* Status indicator */}
            <div className="mt-6 flex items-center gap-2 text-sm text-white/80">
              {cameraStatus === 'checking' && (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                  Checking camera...
                </span>
              )}
              {cameraStatus === 'available' && isScanning && (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Point at QR code
                </span>
              )}
              {cameraStatus === 'available' && !isScanning && (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                  Starting camera...
                </span>
              )}
              {cameraStatus === 'unavailable' && (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-400 rounded-full" />
                  Camera unavailable
                </span>
              )}
              {cameraStatus === 'permission-denied' && (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-400 rounded-full" />
                  Permission denied
                </span>
              )}
              {cameraStatus === 'not-found' && (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-400 rounded-full" />
                  No camera found
                </span>
              )}
            </div>
          </div>

          {/* Last result toast */}
          {lastResult && (
            <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3">
              <p className="text-xs text-green-400 font-medium">Scanned:</p>
              <p className="text-xs text-white/80 truncate">{lastResult.text}</p>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {errorMessage && !showManualFallback && (
        <div className="mt-4 mx-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-sm text-red-400">{errorMessage}</p>
        </div>
      )}

      {/* Manual entry toggle */}
      {showManualEntry && !showManualFallback && (
        <button
          onClick={handleManualToggle}
          className="mt-4 mx-auto px-4 py-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Enter code manually
        </button>
      )}

      {/* Manual fallback container */}
      {showManualFallback && (
        <div className="mt-4">
          {/* Back to camera button */}
          {cameraStatus === 'available' && (
            <button
              onClick={handleManualToggle}
              className="mb-4 mx-auto flex items-center gap-2 px-4 py-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Try camera again
            </button>
          )}
        </div>
      )}

      {/* Scan line animation style */}
      <style>{`
        @keyframes scanLine {
          0%, 100% {
            transform: translateY(-80px);
            opacity: 0.3;
          }
          50% {
            transform: translateY(80px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
