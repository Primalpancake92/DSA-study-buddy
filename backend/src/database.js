import { readFileSync } from 'node:fs';
import pg from 'pg';

const { Pool } = pg;

function readCaCertificate() {
    const inline = process.env.DATABASE_CA_CERT;
    const certificatePath = process.env.DATABASE_CA_CERT_PATH;
    if (inline && certificatePath)
        throw new Error('Configure only one of DATABASE_CA_CERT or DATABASE_CA_CERT_PATH.');
    if (!inline && !certificatePath) return undefined;
    const value = inline ? inline.replace(/\\n/g, '\n') : readFileSync(certificatePath, 'utf8');
    if (
        !value.includes('-----BEGIN CERTIFICATE-----') ||
        !value.includes('-----END CERTIFICATE-----')
    )
        throw new Error('DATABASE_CA_CERT must contain a PEM-encoded certificate.');
    return value;
}

function removeSslQueryParameters(connectionString) {
    const parsed = new URL(connectionString);
    for (const parameter of ['sslmode', 'sslrootcert', 'sslcert', 'sslkey'])
        parsed.searchParams.delete(parameter);
    return parsed.toString();
}

export function createDatabaseConfig() {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
    const sslEnabled = process.env.DATABASE_SSL !== 'false';
    const rejectUnauthorized = process.env.PGSSL_REJECT_UNAUTHORIZED !== 'false';
    if (process.env.NODE_ENV === 'production' && (!sslEnabled || !rejectUnauthorized))
        throw new Error(
            'Production PostgreSQL connections require DATABASE_SSL=true and PGSSL_REJECT_UNAUTHORIZED=true.'
        );
    const ca = sslEnabled ? readCaCertificate() : undefined;
    const connectionString = removeSslQueryParameters(process.env.DATABASE_URL);
    return {
        connectionString,
        max: Number(process.env.DB_POOL_MAX || 10),
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        ssl: sslEnabled ? { rejectUnauthorized, ...(ca ? { ca } : {}) } : undefined
    };
}

export function createDatabasePool() {
    const pool = new Pool(createDatabaseConfig());
    pool.on('error', (error) => logDatabaseError(error, 'pool-idle-client'));
    return pool;
}

export function logDatabaseError(error, context) {
    const category =
        error.code === 'SELF_SIGNED_CERT_IN_CHAIN' ||
        error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
            ? 'tls'
            : error.code === '28P01'
              ? 'authentication'
              : error.code === 'ENOTFOUND'
                ? 'dns'
                : error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED'
                  ? 'connection'
                  : 'database';
    console.error(
        '[database]',
        JSON.stringify({
            context,
            category,
            code: error.code,
            name: error.name,
            errno: error.errno,
            syscall: error.syscall,
            address: error.address,
            port: error.port
        })
    );
}
