import bcrypt from 'bcrypt';
import argon2 from 'argon2';
import { createHash } from 'node:crypto';

// bcrypt truncates beyond 72 bytes. Domain-separated prehashing preserves the
// existing 128-character/Unicode password contract without silent truncation.
const prefix = 'bcrypt-sha256:';
const prepare = (password) => createHash('sha256').update('dsa-password-v1\0').update(password, 'utf8').digest('base64');
export function passwordRounds() {
  const rounds = Number(process.env.BCRYPT_ROUNDS || 12);
  if (!Number.isInteger(rounds) || rounds < 12 || rounds > 16) throw new Error('BCRYPT_ROUNDS must be an integer between 12 and 16.');
  return rounds;
}
export async function hashPassword(password) { return prefix + await bcrypt.hash(prepare(password), passwordRounds()); }
export async function verifyPassword(hash, password) {
  if (typeof hash !== 'string') return false;
  try {
    if (hash.startsWith(prefix)) return await bcrypt.compare(prepare(password), hash.slice(prefix.length));
    if (/^\$2[ab]\$/.test(hash)) return Buffer.byteLength(password, 'utf8') <= 72 && await bcrypt.compare(password, hash);
    if (hash.startsWith('$argon2id$')) return await argon2.verify(hash, password);
    return false; // Unknown formats require reset; never plaintext fallback.
  } catch { return false; }
}
export function needsPasswordUpgrade(hash) { return !hash.startsWith(prefix) || bcrypt.getRounds(hash.slice(prefix.length)) < passwordRounds(); }
