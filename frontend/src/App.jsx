import React, { useState, useCallback, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Historico from './pages/Historico';

/* ─── Design tokens ───────────────────────────────────────── */
const C = {
  rose:       '#e91e8c',
  roseLight:  '#f472b6',
  mauve:      '#c084fc',
  mauveDark:  '#7c3aed',
  deepPurple: '#0f0520',
  card:       'rgba(255,255,255,0.04)',
  border:     'rgba(233,30,140,0.18)',
  dim:        'rgba(255,255,255,0.45)',
  green:      '#34d399',
  yellow:     '#fbbf24',
  lime:       '#a3e635',
};

/* ─── API helpers ─────────────────────────────────────────── */

// URL base da API — usa variável de ambiente ou fallback para localhost
const API_BASE = process.env.REACT_APP_API_URL || 'https://amiable-dedication-production.up.railway.app';

const callAPI = async (substances_input) => {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ substances_input, title: `Análise ${new Date().toLocaleDateString('pt-BR')}` }),
  });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Erro na análise'); }
  return res.json();
};

const callFileAPI = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/analyze/file`, { method: 'POST', body: formData });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Erro no arquivo'); }
  return res.json();
};

/* ─── Shared Badge ────────────────────────────────────────── */
const Badge = ({ level }) => {
  const map = {
    baixo:    { bg:'#d1fae5', color:'#065f46', dot:'#10b981' },
    moderado: { bg:'#fef3c7', color:'#92400e', dot:'#f59e0b' },
    alto:     { bg:'#fee2e2', color:'#7f1d1d', dot:'#ef4444' },
    crítico:  { bg:'#f5d0fe', color:'#6b21a8', dot:'#a855f7' },
    critico:  { bg:'#f5d0fe', color:'#6b21a8', dot:'#a855f7' },
  };
  const s = map[(level || '').toLowerCase()] || map.moderado;
  return (
    <span style={{ background:s.bg, color:s.color, padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700, display:'inline-flex', alignItems:'center', gap:5 }}>
      <span style={{ width:7, height:7, borderRadius:'50%', background:s.dot, display:'inline-block' }}/>
      {level || 'N/A'}
    </span>
  );
};

/* ─── Loading ─────────────────────────────────────────────── */
const LoadingScreen = () => {
  const steps = ['🔬 Identificando substâncias...','⚗️ Consultando base química...','🤖 IA analisando propriedades...','💡 Sugerindo processos otimizados...','✨ Preparando dashboard para Yoleni...'];
  const [step, setStep] = React.useState(0);
  React.useEffect(() => {
    const iv = setInterval(() => setStep(s => (s + 1) % steps.length), 1800);
    return () => clearInterval(iv);
  }, []);
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:380, gap:30 }}>
      <div style={{ position:'relative', width:110, height:110 }}>
        <svg viewBox="0 0 110 110" style={{ width:110, height:110, animation:'spin 3s linear infinite' }}>
          <defs>
            <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={C.rose}/>
              <stop offset="100%" stopColor={C.mauve}/>
            </linearGradient>
          </defs>
          <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(233,30,140,.12)" strokeWidth="7"/>
          <circle cx="55" cy="55" r="46" fill="none" stroke="url(#rg)" strokeWidth="7" strokeDasharray="72 218" strokeLinecap="round"/>
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:36 }}>⚗️</div>
      </div>
      <div style={{ textAlign:'center' }}>
        <p style={{ color:C.roseLight, fontSize:16, fontWeight:700, marginBottom:10 }}>Sistema Avançado em Processamento</p>
        <p style={{ color:C.dim, fontSize:14, minHeight:22 }}>{steps[step]}</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

/* ─── Substance Table ─────────────────────────────────────── */
const SubstanceTable = ({ substances }) => (
  <div style={{ overflowX:'auto' }}>
    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
      <thead>
        <tr>
          {['Substância','Fórmula','Função Química','Propriedades','Aplicação Industrial','Custo Est.','Impacto Amb.'].map(h => (
            <th key={h} style={{ padding:'12px 16px', textAlign:'left', background:'rgba(233,30,140,.1)', color:C.roseLight, fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:1.2, borderBottom:`1px solid ${C.border}`, whiteSpace:'nowrap' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {substances.map((s, i) => (
          <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,.045)' }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(233,30,140,.04)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <td style={{ padding:'14px 16px', color:'#fff', fontWeight:700 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:C.rose, flexShrink:0 }}/>
                {s.name}
              </div>
            </td>
            <td style={{ padding:'14px 16px', color:C.roseLight, fontFamily:'monospace', fontWeight:600, fontSize:12 }}>{s.formula||'—'}</td>
            <td style={{ padding:'14px 16px', color:'rgba(255,255,255,.85)' }}>{s.chemical_function||'—'}</td>
            <td style={{ padding:'14px 16px', color:C.dim, maxWidth:180, fontSize:12 }}>{s.properties||'—'}</td>
            <td style={{ padding:'14px 16px', color:C.dim, maxWidth:180, fontSize:12 }}>{s.industrial_application||'—'}</td>
            <td style={{ padding:'14px 16px', color:C.lime, fontWeight:700, whiteSpace:'nowrap' }}>{s.estimated_cost||'—'}</td>
            <td style={{ padding:'14px 16px' }}><Badge level={s.environmental_impact}/></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ─── Process Card ────────────────────────────────────────── */
const ProcessCard = ({ process, index }) => {
  const types = {
    optimized:    { label:'⚡ Otimizado',    cls:'rgba(233,30,140,.15)', color:C.roseLight },
    low_cost:     { label:'💰 Baixo Custo',  cls:'rgba(163,230,53,.12)', color:C.lime },
    eco_friendly: { label:'🌿 Eco Friendly', cls:'rgba(52,211,153,.12)', color:C.green },
  };
  const t = types[process.type] || types.optimized;
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:22, padding:28, backdropFilter:'blur(10px)', transition:'transform .2s, box-shadow .2s' }}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 20px 60px rgba(233,30,140,.14)`;}}
      onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none';}}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16, flexWrap:'wrap', gap:8 }}>
        <div>
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:1.5, color:C.roseLight, textTransform:'uppercase' }}>Processo {String(index+1).padStart(2,'0')}</span>
          <h3 style={{ color:'#fff', fontSize:18, fontWeight:800, margin:'4px 0 0' }}>{process.process_name}</h3>
        </div>
        <span style={{ background:t.cls, color:t.color, padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:700 }}>{t.label}</span>
      </div>
      {process.description && (
        <p style={{ color:'rgba(255,255,255,.7)', fontSize:14, lineHeight:1.75, marginBottom:20, padding:'12px 16px', background:'rgba(255,255,255,.03)', borderRadius:12, borderLeft:`3px solid ${C.rose}` }}>
          {process.description}
        </p>
      )}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
        {[
          { label:'Eficiência', value:process.estimated_efficiency, color:C.lime },
          { label:'Custo',      value:process.estimated_cost,       color:C.yellow },
          { label:'Impacto',    value:<Badge level={process.environmental_impact}/>, color:'#fff' },
        ].map(m => (
          <div key={m.label} style={{ background:'rgba(255,255,255,.04)', borderRadius:12, padding:'12px', textAlign:'center' }}>
            <div style={{ fontSize:10, color:C.dim, textTransform:'uppercase', letterSpacing:1.2, marginBottom:4 }}>{m.label}</div>
            <div style={{ fontSize:15, fontWeight:800, color:m.color }}>{m.value}</div>
          </div>
        ))}
      </div>
      {process.reagents?.length > 0 && (
        <div style={{ marginBottom:14 }}>
          <p style={{ fontSize:10, color:C.dim, textTransform:'uppercase', letterSpacing:1.2, marginBottom:8 }}>Reagentes</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {process.reagents.map((r,i) => (
              <span key={i} style={{ background:'rgba(233,30,140,.12)', border:`1px solid rgba(233,30,140,.28)`, color:C.roseLight, padding:'3px 12px', borderRadius:20, fontSize:12, fontWeight:600, fontFamily:'monospace' }}>{r}</span>
            ))}
          </div>
        </div>
      )}
      {process.industrial_recommendation && (
        <div style={{ background:'rgba(192,132,252,.08)', border:'1px solid rgba(192,132,252,.2)', borderRadius:12, padding:'14px 16px' }}>
          <p style={{ fontSize:10, color:C.mauve, fontWeight:700, textTransform:'uppercase', letterSpacing:1.2, marginBottom:5 }}>💡 Recomendação para Yoleni</p>
          <p style={{ color:'rgba(255,255,255,.8)', fontSize:13, lineHeight:1.7, margin:0 }}>{process.industrial_recommendation}</p>
        </div>
      )}
      {process.advantages?.length > 0 && (
        <div style={{ marginTop:14 }}>
          <p style={{ fontSize:10, color:C.dim, textTransform:'uppercase', letterSpacing:1.2, marginBottom:6 }}>Vantagens</p>
          <ul style={{ margin:0, paddingLeft:16 }}>
            {process.advantages.map((a,i) => <li key={i} style={{ color:C.dim, fontSize:13, marginBottom:4 }}>{a}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

/* ─── HOME PAGE ───────────────────────────────────────────── */
function Home() {
  const [input,    setInput]   = useState('');
  const [loading,  setLoading] = useState(false);
  const [result,   setResult]  = useState(null);
  const [error,    setError]   = useState(null);
  const [dragOver, setDragOver]= useState(false);
  const fileRef    = useRef();
  const resultsRef = useRef();

  const handleAnalyze = useCallback(async () => {
    if (!input.trim()) { setError('Por favor, insira pelo menos uma substância.'); return; }
    setError(null); setLoading(true); setResult(null);
    try {
      const data = await callAPI(input);
      setResult(data.data);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }), 200);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [input]);

  const handleFile = async (file) => {
    if (!file) return;
    setError(null); setLoading(true); setResult(null);
    try {
      const data = await callFileAPI(file);
      setResult(data.data);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }), 200);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const examples = ['NaOH, HCl, NH3, CaCO3','H2SO4, Ethanol, Acetic Acid','NaCl, KOH, Fe2O3, CO2','CH4, O2, N2, HNO3, SO2'];

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'60px 24px' }}>
      {/* Hero */}
      <div style={{ textAlign:'center', marginBottom:60 }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(233,30,140,.1)', border:`1px solid rgba(233,30,140,.3)`, borderRadius:30, padding:'8px 20px', marginBottom:28, fontSize:13, color:C.roseLight, fontWeight:600 }}>
          ✨ Sistema Inteligente de IA &nbsp;•&nbsp; Powered by Aristides Chiovo
        </div>
        <h1 style={{ fontSize:'clamp(2rem,5vw,3.5rem)', fontWeight:900, lineHeight:1.05, letterSpacing:-1.5, margin:'0 0 18px' }}>
          <span style={{ color:'#fff' }}>Yoleni</span>{' '}
          <span style={{ background:`linear-gradient(135deg,${C.rose},${C.mauve})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Design</span>
          <span style={{ display:'block', fontSize:'.65em', color:'rgba(255,255,255,.8)', fontWeight:700, marginTop:6 }}>de Processos Químicos</span>
        </h1>
        <p style={{ color:C.dim, fontSize:17, maxWidth:520, margin:'0 auto', lineHeight:1.85 }}>
          Design inteligente de processos químicos usando inteligência artificial avançada.
        </p>
      </div>

      {/* Input Card */}
      <div style={{ background:'rgba(255,255,255,.04)', border:`1px solid ${C.border}`, borderRadius:28, padding:40, backdropFilter:'blur(20px)', marginBottom:28, boxShadow:'0 40px 80px rgba(0,0,0,.3)' }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.roseLight, textTransform:'uppercase', letterSpacing:1.5, marginBottom:14 }}>⚗️ Insira as Substâncias Químicas</div>
        <textarea
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.ctrlKey && e.key==='Enter' && handleAnalyze()}
          placeholder="NaOH, HCl, NH3, CaCO3, H2SO4, Ethanol, Acetic Acid..."
          rows={4}
          style={{ width:'100%', background:'rgba(255,255,255,.055)', border:`2px solid rgba(233,30,140,.18)`, borderRadius:16, padding:'16px 20px', color:'#fff', fontSize:15, resize:'vertical', outline:'none', fontFamily:'inherit', lineHeight:1.85, transition:'border-color .2s, box-shadow .2s', boxSizing:'border-box' }}
          onFocus={e=>{e.target.style.borderColor=C.rose; e.target.style.boxShadow=`0 0 0 4px rgba(233,30,140,.1)`;}}
          onBlur={e=>{e.target.style.borderColor='rgba(233,30,140,.18)'; e.target.style.boxShadow='none';}}
        />
        <p style={{ fontSize:12, color:'rgba(255,255,255,.3)', marginTop:8 }}>Separe por vírgula • Aceita nomes, fórmulas e compostos • Ctrl+Enter para analisar</p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:7, margin:'18px 0 26px', alignItems:'center' }}>
          <span style={{ fontSize:12, color:'rgba(255,255,255,.35)' }}>Exemplos:</span>
          {examples.map((ex,i) => (
            <button key={i} onClick={() => setInput(ex)}
              style={{ background:'rgba(255,255,255,.045)', border:`1px solid rgba(255,255,255,.1)`, color:C.dim, padding:'5px 13px', borderRadius:20, cursor:'pointer', fontSize:12, fontFamily:'inherit', transition:'all .2s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.rose; e.currentTarget.style.color=C.roseLight;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.1)'; e.currentTarget.style.color=C.dim;}}>
              {ex}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
          <button onClick={handleAnalyze} disabled={loading}
            style={{ flex:'1 1 200px', background: loading ? 'rgba(233,30,140,.3)' : `linear-gradient(135deg,${C.rose},${C.mauveDark})`, border:'none', color:'#fff', padding:'17px 32px', borderRadius:16, cursor: loading?'not-allowed':'pointer', fontSize:16, fontWeight:800, fontFamily:'inherit', boxShadow: loading?'none':`0 0 35px rgba(233,30,140,.4)`, transition:'all .3s', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
            {loading ? '🔄 Processando...' : '✨ Analisar Processo'}
          </button>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])}/>
          <button onClick={() => fileRef.current?.click()} disabled={loading}
            onDragOver={e=>{e.preventDefault(); setDragOver(true);}}
            onDragLeave={() => setDragOver(false)}
            onDrop={e=>{e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]);}}
            style={{ background: dragOver ? 'rgba(192,132,252,.15)' : 'rgba(255,255,255,.045)', border:`2px dashed ${dragOver ? C.mauve : 'rgba(255,255,255,.14)'}`, color:C.dim, padding:'15px 24px', borderRadius:16, cursor:'pointer', fontSize:14, fontWeight:600, fontFamily:'inherit', display:'flex', alignItems:'center', gap:8, transition:'all .2s' }}>
            📁 CSV / Excel
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)', borderRadius:16, padding:'16px 24px', marginBottom:24, color:'#fca5a5', display:'flex', gap:12, alignItems:'center' }}>
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div style={{ background:'rgba(255,255,255,.03)', border:`1px solid ${C.border}`, borderRadius:28, padding:40, marginBottom:24 }}>
          <LoadingScreen/>
        </div>
      )}

      {result && !loading && (
        <div ref={resultsRef}>
          {result.greeting && (
            <div style={{ background:`linear-gradient(135deg,rgba(233,30,140,.12),rgba(192,132,252,.12))`, border:`1px solid rgba(233,30,140,.28)`, borderRadius:24, padding:'26px 30px', marginBottom:30, position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', right:16, top:'50%', transform:'translateY(-50%)', fontSize:80, opacity:.06 }}>⚗️</div>
              <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
                <div style={{ width:48, height:48, borderRadius:16, background:`linear-gradient(135deg,${C.rose},${C.mauveDark})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0, boxShadow:`0 0 20px rgba(233,30,140,.3)` }}>🤖</div>
                <div>
                  <p style={{ fontSize:11, color:C.roseLight, textTransform:'uppercase', letterSpacing:2, marginBottom:8, fontWeight:700 }}>Sistema Yoleni Chemical AI</p>
                  <p style={{ color:'rgba(255,255,255,.85)', fontSize:15, lineHeight:1.8, margin:0 }}>{result.greeting}</p>
                </div>
              </div>
            </div>
          )}

          {result.summary && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14, marginBottom:30 }}>
              {[
                { icon:'🔬', label:'Substâncias',       value: result.substances?.length, color:C.rose },
                { icon:'🌿', label:'Combinação Segura',  value:(result.summary.safest_combination||'').slice(0,45)+'…', color:C.green,  sm:true },
                { icon:'⚡', label:'Processo Eficiente', value:(result.summary.most_efficient_process||'').slice(0,45)+'…', color:C.yellow, sm:true },
              ].map((c,i) => (
                <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding:'20px 22px', backdropFilter:'blur(10px)' }}>
                  <div style={{ fontSize:26, marginBottom:8 }}>{c.icon}</div>
                  <div style={{ fontSize:10, color:C.dim, textTransform:'uppercase', letterSpacing:1.5, marginBottom:5 }}>{c.label}</div>
                  <div style={{ fontSize:c.sm?13:26, fontWeight:800, color:c.color, lineHeight:1.4 }}>{c.value}</div>
                </div>
              ))}
            </div>
          )}

          {result.substances?.length > 0 && (
            <div style={{ background:'rgba(255,255,255,.025)', border:`1px solid ${C.border}`, borderRadius:24, marginBottom:40, overflow:'hidden' }}>
              <div style={{ padding:'22px 30px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:38, height:38, borderRadius:12, background:`linear-gradient(135deg,${C.rose},${C.mauveDark})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>🔬</div>
                <div>
                  <div style={{ fontSize:18, fontWeight:800 }}>Substâncias Analisadas</div>
                  <div style={{ fontSize:12, color:C.dim, marginTop:2 }}>{result.substances.length} substância(s) processada(s)</div>
                </div>
              </div>
              <SubstanceTable substances={result.substances}/>
            </div>
          )}

          {result.suggested_processes?.length > 0 && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:26 }}>
                <div style={{ width:4, height:34, borderRadius:2, background:`linear-gradient(to bottom,${C.rose},${C.mauve})` }}/>
                <div>
                  <div style={{ fontSize:22, fontWeight:800 }}>Processos Sugeridos pelo Sistema Avançado</div>
                  <div style={{ fontSize:13, color:C.dim, marginTop:4 }}>Recomendações otimizadas por IA exclusivamente para Yoleni</div>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(380px,1fr))', gap:18 }}>
                {result.suggested_processes.map((p,i) => <ProcessCard key={i} process={p} index={i}/>)}
              </div>
            </div>
          )}

          {result.summary?.environmental_recommendation && (
            <div style={{ background:'rgba(52,211,153,.06)', border:'1px solid rgba(52,211,153,.2)', borderRadius:20, padding:'22px 26px', marginTop:28, display:'flex', gap:16, alignItems:'flex-start' }}>
              <span style={{ fontSize:30 }}>🌿</span>
              <div>
                <p style={{ color:C.green, fontWeight:700, fontSize:12, textTransform:'uppercase', letterSpacing:1.5, margin:'0 0 6px' }}>Recomendação de Sustentabilidade</p>
                <p style={{ color:'rgba(255,255,255,.75)', fontSize:14, lineHeight:1.75, margin:0 }}>{result.summary.environmental_recommendation}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Shared Header (with active nav) ────────────────────── */
function Header() {
  const loc = useLocation();
  const isHistorico = loc.pathname === '/historico';
  return (
    <header style={{ position:'sticky', top:0, zIndex:100, borderBottom:`1px solid rgba(233,30,140,.12)`, background:'rgba(15,5,32,.88)', backdropFilter:'blur(24px)' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:70, padding:'0 28px' }}>
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:14, textDecoration:'none' }}>
          <div style={{ width:44, height:44, borderRadius:14, background:`linear-gradient(135deg,${C.rose},${C.mauveDark})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, boxShadow:`0 0 22px rgba(233,30,140,.35)` }}>⚗️</div>
          <div>
            <div style={{ fontSize:17, fontWeight:800, background:`linear-gradient(to right,#fff,${C.roseLight})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Yoleni Design</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,.3)', letterSpacing:2.5, textTransform:'uppercase' }}>Processos Químicos</div>
          </div>
        </Link>
        <nav style={{ display:'flex', gap:6 }}>
          <Link to="/"
            style={{ display:'flex', alignItems:'center', gap:7, background: !isHistorico ? 'rgba(233,30,140,.12)' : 'rgba(255,255,255,.05)', border:`1px solid ${!isHistorico ? 'rgba(233,30,140,.4)' : 'rgba(255,255,255,.1)'}`, color: !isHistorico ? C.roseLight : 'rgba(255,255,255,.65)', padding:'9px 18px', borderRadius:12, fontSize:13, fontWeight:700, textDecoration:'none', transition:'all .2s' }}>
            ⚗️ Analisar
          </Link>
          <Link to="/historico"
            style={{ display:'flex', alignItems:'center', gap:7, background: isHistorico ? 'rgba(233,30,140,.12)' : 'rgba(255,255,255,.05)', border:`1px solid ${isHistorico ? 'rgba(233,30,140,.4)' : 'rgba(255,255,255,.1)'}`, color: isHistorico ? C.roseLight : 'rgba(255,255,255,.65)', padding:'9px 18px', borderRadius:12, fontSize:13, fontWeight:700, textDecoration:'none', transition:'all .2s' }}>
            📋 Histórico
          </Link>
        </nav>
      </div>
    </header>
  );
}

/* ─── Layout wrapper ──────────────────────────────────────── */
function Layout() {
  return (
    <div style={{ minHeight:'100vh', background:C.deepPurple, color:'#fff', fontFamily:"'Outfit','Segoe UI',sans-serif", overflowX:'hidden', position:'relative' }}>
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', top:'-20%', right:'-10%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(233,30,140,.13) 0%,transparent 70%)' }}/>
        <div style={{ position:'absolute', bottom:'-10%', left:'-10%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(192,132,252,.1) 0%,transparent 70%)' }}/>
      </div>
      <div style={{ position:'relative', zIndex:5 }}>
        <Header/>
        <Routes>
          <Route path="/"          element={<Home/>}/>
          <Route path="/historico" element={<Historico/>}/>
        </Routes>
        <footer style={{ borderTop:`1px solid rgba(233,30,140,.08)`, padding:'24px', textAlign:'center', marginTop:40 }}>
          <p style={{ color:'rgba(255,255,255,.2)', fontSize:13, margin:0 }}>
            Yoleni Design de Processos Químicos • Desenvolvido com 💜 para Engenheira Yoleni • Powered by Aristides Chiovo
          </p>
        </footer>
      </div>
    </div>
  );
}

/* ─── App root ────────────────────────────────────────────── */
export default function App() {
  return (
    <BrowserRouter>
      <Layout/>
    </BrowserRouter>
  );
}
