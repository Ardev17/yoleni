/**
 * ============================================================
 * Yoleni Chemical AI - Database Connection
 * Suporta MYSQL_URL (Railway) ou variáveis individuais
 * ============================================================
 */

 const mysql = require('mysql2/promise');
 require('dotenv').config();
 
 let poolConfig;
 
 // Railway usa MYSQL_URL — suporta os dois formatos
 if (process.env.MYSQL_URL || process.env.DATABASE_URL) {
   const url = process.env.MYSQL_URL || process.env.DATABASE_URL;
   console.log('🔗 Usando MYSQL_URL para conectar...');
   poolConfig = {
     uri: url,
     waitForConnections: true,
     connectionLimit: 10,
     queueLimit: 0,
     ssl: { rejectUnauthorized: false },
   };
 } else {
   // Variáveis individuais (local ou Railway com vars separadas)
   poolConfig = {
     host:     process.env.DB_HOST     || 'localhost',
     port:     parseInt(process.env.DB_PORT) || 3306,
     user:     process.env.DB_USER     || 'root',
     password: process.env.DB_PASSWORD || '',
     database: process.env.DB_NAME     || 'railway',
     waitForConnections: true,
     connectionLimit: 10,
     queueLimit: 0,
     charset: 'utf8mb4',
   };
 }
 
 const pool = mysql.createPool(poolConfig);
 
 /**
  * Testa a conexão e cria as tabelas se não existirem
  */
 const testConnection = async () => {
   try {
     const connection = await pool.getConnection();
     console.log('✅ MySQL conectado com sucesso!');
     connection.release();
 
     // Cria tabelas automaticamente se não existirem
     await createTables();
   } catch (error) {
     console.error('❌ Erro ao conectar MySQL:', error.message);
     console.warn('⚠️  Rodando sem banco de dados (modo offline)');
   }
 };
 
 /**
  * Cria as tabelas automaticamente (não precisa executar schema.sql manualmente)
  */
 const createTables = async () => {
   try {
     await pool.execute(`
       CREATE TABLE IF NOT EXISTS analyses (
         id INT AUTO_INCREMENT PRIMARY KEY,
         title VARCHAR(255) DEFAULT 'Análise sem título',
         input_substances TEXT NOT NULL,
         ai_response LONGTEXT NOT NULL,
         substances_count INT DEFAULT 0,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
       ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
     `);
 
     await pool.execute(`
       CREATE TABLE IF NOT EXISTS substances (
         id INT AUTO_INCREMENT PRIMARY KEY,
         analysis_id INT NOT NULL,
         name VARCHAR(255) NOT NULL,
         formula VARCHAR(255),
         chemical_function VARCHAR(255),
         properties TEXT,
         industrial_application TEXT,
         environmental_impact VARCHAR(50),
         estimated_cost VARCHAR(100),
         pollution_level VARCHAR(50),
         maintenance_time VARCHAR(100),
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
       ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
     `);
 
     await pool.execute(`
       CREATE TABLE IF NOT EXISTS suggested_processes (
         id INT AUTO_INCREMENT PRIMARY KEY,
         analysis_id INT NOT NULL,
         process_name VARCHAR(255),
         reagents TEXT,
         estimated_efficiency VARCHAR(50),
         estimated_cost VARCHAR(100),
         environmental_impact VARCHAR(50),
         industrial_recommendation TEXT,
         process_type ENUM('optimized','low_cost','eco_friendly') DEFAULT 'optimized',
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
       ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
     `);
 
     console.log('✅ Tabelas verificadas/criadas com sucesso!');
   } catch (err) {
     console.warn('⚠️  Erro ao criar tabelas:', err.message);
   }
 };
 
 module.exports = { pool, testConnection };