Deploy this Supabase Edge Function to proxy requests to n8n and avoid CORS issues.

Usage

1. Set environment variables when deploying:
   - `N8N_WEBHOOK_URL` (optional) — full webhook URL to forward to, e.g. `https://lopez-dav.app.n8n.cloud/webhook-test/xxx`
   - or `N8N_HOST` (optional) — host part to build URL from path

2. Deploy with Supabase CLI:

```bash
supabase functions deploy proxy-n8n --env .env
```

3. Call the function from the browser using the function's URL:

```
https://<project>.functions.supabase.co/proxy-n8n
```

You can POST JSON directly. If you didn't set `N8N_WEBHOOK_URL`, include header `x-target-url: https://...` or call `https://.../proxy-n8n/webhook-test/xxxx` and set `N8N_HOST`.

Notes
- The function returns CORS headers allowing the calling origin.
- After deploying, set the config key `n8n_proxy_url` in `site_config` to the function URL so the app picks it up automatically.