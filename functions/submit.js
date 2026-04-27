// Netlify serverless function — handles Telegram notification for form submissions
exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { name, contact, email, biz, msg, lang } = JSON.parse(event.body || '{}');

    if (!name || !contact) {
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Missing required fields' }) };
    }

    const text = [
      '📨 *New lead — Voltex Agency*',
      `👤 *Name:* ${name}`,
      `📞 *Contact:* ${contact}`,
      email ? `📧 *Email:* ${email}`   : null,
      biz   ? `🏪 *Business:* ${biz}` : null,
      msg   ? `💬 *Message:* ${msg}`  : null,
      `🌐 *Language:* ${lang || 'en'}`
    ].filter(Boolean).join('\n');

    const token  = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (token && chatId) {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
      });
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok: false }) };
  }
};
