// @ts-check
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_STRING?.trim()
    || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`;

const pool = new Pool({
    connectionString,
    ssl: process.env.REQUIRE_SSL === 'true'
        ? {
            rejectUnauthorized: true,
            ca: process.env.DB_SSL_CA?.trim()
        }
        : false
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = pool;
