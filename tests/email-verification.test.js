import test from 'node:test';
import assert from 'node:assert/strict';
import { createVerificationToken, validateEmailAddress } from '../backend/src/emailService.js';

test('verification tokens are cryptographically random and stored as hashes', () => {
  const first = createVerificationToken();
  const second = createVerificationToken();
  assert.equal(first.rawToken.length, 64);
  assert.equal(first.tokenHash.length, 64);
  assert.notEqual(first.rawToken, first.tokenHash);
  assert.notEqual(first.rawToken, second.rawToken);
});

test('email syntax validation rejects malformed addresses before DNS lookup', async () => {
  const result = await validateEmailAddress('not-an-email');
  assert.deepEqual(result, { ok: false, code: 'INVALID_EMAIL', message: 'Enter a valid email address.' });
});
