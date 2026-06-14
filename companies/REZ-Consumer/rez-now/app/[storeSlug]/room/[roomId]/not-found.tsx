/**
 * Hotel Room Hub — Not Found
 */

import Link from 'next/link';

export default function RoomHubNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Room Not Found</h1>
        <p className="text-sm text-gray-500 mb-6">
          This QR code may be invalid or expired. Please scan the QR code on your room door.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
        >
          Go to REZ Now
        </Link>
      </div>
    </div>
  );
}
