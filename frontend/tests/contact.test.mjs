import test from 'node:test';
import assert from 'node:assert/strict';
import { contactHandler } from '../netlify/functions/contact.mjs';
const valid = { name: 'Test visitor', email: 'test@example.com', subject: 'Test', message: 'A test that never sends email.', company: '', submissionId: 'e3de6c09-947b-4354-9a48-8269d9e333cc' };
const req = (body = valid, origin = 'https://shruti11.netlify.app') => new Request('https://shruti11.netlify.app/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json', origin }, body: JSON.stringify(body) });
test('rejects invalid fields, honeypot, origin and oversize messages before provider', async () => {
  const handler = contactHandler({ env: {}, send: () => { throw new Error('must not call'); } });
  for (const patch of [{ name: '' }, { email: 'invalid' }, { company: 'spam' }, { message: 'a'.repeat(6001) }, { subject: 'header\ninjection' }]) assert.equal((await handler(req({ ...valid, ...patch }))).status, 400);
  assert.equal((await handler(req(valid, 'https://untrusted.example'))).status, 403);
});
test('missing configuration is an explicit failure, never success', async () => assert.equal((await contactHandler({ env: {} })(req())).status, 503));
test('provider accepted status and stable retry idempotency, fixed recipient', async () => {
  const calls = [];
  const handler = contactHandler({ env: { RESEND_API_KEY: 'test-only', CONTACT_FROM_EMAIL: 'test@example.com' }, send: async (url, init) => { calls.push(init); return Response.json({ id: 'test-id' }); } });
  const response = await handler(req()); await handler(req());
  assert.equal(response.status, 202); assert.equal((await response.json()).status, 'accepted');
  assert.equal(calls[0].headers['Idempotency-Key'], calls[1].headers['Idempotency-Key']);
  assert.deepEqual(JSON.parse(calls[0].body).to, ['1729.shruti@gmail.com']);
});
test('provider failure does not report acceptance', async () => {
  const handler = contactHandler({ env: { RESEND_API_KEY: 'test-only', CONTACT_FROM_EMAIL: 'test@example.com' }, send: async () => Response.json({ error: 'rejected' }, { status: 403 }) });
  assert.equal((await handler(req())).status, 502);
});
