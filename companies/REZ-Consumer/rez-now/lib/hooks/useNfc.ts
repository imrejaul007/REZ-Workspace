'use client';

import { useState, useRef, useCallback } from 'react';

export type NfcStatus = 'unsupported' | 'idle' | 'scanning' | 'read' | 'error';

export interface NfcRecord {
  recordType: string;
  data: string;
}

export function useNfc() {
  const isSupported =
    typeof window !== 'undefined' && 'NDEFReader' in window;

  const [status, setStatus] = useState<NfcStatus>(
    isSupported ? 'idle' : 'unsupported',
  );
  const [lastRecord, setLastRecord] = useState<NfcRecord | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopScan = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startScan = useCallback(async () => {
    if (!isSupported) return;

    stopScan();
    setStatus('scanning');
    setLastRecord(null);

    const controller = new AbortController();
    abortRef.current = controller;

    // 10-second timeout
    timeoutRef.current = setTimeout(() => {
      controller.abort();
      abortRef.current = null;
      timeoutRef.current = null;
      setStatus('idle');
    }, 10_000);

    try {
      const reader = new NDEFReader();

      reader.onreading = (event: NDEFReadingEvent) => {
        stopScan();

        // Decode the first text or url record
        const raw = event.message.records[0];
        let text = '';

        if (raw && raw.data) {
          const decoder = new TextDecoder(raw.encoding ?? 'utf-8');
          text = decoder.decode(raw.data);
        }

        const record: NfcRecord = {
          recordType: raw?.recordType ?? 'unknown',
          data: text,
        };

        setLastRecord(record);
        setStatus('read');
      };

      reader.onreadingerror = () => {
        stopScan();
        setStatus('error');
      };

      await reader.scan({ signal: controller.signal });
    } catch (err: unknown) {
      // AbortError is expected on stopScan / timeout — don't surface as error
      const name = err instanceof Error ? err.name : '';
      if (name !== 'AbortError') {
        setStatus('error');
      }
      abortRef.current = null;
    }
  }, [isSupported, stopScan]);

  return { isSupported, status, startScan, stopScan, lastRecord };
}
