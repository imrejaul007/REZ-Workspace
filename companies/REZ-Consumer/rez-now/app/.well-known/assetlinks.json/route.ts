import { NextResponse } from 'next/server';

const PACKAGE_NAME = process.env.ANDROID_PACKAGE_NAME ?? 'com.rez.money';
const SHA256_FINGERPRINT = process.env.ANDROID_SHA256_CERT_FINGERPRINT ?? 'PLACEHOLDER_SHA256';

export function GET() {
  const payload = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: PACKAGE_NAME,
        sha256_cert_fingerprints: [SHA256_FINGERPRINT],
      },
    },
  ];

  return new NextResponse(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
