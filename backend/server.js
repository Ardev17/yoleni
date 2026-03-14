/**
 * ============================================================
 * Yoleni Design de Processos Químicos - Backend Server
 * ============================================================
 */

 require('dotenv').config();
 const express    = require('express');
 const cors       = require('cors');
 const rateLimit  = require('express-rate-limit');
 const { testConnection } = require('./database');
 const analysisRoutes     = require('./routes/analysis');
 
 const app  = express();
 const PORT = process.env.PORT || 5000;
 
 // ── Middlewares ──────────────────────────────────────────────
 app.use(cors({
   origin: process.env.FRONTEND_URL || 'http://localhost:3000',
   methods: ['GET', 'POST', 'DELETE'],
   credentials: true,
 }));
 
 app.use(express.json({ limit: '10mb' }));
 app.use(express.urlencoded({ extended: true, limit: '10mb' }));
 
 // Corrige o erro ERR_ERL_UNEXPECTED_X_FORWARDED_FOR em ambiente local
 app.set('trust proxy', false);
 
 // Rate limiting (protege a API do Gemini)
 const limiter = rateLimit({
   windowMs: 15 * 60 * 1000,
   max: 50,
   message: { error: 'Muitas requisições. Aguarde 15 minutos.' },
   validate: { xForwardedForHeader: false },
 });
 app.use('/api/', limiter);
 
 // ── Rotas ────────────────────────────────────────────────────
 app.use('/api', analysisRoutes);
 
 // Rota de diagnóstico — verifica banco e conta análises
 app.get('/debug', async (req, res) => {
   const { pool } = require('./database');
   try {
     const [[{ total }]] = await pool.execute('SELECT COUNT(*) as total FROM analyses');
     const [[{ subs }]]  = await pool.execute('SELECT COUNT(*) as subs FROM substances');
     const [[{ procs }]] = await pool.execute('SELECT COUNT(*) as procs FROM suggested_processes');
     const [last] = await pool.execute('SELECT id, title, created_at FROM analyses ORDER BY created_at DESC LIMIT 3');
     res.json({ status:'ok', analyses: total, substances: subs, processes: procs, lastAnalyses: last });
   } catch(e) {
     res.status(500).json({ status:'db_error', error: e.message });
   }
 });
 
 app.get('/', (req, res) => {
   res.json({
     name: 'Yoleni Design de Processos Químicos API',
     ia: 'Google Gemini',
     version: '1.0.0',
     status: 'running',
   });
 });
 
 // Handler de erros global
 app.use((err, req, res, next) => {
   console.error('Erro:', err.message);
   res.status(err.status || 500).json({ error: err.message || 'Erro interno do servidor.' });
 });
 
 // ── Start ────────────────────────────────────────────────────
 const startServer = async () => {
   await testConnection();
   app.listen(PORT, () => {
     console.log(`
 ╔════════════════════════════════════════╗
 ║  Yoleni Chemical AI - Backend          ║
 ║  IA: Groq / LLaMA 3.3 70B (gratuito)          ║
 ║  Rodando em http://localhost:${PORT}      ║
 ╚════════════════════════════════════════╝
     `);
   });
 };
 
 startServer();