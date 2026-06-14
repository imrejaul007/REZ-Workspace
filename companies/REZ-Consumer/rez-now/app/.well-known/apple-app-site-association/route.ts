import { NextResponse } from 'next/server';

const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID ?? 'XXXXXXXXXX'; // Set in Vercel env
const BUNDLE_ID = process.env.IOS_BUNDLE_ID ?? 'com.rez.money';

export function GET() {
  const payload = {
    applinks: {
      apps: [],
      details: [
        {
          appIDs: [`${APPLE_TEAM_ID}.${BUNDLE_ID}`],
          components: [
            { '/': '/*', comment: 'All REZ Now paths open the REZ app' },
          ],
        },
      ],
    },
    webcredentials: {
      apps: [`${APPLE_TEAM_ID}.${BUNDLE_ID}`],
    },
  };

  return new NextResponse(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
