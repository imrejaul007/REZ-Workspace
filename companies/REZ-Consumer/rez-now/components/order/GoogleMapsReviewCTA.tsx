'use client';

import Button from '@/components/ui/Button';

interface GoogleMapsReviewCTAProps {
  storeName: string;
  googleMapsPlaceId?: string | null;
  googleMapsUrl?: string | null;
}

export default function GoogleMapsReviewCTA({
  storeName,
  googleMapsPlaceId,
  googleMapsUrl,
}: GoogleMapsReviewCTAProps) {
  if (!googleMapsPlaceId && !googleMapsUrl) return null;

  const reviewUrl = googleMapsPlaceId
    ? `https://search.google.com/local/writereview?placeid=${googleMapsPlaceId}`
    : (googleMapsUrl as string);

  return (
    <div className="bg-white border border-gray-100 rounded-xl px-4 py-4 space-y-3">
      <div className="flex items-start gap-3">
        {/* Google Maps colour icon (SVG inline, no external deps) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="w-8 h-8 flex-shrink-0 mt-0.5"
          aria-hidden="true"
        >
          <path
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"
            fill="#EA4335"
          />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">Enjoying your experience?</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Help others discover {storeName} with a quick Google review.
          </p>
        </div>
      </div>
      <Button
        variant="secondary"
        size="sm"
        fullWidth
        onClick={() => window.open(reviewUrl, '_blank', 'noopener,noreferrer')}
      >
        Leave a Google review
      </Button>
    </div>
  );
}
