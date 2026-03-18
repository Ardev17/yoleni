/**
 * ============================================================
 * Yoleni Industrial AI - Database v2.0
 * Suporta MYSQL_URL (Railway) e variáveis individuais
 * ============================================================
 */

 const mysql = require('mysql2/promise');
 require('dotenv').config();
 
 let poolConfig;
 
 if (process.env.MYSQL_URL) {
   console.log('🔗 Usando MYSQL_URL...');
   const url = new URL(process.env.MYSQL_URL);
   poolConfig = {
     host:     url.hostname,
     port:     parseInt(url.port) || 3306,
     user:     url.username,
     password: url.password,
     database: url.pathname.replace('/', ''),
     waitForConnections: true,
     connectionLimit: 10,
     queueLimit: 0,
     ssl: { rejectUnauthorized: false },
   };
 } else {
   poolConfig = {
     host:     process.env.DB_HOST     || 'localhost',
     port:     parseInt(process.env.DB_PORT) || 3306,
     user:     process.env.DB_USER     || 'root',
     password: process.env.DB_PASSWORD || '',
     database: process.env.DB_NAME     || 'yoleni_chemical',
     waitForConnections: true,
     connectionLimit: 10,
     queueLimit: 0,
     charset: 'utf8mb4',
   };
 }
 
 const pool = mysql.createPool(poolConfig);
 
 const testConnection = async () => {
   try {
     const conn = await pool.getConnection();
     console.log('✅ MySQL conectado!');
     conn.release();
     await createTables();
   } catch (e) {
     console.error('❌ MySQL erro:', e.message);
     console.warn('⚠️  Modo offline (sem banco)');
   }
 };
 
 const createTables = async () => {
   try {
     // Tabela principal
     await pool.execute(`
       CREATE TABLE IF NOT EXISTS analyses (
         id INT AUTO_INCREMENT PRIMARY KEY,
         title VARCHAR(255) DEFAULT 'Análise sem título',
         input_substances TEXT NOT NULL,
         ai_response LONGTEXT NOT NULL,
         substances_count INT DEFAULT 0,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
       )
     `);
 
     // Matérias-primas com 14 propriedades
     await pool.execute(`
       CREATE TABLE IF NOT EXISTS substances (
         id INT AUTO_INCREMENT PRIMARY KEY,
         analysis_id INT NOT NULL,
         name VARCHAR(255) NOT NULL,
         origin VARCHAR(255),
         description TEXT,
         estimated_cost_aoa VARCHAR(150),
         availability_angola VARCHAR(50),
         corrosion_resistance TEXT,
         abrasion_resistance TEXT,
         toughness TEXT,
         electrical_conductivity TEXT,
         thermal_conductivity TEXT,
         tensile_strength TEXT,
         hardness VARCHAR(100),
         density VARCHAR(100),
         melting_point VARCHAR(100),
         solubility TEXT,
         ph_reactivity TEXT,
         biodegradability TEXT,
         flammability TEXT,
         hygroscopicity TEXT,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
       )
     `);
 
     // Produtos finais
     await pool.execute(`
       CREATE TABLE IF NOT EXISTS final_products (
         id INT AUTO_INCREMENT PRIMARY KEY,
         analysis_id INT NOT NULL,
         substance_id INT,
         product_name VARCHAR(255) NOT NULL,
         product_description TEXT,
         market_value_aoa VARCHAR(150),
         industrial_importance VARCHAR(50),
         needs_reagents BOOLEAN DEFAULT FALSE,
         process_name VARCHAR(255),
         process_type VARCHAR(100),
         total_duration VARCHAR(100),
         overall_efficiency VARCHAR(50),
         total_cost_aoa VARCHAR(150),
         quality_control TEXT,
         byproducts TEXT,
         environmental_impact VARCHAR(50),
         environmental_notes TEXT,
         industrial_scale_notes TEXT,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
       )
     `);
 
     // Etapas do processo
     await pool.execute(`
       CREATE TABLE IF NOT EXISTS process_stages (
         id INT AUTO_INCREMENT PRIMARY KEY,
         final_product_id INT NOT NULL,
         analysis_id INT NOT NULL,
         stage_number INT DEFAULT 1,
         stage_name VARCHAR(255),
         description TEXT,
         chemical_reactions TEXT,
         temperature VARCHAR(100),
         pressure VARCHAR(100),
         duration VARCHAR(100),
         equipment_needed TEXT,
         reagents_added TEXT,
         expected_output TEXT,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         FOREIGN KEY (final_product_id) REFERENCES final_products(id) ON DELETE CASCADE
       )
     `);
 
     // Reagentes por produto
     await pool.execute(`
       CREATE TABLE IF NOT EXISTS product_reagents (
         id INT AUTO_INCREMENT PRIMARY KEY,
         final_product_id INT NOT NULL,
         analysis_id INT NOT NULL,
         reagent_name VARCHAR(255),
         reagent_function TEXT,
         quantity_per_ton VARCHAR(150),
         cost_aoa VARCHAR(150),
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         FOREIGN KEY (final_product_id) REFERENCES final_products(id) ON DELETE CASCADE
       )
     `);
 
     // Combinações entre matérias-primas
     await pool.execute(`
       CREATE TABLE IF NOT EXISTS material_combinations (
         id INT AUTO_INCREMENT PRIMARY KEY,
         analysis_id INT NOT NULL,
         substance_id INT,
         combine_with VARCHAR(255),
         resulting_product VARCHAR(255),
         combination_benefit TEXT,
         process_overview TEXT,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
       )
     `);
 
     // Compatibilidade v1
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
       )
     `);
 
     console.log('✅ Tabelas v2.0 criadas/verificadas!');
   } catch (e) {
     console.warn('⚠️  Erro ao criar tabelas:', e.message);
   }
 };
 
 module.exports = { pool, testConnection };