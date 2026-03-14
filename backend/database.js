/**
 * ============================================================
 * Yoleni Chemical AI - Database Connection
 * Conexão com MySQL via mysql2
 * ============================================================
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool de conexões para melhor performance
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'yoleni_chemical',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

/**
 * Testa a conexão com o banco de dados
 */
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL conectado com sucesso!');
    connection.release();
  } catch (error) {
    console.error('❌ Erro ao conectar MySQL:', error.message);
    console.warn('⚠️  Rodando sem banco de dados (modo offline)');
  }
};

module.exports = { pool, testConnection };
