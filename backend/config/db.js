const sql = require('mysql2/promise');

const config = {
  host: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'QL_DangKyHocPhan',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '12345678',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Cho phep query dung placeholder dang :ten_tham_so.
  namedPlaceholders: true
};

let pool;

async function connectDB() {
  if (pool) return pool;
  pool = sql.createPool(config);
  await pool.query('SELECT 1');
  console.log('Ket noi MySQL thanh cong');
  return pool;
}

async function execQuery(query, params = {}) {
  const [rows] = await pool.query(query, params);
  return rows;
}

async function execSP(spName, params = {}) {
  if (!/^[A-Za-z0-9_]+$/.test(spName)) {
    throw new Error('Invalid stored procedure name');
  }

  const keys = Array.isArray(params) ? [] : Object.keys(params);
  const placeholders = Array.isArray(params)
    ? params.map(() => '?').join(',')
    : keys.map((k) => `:${k}`).join(',');

  const callSql = `CALL ${spName}(${placeholders})`;
  const [rows] = await pool.query(callSql, params);
  return rows;
}

module.exports = { connectDB, execQuery, execSP, sql };
