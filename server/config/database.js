const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0,
    connectTimeout: 10000 // 10 seconds
});

pool.query('SELECT 1 AS ok', (err, rows) => {
    if (err) {
        console.log('Database error:', err.message);
    } else {
        console.log(`Database connection OK: ${process.env.DB_NAME}`);
    }
});

module.exports = pool;