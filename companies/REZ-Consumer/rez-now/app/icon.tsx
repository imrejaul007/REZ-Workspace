import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#6366f1',
          borderRadius: '20%',
        }}
      >
        <span
          style={{
            color: '#ffffff',
            fontSize: 300,
            fontWeight: 700,
            lineHeight: 1,
            fontFamily: 'sans-serif',
          }}
        >
          R
        </span>
      </div>
    ),
    { ...size }
  );
}
