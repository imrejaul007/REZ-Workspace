import { NextResponse } from 'next/server';

// Android Asset Links for now.rez.money
// SHA256 fingerprint: set ANDROID_SHA256_FINGERPRINT in Vercel env vars
// (copy from Play Console → Setup → App signing → SHA-256 certificate fingerprint)
export async function GET() {
  const fingerprint = process.env.ANDROID_SHA256_FINGERPRINT;
  if (!fingerprint || fingerprint === 'PLACEHOLDER_ADD_FROM_PLAY_CONSOLE') {
    return new Response('Android App Links not yet configured', { status: 503 });
  }

  const assetLinks = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.rez.consumer',
        sha256_cert_fingerprints: [fingerprint],
      },
    },
  ];

  return NextResponse.json(assetLinks, {
    headers: { 'Content-Type': 'application/json' },
  });
}
