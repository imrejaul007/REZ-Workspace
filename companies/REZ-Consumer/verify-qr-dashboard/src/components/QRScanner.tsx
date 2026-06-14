'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// Simple QR code decoder using camera
// Uses html5-qrcode library for production, falls back to manual entry for demo

interface QRScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
  loading?: boolean;
}

export default function QRScanner({ onScan, onError, loading }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCamera, setHasCamera] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
        setError(null);

        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          startScanLoop();
        };
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setHasCamera(false);
      setShowManualEntry(true);
      setError('Unable to access camera. Please grant camera permission or enter QR code manually.');
      onError?.('Camera access denied');
    }
  }, [onError]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // QR Code detection using canvas and basic pattern matching
  // This is a simplified version - for production, use html5-qrcode or jsQR
  const detectQRCode = useCallback((canvas: HTMLCanvasElement): string | null => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);

    // Simple edge detection for QR-like patterns
    // In production, replace with proper QR library like html5-qrcode

    // For demo purposes, we'll use simulated detection
    // Real implementation would decode actual QR codes
    return null;
  }, []);

  // Scan loop
  const startScanLoop = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const scan = () => {
      if (!isScanning || loading) {
        animationRef.current = requestAnimationFrame(scan);
        return;
      }

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Try to detect QR code
        // In production, use html5-qrcode library:
        // const decoded = await html5QrCode.scanFile(canvas);
        // if (decoded) onScan(decoded);

        // For now, we'll use manual entry or simulation
      }

      animationRef.current = requestAnimationFrame(scan);
    };

    scan();
  }, [isScanning, loading, onScan]);

  // Initialize
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Handle manual entry
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim().toUpperCase());
      setManualCode('');
    }
  };

  // Demo codes for testing
  const demoCodes = [
    'REZ-WARR-2026-001234',
    'REZ-WARR-2026-005678',
    'REZ-WARR-2026-009012',
  ];

  // NOTE: Using Math.random() here is acceptable for demo simulation
  // as it only selects from predefined demo codes, not for security purposes.
  const simulateScan = () => {
    const code = demoCodes[Math.floor(Math.random() * demoCodes.length)];
    onScan(code);
  };

  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
      {/* Video/Camera View */}
      <div className="relative aspect-square sm:aspect-video">
        {hasCamera ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />

            {/* Scanning Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Scanning Frame */}
              <div className="relative w-64 h-64">
                {/* Corner Brackets */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />

                {/* Scanning Line Animation */}
                {isScanning && !loading && (
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-b from-emerald-400 to-transparent animate-scan-line" />
                )}

                {/* Center Target */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 border-2 border-white/30 rounded-lg" />
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="absolute top-4 left-4 right-4 flex justify-between">
              <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${isScanning ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
                <span className="text-white text-xs font-medium">
                  {isScanning ? 'Scanning...' : 'Camera Off'}
                </span>
              </div>
              {loading && (
                <div className="bg-emerald-500/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center">
                  <svg className="animate-spin w-3 h-3 mr-2 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-white text-xs font-medium">Verifying</span>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-white text-sm text-center font-medium">
                Position QR code within the frame
              </p>
            </div>
          </>
        ) : (
          /* No Camera Fallback */
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <div className="text-center p-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-white text-lg font-medium mb-2">Camera not available</h3>
              <p className="text-gray-400 text-sm mb-4">{error}</p>
              <button
                onClick={() => setShowManualEntry(true)}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Enter Code Manually
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden Canvas for Processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Manual Entry Section */}
      {showManualEntry && (
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="Enter Serial Number or QR Code"
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder-gray-400"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
            />
            <button
              type="submit"
              disabled={!manualCode.trim() || loading}
              className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Verify
            </button>
          </form>
        </div>
      )}

      {/* Demo Section */}
      {!showManualEntry && (
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <button
              onClick={simulateScan}
              disabled={loading}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Try Demo Scan
            </button>
            <button
              onClick={() => setShowManualEntry(true)}
              className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Enter Code Manually
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scan-line {
          0% { top: 0; }
          50% { top: calc(100% - 4px); }
          100% { top: 0; }
        }
        .animate-scan-line {
          animation: scan-line 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// Export a hook for easy QR scanning integration
export function useQRScanner() {
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const startScanning = useCallback(() => {
    setIsScanning(true);
  }, []);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
  }, []);

  const handleScan = useCallback((code: string) => {
    setScannedCode(code);
    setIsScanning(false);
  }, []);

  return {
    scannedCode,
    isScanning,
    startScanning,
    stopScanning,
    handleScan,
  };
}
