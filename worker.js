export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      if (request.method === 'POST' && url.pathname === '/.netlify/functions/submit') {
        return handleSubmit(request, env);
      }

      const response = await env.ASSETS.fetch(request);
      return addSecurityHeaders(response);
    } catch (err) {
      return new Response('Internal Server Error', { status: 500 });
    }
  }
};

function addSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src https://fonts.gstatic.com; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://formspree.io https://api.telegram.org;"
  );
  return new Response(response.body, {
    status: response.status,
    headers
  });
}

async function handleSubmit(request, env) {
  try {
    const data = await request.json();
    const { name, contact, email, biz, msg, lang } = data;

    if (!name || !contact) {
      return Response.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
    }

    const text = [
      '📨 *New lead — Voltex Agency*',
      `👤 *Name:* ${name}`,
      `📞 *Contact:* ${contact}`,
      email   ? `📧 *Email:* ${email}`       : null,
      biz     ? `🏪 *Business:* ${biz}`      : null,
      msg     ? `💬 *Message:* ${msg}`       : null,
      `🌐 *Language:* ${lang || 'en'}`
    ].filter(Boolean).join('\n');

    if (env.TG_TOKEN && env.TG_CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.TG_CHAT_ID,
          text,
          parse_mode: 'Markdown'
        })
      });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
