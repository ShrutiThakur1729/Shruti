import { createHash } from 'node:crypto';

const recipient = '1729.shruti@gmail.com';
const reply = (status, body) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

// Exported factory keeps the provider boundary testable without sending test mail.
export function contactHandler({ env = process.env, send = fetch } = {}) {
  return async (request) => {
    if (request.method !== 'POST') return reply(405, { error: 'Use POST to send a message.' });
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin) return reply(403, { error: 'Please send from this website.' });
    if (!request.headers.get('content-type')?.includes('application/json')) return reply(415, { error: 'Expected a JSON message.' });
    let form;
    try {
      const raw = await request.text();
      if (raw.length > 16000) return reply(413, { error: 'Your message is too long.' });
      form = JSON.parse(raw);
    } catch { return reply(400, { error: 'The message could not be read.' }); }
    if (!form || typeof form !== 'object' || form.company) return reply(400, { error: 'Please check the form and try again.' });
    const fields = {};
    for (const [key, max] of [['name', 100], ['email', 254], ['subject', 160], ['message', 6000]]) {
      if (typeof form[key] !== 'string' || !form[key].trim() || form[key].trim().length > max) return reply(400, { error: `Please enter a valid ${key}.` });
      fields[key] = form[key].trim();
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fields.email) || /[\r\n]/.test(fields.subject + fields.name)) return reply(400, { error: 'Please check your email, name and subject.' });
    if (!/^[a-f0-9-]{36}$/i.test(form.submissionId ?? '')) return reply(400, { error: 'Please refresh the page and try again.' });
    if (!env.RESEND_API_KEY || !env.CONTACT_FROM_EMAIL) return reply(503, { error: 'Email sending is not configured yet. Please email 1729.shruti@gmail.com directly.' });
    const payload = { from: env.CONTACT_FROM_EMAIL, to: [recipient], reply_to: fields.email, subject: `[The World Inside] ${fields.subject}`, text: `From: ${fields.name}\nReply to: ${fields.email}\n\n${fields.message}` };
    // Stable across retries, but a changed message cannot collide with the previous request.
    const hash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    try {
      const response = await send('https://api.resend.com/emails', {
        method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `${form.submissionId}-${hash}` },
        body: JSON.stringify(payload), signal: AbortSignal.timeout(15000),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data.id !== 'string') {
        console.error('[contact] Provider rejected message', { status: response.status, name: data.name, message: data.message });
        return reply(502, { error: 'The email service could not accept your message. Please retry or email Shruti directly.' });
      }
      return reply(202, { status: 'accepted', message: 'Your message was accepted by the email service for sending to Shruti. Inbox delivery is not yet confirmed.' });
    } catch { return reply(502, { error: 'The email service did not respond. Retry this message safely, or email Shruti directly.' }); }
  };
}

export default contactHandler();
export const config = { rateLimit: { windowLimit: 5, windowSize: 60, aggregateBy: ['ip', 'domain'] } };
