import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.rezapp.com';

interface StoreData {
  name: string;
  logo: string | null;
  address: string;
}

async function fetchStoreName(storeSlug: string): Promise<StoreData | null> {
  try {
    const res = await fetch(`${API_BASE}/api/web-ordering/store/${storeSlug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.success && json?.data?.store) {
      return json.data.store as StoreData;
    }
    return null;
  } catch {
    return null;
  }
}

export default async function OGImage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const store = await fetchStoreName(storeSlug);

  const displayName = store?.name ?? storeSlug.replace(/-/g, ' ');
  const subtitle = store?.address ?? 'Order online — earn REZ coins';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
          padding: '60px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* REZ Now badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 700,
              color: '#ffffff',
            }}
          >
            R
          </div>
          <span
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.85)',
              letterSpacing: '0.05em',
            }}
          >
            REZ Now
          </span>
        </div>

        {/* Store name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.1,
            maxWidth: '900px',
            wordBreak: 'break-word',
          }}
        >
          {displayName}
        </div>

        {/* Subtitle */}
        <div
          style={{
            marginTop: '24px',
            fontSize: 32,
            color: 'rgba(255,255,255,0.75)',
            textAlign: 'center',
            maxWidth: '700px',
          }}
        >
          {subtitle}
        </div>
      </div>
    ),
    { ...size },
  );
}
