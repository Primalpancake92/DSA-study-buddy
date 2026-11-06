import test from 'node:test';
import assert from 'node:assert/strict';
import { createDatabaseConfig } from '../backend/src/database.js';

const original = { ...process.env };

function restoreEnvironment() {
  for (const key of Object.keys(process.env)) if (!(key in original)) delete process.env[key];
  for (const [key, value] of Object.entries(original)) process.env[key] = value;
}

test.afterEach(restoreEnvironment);

test('production database config keeps TLS verification enabled and strips URL SSL overrides', () => {
  process.env.NODE_ENV = 'production';
  process.env.DATABASE_URL = 'postgresql://user:password@pooler.example.test:5432/postgres?sslmode=require&sslrootcert=ignored';
  process.env.DATABASE_SSL = 'true';
  process.env.PGSSL_REJECT_UNAUTHORIZED = 'true';
  const config = createDatabaseConfig();
  assert.equal(config.ssl.rejectUnauthorized, true);
  assert.equal(config.connectionString.includes('sslmode'), false);
  assert.equal(config.connectionString.includes('sslrootcert'), false);
});

test('inline PEM CA certificates decode escaped newlines', () => {
  process.env.DATABASE_URL = 'postgresql://user:password@pooler.example.test:5432/postgres';
  process.env.DATABASE_SSL = 'true';
  process.env.PGSSL_REJECT_UNAUTHORIZED = 'true';
  process.env.DATABASE_CA_CERT = '-----BEGIN CERTIFICATE-----\\ntrusted\\n-----END CERTIFICATE-----';
  assert.equal(createDatabaseConfig().ssl.ca, '-----BEGIN CERTIFICATE-----\ntrusted\n-----END CERTIFICATE-----');
});

test('invalid CA configuration fails clearly', () => {
  process.env.DATABASE_URL = 'postgresql://user:password@pooler.example.test:5432/postgres';
  process.env.DATABASE_SSL = 'true';
  process.env.PGSSL_REJECT_UNAUTHORIZED = 'true';
  process.env.DATABASE_CA_CERT = 'not-a-certificate';
  assert.throws(() => createDatabaseConfig(), /DATABASE_CA_CERT must contain a PEM-encoded certificate/);
});
