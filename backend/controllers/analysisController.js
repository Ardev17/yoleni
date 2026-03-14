/**
 * ============================================================
 * Yoleni Chemical AI - Analysis Controller
 * IA: Groq (gratuito, sem restrições geográficas)
 * Modelo: llama-3.3-70b-versatile
 * ============================================================
 */

 const { pool } = require('../database');
 const { buildChemicalAnalysisPrompt } = require('../ai/prompt-engine');
 
 // ── Chama Groq via fetch nativo (sem SDK) ────────────────────
 const callGroq = async (prompt) => {
   const apiKey = process.env.GROQ_API_KEY;
   if (!apiKey) throw new Error('GROQ_API_KEY não configurada no .env');
 
   const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${apiKey}`,
     },
     body: JSON.stringify({
       model: 'llama-3.3-70b-versatile',
       messages: [
         {
           role: 'system',
           content:
             'Você é um especialista em engenharia química com 20 anos de experiência industrial. ' +
             'Responda SEMPRE em português brasileiro. ' +
             'Retorne APENAS JSON válido, sem markdown, sem blocos de código, sem texto antes ou depois do JSON.',
         },
         {
           role: 'user',
           content: prompt,
         },
       ],
       temperature: 0.3,
       max_tokens: 4096,
     }),
   });
 
   const json = await response.json();
 
   if (!response.ok) {
     const msg = json?.error?.message || response.statusText;
     if (msg.includes('rate_limit') || msg.includes('quota')) {
       throw new Error('QUOTA:' + msg);
     }
     if (msg.includes('invalid_api_key') || msg.includes('Unauthorized')) {
       throw new Error('INVALID_KEY:' + msg);
     }
     throw new Error(msg);
   }
 
   const text = json?.choices?.[0]?.message?.content;
   if (!text) throw new Error('Resposta vazia do Groq');
 
   console.log(`✅ Groq respondeu com sucesso! Tokens usados: ${json?.usage?.total_tokens || 'N/A'}`);
   return text;
 };
 
 // ── Limpa e faz parse do JSON ────────────────────────────────
 const parseAIResponse = (raw) => {
   let cleaned = raw
     .replace(/```json\s*/gi, '')
     .replace(/```\s*/gi, '')
     .trim();
 
   const start = cleaned.indexOf('{');
   if (start > 0) cleaned = cleaned.slice(start);
 
   const end = cleaned.lastIndexOf('}');
   if (end !== -1 && end < cleaned.length - 1) cleaned = cleaned.slice(0, end + 1);
 
   return JSON.parse(cleaned);
 };
 
 // ── analyzeSubstances ────────────────────────────────────────
 const analyzeSubstances = async (req, res) => {
   try {
     const { substances_input, title } = req.body;
 
     if (!substances_input?.trim())
       return res.status(400).json({ error: 'Por favor, insira pelo menos uma substância.' });
 
     const substances = substances_input
       .split(/[,;\n]+/)
       .map(s => s.trim())
       .filter(s => s.length > 0 && s.length < 120);
 
     if (substances.length === 0)
       return res.status(400).json({ error: 'Nenhuma substância válida encontrada.' });
     if (substances.length > 50)
       return res.status(400).json({ error: 'Máximo de 50 substâncias por análise.' });
     if (!process.env.GROQ_API_KEY)
       return res.status(500).json({ error: 'GROQ_API_KEY não configurada no .env' });
 
     const prompt = buildChemicalAnalysisPrompt(substances);
     let rawResponse;
 
     try {
       rawResponse = await callGroq(prompt);
     } catch (aiError) {
       console.error('Erro Groq:', aiError.message);
       if (aiError.message?.startsWith('INVALID_KEY:')) {
         return res.status(401).json({ error: '❌ Chave Groq inválida. Verifique o GROQ_API_KEY no .env' });
       }
       if (aiError.message?.startsWith('QUOTA:')) {
         return res.status(429).json({ error: '⏳ Rate limit do Groq atingido. Aguarde 1 minuto e tente novamente.' });
       }
       return res.status(502).json({ error: 'Erro ao conectar com o Groq: ' + aiError.message });
     }
 
     let analysisResult;
     try {
       analysisResult = parseAIResponse(rawResponse);
     } catch (parseError) {
       console.error('Erro parse JSON:', rawResponse?.slice(0, 300));
       return res.status(500).json({ error: 'A IA retornou formato inesperado. Tente novamente.' });
     }
 
     // Salvar no banco
     let analysisId = null;
     try {
       const [result] = await pool.execute(
         'INSERT INTO analyses (title, input_substances, ai_response, substances_count) VALUES (?, ?, ?, ?)',
         [
           title || `Análise - ${new Date().toLocaleDateString('pt-BR')}`,
           substances_input,
           JSON.stringify(analysisResult),
           substances.length,
         ]
       );
       analysisId = result.insertId;
 
       if (analysisResult.substances) {
         for (const sub of analysisResult.substances) {
           await pool.execute(
             `INSERT INTO substances (analysis_id, name, formula, chemical_function, properties,
              industrial_application, environmental_impact, estimated_cost, pollution_level, maintenance_time)
              VALUES (?,?,?,?,?,?,?,?,?,?)`,
             [
               analysisId, sub.name||'', sub.formula||'', sub.chemical_function||'',
               sub.properties||'', sub.industrial_application||'',
               sub.environmental_impact||'moderado', sub.estimated_cost||'N/A',
               sub.pollution_level||'moderado', sub.maintenance_time||'N/A',
             ]
           );
         }
       }
 
       if (analysisResult.suggested_processes) {
         for (const proc of analysisResult.suggested_processes) {
           await pool.execute(
             `INSERT INTO suggested_processes (analysis_id, process_name, reagents, estimated_efficiency,
              estimated_cost, environmental_impact, industrial_recommendation, process_type)
              VALUES (?,?,?,?,?,?,?,?)`,
             [
               analysisId, proc.process_name||'',
               JSON.stringify(proc.reagents||[]),
               proc.estimated_efficiency||'N/A',
               proc.estimated_cost||'N/A',
               proc.environmental_impact||'moderado',
               proc.industrial_recommendation||'',
               proc.type||'optimized',
             ]
           );
         }
       }
     } catch (dbError) {
       console.warn('⚠️  Banco indisponível:', dbError.message);
     }
 
     return res.json({
       success: true,
       analysis_id: analysisId,
       data: analysisResult,
       substances_parsed: substances,
     });
   } catch (error) {
     console.error('Erro inesperado:', error);
     return res.status(500).json({ error: 'Erro interno: ' + error.message });
   }
 };
 
 // ── analyzeFile ──────────────────────────────────────────────
 const analyzeFile = async (req, res) => {
   try {
     if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
     let substances = [];
     const filename = req.file.originalname;
     if (filename.endsWith('.csv')) {
       for (const line of req.file.buffer.toString('utf-8').split('\n'))
         for (const part of line.split(/[,;]/)) {
           const c = part.trim().replace(/"/g, '');
           if (c && c.length < 100) substances.push(c);
         }
     } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
       const XLSX = require('xlsx');
       const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
       const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
       for (const row of data)
         for (const cell of row)
           if (cell && typeof cell === 'string') substances.push(cell.trim());
     }
     substances = [...new Set(substances)].slice(0, 50);
     if (substances.length === 0)
       return res.status(400).json({ error: 'Nenhuma substância encontrada no arquivo.' });
     req.body.substances_input = substances.join(', ');
     req.body.title = `Arquivo: ${filename}`;
     return analyzeSubstances(req, res);
   } catch (e) {
     return res.status(500).json({ error: 'Erro ao processar arquivo.' });
   }
 };
 
 // ── getHistory ───────────────────────────────────────────────
 const getHistory = async (req, res) => {
   try {
     const page   = Math.max(1, parseInt(req.query.page)||1);
     const limit  = Math.min(50, parseInt(req.query.limit)||12);
     const search = req.query.search ? `%${req.query.search}%` : null;
     const offset = (page-1)*limit;
     const [countRows] = search
       ? await pool.execute('SELECT COUNT(*) as total FROM analyses WHERE title LIKE ? OR input_substances LIKE ?', [search, search])
       : await pool.execute('SELECT COUNT(*) as total FROM analyses');
     const total = countRows[0].total;
     const [rows] = search
       ? await pool.execute(
           'SELECT id,title,input_substances,substances_count,created_at FROM analyses WHERE title LIKE ? OR input_substances LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
           [search, search, limit, offset])
       : await pool.execute(
           'SELECT id,title,input_substances,substances_count,created_at FROM analyses ORDER BY created_at DESC LIMIT ? OFFSET ?',
           [limit, offset]);
     return res.json({ success:true, data:rows, pagination:{ total, page, limit, totalPages:Math.ceil(total/limit) } });
   } catch(e) {
     return res.json({ success:true, data:[], pagination:{ total:0, page:1, limit:12, totalPages:0 } });
   }
 };
 
 // ── getAnalysisById ──────────────────────────────────────────
 const getAnalysisById = async (req, res) => {
   try {
     const [rows] = await pool.execute('SELECT * FROM analyses WHERE id = ?', [req.params.id]);
     if (rows.length === 0) return res.status(404).json({ error: 'Análise não encontrada.' });
     const analysis = rows[0];
     try { analysis.ai_response = JSON.parse(analysis.ai_response); } catch { analysis.ai_response = {}; }
     const [substances] = await pool.execute('SELECT * FROM substances WHERE analysis_id = ? ORDER BY id', [req.params.id]);
     const [processes]  = await pool.execute('SELECT * FROM suggested_processes WHERE analysis_id = ? ORDER BY id', [req.params.id]);
     const parsedProcesses = processes.map(p => ({
       ...p, reagents: (() => { try { return JSON.parse(p.reagents); } catch { return []; } })()
     }));
     return res.json({ success:true, data:{ ...analysis, substances, processes:parsedProcesses } });
   } catch(e) { return res.status(500).json({ error: 'Erro ao buscar análise.' }); }
 };
 
 // ── deleteAnalysis ───────────────────────────────────────────
 const deleteAnalysis = async (req, res) => {
   try {
     const [result] = await pool.execute('DELETE FROM analyses WHERE id = ?', [req.params.id]);
     if (result.affectedRows === 0) return res.status(404).json({ error: 'Análise não encontrada.' });
     return res.json({ success:true, message:'Análise removida com sucesso.' });
   } catch(e) { return res.status(500).json({ error: 'Erro ao remover.' }); }
 };
 
 // ── getStats ─────────────────────────────────────────────────
 const getStats = async (req, res) => {
   try {
     const [[totals]] = await pool.execute(
       `SELECT COUNT(*) AS total_analyses, COALESCE(SUM(substances_count),0) AS total_substances,
        COALESCE(MAX(substances_count),0) AS max_substances, COALESCE(MIN(substances_count),0) AS min_substances
        FROM analyses`
     );
     const [recent] = await pool.execute(
       `SELECT DATE(created_at) as day, COUNT(*) as count FROM analyses
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at) ORDER BY day ASC`
     );
     const [topSubstances] = await pool.execute(
       `SELECT name, COUNT(*) as frequency FROM substances GROUP BY name ORDER BY frequency DESC LIMIT 8`
     );
     const [impactDist] = await pool.execute(
       `SELECT environmental_impact, COUNT(*) as count FROM substances GROUP BY environmental_impact`
     );
     return res.json({ success:true, data:{ totals, recentActivity:recent, topSubstances, impactDistribution:impactDist } });
   } catch(e) {
     return res.json({ success:true, data:{
       totals:{ total_analyses:0, total_substances:0, max_substances:0, min_substances:0 },
       recentActivity:[], topSubstances:[], impactDistribution:[]
     }});
   }
 };
 
 module.exports = { analyzeSubstances, analyzeFile, getHistory, getAnalysisById, deleteAnalysis, getStats };