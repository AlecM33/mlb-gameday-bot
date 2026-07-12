// @ts-check
'use strict';

const pool = require('./db');

const migrations = [
    // v3.4.0
    'ALTER TABLE gameday_subscribe_channels ADD COLUMN IF NOT EXISTS advanced_stats BOOLEAN NOT NULL DEFAULT TRUE;'
];

(async () => {
    const client = await pool.connect();
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
        client.release();
        await pool.end();
    }
})();

