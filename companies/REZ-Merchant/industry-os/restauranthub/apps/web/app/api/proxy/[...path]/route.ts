import { NextRequest, NextResponse } from 'next/server';

const BACKEND = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1')
  .replace(/\/api\/v1\/?$/, '');

// RESTRICT CORS to specific origins - no wildcard
const ALLOWED_ORIGINS = (process.env.ALLOWED_CORS_ORIGINS || 'https://restauranthub.app,https://admin.restauranthub.app').split(',');

const SKIP_HEADERS = new Set([
  'host', 'connection', 'content-length', 'transfer-encoding',
]);

function getCorsOrigin(origin: string | null): string {
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  // Fallback to first allowed origin, never use wildcard
  return ALLOWED_ORIGINS[0] || 'null';
}

async function proxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const url = new URL(`${BACKEND}/api/v1/${path}${req.nextUrl.search}`);

  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    if (!SKIP_HEADERS.has(key.toLowerCase())) {
      headers[key] = value;
    }
  });

  let body: BodyInit | undefined;
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    body = await req.arrayBuffer();
  }

  try {
    const upstream = await fetch(url.toString(), {
      method: req.method,
      headers,
      body,
      // @ts-ignore — Node fetch option
      duplex: 'half',
    });

    const resHeaders: Record<string, string> = {};
    upstream.headers.forEach((value, key) => {
      if (!SKIP_HEADERS.has(key.toLowerCase())) {
        resHeaders[key] = value;
      }
    });

    // Restrict CORS to specific origins
    const origin = req.headers.get('origin');
    resHeaders['Access-Control-Allow-Origin'] = getCorsOrigin(origin);
    resHeaders['Access-Control-Allow-Credentials'] = 'true';

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: resHeaders,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { message: 'Backend unavailable', error: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = async (req: NextRequest) => {
  const origin = req.headers.get('origin');
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': getCorsOrigin(origin),
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With,Accept',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
};
