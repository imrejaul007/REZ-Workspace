import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { BarcodeFormat, BarcodeResult } from '../types';
import { formatDisplayNames, parseBarcodeValue } from '../utils/formats';

export interface BarcodeScannerProps {
  onScan: (result: BarcodeResult) => void;
  onError?: (error: Error) => void;
  formats?: BarcodeFormat[];
  scanInterval?: number;
  continuous?: boolean;
  showViewfinder?: boolean;
  showResult?: boolean;
  lastResult?: BarcodeResult | null;
  className?: string;
  style?: React.CSSProperties;
  viewfinderStyle?: React.CSSProperties;
  resultDisplayFormat?: 'none' | 'toast' | 'inline';
  onStart?: () => void;
  onStop?: () => void;
}

interface BarcodeScannerState {
  hasPermission: boolean | null;
  isScanning: boolean;
  error: Error | null;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScan,
  onError,
  formats = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
  scanInterval = 500,
  continuous = false,
  showViewfinder = true,
  showResult = true,
  lastResult: externalLastResult,
  className = '',
  style,
  viewfinderStyle,
  resultDisplayFormat = 'inline',
  onStart,
  onStop,
}) => {
  const scannerId = useRef(`barcode-scanner-${Math.random().toString(36).substring(7)}`);
  const [state, setState] = useState<BarcodeScannerState>({
    hasPermission: null,
    isScanning: false,
    error: null,
  });
  const [localLastResult, setLocalLastResult] = useState<BarcodeResult | null>(null);
  const [showToast, setShowToast] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const lastBarcodeRef = useRef<string>('');
  const audioContextRef = useRef<AudioContext | null>(null);

  const playBeep = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = 1800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.1);
    } catch (err) {
      console.warn('Failed to play beep:', err);
    }
  }, []);

  const vibrate = useCallback(() => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }
    } catch (err) {
      console.warn('Failed to vibrate:', err);
    }
  }, []);

  const handleScan = useCallback(
    (decodedText: string) => {
      const now = Date.now();

      // Debounce duplicate scans
      if (
        decodedText === lastBarcodeRef.current &&
        now - lastScanTimeRef.current < scanInterval
      ) {
        return;
      }

      const parsedValue = parseBarcodeValue(decodedText);
      const result: BarcodeResult = {
        value: parsedValue,
        format: formats[0],
        timestamp: new Date(),
      };

      lastBarcodeRef.current = parsedValue;
      lastScanTimeRef.current = now;
      setLocalLastResult(result);

      // Play feedback
      playBeep();
      vibrate();

      // Show toast if configured
      if (resultDisplayFormat === 'toast') {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }

      // Notify callback
      onScan(result);

      // Stop if not continuous
      if (!continuous) {
        setTimeout(() => {
          stopScanning();
        }, 500);
      }
    },
    [scanInterval, formats, continuous, onScan, playBeep, vibrate, resultDisplayFormat]
  );

  const startScanning = useCallback(async () => {
    if (state.isScanning) return;

    try {
      setState((prev) => ({ ...prev, error: null }));

      // Clean up existing scanner
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          await scannerRef.current.clear();
        } catch (e) {
          // Ignore cleanup errors
        }
        scannerRef.current = null;
      }

      const scanner = new Html5Qrcode(scannerId.current);
      scannerRef.current = scanner;

      // Map our formats to html5-qrcode formats
      const formatMap: Record<BarcodeFormat, Html5QrcodeSupportedFormats> = {
        ean_13: Html5QrcodeSupportedFormats.EAN_13,
        ean_8: Html5QrcodeSupportedFormats.EAN_8,
        upc_a: Html5QrcodeSupportedFormats.UPC_A,
        upc_e: Html5QrcodeSupportedFormats.UPC_E,
        code_128: Html5QrcodeSupportedFormats.CODE_128,
        code_39: Html5QrcodeSupportedFormats.CODE_39,
        qr_code: Html5QrcodeSupportedFormats.QR_CODE,
        code_93: Html5QrcodeSupportedFormats.CODE_93,
        codabar: Html5QrcodeSupportedFormats.CODABAR,
        itf: Html5QrcodeSupportedFormats.ITF,
        data_matrix: Html5QrcodeSupportedFormats.DATA_MATRIX,
        aztec: Html5QrcodeSupportedFormats.AZTEC,
        pdf417: Html5QrcodeSupportedFormats.PDF417,
      };

      const html5Formats = formats
        .map((f) => formatMap[f])
        .filter(Boolean);

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          formatsToSupport: html5Formats,
        },
        handleScan,
        () => {
          // QR code parse error - ignore, this happens frequently
        }
      );

      setState({ hasPermission: true, isScanning: true, error: null });
      onStart?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start scanner');
      setState((prev) => ({ ...prev, error, isScanning: false }));
      onError?.(error);
    }
  }, [state.isScanning, formats, handleScan, onError, onStart]);

  const stopScanning = useCallback(async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
      setState((prev) => ({ ...prev, isScanning: false }));
      lastBarcodeRef.current = '';
      onStop?.();
    } catch (err) {
      console.warn('Error stopping scanner:', err);
      setState((prev) => ({ ...prev, isScanning: false }));
    }
  }, [onStop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const displayResult = externalLastResult || localLastResult;

  return (
    <div className={`barcode-scanner ${className}`} style={style}>
      {/* Scanner container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '400px',
          aspectRatio: '1',
          backgroundColor: '#000',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        {/* Camera view */}
        <div
          id={scannerId.current}
          style={{
            width: '100%',
            height: '100%',
          }}
        />

        {/* Viewfinder overlay */}
        {showViewfinder && state.isScanning && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '250px',
              height: '250px',
              border: '2px solid rgba(255, 255, 255, 0.8)',
              borderRadius: '8px',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
              ...viewfinderStyle,
            }}
          >
            {/* Corner accents */}
            <div
              style={{
                position: 'absolute',
                top: '-2px',
                left: '-2px',
                width: '20px',
                height: '20px',
                borderTop: '4px solid #4CAF50',
                borderLeft: '4px solid #4CAF50',
                borderRadius: '4px 0 0 0',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '20px',
                height: '20px',
                borderTop: '4px solid #4CAF50',
                borderRight: '4px solid #4CAF50',
                borderRadius: '0 4px 0 0',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '-2px',
                left: '-2px',
                width: '20px',
                height: '20px',
                borderBottom: '4px solid #4CAF50',
                borderLeft: '4px solid #4CAF50',
                borderRadius: '0 0 0 4px',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '20px',
                height: '20px',
                borderBottom: '4px solid #4CAF50',
                borderRight: '4px solid #4CAF50',
                borderRadius: '0 0 4px 0',
              }}
            />
          </div>
        )}

        {/* Start button overlay */}
        {!state.isScanning && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: '#fff',
              gap: '16px',
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <button
              onClick={startScanning}
              style={{
                padding: '12px 24px',
                backgroundColor: '#4CAF50',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Start Scanning
            </button>
            {state.error && (
              <p style={{ color: '#ff6b6b', fontSize: '14px' }}>
                {state.error.message}
              </p>
            )}
          </div>
        )}

        {/* Stop button */}
        {state.isScanning && (
          <button
            onClick={stopScanning}
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '8px 24px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: '#000',
              border: 'none',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Stop Scanning
          </button>
        )}
      </div>

      {/* Toast notification */}
      {resultDisplayFormat === 'toast' && showToast && displayResult && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            backgroundColor: '#4CAF50',
            color: '#fff',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
          }}
        >
          <strong>Scanned:</strong> {displayResult.value}
        </div>
      )}

      {/* Inline result display */}
      {resultDisplayFormat === 'inline' && showResult && displayResult && (
        <div
          style={{
            marginTop: '16px',
            padding: '16px',
            backgroundColor: '#e8f5e9',
            borderRadius: '8px',
            border: '1px solid #4CAF50',
          }}
        >
          <p style={{ margin: 0, color: '#2e7d32' }}>
            <strong>Last Scanned:</strong> {displayResult.value}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#666' }}>
            Format: {formatDisplayNames[displayResult.format]} | Time:{' '}
            {displayResult.timestamp.toLocaleTimeString()}
          </p>
        </div>
      )}

      {/* Supported formats */}
      <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
        <strong>Supported:</strong> {formats.map((f) => formatDisplayNames[f]).join(', ')}
      </div>
    </div>
  );
};

export default BarcodeScanner;
