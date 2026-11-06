import test from 'node:test';
import assert from 'node:assert/strict';
import { parseApiResponse } from '../frontend/src/services/parseApiResponse.js';

test('API client rejects Vercel HTML instead of parsing it as JSON', async () => {
  const response = new Response('<script type="module"></script>', { status: 200, headers: { 'content-type': 'text/html' } });
  await assert.rejects(() => parseApiResponse(response), /Expected JSON from the API/);
});

test('API client preserves JSON API errors', async () => {
  const response = new Response(JSON.stringify({ error: 'Invalid email or password.' }), { status: 401, headers: { 'content-type': 'application/json' } });
  await assert.rejects(() => parseApiResponse(response), /Invalid email or password/);
});
