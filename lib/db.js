import mysql from 'mysql2/promise';

const db = mysql.createPool({
  host: process.env.DB_HOST || 'srv147.niagahoster.com',
  user: process.env.DB_USER || 'smpn1130_kaih',
  password: process.env.DB_PASSWORD || 'Belit4ng@',
  database: process.env.DB_NAME || 'smpn1130_dashboard-data',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default db;
