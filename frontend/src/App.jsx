import React, { useState, useCallback, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Historico from './pages/Historico';

/* ─── Design System ───────────────────────────────────────── */
const C = {
  emerald:      '#10b981',
  emeraldLight: '#34d399',
  emeraldDark:  '#059669',
  teal:         '#0d9488',
  tealLight:    '#2dd4bf',
  amber:        '#f59e0b',
  amberLight:   '#fcd34d',
  deepForest:   '#030d0a',
  forestCard:   'rgba(16,185,129,0.06)',
  border:       'rgba(16,185,129,0.18)',
  borderHover:  'rgba(16,185,129,0.45)',
  dim:          'rgba(255,255,255,0.5)',
  dimLight:     'rgba(255,255,255,0.7)',
  red:          '#f87171',
  blue:         '#60a5fa',
};

const API_BASE = process.env.REACT_APP_API_URL || 'https://amiable-dedication-production.up.railway.app/api';

const callAPI = async (input) => {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      substances_input: input,
      title: `Análise — ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Erro na análise'); }
  return res.json();
};

const callFileAPI = async (file) => {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${API_BASE}/analyze/file`, { method: 'POST', body: fd });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Erro no arquivo'); }
  return res.json();
};

/* ─── Badge de impacto ────────────────────────────────────── */
const ImpactBadge = ({ level }) => {
  const map = {
    baixo:    { bg:'rgba(16,185,129,.15)',  color:'#34d399', dot:'#10b981' },
    moderado: { bg:'rgba(245,158,11,.15)',  color:'#fcd34d', dot:'#f59e0b' },
    alto:     { bg:'rgba(248,113,113,.15)', color:'#fca5a5', dot:'#ef4444' },
    crítico:  { bg:'rgba(167,139,250,.15)', color:'#c4b5fd', dot:'#8b5cf6' },
    critico:  { bg:'rgba(167,139,250,.15)', color:'#c4b5fd', dot:'#8b5cf6' },
  };
  const s = map[(level||'').toLowerCase()] || map.moderado;
  return (
    <span style={{ background:s.bg, color:s.color, padding:'3px 12px', borderRadius:20, fontSize:11, fontWeight:700, display:'inline-flex', alignItems:'center', gap:5 }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:s.dot }}/>
      {level||'N/A'}
    </span>
  );
};

/* ─── Propriedades do Material ────────────────────────────── */
const PropertyCard = ({ label, value, icon }) => (
  <div style={{ background:'rgba(16,185,129,.05)', border:`1px solid rgba(16,185,129,.12)`, borderRadius:12, padding:'12px 14px' }}>
    <div style={{ fontSize:10, color:C.emeraldLight, textTransform:'uppercase', letterSpacing:1.5, marginBottom:5, fontWeight:700 }}>
      {icon} {label}
    </div>
    <div style={{ color:'rgba(255,255,255,.8)', fontSize:13, lineHeight:1.6 }}>{value || '—'}</div>
  </div>
);

const MaterialProperties = ({ props }) => {
  if (!props) return null;
  const items = [
    { key:'corrosion_resistance',    label:'Resistência à Corrosão',  icon:'🛡️' },
    { key:'abrasion_resistance',     label:'Resistência à Abrasão',   icon:'⚙️' },
    { key:'toughness',               label:'Tenacidade',               icon:'💪' },
    { key:'electrical_conductivity', label:'Condutividade Eléctrica',  icon:'⚡' },
    { key:'thermal_conductivity',    label:'Condutividade Térmica',    icon:'🌡️' },
    { key:'tensile_strength',        label:'Resistência à Tracção',    icon:'🔗' },
    { key:'hardness',                label:'Dureza',                   icon:'💎' },
    { key:'density',                 label:'Densidade',                icon:'⚖️' },
    { key:'melting_point',           label:'Ponto de Fusão',           icon:'🔥' },
    { key:'solubility',              label:'Solubilidade',             icon:'💧' },
    { key:'ph_reactivity',           label:'Reactividade a pH',        icon:'🧪' },
    { key:'biodegradability',        label:'Biodegradabilidade',       icon:'🌿' },
    { key:'flammability',            label:'Inflamabilidade',          icon:'🚨' },
    { key:'hygroscopicity',          label:'Higroscopicidade',         icon:'💦' },
  ];
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:10, margin:'16px 0' }}>
      {items.map(i => props[i.key] && (
        <PropertyCard key={i.key} label={i.label} value={props[i.key]} icon={i.icon}/>
      ))}
    </div>
  );
};

/* ─── Stage de processo ───────────────────────────────────── */
const ProcessStage = ({ stage, index }) => (
  <div style={{ display:'flex', gap:16, marginBottom:20 }}>
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
      <div style={{ width:36, height:36, borderRadius:'50%', background:`linear-gradient(135deg,${C.emerald},${C.teal})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, color:'#fff', boxShadow:`0 0 16px rgba(16,185,129,.3)` }}>
        {stage.stage_number || index+1}
      </div>
      <div style={{ width:2, flex:1, background:'rgba(16,185,129,.2)', minHeight:20, marginTop:6 }}/>
    </div>
    <div style={{ flex:1, background:'rgba(16,185,129,.04)', border:`1px solid rgba(16,185,129,.12)`, borderRadius:16, padding:'18px 20px', marginBottom:4 }}>
      <h4 style={{ color:C.emeraldLight, fontSize:15, fontWeight:800, margin:'0 0 10px' }}>{stage.stage_name}</h4>
      <p style={{ color:'rgba(255,255,255,.75)', fontSize:13, lineHeight:1.75, marginBottom:12 }}>{stage.description}</p>
      {stage.chemical_reactions && (
        <div style={{ background:'rgba(0,0,0,.3)', border:`1px solid rgba(16,185,129,.2)`, borderRadius:10, padding:'10px 14px', marginBottom:10, fontFamily:'monospace', fontSize:13, color:C.emeraldLight }}>
          ⚗️ {stage.chemical_reactions}
        </div>
      )}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:8 }}>
        {stage.temperature && <div style={{ background:'rgba(245,158,11,.08)', borderRadius:8, padding:'7px 11px', fontSize:12 }}><span style={{ color:C.amberLight, fontWeight:700 }}>🌡️ Temp:</span> <span style={{ color:'rgba(255,255,255,.7)' }}>{stage.temperature}</span></div>}
        {stage.pressure && <div style={{ background:'rgba(96,165,250,.08)', borderRadius:8, padding:'7px 11px', fontSize:12 }}><span style={{ color:C.blue, fontWeight:700 }}>📊 Pressão:</span> <span style={{ color:'rgba(255,255,255,.7)' }}>{stage.pressure}</span></div>}
        {stage.duration && <div style={{ background:'rgba(16,185,129,.08)', borderRadius:8, padding:'7px 11px', fontSize:12 }}><span style={{ color:C.emeraldLight, fontWeight:700 }}>⏱️ Duração:</span> <span style={{ color:'rgba(255,255,255,.7)' }}>{stage.duration}</span></div>}
        {stage.equipment_needed && <div style={{ background:'rgba(167,139,250,.08)', borderRadius:8, padding:'7px 11px', fontSize:12 }}><span style={{ color:'#c4b5fd', fontWeight:700 }}>🏭 Equip.:</span> <span style={{ color:'rgba(255,255,255,.7)' }}>{stage.equipment_needed}</span></div>}
      </div>
      {stage.expected_output && (
        <div style={{ marginTop:10, padding:'8px 12px', background:'rgba(16,185,129,.08)', borderRadius:8, fontSize:12 }}>
          <span style={{ color:C.emeraldLight, fontWeight:700 }}>✅ Resultado: </span>
          <span style={{ color:'rgba(255,255,255,.7)' }}>{stage.expected_output}</span>
        </div>
      )}
    </div>
  </div>
);

/* ─── Card de Produto Final ───────────────────────────────── */
const ProductCard = ({ product, index }) => {
  const [expanded, setExpanded] = useState(false);
  const proc = product.transformation_process;

  return (
    <div style={{ background:'rgba(13,148,136,.05)', border:`1px solid rgba(13,148,136,.2)`, borderRadius:20, overflow:'hidden', marginBottom:16, transition:'all .2s' }}>
      {/* Header */}
      <div style={{ padding:'20px 24px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}
        onClick={() => setExpanded(!expanded)}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:42, height:42, borderRadius:14, background:`linear-gradient(135deg,${C.teal},${C.emerald})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:800, color:'#fff', flexShrink:0 }}>
            {index + 1}
          </div>
          <div>
            <h3 style={{ color:'#fff', fontSize:17, fontWeight:800, margin:0 }}>{product.product_name}</h3>
            <p style={{ color:C.dim, fontSize:12, margin:'3px 0 0' }}>{proc?.process_name} • {proc?.process_type}</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {product.market_value_aoa && (
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:10, color:C.dim, textTransform:'uppercase', letterSpacing:1 }}>Valor de Mercado</div>
              <div style={{ fontSize:14, fontWeight:800, color:C.amberLight }}>{product.market_value_aoa}</div>
            </div>
          )}
          <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(16,185,129,.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:C.emeraldLight, transition:'transform .2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}>▼</div>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding:'0 24px 24px', borderTop:`1px solid rgba(16,185,129,.1)` }}>
          <p style={{ color:'rgba(255,255,255,.7)', fontSize:14, lineHeight:1.8, margin:'16px 0' }}>{product.product_description}</p>

          {/* Reagentes necessários */}
          {product.additional_reagents?.length > 0 && (
            <div style={{ marginBottom:20 }}>
              <h4 style={{ color:C.tealLight, fontSize:13, fontWeight:700, textTransform:'uppercase', letterSpacing:1.5, marginBottom:12 }}>🧪 Reagentes Necessários</h4>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:10 }}>
                {product.additional_reagents.map((r,i) => (
                  <div key={i} style={{ background:'rgba(0,0,0,.2)', border:`1px solid rgba(13,148,136,.2)`, borderRadius:12, padding:'12px 14px' }}>
                    <div style={{ color:C.tealLight, fontWeight:700, fontSize:13, marginBottom:5 }}>{r.reagent_name}</div>
                    <div style={{ color:'rgba(255,255,255,.6)', fontSize:12, marginBottom:4 }}>{r.reagent_function}</div>
                    {r.quantity_per_ton && <div style={{ fontSize:11, color:C.dim }}>📦 {r.quantity_per_ton}</div>}
                    {r.cost_aoa && <div style={{ fontSize:11, color:C.amberLight }}>💰 {r.cost_aoa}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processo de transformação */}
          {proc && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
                <h4 style={{ color:C.emeraldLight, fontSize:13, fontWeight:700, textTransform:'uppercase', letterSpacing:1.5, margin:0 }}>⚗️ Processo de Transformação</h4>
                <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                  {proc.overall_efficiency && <span style={{ background:'rgba(16,185,129,.12)', color:C.emeraldLight, padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700 }}>⚡ {proc.overall_efficiency}</span>}
                  {proc.total_duration && <span style={{ background:'rgba(245,158,11,.12)', color:C.amberLight, padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700 }}>⏱️ {proc.total_duration}</span>}
                  {proc.estimated_total_cost_aoa && <span style={{ background:'rgba(96,165,250,.12)', color:C.blue, padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700 }}>💰 {proc.estimated_total_cost_aoa}</span>}
                </div>
              </div>

              {/* Stages */}
              {proc.stages?.length > 0 && (
                <div style={{ marginBottom:16 }}>
                  {proc.stages.map((stage, i) => <ProcessStage key={i} stage={stage} index={i}/>)}
                </div>
              )}

              {/* Subprodutos e controlo de qualidade */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
                {proc.byproducts && (
                  <div style={{ background:'rgba(16,185,129,.06)', border:`1px solid rgba(16,185,129,.15)`, borderRadius:12, padding:'14px 16px' }}>
                    <div style={{ fontSize:11, color:C.emeraldLight, fontWeight:700, textTransform:'uppercase', letterSpacing:1.5, marginBottom:6 }}>♻️ Subprodutos</div>
                    <p style={{ color:'rgba(255,255,255,.65)', fontSize:13, lineHeight:1.7, margin:0 }}>{proc.byproducts}</p>
                  </div>
                )}
                {proc.quality_control && (
                  <div style={{ background:'rgba(96,165,250,.06)', border:`1px solid rgba(96,165,250,.15)`, borderRadius:12, padding:'14px 16px' }}>
                    <div style={{ fontSize:11, color:C.blue, fontWeight:700, textTransform:'uppercase', letterSpacing:1.5, marginBottom:6 }}>🔬 Controlo de Qualidade</div>
                    <p style={{ color:'rgba(255,255,255,.65)', fontSize:13, lineHeight:1.7, margin:0 }}>{proc.quality_control}</p>
                  </div>
                )}
                {proc.environmental_notes && (
                  <div style={{ background:'rgba(52,211,153,.06)', border:`1px solid rgba(52,211,153,.15)`, borderRadius:12, padding:'14px 16px' }}>
                    <div style={{ fontSize:11, color:'#34d399', fontWeight:700, textTransform:'uppercase', letterSpacing:1.5, marginBottom:6 }}>🌿 Impacto Ambiental</div>
                    <ImpactBadge level={proc.environmental_impact}/>
                    <p style={{ color:'rgba(255,255,255,.65)', fontSize:13, lineHeight:1.7, margin:'8px 0 0' }}>{proc.environmental_notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Card de Matéria-Prima ───────────────────────────────── */
const RawMaterialCard = ({ material }) => {
  const [tab, setTab] = useState('products');
  const tabs = [
    { key:'products',      label:`🏭 Produtos (${material.final_products?.length||0})` },
    { key:'properties',    label:'🔬 Propriedades' },
    { key:'combinations',  label:`🔗 Combinações (${material.combinations_with_other_materials?.length||0})` },
  ];

  return (
    <div style={{ background:'rgba(16,185,129,.04)', border:`1px solid ${C.border}`, borderRadius:24, overflow:'hidden', marginBottom:28 }}>
      {/* Header */}
      <div style={{ padding:'24px 28px', background:`linear-gradient(135deg, rgba(16,185,129,.12), rgba(13,148,136,.08))`, borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ fontSize:11, color:C.emeraldLight, textTransform:'uppercase', letterSpacing:2, marginBottom:6, fontWeight:700 }}>🌿 Matéria-Prima</div>
            <h2 style={{ color:'#fff', fontSize:24, fontWeight:900, margin:0, letterSpacing:-0.5 }}>{material.name}</h2>
            {material.origin && <p style={{ color:C.dim, fontSize:13, margin:'6px 0 0' }}>📍 {material.origin}</p>}
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {material.estimated_cost_aoa && (
              <div style={{ textAlign:'center', background:'rgba(16,185,129,.1)', border:`1px solid rgba(16,185,129,.25)`, borderRadius:14, padding:'10px 18px' }}>
                <div style={{ fontSize:10, color:C.dim, textTransform:'uppercase', letterSpacing:1 }}>Custo/Tonelada</div>
                <div style={{ fontSize:16, fontWeight:800, color:C.amberLight }}>{material.estimated_cost_aoa}</div>
              </div>
            )}
            {material.availability_angola && (
              <div style={{ textAlign:'center', background:'rgba(16,185,129,.1)', border:`1px solid rgba(16,185,129,.25)`, borderRadius:14, padding:'10px 18px' }}>
                <div style={{ fontSize:10, color:C.dim, textTransform:'uppercase', letterSpacing:1 }}>Disponibilidade AO</div>
                <div style={{ fontSize:16, fontWeight:800, color:C.emeraldLight, textTransform:'capitalize' }}>{material.availability_angola}</div>
              </div>
            )}
          </div>
        </div>
        {material.description && (
          <p style={{ color:'rgba(255,255,255,.65)', fontSize:14, lineHeight:1.8, margin:'14px 0 0', maxWidth:800 }}>{material.description}</p>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, padding:'0 28px', borderBottom:`1px solid rgba(255,255,255,.06)` }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ background:'none', border:'none', cursor:'pointer', padding:'14px 18px', fontSize:13, fontWeight:700, fontFamily:'inherit',
              color: tab===t.key ? C.emeraldLight : C.dim,
              borderBottom: tab===t.key ? `2px solid ${C.emerald}` : '2px solid transparent',
              marginBottom:-1, transition:'all .2s', whiteSpace:'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding:'24px 28px' }}>
        {/* Tab Produtos */}
        {tab === 'products' && (
          material.final_products?.length > 0
            ? material.final_products.map((p,i) => <ProductCard key={i} product={p} index={i}/>)
            : <p style={{ color:C.dim }}>Nenhum produto identificado.</p>
        )}

        {/* Tab Propriedades */}
        {tab === 'properties' && (
          <MaterialProperties props={material.material_properties}/>
        )}

        {/* Tab Combinações */}
        {tab === 'combinations' && (
          material.combinations_with_other_materials?.length > 0 ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
              {material.combinations_with_other_materials.map((c,i) => (
                <div key={i} style={{ background:'rgba(13,148,136,.06)', border:`1px solid rgba(13,148,136,.2)`, borderRadius:16, padding:'18px 20px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                    <span style={{ fontSize:20 }}>🔗</span>
                    <div>
                      <div style={{ color:'#fff', fontWeight:800, fontSize:14 }}>{c.combine_with}</div>
                      <div style={{ color:C.tealLight, fontSize:12, marginTop:2 }}>→ {c.resulting_product}</div>
                    </div>
                  </div>
                  {c.combination_benefit && <p style={{ color:'rgba(255,255,255,.65)', fontSize:13, lineHeight:1.7, margin:'0 0 8px' }}>{c.combination_benefit}</p>}
                  {c.process_overview && <p style={{ color:C.dim, fontSize:12, lineHeight:1.7, margin:0, fontStyle:'italic' }}>{c.process_overview}</p>}
                </div>
              ))}
            </div>
          ) : <p style={{ color:C.dim }}>Nenhuma combinação identificada.</p>
        )}
      </div>
    </div>
  );
};

/* ─── Loading Screen ──────────────────────────────────────── */
const LoadingScreen = () => {
  const steps = [
    '🌿 Identificando matérias-primas...',
    '🔬 Analisando propriedades dos materiais...',
    '⚗️ Mapeando processos de transformação...',
    '🏭 Calculando produtos finais possíveis...',
    '💰 Estimando custos em Kwanzas (AOA)...',
    '✨ Preparando relatório para Yoleni...',
  ];
  const [step, setStep] = React.useState(0);
  React.useEffect(() => {
    const iv = setInterval(() => setStep(s => (s + 1) % steps.length), 2000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:400, gap:32, padding:'40px 20px' }}>
      <div style={{ position:'relative', width:120, height:120 }}>
        <svg viewBox="0 0 120 120" style={{ width:120, height:120, animation:'spin 3s linear infinite' }}>
          <defs>
            <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={C.emerald}/>
              <stop offset="100%" stopColor={C.teal}/>
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(16,185,129,.12)" strokeWidth="7"/>
          <circle cx="60" cy="60" r="52" fill="none" stroke="url(#g1)" strokeWidth="7" strokeDasharray="80 245" strokeLinecap="round"/>
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:40 }}>🏭</div>
      </div>
      <div style={{ textAlign:'center' }}>
        <p style={{ color:C.emeraldLight, fontSize:17, fontWeight:700, marginBottom:10 }}>Sistema Industrial em Processamento</p>
        <p style={{ color:C.dim, fontSize:14, minHeight:24 }}>{steps[step]}</p>
        <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:16 }}>
          {steps.map((_,i) => (
            <div key={i} style={{ width: i===step ? 24 : 6, height:6, borderRadius:3, background: i===step ? C.emerald : 'rgba(16,185,129,.2)', transition:'all .4s' }}/>
          ))}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
    if (!input.trim()) { setError('Por favor, insira pelo menos uma matéria-prima.'); return; }
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

  const examples = [
    'Bagaço de cana-de-açúcar',
    'Capim elefante',
    'Bambu, Sisal',
    'Óleo de palma',
    'Caju, Mandioca',
  ];

  return (
    <div style={{ maxWidth:1200, margin:'0 auto', padding:'60px 24px' }}>

      {/* Hero */}
      <div style={{ textAlign:'center', marginBottom:64 }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(16,185,129,.1)', border:`1px solid rgba(16,185,129,.3)`, borderRadius:30, padding:'8px 22px', marginBottom:28, fontSize:13, color:C.emeraldLight, fontWeight:600 }}>
          🏭 Sistema Industrial de IA &nbsp;•&nbsp; Análise de Matérias-Primas
        </div>
        <h1 style={{ fontSize:'clamp(2rem,5vw,3.8rem)', fontWeight:900, lineHeight:1.05, letterSpacing:-2, margin:'0 0 20px' }}>
          <span style={{ color:'#fff' }}>Yoleni</span>{' '}
          <span style={{ background:`linear-gradient(135deg,${C.emerald},${C.teal})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Industrial</span>
          <span style={{ display:'block', fontSize:'.55em', color:'rgba(255,255,255,.75)', fontWeight:700, marginTop:8, letterSpacing:-0.5 }}>
            Design de Processos Industriais com IA
          </span>
        </h1>
        <p style={{ color:C.dim, fontSize:17, maxWidth:580, margin:'0 auto', lineHeight:1.9 }}>
          Insira uma matéria-prima e descubra todos os produtos possíveis, os processos detalhados de transformação, custos em Kwanzas e muito mais.
        </p>

        {/* Stats */}
        <div style={{ display:'flex', justifyContent:'center', gap:36, marginTop:36, flexWrap:'wrap' }}>
          {[
            { val:'10+', label:'Propriedades Analisadas' },
            { val:'AOA', label:'Custos em Kwanzas' },
            { val:'100%', label:'Processos Detalhados' },
            { val:'IA', label:'LLaMA 3.3 70B' },
          ].map((s,i) => (
            <div key={i} style={{ textAlign:'center' }}>
              <div style={{ fontSize:26, fontWeight:900, background:`linear-gradient(to right,#fff,${C.emeraldLight})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{s.val}</div>
              <div style={{ fontSize:11, color:C.dim, textTransform:'uppercase', letterSpacing:1.5, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Input Card */}
      <div style={{ background:'rgba(16,185,129,.04)', border:`1px solid ${C.border}`, borderRadius:28, padding:40, backdropFilter:'blur(20px)', marginBottom:28, boxShadow:'0 40px 80px rgba(0,0,0,.3)' }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.emeraldLight, textTransform:'uppercase', letterSpacing:1.5, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
          🌿 Insira a(s) Matéria(s)-Prima(s)
        </div>
        <textarea
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.ctrlKey && e.key==='Enter' && handleAnalyze()}
          placeholder="Ex: Bagaço de cana-de-açúcar, Capim elefante, Bambu..."
          rows={4}
          style={{ width:'100%', background:'rgba(16,185,129,.04)', border:`2px solid rgba(16,185,129,.2)`, borderRadius:16, padding:'16px 20px', color:'#fff', fontSize:15, resize:'vertical', outline:'none', fontFamily:'inherit', lineHeight:1.85, transition:'border-color .2s, box-shadow .2s', boxSizing:'border-box' }}
          onFocus={e=>{e.target.style.borderColor=C.emerald; e.target.style.boxShadow=`0 0 0 4px rgba(16,185,129,.1)`;}}
          onBlur={e=>{e.target.style.borderColor='rgba(16,185,129,.2)'; e.target.style.boxShadow='none';}}
        />
        <p style={{ fontSize:12, color:'rgba(255,255,255,.3)', marginTop:8 }}>
          Separe por vírgula • Uma ou várias matérias-primas • Ctrl+Enter para analisar
        </p>

        {/* Examples */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:7, margin:'16px 0 24px', alignItems:'center' }}>
          <span style={{ fontSize:12, color:'rgba(255,255,255,.3)' }}>Exemplos:</span>
          {examples.map((ex,i) => (
            <button key={i} onClick={() => setInput(ex)}
              style={{ background:'rgba(16,185,129,.07)', border:`1px solid rgba(16,185,129,.15)`, color:'rgba(255,255,255,.6)', padding:'5px 13px', borderRadius:20, cursor:'pointer', fontSize:12, fontFamily:'inherit', transition:'all .2s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.emerald; e.currentTarget.style.color=C.emeraldLight; e.currentTarget.style.background='rgba(16,185,129,.12)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(16,185,129,.15)'; e.currentTarget.style.color='rgba(255,255,255,.6)'; e.currentTarget.style.background='rgba(16,185,129,.07)';}}>
              🌿 {ex}
            </button>
          ))}
        </div>

        <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
          <button onClick={handleAnalyze} disabled={loading}
            style={{ flex:'1 1 220px', background: loading ? 'rgba(16,185,129,.25)' : `linear-gradient(135deg,${C.emerald},${C.tealDark||'#0f766e'})`, border:'none', color:'#fff', padding:'17px 32px', borderRadius:16, cursor: loading?'not-allowed':'pointer', fontSize:16, fontWeight:800, fontFamily:'inherit', boxShadow: loading?'none':`0 0 40px rgba(16,185,129,.3)`, transition:'all .3s', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
            {loading ? '⏳ Processando...' : '🏭 Analisar Matéria-Prima'}
          </button>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])}/>
          <button onClick={() => fileRef.current?.click()} disabled={loading}
            onDragOver={e=>{e.preventDefault(); setDragOver(true);}}
            onDragLeave={() => setDragOver(false)}
            onDrop={e=>{e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]);}}
            style={{ background: dragOver ? 'rgba(16,185,129,.12)' : 'rgba(255,255,255,.04)', border:`2px dashed ${dragOver ? C.emerald : 'rgba(255,255,255,.12)'}`, color:C.dim, padding:'15px 24px', borderRadius:16, cursor:'pointer', fontSize:14, fontWeight:600, fontFamily:'inherit', display:'flex', alignItems:'center', gap:8, transition:'all .2s' }}>
            📁 CSV / Excel
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background:'rgba(248,113,113,.08)', border:'1px solid rgba(248,113,113,.25)', borderRadius:16, padding:'16px 24px', marginBottom:24, color:'#fca5a5', display:'flex', gap:12, alignItems:'center', fontSize:14 }}>
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div style={{ background:'rgba(16,185,129,.03)', border:`1px solid ${C.border}`, borderRadius:28, padding:'40px 20px', marginBottom:24 }}>
          <LoadingScreen/>
        </div>
      )}

      {result && !loading && (
        <div ref={resultsRef}>
          {/* Greeting */}
          {result.greeting && (
            <div style={{ background:`linear-gradient(135deg,rgba(16,185,129,.1),rgba(13,148,136,.08))`, border:`1px solid rgba(16,185,129,.25)`, borderRadius:24, padding:'26px 30px', marginBottom:32, position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', right:20, top:'50%', transform:'translateY(-50%)', fontSize:90, opacity:.05 }}>🏭</div>
              <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
                <div style={{ width:50, height:50, borderRadius:16, background:`linear-gradient(135deg,${C.emerald},${C.teal})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0, boxShadow:`0 0 20px rgba(16,185,129,.3)` }}>🤖</div>
                <div>
                  <p style={{ fontSize:11, color:C.emeraldLight, textTransform:'uppercase', letterSpacing:2, marginBottom:8, fontWeight:700 }}>Sistema Yoleni Industrial AI</p>
                  <p style={{ color:'rgba(255,255,255,.85)', fontSize:15, lineHeight:1.85, margin:0 }}>{result.greeting}</p>
                </div>
              </div>
            </div>
          )}

          {/* Summary cards */}
          {result.summary && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:14, marginBottom:32 }}>
              {[
                { icon:'🌿', label:'Matérias Analisadas', val:result.raw_materials?.length || result.summary.total_materials_analyzed, color:C.emeraldLight },
                { icon:'🏆', label:'Produto Mais Valioso', val:result.summary.most_valuable_product, color:C.amberLight, sm:true },
                { icon:'💰', label:'Investimento Inicial', val:result.summary.investment_estimate_aoa, color:'#60a5fa', sm:true },
                { icon:'🌍', label:'Impacto Social', val:result.summary.social_impact, color:'#34d399', sm:true },
              ].filter(c => c.val).map((c,i) => (
                <div key={i} style={{ background:'rgba(16,185,129,.04)', border:`1px solid ${C.border}`, borderRadius:18, padding:'20px 22px' }}>
                  <div style={{ fontSize:26, marginBottom:8 }}>{c.icon}</div>
                  <div style={{ fontSize:10, color:C.dim, textTransform:'uppercase', letterSpacing:1.5, marginBottom:5 }}>{c.label}</div>
                  <div style={{ fontSize:c.sm?13:26, fontWeight:800, color:c.color, lineHeight:1.4 }}>{c.val}</div>
                </div>
              ))}
            </div>
          )}

          {/* Raw materials */}
          {result.raw_materials?.map((mat,i) => <RawMaterialCard key={i} material={mat}/>)}

          {/* Recommendation */}
          {result.summary?.yoleni_recommendation && (
            <div style={{ background:`linear-gradient(135deg,rgba(16,185,129,.08),rgba(13,148,136,.06))`, border:`1px solid rgba(16,185,129,.2)`, borderRadius:20, padding:'24px 28px', marginTop:12, display:'flex', gap:16 }}>
              <span style={{ fontSize:30, flexShrink:0 }}>💡</span>
              <div>
                <p style={{ color:C.emeraldLight, fontWeight:700, fontSize:13, textTransform:'uppercase', letterSpacing:1.5, margin:'0 0 8px' }}>Recomendação Personalizada para Yoleni</p>
                <p style={{ color:'rgba(255,255,255,.78)', fontSize:14, lineHeight:1.8, margin:0 }}>{result.summary.yoleni_recommendation}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Header ──────────────────────────────────────────────── */
function Header() {
  const loc = useLocation();
  const isHistorico = loc.pathname === '/historico';
  return (
    <header style={{ position:'sticky', top:0, zIndex:100, borderBottom:`1px solid rgba(16,185,129,.1)`, background:'rgba(3,13,10,.92)', backdropFilter:'blur(24px)' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:70, padding:'0 28px' }}>
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:14, textDecoration:'none' }}>
          <div style={{ width:44, height:44, borderRadius:14, background:`linear-gradient(135deg,${C.emerald},${C.teal})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, boxShadow:`0 0 22px rgba(16,185,129,.3)` }}>🏭</div>
          <div>
            <div style={{ fontSize:17, fontWeight:800, background:`linear-gradient(to right,#fff,${C.emeraldLight})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Yoleni Industrial</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,.3)', letterSpacing:2.5, textTransform:'uppercase' }}>Design de Processos</div>
          </div>
        </Link>
        <nav style={{ display:'flex', gap:6 }}>
          <Link to="/"
            style={{ display:'flex', alignItems:'center', gap:7, background: !isHistorico ? 'rgba(16,185,129,.12)' : 'rgba(255,255,255,.05)', border:`1px solid ${!isHistorico ? 'rgba(16,185,129,.4)' : 'rgba(255,255,255,.1)'}`, color: !isHistorico ? C.emeraldLight : 'rgba(255,255,255,.65)', padding:'9px 18px', borderRadius:12, fontSize:13, fontWeight:700, textDecoration:'none', transition:'all .2s' }}>
            🏭 Analisar
          </Link>
          <Link to="/historico"
            style={{ display:'flex', alignItems:'center', gap:7, background: isHistorico ? 'rgba(16,185,129,.12)' : 'rgba(255,255,255,.05)', border:`1px solid ${isHistorico ? 'rgba(16,185,129,.4)' : 'rgba(255,255,255,.1)'}`, color: isHistorico ? C.emeraldLight : 'rgba(255,255,255,.65)', padding:'9px 18px', borderRadius:12, fontSize:13, fontWeight:700, textDecoration:'none', transition:'all .2s' }}>
            📋 Histórico
          </Link>
        </nav>
      </div>
    </header>
  );
}

/* ─── Layout ──────────────────────────────────────────────── */
function Layout() {
  return (
    <div style={{ minHeight:'100vh', background:C.deepForest, color:'#fff', fontFamily:"'Outfit','Segoe UI',sans-serif", overflowX:'hidden', position:'relative' }}>
      {/* Background */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', top:'-15%', right:'-5%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(16,185,129,.08) 0%,transparent 70%)' }}/>
        <div style={{ position:'absolute', bottom:'-10%', left:'-8%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(13,148,136,.07) 0%,transparent 70%)' }}/>
        <div style={{ position:'absolute', top:'45%', left:'35%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle,rgba(16,185,129,.04) 0%,transparent 70%)' }}/>
        {/* Grid */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(16,185,129,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(16,185,129,.025) 1px,transparent 1px)', backgroundSize:'60px 60px' }}/>
      </div>
      <div style={{ position:'relative', zIndex:5 }}>
        <Header/>
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/historico" element={<Historico/>}/>
        </Routes>
        <footer style={{ borderTop:`1px solid rgba(16,185,129,.08)`, padding:'28px', textAlign:'center', marginTop:40 }}>
          <p style={{ color:'rgba(255,255,255,.2)', fontSize:13, margin:0 }}>
            Yoleni Industrial AI • Design de Processos Industriais • Desenvolvido com 💚 para Engenheira Yoleni • Angola 🇦🇴
          </p>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return <BrowserRouter><Layout/></BrowserRouter>;
}
