import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { createDatabasePool, logDatabaseError } from './database.js';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });
const pool = createDatabasePool();
try {
    // Aggregate classifications only: never fetch hashes, emails or user IDs.
    const { rows } = await pool.query(`SELECT
    count(*)::int AS total,
    count(*) FILTER (WHERE password_hash LIKE '$argon2id$%')::int AS argon2id,
    count(*) FILTER (WHERE password_hash ~ '^[$]2[ab][$][0-9]{2}[$][./A-Za-z0-9]{53}$')::int AS bcrypt,
    count(*) FILTER (WHERE password_hash LIKE 'bcrypt-sha256:$2%')::int AS bcrypt_sha256
    FROM users`);
    const counts = rows[0];
    console.info(
        JSON.stringify({
            ...counts,
            unknown: counts.total - counts.argon2id - counts.bcrypt - counts.bcrypt_sha256,
            note: 'Format classification only; does not establish hash validity or password strength.'
        })
    );
} catch (error) {
    logDatabaseError(error, 'password-format-audit');
    process.exitCode = 1;
} finally {
    await pool.end();
}
