// Supabase Edge Function template to proxy requests to n8n
// Deploy this function with the Supabase CLI (supabase functions deploy proxy-n8n)

// You can set the target n8n webhook URL as an environment variable when deploying
const TARGET_N8N_URL = Deno.env.get('N8N_WEBHOOK_URL') || '';

Deno.serve(async (req: Request) => {
  // Allow CORS (adjust allowed origins as needed)
  const origin = req.headers.get('origin') || '*';
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-target-url, x-client-info, apikey'
      }
    });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/(functions\/v1\/)?proxy-n8n\/?/, '');

    // If the function is set to proxy a specific webhook, use that; otherwise expect the client
    // to send the full target URL in header 'x-target-url' or use path as the webhook path.
    let target = TARGET_N8N_URL;
    const headerTarget = req.headers.get('x-target-url');
    if (!target && headerTarget) target = headerTarget;

    console.log(`[Proxy] Target URL: ${target || 'NONE'}`);

    // If still no target, try to build from path
    if (!target) {
      const host = Deno.env.get('N8N_HOST') || '';
      if (host) target = `${host}/${path.replace(/^\//, '')}`;
    }

    if (!target) {
      console.error('[Proxy] Error: No target URL configured');
      return new Response(JSON.stringify({ error: 'No target n8n URL configured' }), {
        status: 400,
        headers: { 'Access-Control-Allow-Origin': origin, 'Content-Type': 'application/json' }
      });
    }

    // Forward the request body and headers
    const forwardedHeaders = {} as Record<string, string>;
    for (const [k, v] of req.headers.entries()) {
      const lowerKey = k.toLowerCase();
      if ([
        'host',
        'origin',
        'referer',
        'x-target-url',
        'authorization',
        'apikey',
        'x-client-info'
      ].includes(lowerKey)) {
        continue;
      }
      forwardedHeaders[k] = v;
    }

    console.log(`[Proxy] Forwarding ${req.method} request to n8n...`);

    const resp = await fetch(target, {
      method: req.method,
      headers: forwardedHeaders,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.arrayBuffer()
    });

    console.log(`[Proxy] n8n responded with status: ${resp.status}`);

    const text = await resp.text();
    const responseHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': origin,
      'Content-Type': resp.headers.get('content-type') || 'text/plain'
    };

    return new Response(text, {
      status: resp.status,
      headers: responseHeaders
    });
  } catch (error: any) {
    console.error('[Proxy] Fatal Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': origin, 'Content-Type': 'application/json' }
    });
  }
});
