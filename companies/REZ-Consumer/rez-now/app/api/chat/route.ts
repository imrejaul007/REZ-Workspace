import { NextRequest } from 'next/server';
import { logger } from '@/lib/utils/logger';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeSlug, message, conversationId, customerId } = body as {
      storeSlug: string;
      message: string;
      conversationId: string;
      customerId?: string;
    };

    if (!storeSlug || !message || !conversationId) {
      return Response.json(
        { success: false, error: 'Missing required fields: storeSlug, message, conversationId' },
        { status: 400 }
      );
    }

    const internalToken = process.env.INTERNAL_SERVICE_TOKEN;
    if (!internalToken) {
      return Response.json(
        { success: false, error: 'Internal service token not configured' },
        { status: 500 }
      );
    }

    const internalApiUrl = process.env.INTERNAL_API_URL;
    if (!internalApiUrl) {
      return Response.json(
        { success: false, error: 'Internal API URL not configured' },
        { status: 500 }
      );
    }

    const upstream = await fetch(`${internalApiUrl}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': internalToken,
      },
      body: JSON.stringify({ storeSlug, message, conversationId, customerId }),
    });

    let data;
    try {
      data = await upstream.json();
    } catch (jsonErr) {
      logger.error('[chat/route] upstream returned non-JSON', { error: jsonErr, status: upstream.status });
      return Response.json(
        { success: false, error: 'Upstream error' },
        { status: 502 }
      );
    }
    return Response.json(data, { status: upstream.status });
  } catch (err) {
    logger.error('[chat/route] Edge function error', { error: err });
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
