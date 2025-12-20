Deno.serve(async (req) => {
  // Handle CORS preflight requests
  const origin = req.headers.get('origin') || '*';
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Max-Age': '86400',
      }
    })
  }

  try {
    let url = new URL(req.url).searchParams.get('url');

    // If not in query params, try to get from body
    if (!url && req.method === 'POST') {
      try {
        const body = await req.json();
        url = body.url;
      } catch (err) {
        console.error('Error parsing body:', err);
      }
    }

    console.log(`[fetch-html] Request method: ${req.method}, Resolved URL: ${url || 'NONE'}`);

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'Missing url parameter (checked query params and body)' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
          }
        }
      )
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return new Response(
        JSON.stringify({ error: `Invalid URL format: ${url}` }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
          }
        }
      )
    }

    // Fetch the HTML content
    console.log(`[fetch-html] Fetching ${url}...`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })

    if (!response.ok) {
      console.error(`[fetch-html] Failed to fetch. Status: ${response.status}`);
      return new Response(
        JSON.stringify({ error: `Failed to fetch URL: ${response.status} ${response.statusText}` }),
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': origin,
          }
        }
      )
    }

    const html = await response.text()
    console.log(`[fetch-html] Success: fetched ${html.length} characters.`);

    return new Response(
      JSON.stringify({ data: html }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
          'Cache-Control': 'public, max-age=3600',
        }
      }
    )
  } catch (error) {
    console.error('[fetch-html] Fatal error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
        }
      }
    )
  }
})
