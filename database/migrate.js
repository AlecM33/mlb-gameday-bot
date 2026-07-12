// @ts-check
'use strict';

const pool = require('./db');

const migrations = [
    // v3.4.0
    'ALTER TABLE gameday_subscribe_channels ADD COLUMN IF NOT EXISTS advanced_stats BOOLEAN NOT NULL DEFAULT TRUE;'
];

const maxAttempts = Number(process.env.DB_CONNECT_RETRIES || 15);
const retryDelayMs = Number(process.env.DB_CONNECT_RETRY_MS || 2000);

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {unknown} err
 * @returns {boolean}
 */
function isTransientConnectionError(err) {
    if (!err || typeof err !== 'object') {
        return false;
    }

    const error = /** @type {{ code?: string, message?: string }} */ (err);
    const message = (error.message || '').toLowerCase();

    return error.code === 'ECONNREFUSED'
        || error.code === 'ETIMEDOUT'
        || message.includes('database system is starting up')
        || message.includes('the database system is starting up')
        || message.includes('connection terminated unexpectedly');
}

(async () => {
    let client;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            client = await pool.connect();
            break;
        } catch (e) {
            const transient = isTransientConnectionError(e);
            const canRetry = transient && attempt < maxAttempts;

            if (!canRetry) {
                console.error(`[migrate] Failed to connect after ${attempt} attempt(s):`, e.message);
                process.exit(1);
            }

            console.error(`[migrate] DB not ready (attempt ${attempt}/${maxAttempts}). Retrying in ${retryDelayMs}ms...`);
            await sleep(retryDelayMs);
        }
    }

    try {
        for (const sql of migrations) {
            await client.query(sql);
            console.log(`[migrate] OK: ${sql}`);
        }
        console.log('[migrate] All migrations applied.');
    } catch (e) {
        console.error('[migrate] Migration failed:', e.message);
        process.exit(1);
    } finally {
        if (client) {
            client.release();
        }
        await pool.end();
    }
})();
