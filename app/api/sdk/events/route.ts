import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sdkEventsSchema, SDKEvent, validate } from '@/lib/validation';
import { logger } from '@/lib/errors';

export async function POST(request: NextRequest) {
  // CORS headers
  const origin = request.headers.get('origin') || '*';

  try {
    // Authenticate via API key
    const apiKey = request.headers.get('x-abo-key');
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key' },
        { status: 401, headers: corsHeaders(origin) }
      );
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Server error' },
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    // Look up user by API key
    // Try user table first (fast O(1) lookup if sdk_api_key column exists)
    let userId: string | null = null;

    const { data: userData } = await supabase
      .from('user')
      .select('id')
      .eq('sdk_api_key', apiKey)
      .single();

    if (userData) {
      userId = userData.id;
    } else {
      // Fallback: search auth.users metadata (handles case where column doesn't exist)
      const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const matchedUser = listData?.users?.find(
        (u) => u.user_metadata?.sdk_api_key === apiKey
      );
      if (matchedUser) {
        userId = matchedUser.id;
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401, headers: corsHeaders(origin) }
      );
    }

    // Parse and validate body with Zod
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Corps JSON invalide' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    // Normalize to array format
    const eventsPayload = Array.isArray(body.events) ? body : { events: [body] };

    const validation = validate(sdkEventsSchema, eventsPayload);
    if (!validation.success) {
      logger.warn('SDK events validation failed', {
        userId,
        details: validation.details,
      });
      return NextResponse.json(
        {
          error: 'Donnees invalides',
          details: validation.details.map((d) => ({
            field: d.path.join('.'),
            message: d.message,
          })),
        },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const events: SDKEvent[] = validation.data.events;

    // Try to resolve subscriber for each event
    const resolvedEvents = await Promise.all(
      events.map(async (event) => {
        let subscriberId: string | null = null;

        // Try to match by email first, then stripe customer ID
        if (event.email) {
          const { data } = await supabase
            .from('subscriber')
            .select('id')
            .eq('user_id', userId)
            .eq('email', event.email)
            .limit(1)
            .single();
          if (data) subscriberId = data.id;
        }

        if (!subscriberId && event.stripeCustomerId) {
          const { data } = await supabase
            .from('subscriber')
            .select('id')
            .eq('user_id', userId)
            .eq('stripe_customer_id', event.stripeCustomerId)
            .limit(1)
            .single();
          if (data) subscriberId = data.id;
        }

        return {
          user_id: userId,
          subscriber_id: subscriberId,
          visitor_id: event.visitorId || null,
          email: event.email || null,
          stripe_customer_id: event.stripeCustomerId || null,
          external_user_id: event.userId || null,
          event_type: event.type,
          event_name: event.name || null,
          event_data: event.data || {},
          page_url: event.url || null,
          page_title: event.title || null,
          page_path: event.path || null,
          referrer: event.referrer || null,
          session_id: event.sessionId || null,
          device_type: event.device?.type || null,
          browser: event.device?.browser || null,
          os: event.device?.os || null,
          screen_width: event.device?.screenWidth || null,
          screen_height: event.device?.screenHeight || null,
          event_at: event.timestamp || new Date().toISOString(),
        };
      })
    );

    const { error: insertError } = await supabase
      .from('behavioral_event')
      .insert(resolvedEvents);

    if (insertError) {
      logger.error('SDK event insert error', {
        userId,
        errorCode: insertError.code,
        errorMessage: insertError.message,
      });
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement des evenements' },
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    return NextResponse.json(
      { success: true, count: resolvedEvents.length },
      { headers: corsHeaders(origin) }
    );
  } catch (error) {
    logger.error('SDK events error', {
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500, headers: corsHeaders(request.headers.get('origin') || '*') }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-abo-key',
    'Access-Control-Max-Age': '86400',
  };
}
