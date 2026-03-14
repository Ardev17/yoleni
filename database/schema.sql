

CREATE DATABASE IF NOT EXISTS yoleni_chemical CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE yoleni_chemical;

CREATE TABLE IF NOT EXISTS analyses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) DEFAULT 'Análise sem título',
  input_substances TEXT NOT NULL,
  ai_response LONGTEXT NOT NULL,
  substances_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

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
);

CREATE TABLE IF NOT EXISTS suggested_processes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  analysis_id INT NOT NULL,
  process_name VARCHAR(255),
  reagents TEXT,
  estimated_efficiency VARCHAR(50),
  estimated_cost VARCHAR(100),
  environmental_impact VARCHAR(50),
  industrial_recommendation TEXT,
  process_type ENUM('optimized', 'low_cost', 'eco_friendly') DEFAULT 'optimized',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
);

CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX idx_substances_analysis_id ON substances(analysis_id);
CREATE INDEX idx_processes_analysis_id ON suggested_processes(analysis_id);

INSERT INTO analyses (title, input_substances, ai_response, substances_count) VALUES
('Exemplo: Ácidos e Bases', 'NaOH, HCl, NH3', '{"substances":[],"processes":[]}', 3);
