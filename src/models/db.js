const mysql = require('mysql2/promise');
require('dotenv').config();

/* OLD: host: 'localhost', user: 'root' hardcoded. 
Reason: Security risk (root user, no env vars). */

module.exports = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER, 
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT, 
  database: process.env.DB_NAME,
  connectionLimit: 10,
  waitForConnections: true
});
  
