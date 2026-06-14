'use client';

import { useEffect } from 'react';
import { useNfc } from '@/lib/hooks/useNfc';

interface NfcPayButtonProps {
  onNfcConfirmed: (record: string) => void;
}

export default function NfcPayButton({ onNfcConfirmed }: NfcPayButtonProps) {
  const { isSupported, status, startScan, stopScan, lastRecord } = useNfc();

  // Fire callback when a record is read
  useEffect(() => {
    if (status === 'read' && lastRecord) {
      // NW-MED-025: Validate NFC record format before invoking onNfcConfirmed.
      // Accept only non-empty strings that look like payment references:
      // alphanumeric, dashes, underscores, max 128 chars.
      const raw = lastRecord.data;
      if (typeof raw !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(raw)) {
        return;
      }
      onNfcConfirmed(raw);
    }
  }, [status, lastRecord, onNfcConfirmed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopScan();
  }, [stopScan]);

  // Hidden on unsupported browsers
  if (!isSupported) return null;

  const isScanning = status === 'scanning';

  function handlePress() {
    if (isScanning) {
      stopScan();
    } else {
      startScan();
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 mt-1">
      {/* Divider */}
      <div className="flex items-center gap-3 w-full">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <button
        type="button"
        onClick={handlePress}
        className={[
          'relative flex items-center justify-center gap-3 w-full rounded-2xl px-5 py-4 font-semibold text-base transition-all duration-200',
          isScanning
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
            : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100',
        ].join(' ')}
        aria-label={isScanning ? 'Hold your phone to the terminal' : 'Tap to Pay via NFC'}
      >
        {/* NFC wave icon */}
        <span className={isScanning ? 'animate-pulse' : ''}>
          <NfcWaveIcon scanning={isScanning} />
        </span>

        <span>
          {isScanning ? 'Hold your phone to the terminal…' : 'Tap to Pay'}
        </span>

        {/* Pulsing ring when scanning */}
        {isScanning && (
          <span className="absolute inset-0 rounded-2xl ring-2 ring-indigo-400 animate-ping opacity-30 pointer-events-none" />
        )}
      </button>

      {/* Status messages */}
      {status === 'error' && (
        <p className="text-xs text-red-500 text-center">
          NFC read failed — tap the button to try again.
        </p>
      )}
      {status === 'idle' && lastRecord === null && (
        // After a timeout reset, show nothing extra
        null
      )}
      {status === 'scanning' && (
        <p className="text-xs text-indigo-500 text-center animate-pulse">
          Waiting for NFC tag… (times out in 10 s)
        </p>
      )}
    </div>
  );
}

// ── Inline NFC wave SVG ─────────────────────────────────────────────────────

function NfcWaveIcon({ scanning }: { scanning: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={['w-6 h-6', scanning ? 'text-white' : 'text-indigo-600'].join(' ')}
      aria-hidden="true"
    >
      {/* Phone chip / card body */}
      <rect x="2" y="7" width="9" height="14" rx="1.5" />
      {/* NFC waves emanating right */}
      <path d="M14 10.5a3.5 3.5 0 0 1 0 5" />
      <path d="M17.5 8a7 7 0 0 1 0 10" />
    </svg>
  );
}
