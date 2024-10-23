const { Pool } = require('pg');

const pool = new Pool({
  user: 'sunazuka',
  host: 'localhost',
  database: 'finalweb',
  password: '123456',
  port: 5432,
});

module.exports = pool;