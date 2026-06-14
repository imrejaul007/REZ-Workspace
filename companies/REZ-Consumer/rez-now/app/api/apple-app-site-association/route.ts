import { NextResponse } from 'next/server';

// iOS Universal Links for now.rez.money
// Set APPLE_TEAM_ID in Vercel env vars (10-char Apple Developer Team ID)
export async function GET() {
  const teamId = process.env.APPLE_TEAM_ID;
  if (!teamId || teamId === 'TEAMID') {
    return new Response('iOS Universal Links not yet configured', { status: 503 });
  }

  const aasa = {
    applinks: {
      details: [
        {
          appIDs: [`${teamId}.com.rez.consumer`],
          components: [
            { '/': '/*', comment: 'All paths on now.rez.money open in REZ consumer app' },
          ],
        },
      ],
    },
  };

  return NextResponse.json(aasa, {
    headers: { 'Content-Type': 'application/json' },
  });
}
