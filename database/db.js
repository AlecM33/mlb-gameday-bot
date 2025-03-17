const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

console.log(process.env.DATABASE_STRING?.trim());
const pool = new Pool({
    connectionString: process.env.DATABASE_STRING?.trim(),
    ssl: process.env.REQUIRE_SSL === 'true'
        ? {
            rejectUnauthorized: true,
            ca: fs.readFileSync(path.join(__dirname, '/certs/ca.pem')).toString()
        }
        : false
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = pool;
