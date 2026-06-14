'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { detectQRType, type QRType } from '@/lib/api/room-service';
import { logger } from '@/lib/utils/logger';

interface Props {
  params: Promise<{ storeSlug: string }>;
}

export default function RoomScanPage({ params }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function processQR() {
      try {
        // Get QR data from URL params (after scanning)
        const qrData = searchParams.get('data');
        const rawSlug = searchParams.get('slug');
        const token = searchParams.get('token');

        // If we have a storeSlug in URL, this is a direct room link
        const { storeSlug } = await params;
        if (storeSlug && token) {
          // Direct room access via hotel store page
          router.push(`/${storeSlug}/room/${storeSlug}?token=${encodeURIComponent(token)}`);
          return;
        }

        // Process QR code data
        if (!qrData) {
          setError('No QR code data found. Please scan a valid QR code.');
          setLoading(false);
          return;
        }

        const qrResult = detectQRType(qrData);
        logger.info('[RoomScan] QR detected', { qrResult, rawSlug });

        if (qrResult.type === 'room') {
          // Navigate to room hub with token
          router.push(`/room/room-hub?token=${encodeURIComponent(qrData)}`);
        } else if (qrResult.type === 'store') {
          // Navigate to store page
          router.push(`/${qrResult.identifier}`);
        } else {
          setError('Invalid QR code format. Please scan a valid hotel QR code.');
          setLoading(false);
        }
      } catch (err) {
        logger.error('[RoomScan] Error processing QR', { error: err });
        setError('Failed to process QR code. Please try again.');
        setLoading(false);
      }
    }

    processQR();
  }, [searchParams, params, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Processing QR code...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Invalid QR Code</h1>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return null;
}
