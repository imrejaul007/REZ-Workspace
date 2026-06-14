import { useState, useCallback, useRef, useEffect } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { BarcodeFormat, BarcodeResult, ScannerConfig } from '../types';
import { getHtml5QrcodeFormats, parseBarcodeValue } from '../utils/formats';

interface UseBarcodeScannerOptions {
  formats?: BarcodeFormat[];
  scanInterval?: number;
  continuousScan?: boolean;
  beepOnScan?: boolean;
  vibrateOnScan?: boolean;
  onScan?: (result: BarcodeResult) => void;
  onError?: (error: Error) => void;
}

interface UseBarcodeScannerReturn {
  hasPermission: boolean | null;
  isScanning: boolean;
  lastResult: BarcodeResult | null;
  error: Error | null;
  requestPermission: () => Promise<boolean>;
  startScanning: (elementId: string) => Promise<void>;
  stopScanning: () => Promise<void>;
  toggleScanning: (elementId: string) => Promise<void>;
  clearLastResult: () => void;
}

const DEFAULT_CONFIG: Required<Omit<ScannerConfig, 'formats'>> = {
  scanInterval: 500,
  continuousScan: false,
  beepOnScan: true,
  vibrateOnScan: true,
};

export const useBarcodeScanner = (
  options: UseBarcodeScannerOptions = {}
): UseBarcodeScannerReturn => {
  const {
    formats = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
    scanInterval = 500,
    continuousScan = false,
    beepOnScan = true,
    vibrateOnScan = true,
    onScan,
    onError,
  } = options;

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<BarcodeResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const lastBarcodeRef = useRef<string>('');

  // Audio context for beep sound
  const audioContextRef = useRef<AudioContext | null>(null);

  const playBeep = useCallback(() => {
    if (!beepOnScan) return;

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
  }, [beepOnScan]);

  const vibrate = useCallback(() => {
    if (!vibrateOnScan) return;

    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }
    } catch (err) {
      console.warn('Failed to vibrate:', err);
    }
  }, [vibrateOnScan]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      // For browser-based scanning, we don't need explicit camera permission
      // The browser will prompt when we try to start scanning
      setHasPermission(true);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to request permission');
      setError(error);
      setHasPermission(false);
      onError?.(error);
      return false;
    }
  }, [onError]);

  const startScanning = useCallback(
    async (elementId: string): Promise<void> => {
      if (isScanning) return;

      try {
        setError(null);

        // Clean up existing scanner
        if (scannerRef.current) {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        }

        const scanner = new Html5Qrcode(elementId);
        scannerRef.current = scanner;

        // Map our formats to html5-qrcode formats
        const html5Formats = formats.map((f) => {
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
          return formatMap[f];
        });

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            formatsToSupport: html5Formats,
          },
          (decodedText, decodedResult) => {
            const now = Date.now();

            // Debounce duplicate scans
            if (
              decodedText === lastBarcodeRef.current &&
              now - lastScanTimeRef.current < scanInterval
            ) {
              return;
            }

            const parsedValue = parseBarcodeValue(decodedText);
            const format = formats[0]; // Use first format as default

            const result: BarcodeResult = {
              value: parsedValue,
              format,
              timestamp: new Date(),
            };

            lastBarcodeRef.current = parsedValue;
            lastScanTimeRef.current = now;
            setLastResult(result);

            // Play feedback
            playBeep();
            vibrate();

            // Notify callback
            onScan?.(result);

            // Stop if not continuous
            if (!continuousScan) {
              // Small delay to show the result
              setTimeout(() => {
                if (!continuousScan && scannerRef.current) {
                  scannerRef.current.stop().catch(() => {});
                }
              }, 500);
            }
          },
          () => {
            // QR code parse error - ignore, this happens frequently
          }
        );

        setIsScanning(true);
        setHasPermission(true);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to start scanner');
        setError(error);
        setIsScanning(false);
        onError?.(error);
      }
    },
    [formats, scanInterval, continuousScan, onScan, onError, playBeep, vibrate]
  );

  const stopScanning = useCallback(async (): Promise<void> => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
      setIsScanning(false);
      lastBarcodeRef.current = '';
    } catch (err) {
      console.warn('Error stopping scanner:', err);
      setIsScanning(false);
    }
  }, []);

  const toggleScanning = useCallback(
    async (elementId: string): Promise<void> => {
      if (isScanning) {
        await stopScanning();
      } else {
        await startScanning(elementId);
      }
    },
    [isScanning, startScanning, stopScanning]
  );

  const clearLastResult = useCallback(() => {
    setLastResult(null);
    lastBarcodeRef.current = '';
  }, []);

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

  return {
    hasPermission,
    isScanning,
    lastResult,
    error,
    requestPermission,
    startScanning,
    stopScanning,
    toggleScanning,
    clearLastResult,
  };
};

export default useBarcodeScanner;
