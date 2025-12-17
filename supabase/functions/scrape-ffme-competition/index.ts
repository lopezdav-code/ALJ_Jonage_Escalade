// Follow this setup guide to integrate the Deno template into your project:
// https://deno.land/manual@v1.42.0/getting_started/setup_your_environment
// This will add a `deno.json` and workflow file for running tests.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log(`Function "scrape-ffme-competition" loaded`)

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const ffmeId = url.searchParams.get('id')
    
    if (!ffmeId) {
      return new Response(
        JSON.stringify({ error: 'Missing id parameter' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const targetUrl = `https://mycompet.ffme.fr/resultat/resultat_${ffmeId}`
    
    console.log(`Fetching: ${targetUrl}`)

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          error: `HTTP ${response.status}`,
          status: response.status
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const html = await response.text()

    // Extract title from <div class="title">
    const titleMatch = html.match(/<div[^>]*class="title"[^>]*>([^<]*)<\/div>/i) ||
                       html.match(/<div[^>]*class="title"[^>]*>\s*([^<]*?)\s*<\/div>/i)
    
    const title = titleMatch ? titleMatch[1].trim() : null

    if (!title) {
      return new Response(
        JSON.stringify({ 
          error: 'No title found',
          html: html.substring(0, 500) // Return first 500 chars for debugging
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        ffme_id: parseInt(ffmeId),
        title: title
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: error.constructor.name
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/* To invoke locally:

  1. Build functions: `supabase functions deploy scrape-ffme-competition --no-verify`

  2. Create functions locally and run them directly by calling http://localhost:54321/functions/v1/scrape-ffme-competition

curl -i --location --request POST 'http://localhost:54321/functions/v1/scrape-ffme-competition' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  --header 'Content-Type: application/json' \
  --data '{"id":"13150"}'

*/
