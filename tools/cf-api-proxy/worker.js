// Stable public proxy for the NutriCare API.
// The frontend always calls https://nutricare-api.<subdomain>.workers.dev/api/v1/*
// This worker forwards to whatever local tunnel URL is set in TARGET (a var).
// When the quick-tunnel URL changes, just redeploy this worker with the new
// TARGET — the frontend never needs a rebuild.
export default {
  async fetch(request, env) {
    const target = (env.TARGET || '').replace(/\/+$/, '');
    if (!target) {
      return new Response('Proxy TARGET not configured', { status: 502 });
    }
    const url = new URL(request.url);
    const upstream = target + url.pathname + url.search;

    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('cf-connecting-ip');

    const init = {
      method: request.method,
      headers,
      redirect: 'manual',
    };
    if (!['GET', 'HEAD'].includes(request.method)) {
      init.body = await request.arrayBuffer();
      init.duplex = 'half';
    }

    const res = await fetch(upstream, init);
    const outHeaders = new Headers(res.headers);
    // Allow the browser to read responses from any origin the frontend uses.
    outHeaders.set('Access-Control-Allow-Origin', request.headers.get('Origin') || '*');
    outHeaders.set('Access-Control-Allow-Credentials', 'true');
    return new Response(res.body, { status: res.status, headers: outHeaders });
  },
};
