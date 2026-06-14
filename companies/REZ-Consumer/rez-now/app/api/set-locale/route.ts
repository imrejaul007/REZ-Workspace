import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_LOCALES = new Set(['en', 'hi']);

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const locale =
    body !== null &&
    typeof body === 'object' &&
    'locale' in body &&
    typeof (body as Record<string, unknown>).locale === 'string'
      ? (body as Record<string, string>).locale
      : null;

  if (!locale || !ALLOWED_LOCALES.has(locale)) {
    return NextResponse.json(
      { error: 'Invalid locale. Must be "en" or "hi".' },
      { status: 400 },
    );
  }

  const response = NextResponse.json({ success: true });
  response.headers.set(
    'Set-Cookie',
    `NEXT_LOCALE=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`,
  );

  return response;
}
