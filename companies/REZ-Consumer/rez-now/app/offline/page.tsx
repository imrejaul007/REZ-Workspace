import type { Metadata } from 'next';
import { ReloadButton } from './reload-button';

export const metadata: Metadata = {
  title: 'Offline — REZ Now',
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-6 text-center">
      {/* Wifi-off icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-20 w-20 text-indigo-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3l18 18M8.11 8.11A7.49 7.49 0 0 0 4.93 10.5M15.89 8.11A7.49 7.49 0 0 1 19.07 10.5M12 20h.01M6.34 13.76A5 5 0 0 0 9.17 12.5M17.66 13.76A5 5 0 0 0 14.83 12.5"
        />
      </svg>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">
          {"You're offline"}
        </h1>
        <p className="text-base text-gray-500">
          Check your connection and try again.
        </p>
      </div>

      <ReloadButton />
    </main>
  );
}
