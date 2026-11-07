import test from 'node:test';
import assert from 'node:assert/strict';
import argon2 from '../backend/node_modules/argon2/argon2.cjs';
import bcrypt from '../backend/node_modules/bcrypt/bcrypt.js';
import { hashPassword, verifyPassword, needsPasswordUpgrade } from '../backend/src/passwords.js';
test('bcrypt password service supports updates and long passwords without truncation', async () => {
    const password = 'a'.repeat(90);
    const hash = await hashPassword(password);
    assert.match(hash, /^bcrypt-sha256:\$2b\$12\$/);
    assert.notEqual(hash, password);
    assert.equal(await verifyPassword(hash, password), true);
    assert.equal(await verifyPassword(hash, password + 'b'), false);
    assert.equal(needsPasswordUpgrade(hash), false);
    assert.notEqual(await hashPassword(password), hash);
    assert.equal(await verifyPassword('plaintext', 'plaintext'), false);
});
test('existing Argon2id stays verifiable and upgrades only with the correct password', async () => {
    const hash = await argon2.hash('existing-password', { type: argon2.argon2id });
    assert.equal(await verifyPassword(hash, 'existing-password'), true);
    assert.equal(await verifyPassword(hash, 'wrong-password'), false);
    assert.equal(needsPasswordUpgrade(hash), true);
});

test('standard bcrypt hashes remain verifiable without hashing the stored hash', async () => {
    const hash = await bcrypt.hash('legacy-password', 12);
    assert.equal(await verifyPassword(hash, 'legacy-password'), true);
    assert.equal(await verifyPassword(hash, 'wrong-password'), false);
    assert.equal(needsPasswordUpgrade(hash), true);
    const upgraded = await hashPassword('legacy-password');
    assert.equal(await verifyPassword(upgraded, 'legacy-password'), true);
    assert.equal(needsPasswordUpgrade(upgraded), false);
});
