import { ImageResponse } from 'next/og'

export const size = { width: 16, height: 16 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 10,
          background: '#ff6b35',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
        }}
      >
        R
      </div>
    ),
    {
      ...size,
    }
  )
}