/**
 * ============================================================
 * Yoleni Industrial AI - Analysis Controller v2.0
 * Análise de Matérias-Primas com Groq (LLaMA 3.3 70B)
 * ============================================================
 */

 const { pool } = require('../database');
 const { buildRawMaterialPrompt } = require('../ai/prompt-engine');
 
 // ── Groq via fetch nativo ────────────────────────────────────
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
           content: 'Você é o Yoleni Industrial AI, especialista em engenharia química e processos industriais africanos. Responda SEMPRE em português brasileiro. Retorne APENAS JSON válido, sem markdown, sem texto antes ou depois.',
         },
         { role: 'user', content: prompt },
       ],
       temperature: 0.3,
       max_tokens: 32768,
     }),
   });
 
   const json = await response.json();
   if (!response.ok) {
     const msg = json?.error?.message || response.statusText;
     if (msg.includes('rate_limit') || msg.includes('quota')) throw new Error('QUOTA:' + msg);
     if (msg.includes('invalid_api_key') || msg.includes('Unauthorized')) throw new Error('INVALID_KEY:' + msg);
     throw new Error(msg);
   }
 
   const text = json?.choices?.[0]?.message?.content;
   if (!text) throw new Error('Resposta vazia do Groq');
   console.log(`✅ Groq respondeu! Tokens: ${json?.usage?.total_tokens || 'N/A'}`);
   return text;
 };
 
 // ── Parse JSON da IA ─────────────────────────────────────────
 const parseAI = (raw) => {
   let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
   const start = cleaned.indexOf('{');
   if (start > 0) cleaned = cleaned.slice(start);
   const end = cleaned.lastIndexOf('}');
   if (end !== -1 && end < cleaned.length - 1) cleaned = cleaned.slice(0, end + 1);
   return JSON.parse(cleaned);
 };
 
 // ── Gravar dados detalhados no banco ─────────────────────────
 const saveDetailedData = async (analysisId, result) => {
   const materials = result.raw_materials || result.substances || [];
 
   for (const mat of materials) {
     const props = mat.material_properties || {};
 
     // Gravar matéria-prima com 14 propriedades
     const [subResult] = await pool.execute(
       `INSERT INTO substances (
         analysis_id, name, origin, description, estimated_cost_aoa, availability_angola,
         corrosion_resistance, abrasion_resistance, toughness, electrical_conductivity,
         thermal_conductivity, tensile_strength, hardness, density, melting_point,
         solubility, ph_reactivity, biodegradability, flammability, hygroscopicity
       ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
       [
         analysisId, mat.name||'', mat.origin||'', mat.description||'',
         mat.estimated_cost_aoa||'', mat.availability_angola||'',
         props.corrosion_resistance||'', props.abrasion_resistance||'',
         props.toughness||'', props.electrical_conductivity||'',
         props.thermal_conductivity||'', props.tensile_strength||'',
         props.hardness||'', props.density||'', props.melting_point||'',
         props.solubility||'', props.ph_reactivity||'', props.biodegradability||'',
         props.flammability||'', props.hygroscopicity||'',
       ]
     );
     const substanceId = subResult.insertId;
 
     // Gravar cada produto final
     for (const product of (mat.final_products || [])) {
       const proc = product.transformation_process || {};
 
       const [prodResult] = await pool.execute(
         `INSERT INTO final_products (
           analysis_id, substance_id, product_name, product_description,
           market_value_aoa, industrial_importance, needs_reagents,
           process_name, process_type, total_duration, overall_efficiency,
           total_cost_aoa, quality_control, byproducts,
           environmental_impact, environmental_notes, industrial_scale_notes
         ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
         [
           analysisId, substanceId, product.product_name||'', product.product_description||'',
           product.market_value_aoa||'', product.industrial_importance||'',
           product.needs_additional_reagents ? 1 : 0,
           proc.process_name||'', proc.process_type||'', proc.total_duration||'',
           proc.overall_efficiency||'', proc.estimated_total_cost_aoa||'',
           proc.quality_control||'', proc.byproducts||'',
           proc.environmental_impact||'', proc.environmental_notes||'',
           proc.industrial_scale_notes||'',
         ]
       );
       const productId = prodResult.insertId;
 
       // Gravar etapas do processo
       for (const stage of (proc.stages || [])) {
         await pool.execute(
           `INSERT INTO process_stages (
             final_product_id, analysis_id, stage_number, stage_name,
             description, chemical_reactions, temperature, pressure,
             duration, equipment_needed, reagents_added, expected_output
           ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
           [
             productId, analysisId, stage.stage_number||1, stage.stage_name||'',
             stage.description||'', stage.chemical_reactions||'',
             stage.temperature||'', stage.pressure||'', stage.duration||'',
             stage.equipment_needed||'', stage.reagents_added||'', stage.expected_output||'',
           ]
         );
       }
 
       // Gravar reagentes necessários
       for (const reagent of (product.additional_reagents || [])) {
         await pool.execute(
           `INSERT INTO product_reagents (
             final_product_id, analysis_id, reagent_name,
             reagent_function, quantity_per_ton, cost_aoa
           ) VALUES (?,?,?,?,?,?)`,
           [
             productId, analysisId, reagent.reagent_name||'',
             reagent.reagent_function||'', reagent.quantity_per_ton||'', reagent.cost_aoa||'',
           ]
         );
       }
     }
 
     // Gravar combinações
     for (const combo of (mat.combinations_with_other_materials || [])) {
       await pool.execute(
         `INSERT INTO material_combinations (
           analysis_id, substance_id, combine_with,
           resulting_product, combination_benefit, process_overview
         ) VALUES (?,?,?,?,?,?)`,
         [
           analysisId, substanceId, combo.combine_with||'',
           combo.resulting_product||'', combo.combination_benefit||'', combo.process_overview||'',
         ]
       );
     }
   }
 };
 
 // ── analyzeSubstances ─────────────────────────────────────────
 const analyzeSubstances = async (req, res) => {
   try {
     const { substances_input, title } = req.body;
 
     if (!substances_input?.trim())
       return res.status(400).json({ error: 'Por favor, insira pelo menos uma matéria-prima.' });
 
     const materials = substances_input
       .split(/[,;\n]+/)
       .map(s => s.trim())
       .filter(s => s.length > 0 && s.length < 200);
 
     if (materials.length === 0)
       return res.status(400).json({ error: 'Nenhuma matéria-prima válida encontrada.' });
     if (materials.length > 5)
       return res.status(400).json({ error: 'Máximo de 5 matérias-primas por análise para garantir análise completa.' });
     if (!process.env.GROQ_API_KEY)
       return res.status(500).json({ error: 'GROQ_API_KEY não configurada no .env' });
 
     const prompt = buildRawMaterialPrompt(materials);
     let rawResponse;
     try {
       rawResponse = await callGroq(prompt);
     } catch (aiError) {
       if (aiError.message?.startsWith('INVALID_KEY:'))
         return res.status(401).json({ error: '❌ Chave Groq inválida. Verifique o GROQ_API_KEY no .env' });
       if (aiError.message?.startsWith('QUOTA:'))
         return res.status(429).json({ error: '⏳ Rate limit do Groq. Aguarde 1 minuto.' });
       return res.status(502).json({ error: 'Erro Groq: ' + aiError.message });
     }
 
     let result;
     try { result = parseAI(rawResponse); }
     catch {
       console.error('Parse JSON falhou:', rawResponse?.slice(0, 300));
       return res.status(500).json({ error: 'A IA retornou formato inesperado. Tente novamente.' });
     }
 
     // Salvar no banco
     let analysisId = null;
     try {
       const [ins] = await pool.execute(
         'INSERT INTO analyses (title, input_substances, ai_response, substances_count) VALUES (?,?,?,?)',
         [
           title || `Análise — ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`,
           substances_input,
           JSON.stringify(result),
           materials.length,
         ]
       );
       analysisId = ins.insertId;
       await saveDetailedData(analysisId, result);
       console.log(`✅ Análise #${analysisId} salva com dados detalhados`);
     } catch (dbErr) {
       console.warn('⚠️  Banco indisponível:', dbErr.message);
     }
 
     return res.json({ success:true, analysis_id:analysisId, data:result, substances_parsed:materials });
   } catch (e) {
     console.error('Erro inesperado:', e);
     return res.status(500).json({ error: 'Erro interno: ' + e.message });
   }
 };
 
 // ── analyzeFile ───────────────────────────────────────────────
 const analyzeFile = async (req, res) => {
   try {
     if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
     let materials = [];
     const filename = req.file.originalname;
     if (filename.endsWith('.csv')) {
       for (const line of req.file.buffer.toString('utf-8').split('\n'))
         for (const part of line.split(/[,;]/)) {
           const c = part.trim().replace(/"/g, '');
           if (c && c.length > 1 && c.length < 200) materials.push(c);
         }
     } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
       const XLSX = require('xlsx');
       const wb = XLSX.read(req.file.buffer, { type:'buffer' });
       const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header:1 });
       for (const row of data)
         for (const cell of row)
           if (cell && typeof cell === 'string') materials.push(cell.trim());
     }
     materials = [...new Set(materials)].slice(0, 10);
     if (materials.length === 0) return res.status(400).json({ error: 'Nenhuma matéria-prima no arquivo.' });
     req.body.substances_input = materials.join(', ');
     req.body.title = `Arquivo: ${filename}`;
     return analyzeSubstances(req, res);
   } catch (e) {
     return res.status(500).json({ error: 'Erro ao processar arquivo.' });
   }
 };
 
 // ── getHistory ─────────────────────────────────────────────────
 const getHistory = async (req, res) => {
   try {
     const page   = Math.max(1, parseInt(req.query.page)||1);
     const limit  = Math.min(50, parseInt(req.query.limit)||12);
     const search = req.query.search ? `%${req.query.search}%` : null;
     const offset = (page-1)*limit;
     const [countRows] = search
       ? await pool.execute('SELECT COUNT(*) as total FROM analyses WHERE title LIKE ? OR input_substances LIKE ?', [search,search])
       : await pool.execute('SELECT COUNT(*) as total FROM analyses');
     const total = countRows[0].total;
     const [rows] = search
       ? await pool.execute('SELECT id,title,input_substances,substances_count,created_at FROM analyses WHERE title LIKE ? OR input_substances LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?', [search,search,limit,offset])
       : await pool.execute('SELECT id,title,input_substances,substances_count,created_at FROM analyses ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit,offset]);
     return res.json({ success:true, data:rows, pagination:{ total, page, limit, totalPages:Math.ceil(total/limit) } });
   } catch(e) {
     return res.json({ success:true, data:[], pagination:{ total:0, page:1, limit:12, totalPages:0 } });
   }
 };
 
 // ── getAnalysisById ───────────────────────────────────────────
 const getAnalysisById = async (req, res) => {
   try {
     const { id } = req.params;
     const [rows] = await pool.execute('SELECT * FROM analyses WHERE id = ?', [id]);
     if (rows.length === 0) return res.status(404).json({ error: 'Análise não encontrada.' });
     const analysis = rows[0];
     try { analysis.ai_response = JSON.parse(analysis.ai_response); } catch { analysis.ai_response = {}; }
 
     // Buscar substâncias com produtos, etapas e reagentes
     const [substances] = await pool.execute('SELECT * FROM substances WHERE analysis_id = ? ORDER BY id', [id]);
     const [products] = await pool.execute('SELECT * FROM final_products WHERE analysis_id = ? ORDER BY id', [id]);
     const [stages] = await pool.execute('SELECT * FROM process_stages WHERE analysis_id = ? ORDER BY final_product_id, stage_number', [id]);
     const [reagents] = await pool.execute('SELECT * FROM product_reagents WHERE analysis_id = ? ORDER BY final_product_id', [id]);
     const [combinations] = await pool.execute('SELECT * FROM material_combinations WHERE analysis_id = ? ORDER BY id', [id]);
     const [processes] = await pool.execute('SELECT * FROM suggested_processes WHERE analysis_id = ? ORDER BY id', [id]);
 
     return res.json({ success:true, data:{
       ...analysis, substances, products, stages, reagents, combinations,
       processes: processes.map(p => ({ ...p, reagents: (() => { try { return JSON.parse(p.reagents); } catch { return []; } })() })),
     }});
   } catch(e) { return res.status(500).json({ error: 'Erro ao buscar análise.' }); }
 };
 
 // ── deleteAnalysis ─────────────────────────────────────────────
 const deleteAnalysis = async (req, res) => {
   try {
     const [r] = await pool.execute('DELETE FROM analyses WHERE id = ?', [req.params.id]);
     if (r.affectedRows === 0) return res.status(404).json({ error: 'Análise não encontrada.' });
     return res.json({ success:true, message:'Análise removida.' });
   } catch(e) { return res.status(500).json({ error: 'Erro ao remover.' }); }
 };
 
 // ── getStats ───────────────────────────────────────────────────
 const getStats = async (req, res) => {
   try {
     const [[totals]] = await pool.execute(`
       SELECT COUNT(*) AS total_analyses,
         COALESCE(SUM(substances_count),0) AS total_substances,
         COALESCE(MAX(substances_count),0) AS max_substances,
         COALESCE(MIN(substances_count),0) AS min_substances
       FROM analyses
     `);
     const [recent] = await pool.execute(`
       SELECT DATE(created_at) as day, COUNT(*) as count FROM analyses
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at) ORDER BY day ASC
     `);
     const [topSubstances] = await pool.execute(`
       SELECT name, COUNT(*) as frequency FROM substances
       GROUP BY name ORDER BY frequency DESC LIMIT 8
     `);
     const [impactDist] = await pool.execute(`
       SELECT environmental_impact, COUNT(*) as count FROM final_products
       WHERE environmental_impact != ''
       GROUP BY environmental_impact
     `);
     return res.json({ success:true, data:{ totals, recentActivity:recent, topSubstances, impactDistribution:impactDist } });
   } catch(e) {
     return res.json({ success:true, data:{ totals:{ total_analyses:0, total_substances:0, max_substances:0, min_substances:0 }, recentActivity:[], topSubstances:[], impactDistribution:[] } });
   }
 };
 
 module.exports = { analyzeSubstances, analyzeFile, getHistory, getAnalysisById, deleteAnalysis, getStats };