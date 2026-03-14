import React, { useState, useEffect, useCallback } from 'react';

/* ─── API helpers ─────────────────────────────────────────── */
const BASE = process.env.REACT_APP_API_URL || '/api';

const apiFetch = async (path) => {
  const r = await fetch(BASE + path);
  if (!r.ok) throw new Error((await r.json()).error || 'Erro na requisição');
  return r.json();
};

const apiDelete = async (id) => {
  const r = await fetch(`${BASE}/analysis/${id}`, { method: 'DELETE' });
  if (!r.ok) throw new Error((await r.json()).error || 'Erro ao deletar');
  return r.json();
};

/* ─── Design tokens ───────────────────────────────────────── */
const C = {
  rose:      '#e91e8c',
  roseLight: '#f472b6',
  mauve:     '#c084fc',
  mauveDark: '#7c3aed',
  deepPurple:'#0f0520',
  card:      'rgba(255,255,255,0.04)',
  border:    'rgba(233,30,140,0.18)',
  dim:       'rgba(255,255,255,0.45)',
  green:     '#34d399',
  yellow:    '#fbbf24',
  lime:      '#a3e635',
  red:       '#f87171',
};

/* ─── Tiny components ─────────────────────────────────────── */
const Badge = ({ level }) => {
  const map = {
    baixo:    { bg:'#d1fae5', color:'#065f46', dot:'#10b981' },
    moderado: { bg:'#fef3c7', color:'#92400e', dot:'#f59e0b' },
    alto:     { bg:'#fee2e2', color:'#7f1d1d', dot:'#ef4444' },
    crítico:  { bg:'#f5d0fe', color:'#6b21a8', dot:'#a855f7' },
    critico:  { bg:'#f5d0fe', color:'#6b21a8', dot:'#a855f7' },
  };
  const s = map[(level||'').toLowerCase()] || map.moderado;
  return (
    <span style={{ background:s.bg, color:s.color, padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700, display:'inline-flex', alignItems:'center', gap:4 }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:s.dot, display:'inline-block' }}/>
      {level||'N/A'}
    </span>
  );
};

const StatCard = ({ icon, label, value, color, sub }) => (
  <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:'22px 26px', backdropFilter:'blur(12px)', transition:'transform .2s' }}
    onMouseEnter={e=>e.currentTarget.style.transform='translateY(-3px)'}
    onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
    <div style={{ fontSize:28, marginBottom:8 }}>{icon}</div>
    <div style={{ fontSize:11, color:C.dim, textTransform:'uppercase', letterSpacing:1.5, marginBottom:4 }}>{label}</div>
    <div style={{ fontSize:28, fontWeight:900, color:color||'#fff' }}>{value}</div>
    {sub && <div style={{ fontSize:12, color:C.dim, marginTop:4 }}>{sub}</div>}
  </div>
);

const TypePill = ({ type }) => {
  const map = {
    optimized:   { label:'⚡ Otimizado',     bg:'rgba(233,30,140,.15)',  color:C.roseLight },
    low_cost:    { label:'💰 Baixo Custo',   bg:'rgba(163,230,53,.12)',  color:C.lime      },
    eco_friendly:{ label:'🌿 Eco Friendly',  bg:'rgba(52,211,153,.12)',  color:C.green     },
  };
  const s = map[type] || map.optimized;
  return <span style={{ background:s.bg, color:s.color, padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700 }}>{s.label}</span>;
};

/* ─── Mini bar chart (no library needed) ─────────────────── */
const MiniBar = ({ data, color }) => {
  if (!data || data.length === 0) return <p style={{ color:C.dim, fontSize:13 }}>Sem dados suficientes.</p>;
  const max = Math.max(...data.map(d => d.count));
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:60 }}>
      {data.map((d,i) => (
        <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', flex:1, gap:4 }}>
          <div style={{ width:'100%', background: color||C.rose, borderRadius:'4px 4px 0 0', height: max > 0 ? `${Math.round((d.count/max)*52)}px` : '4px', minHeight:4, transition:'height .4s', opacity:.85 }}/>
          <span style={{ fontSize:9, color:C.dim, whiteSpace:'nowrap' }}>{(d.day||'').split('T')[0].split('-').slice(1).join('/')}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── Impact pie (CSS only) ───────────────────────────────── */
const ImpactPie = ({ data }) => {
  if (!data || data.length === 0) return <p style={{ color:C.dim, fontSize:13 }}>Sem dados.</p>;
  const colors = { baixo:'#10b981', moderado:'#f59e0b', alto:'#ef4444', crítico:'#a855f7', critico:'#a855f7' };
  const total = data.reduce((a,d) => a + Number(d.count), 0);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {data.map((d,i) => {
        const pct = total > 0 ? Math.round((d.count / total)*100) : 0;
        const c = colors[(d.environmental_impact||'').toLowerCase()] || '#888';
        return (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background:c, flexShrink:0 }}/>
            <div style={{ flex:1, background:'rgba(255,255,255,.06)', borderRadius:4, height:8, overflow:'hidden' }}>
              <div style={{ width:`${pct}%`, height:'100%', background:c, borderRadius:4, transition:'width .6s' }}/>
            </div>
            <span style={{ fontSize:12, color:'rgba(255,255,255,.7)', width:70, textAlign:'right' }}>
              {d.environmental_impact} <strong style={{ color:'#fff' }}>{pct}%</strong>
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* ─── Analysis Detail Modal ───────────────────────────────── */
const DetailModal = ({ id, onClose }) => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [tab,     setTab]     = useState('substancias'); // substancias | processos | ia

  useEffect(() => {
    apiFetch(`/analysis/${id}`)
      .then(r => setData(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const ai = data?.ai_response || {};

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(10px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>

      <div style={{ background:'#160824', border:`1px solid ${C.border}`, borderRadius:28, width:'100%', maxWidth:900, maxHeight:'90vh', overflowY:'auto', display:'flex', flexDirection:'column' }}>

        {/* Modal header */}
        <div style={{ padding:'28px 32px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, position:'sticky', top:0, background:'#160824', zIndex:10, borderRadius:'28px 28px 0 0' }}>
          <div>
            <p style={{ fontSize:11, color:C.roseLight, textTransform:'uppercase', letterSpacing:2, marginBottom:6, fontWeight:700 }}>📋 Detalhes da Análise #{id}</p>
            {loading ? <div style={{ color:'rgba(255,255,255,.5)', fontSize:16 }}>Carregando...</div>
              : <h2 style={{ color:'#fff', fontSize:20, fontWeight:800, margin:0 }}>{data?.title}</h2>}
            {data && <p style={{ color:C.dim, fontSize:13, marginTop:4 }}>{new Date(data.created_at).toLocaleString('pt-BR')} • {data.substances_count} substância(s)</p>}
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,.08)', border:'none', color:'#fff', width:38, height:38, borderRadius:'50%', cursor:'pointer', fontSize:20, flexShrink:0 }}>×</button>
        </div>

        {loading && <div style={{ padding:60, textAlign:'center', color:C.dim }}>⏳ Carregando análise completa...</div>}
        {error   && <div style={{ padding:32, color:C.red }}>⚠️ {error}</div>}

        {data && !loading && (
          <div style={{ padding:'28px 32px', flex:1 }}>

            {/* Greeting da IA */}
            {ai.greeting && (
              <div style={{ background:`linear-gradient(135deg, rgba(233,30,140,.1), rgba(192,132,252,.1))`, border:`1px solid rgba(233,30,140,.25)`, borderRadius:18, padding:'20px 24px', marginBottom:28, display:'flex', gap:14 }}>
                <div style={{ fontSize:28, flexShrink:0 }}>🤖</div>
                <div>
                  <p style={{ fontSize:11, color:C.roseLight, textTransform:'uppercase', letterSpacing:2, marginBottom:6, fontWeight:700 }}>Resposta da IA</p>
                  <p style={{ color:'rgba(255,255,255,.85)', fontSize:14, lineHeight:1.8, margin:0 }}>{ai.greeting}</p>
                </div>
              </div>
            )}

            {/* Input original */}
            <div style={{ background:'rgba(255,255,255,.03)', border:`1px solid rgba(255,255,255,.08)`, borderRadius:14, padding:'16px 20px', marginBottom:24 }}>
              <p style={{ fontSize:11, color:C.dim, textTransform:'uppercase', letterSpacing:1.5, marginBottom:6 }}>Substâncias inseridas</p>
              <p style={{ color:'rgba(255,255,255,.8)', fontSize:14, fontFamily:'monospace', lineHeight:1.7 }}>{data.input_substances}</p>
            </div>

            {/* Tabs */}
            <div style={{ display:'flex', gap:8, marginBottom:24, borderBottom:`1px solid rgba(255,255,255,.07)`, paddingBottom:0 }}>
              {[
                { key:'substancias', label:`🔬 Substâncias (${data.substances?.length||0})` },
                { key:'processos',   label:`⚗️ Processos (${data.processes?.length||0})` },
                { key:'ia',          label:'🤖 Resumo IA' },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={{ background:'none', border:'none', cursor:'pointer', padding:'10px 18px', fontSize:13, fontWeight:700, fontFamily:'inherit',
                    color: tab===t.key ? C.roseLight : C.dim,
                    borderBottom: tab===t.key ? `2px solid ${C.rose}` : '2px solid transparent',
                    marginBottom:-1, transition:'all .2s' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab: Substâncias */}
            {tab === 'substancias' && (
              data.substances && data.substances.length > 0 ? (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                    <thead>
                      <tr>
                        {['Substância','Fórmula','Função','Propriedades','Aplicação','Custo','Impacto'].map(h => (
                          <th key={h} style={{ padding:'11px 14px', textAlign:'left', background:'rgba(233,30,140,.08)', color:C.roseLight, fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:1.2, borderBottom:`1px solid ${C.border}`, whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.substances.map((s,i) => (
                        <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,.04)' }}
                          onMouseEnter={e=>e.currentTarget.style.background='rgba(233,30,140,.04)'}
                          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                          <td style={{ padding:'13px 14px', color:'#fff', fontWeight:700 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                              <span style={{ width:7, height:7, borderRadius:'50%', background:C.rose, flexShrink:0 }}/>
                              {s.name}
                            </div>
                          </td>
                          <td style={{ padding:'13px 14px', color:C.roseLight, fontFamily:'monospace', fontSize:12 }}>{s.formula||'—'}</td>
                          <td style={{ padding:'13px 14px', color:'rgba(255,255,255,.8)' }}>{s.chemical_function||'—'}</td>
                          <td style={{ padding:'13px 14px', color:'rgba(255,255,255,.55)', fontSize:12, maxWidth:160 }}>{s.properties||'—'}</td>
                          <td style={{ padding:'13px 14px', color:'rgba(255,255,255,.55)', fontSize:12, maxWidth:160 }}>{s.industrial_application||'—'}</td>
                          <td style={{ padding:'13px 14px', color:C.lime, fontWeight:700, whiteSpace:'nowrap' }}>{s.estimated_cost||'—'}</td>
                          <td style={{ padding:'13px 14px' }}><Badge level={s.environmental_impact}/></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p style={{ color:C.dim, fontSize:14 }}>Nenhuma substância detalhada armazenada.</p>
            )}

            {/* Tab: Processos */}
            {tab === 'processos' && (
              data.processes && data.processes.length > 0 ? (
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  {data.processes.map((p,i) => (
                    <div key={i} style={{ background:'rgba(255,255,255,.035)', border:`1px solid ${C.border}`, borderRadius:18, padding:'22px 24px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10, marginBottom:14 }}>
                        <div>
                          <p style={{ fontSize:10, color:C.roseLight, textTransform:'uppercase', letterSpacing:1.5, fontWeight:700, marginBottom:4 }}>Processo {i+1}</p>
                          <h3 style={{ color:'#fff', fontSize:17, fontWeight:800, margin:0 }}>{p.process_name}</h3>
                        </div>
                        <TypePill type={p.process_type||p.type}/>
                      </div>

                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:10, marginBottom:16 }}>
                        {[
                          { label:'Eficiência', val:p.estimated_efficiency, c:C.lime },
                          { label:'Custo',      val:p.estimated_cost,       c:C.yellow },
                          { label:'Impacto',    val:<Badge level={p.environmental_impact}/>, c:'#fff' },
                        ].map(m => (
                          <div key={m.label} style={{ background:'rgba(255,255,255,.04)', borderRadius:12, padding:'12px 14px', textAlign:'center' }}>
                            <div style={{ fontSize:10, color:C.dim, textTransform:'uppercase', letterSpacing:1.2, marginBottom:5 }}>{m.label}</div>
                            <div style={{ fontWeight:800, color:m.c, fontSize:14 }}>{m.val}</div>
                          </div>
                        ))}
                      </div>

                      {p.reagents && p.reagents.length > 0 && (
                        <div style={{ marginBottom:14 }}>
                          <p style={{ fontSize:10, color:C.dim, textTransform:'uppercase', letterSpacing:1.2, marginBottom:8 }}>Reagentes</p>
                          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                            {p.reagents.map((r,j) => (
                              <span key={j} style={{ background:'rgba(233,30,140,.12)', border:`1px solid rgba(233,30,140,.25)`, color:C.roseLight, padding:'3px 12px', borderRadius:20, fontSize:12, fontWeight:600, fontFamily:'monospace' }}>{r}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {p.industrial_recommendation && (
                        <div style={{ background:'rgba(192,132,252,.07)', border:'1px solid rgba(192,132,252,.2)', borderRadius:12, padding:'14px 16px' }}>
                          <p style={{ fontSize:10, color:C.mauve, fontWeight:700, textTransform:'uppercase', letterSpacing:1.2, marginBottom:5 }}>💡 Recomendação para Yoleni</p>
                          <p style={{ color:'rgba(255,255,255,.78)', fontSize:13, lineHeight:1.7, margin:0 }}>{p.industrial_recommendation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : <p style={{ color:C.dim, fontSize:14 }}>Nenhum processo armazenado.</p>
            )}

            {/* Tab: Resumo IA */}
            {tab === 'ia' && (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                {ai.summary ? (
                  <>
                    {[
                      { icon:'🌿', label:'Combinação mais segura',   val: ai.summary.safest_combination },
                      { icon:'⚡', label:'Processo mais eficiente',  val: ai.summary.most_efficient_process },
                      { icon:'🌱', label:'Recomendação ambiental',   val: ai.summary.environmental_recommendation },
                      { icon:'💰', label:'Otimização de custos',     val: ai.summary.cost_optimization },
                    ].filter(i => i.val).map((item,i) => (
                      <div key={i} style={{ background:'rgba(255,255,255,.035)', border:`1px solid rgba(255,255,255,.07)`, borderRadius:16, padding:'18px 22px', display:'flex', gap:14 }}>
                        <span style={{ fontSize:24, flexShrink:0 }}>{item.icon}</span>
                        <div>
                          <p style={{ fontSize:10, color:C.dim, textTransform:'uppercase', letterSpacing:1.5, marginBottom:6, fontWeight:700 }}>{item.label}</p>
                          <p style={{ color:'rgba(255,255,255,.8)', fontSize:14, lineHeight:1.75, margin:0 }}>{item.val}</p>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <p style={{ color:C.dim, fontSize:14 }}>Resumo da IA não disponível para esta análise.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── MAIN PAGE ───────────────────────────────────────────── */
export default function Historico() {
  const [stats,    setStats]    = useState(null);
  const [history,  setHistory]  = useState([]);
  const [pagInfo,  setPagInfo]  = useState({ total:0, page:1, totalPages:1 });
  const [search,   setSearch]   = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading,  setLoading]  = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [toast,    setToast]    = useState(null);

  /* Debounce search */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  /* Load stats */
  useEffect(() => {
    apiFetch('/history/stats')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, []);

  /* Load history */
  const loadHistory = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page, limit:12, ...(debouncedSearch ? { search: debouncedSearch } : {}) });
      const r = await apiFetch(`/history?${qs}`);
      setHistory(r.data || []);
      setPagInfo(r.pagination || { total:0, page:1, totalPages:1 });
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => { loadHistory(1); }, [loadHistory]);

  /* Delete */
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Remover esta análise permanentemente?')) return;
    setDeleting(id);
    try {
      await apiDelete(id);
      showToast('✅ Análise removida com sucesso.', 'green');
      loadHistory(pagInfo.page);
    } catch (err) {
      showToast('⚠️ ' + err.message, 'red');
    } finally {
      setDeleting(null);
    }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const substanceList = (input) =>
    input.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);

  /* ── Render ── */
  return (
    <div style={{ minHeight:'100vh', background:C.deepPurple, fontFamily:"'Outfit', 'Segoe UI', sans-serif", color:'#fff', overflowX:'hidden' }}>

      {/* Background orbs */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-15%', right:'-5%',  width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(233,30,140,.13) 0%, transparent 70%)' }}/>
        <div style={{ position:'absolute', bottom:'-10%', left:'-8%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(192,132,252,.1) 0%, transparent 70%)' }}/>
      </div>

      {/* ── Header ── */}
      <header style={{ position:'sticky', top:0, zIndex:100, borderBottom:`1px solid rgba(233,30,140,.12)`, background:'rgba(15,5,32,.88)', backdropFilter:'blur(24px)' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:70, padding:'0 28px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:14, background:`linear-gradient(135deg, ${C.rose}, ${C.mauveDark})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, boxShadow:`0 0 22px rgba(233,30,140,.35)` }}>⚗️</div>
            <div>
              <div style={{ fontSize:17, fontWeight:800, background:`linear-gradient(to right, #fff, ${C.roseLight})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Yoleni Design</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,.3)', letterSpacing:2.5, textTransform:'uppercase' }}>Processos Químicos</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <a href="/" style={{ background:'rgba(255,255,255,.05)', border:`1px solid rgba(255,255,255,.1)`, color:'rgba(255,255,255,.75)', padding:'8px 18px', borderRadius:12, cursor:'pointer', fontSize:13, fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center', gap:7, transition:'all .2s' }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.rose}
              onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,.1)'}>
              ← Voltar ao Sistema
            </a>
          </div>
        </div>
      </header>

      <div style={{ position:'relative', zIndex:5, maxWidth:1280, margin:'0 auto', padding:'52px 28px 80px' }}>

        {/* ── Page title ── */}
        <div style={{ marginBottom:44 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(233,30,140,.1)', border:`1px solid rgba(233,30,140,.3)`, borderRadius:30, padding:'7px 18px', marginBottom:20, fontSize:12, color:C.roseLight, fontWeight:700 }}>
            📋 Dashboard de Histórico
          </div>
          <h1 style={{ fontSize:'clamp(1.8rem,4vw,2.8rem)', fontWeight:900, letterSpacing:-1.5, lineHeight:1.1, margin:0 }}>
            Histórico de{' '}
            <span style={{ background:`linear-gradient(135deg,${C.rose},${C.mauve})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Análises</span>
          </h1>
          <p style={{ color:C.dim, fontSize:15, marginTop:12, maxWidth:520, lineHeight:1.8 }}>
            Todas as pesquisas realizadas e as respostas geradas pelo Sistema Avançado de IA para Yoleni.
          </p>
        </div>

        {/* ── Stats row ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16, marginBottom:44 }}>
          {loadingStats ? (
            Array(4).fill(0).map((_,i) => (
              <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:'22px 26px', height:100, opacity:.5 }}/>
            ))
          ) : stats ? (
            <>
              <StatCard icon="🔬" label="Total de Análises"     value={stats.totals.total_analyses}   color={C.roseLight} />
              <StatCard icon="⚗️" label="Substâncias Analisadas" value={stats.totals.total_substances}  color={C.mauve}     />
              <StatCard icon="📊" label="Máx. por Análise"      value={stats.totals.max_substances}    color={C.lime}      />
              <StatCard icon="✨" label="Média por Análise"
                value={stats.totals.total_analyses > 0 ? Math.round(stats.totals.total_substances / stats.totals.total_analyses) : 0}
                color={C.yellow} sub="substâncias" />
            </>
          ) : null}
        </div>

        {/* ── Charts row ── */}
        {stats && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:20, marginBottom:44 }}>

            {/* Activity chart */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:22, padding:'24px 28px', backdropFilter:'blur(12px)' }}>
              <p style={{ fontSize:13, fontWeight:700, color:C.roseLight, textTransform:'uppercase', letterSpacing:1.5, marginBottom:18 }}>📈 Atividade — Últimos 7 dias</p>
              <MiniBar data={stats.recentActivity} color={C.rose} />
            </div>

            {/* Impact distribution */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:22, padding:'24px 28px', backdropFilter:'blur(12px)' }}>
              <p style={{ fontSize:13, fontWeight:700, color:C.roseLight, textTransform:'uppercase', letterSpacing:1.5, marginBottom:18 }}>🌿 Impacto Ambiental — Distribuição</p>
              <ImpactPie data={stats.impactDistribution} />
            </div>

            {/* Top substances */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:22, padding:'24px 28px', backdropFilter:'blur(12px)' }}>
              <p style={{ fontSize:13, fontWeight:700, color:C.roseLight, textTransform:'uppercase', letterSpacing:1.5, marginBottom:18 }}>🏆 Substâncias mais Analisadas</p>
              {stats.topSubstances && stats.topSubstances.length > 0 ? (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {stats.topSubstances.slice(0,6).map((s,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:12, color:C.dim, width:16, textAlign:'right', flexShrink:0 }}>#{i+1}</span>
                      <span style={{ fontSize:13, color:'rgba(255,255,255,.85)', fontWeight:600, flex:1 }}>{s.name}</span>
                      <span style={{ background:'rgba(233,30,140,.15)', color:C.roseLight, fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:20 }}>{s.frequency}×</span>
                    </div>
                  ))}
                </div>
              ) : <p style={{ color:C.dim, fontSize:13 }}>Sem dados ainda.</p>}
            </div>
          </div>
        )}

        {/* ── Search + List ── */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:24, overflow:'hidden', backdropFilter:'blur(12px)' }}>

          {/* List header */}
          <div style={{ padding:'22px 28px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:38, height:38, borderRadius:12, background:`linear-gradient(135deg,${C.rose},${C.mauveDark})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>📋</div>
              <div>
                <div style={{ fontSize:17, fontWeight:800, color:'#fff' }}>Todas as Pesquisas</div>
                <div style={{ fontSize:12, color:C.dim, marginTop:2 }}>{pagInfo.total} análise(s) registrada(s)</div>
              </div>
            </div>

            <div style={{ display:'flex', gap:8, alignItems:'center', flex:'1 1 auto', justifyContent:'flex-end', flexWrap:'wrap' }}>
            {/* Refresh button */}
            <button onClick={() => { loadHistory(1); apiFetch('/history/stats').then(r => setStats(r.data)).catch(()=>{}); }}
              style={{ background:'rgba(255,255,255,.05)', border:`1px solid rgba(255,255,255,.12)`, color:'rgba(255,255,255,.65)', padding:'9px 16px', borderRadius:12, cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit', display:'flex', alignItems:'center', gap:6, transition:'all .2s', whiteSpace:'nowrap' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.rose; e.currentTarget.style.color=C.roseLight;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,.12)'; e.currentTarget.style.color='rgba(255,255,255,.65)';}}>
              🔄 Atualizar
            </button>

            {/* Search */}
            <div style={{ position:'relative', flex:'1 1 260px', maxWidth:360 }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por título ou substância..."
                style={{ width:'100%', background:'rgba(255,255,255,.06)', border:`1px solid rgba(255,255,255,.1)`, borderRadius:12, padding:'10px 16px 10px 40px', color:'#fff', fontSize:14, outline:'none', fontFamily:'inherit', transition:'border-color .2s', boxSizing:'border-box' }}
                onFocus={e=>e.target.style.borderColor=C.rose}
                onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.1)'}
              />
              <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:C.dim, fontSize:15 }}>🔍</span>
            </div>
            </div>
          </div>

          {/* Cards grid */}
          {loading ? (
            <div style={{ padding:'60px 28px', textAlign:'center', color:C.dim }}>
              <div style={{ fontSize:40, marginBottom:14 }}>⏳</div>
              <p style={{ fontSize:15 }}>Carregando análises...</p>
            </div>
          ) : history.length === 0 ? (
            <div style={{ padding:'60px 28px', textAlign:'center' }}>
              <div style={{ fontSize:52, marginBottom:16 }}>🔬</div>
              <p style={{ color:'rgba(255,255,255,.7)', fontSize:17, fontWeight:700 }}>
                {debouncedSearch ? 'Nenhuma análise encontrada para esta busca.' : 'Nenhuma análise registrada ainda.'}
              </p>
              <p style={{ color:C.dim, fontSize:14, marginTop:8 }}>
                {debouncedSearch ? 'Tente outros termos.' : 'Realize sua primeira análise na página inicial!'}
              </p>
              {!debouncedSearch && (
                <a href="/" style={{ display:'inline-flex', alignItems:'center', gap:8, marginTop:24, background:`linear-gradient(135deg,${C.rose},${C.mauveDark})`, border:'none', color:'#fff', padding:'12px 28px', borderRadius:14, cursor:'pointer', fontSize:14, fontWeight:700, textDecoration:'none' }}>
                  ✨ Fazer Primeira Análise
                </a>
              )}
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16, padding:24 }}>
              {history.map(item => {
                const pills = substanceList(item.input_substances).slice(0, 5);
                const extra = substanceList(item.input_substances).length - 5;
                return (
                  <div key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    style={{ background:'rgba(255,255,255,.035)', border:`1px solid rgba(255,255,255,.07)`, borderRadius:20, padding:'22px 22px 18px', cursor:'pointer', transition:'all .25s', position:'relative', overflow:'hidden' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.rose; e.currentTarget.style.background = 'rgba(233,30,140,.05)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.07)'; e.currentTarget.style.background = 'rgba(255,255,255,.035)'; e.currentTarget.style.transform = 'translateY(0)'; }}>

                    {/* Glow accent */}
                    <div style={{ position:'absolute', top:0, left:0, width:'100%', height:2, background:`linear-gradient(to right, ${C.rose}, ${C.mauve})`, opacity:.7 }}/>

                    {/* Header */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14, gap:8 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                          <span style={{ width:8, height:8, borderRadius:'50%', background:C.rose, flexShrink:0, boxShadow:`0 0 6px ${C.rose}` }}/>
                          <span style={{ fontSize:10, color:C.dim, textTransform:'uppercase', letterSpacing:1.5 }}>#{item.id}</span>
                        </div>
                        <h3 style={{ color:'#fff', fontSize:15, fontWeight:800, margin:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.title}</h3>
                      </div>
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        disabled={deleting === item.id}
                        style={{ background:'rgba(248,113,113,.1)', border:`1px solid rgba(248,113,113,.2)`, color:C.red, width:30, height:30, borderRadius:8, cursor:'pointer', fontSize:13, flexShrink:0, transition:'all .2s', display:'flex', alignItems:'center', justifyContent:'center' }}
                        onMouseEnter={e => { e.currentTarget.style.background='rgba(248,113,113,.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background='rgba(248,113,113,.1)'; }}
                        title="Remover análise">
                        {deleting === item.id ? '⏳' : '🗑'}
                      </button>
                    </div>

                    {/* Substance pills */}
                    <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:16, minHeight:28 }}>
                      {pills.map((p,i) => (
                        <span key={i} style={{ background:'rgba(233,30,140,.12)', border:`1px solid rgba(233,30,140,.22)`, color:C.roseLight, padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:600, fontFamily:'monospace' }}>{p}</span>
                      ))}
                      {extra > 0 && <span style={{ background:'rgba(255,255,255,.07)', color:C.dim, padding:'2px 10px', borderRadius:20, fontSize:11 }}>+{extra} mais</span>}
                    </div>

                    {/* Footer */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:`1px solid rgba(255,255,255,.06)`, paddingTop:12 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ fontSize:14 }}>🔬</span>
                        <span style={{ fontSize:12, color:C.dim }}>{item.substances_count} substância(s)</span>
                      </div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,.3)' }}>
                        {new Date(item.created_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' })}
                        {' • '}
                        {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}
                      </div>
                    </div>

                    {/* "Ver detalhes" hint */}
                    <div style={{ textAlign:'center', marginTop:10 }}>
                      <span style={{ fontSize:11, color:'rgba(233,30,140,.6)', fontWeight:600, letterSpacing:.5 }}>
                        Clique para ver detalhes completos →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagInfo.totalPages > 1 && (
            <div style={{ padding:'16px 28px', borderTop:`1px solid ${C.border}`, display:'flex', justifyContent:'center', alignItems:'center', gap:8 }}>
              <button onClick={() => loadHistory(pagInfo.page - 1)} disabled={pagInfo.page <= 1}
                style={{ background:'rgba(255,255,255,.05)', border:`1px solid rgba(255,255,255,.1)`, color:'rgba(255,255,255,.7)', padding:'8px 16px', borderRadius:10, cursor:'pointer', fontSize:13, fontFamily:'inherit', opacity: pagInfo.page <= 1 ? .4 : 1 }}>
                ← Anterior
              </button>
              {Array.from({ length: pagInfo.totalPages }, (_,i) => i+1).map(p => (
                <button key={p} onClick={() => loadHistory(p)}
                  style={{ background: p===pagInfo.page ? `linear-gradient(135deg,${C.rose},${C.mauveDark})` : 'rgba(255,255,255,.05)', border: `1px solid ${p===pagInfo.page ? C.rose : 'rgba(255,255,255,.1)'}`, color:'#fff', padding:'8px 14px', borderRadius:10, cursor:'pointer', fontSize:13, fontFamily:'inherit', fontWeight: p===pagInfo.page ? 700 : 400, minWidth:38 }}>
                  {p}
                </button>
              ))}
              <button onClick={() => loadHistory(pagInfo.page + 1)} disabled={pagInfo.page >= pagInfo.totalPages}
                style={{ background:'rgba(255,255,255,.05)', border:`1px solid rgba(255,255,255,.1)`, color:'rgba(255,255,255,.7)', padding:'8px 16px', borderRadius:10, cursor:'pointer', fontSize:13, fontFamily:'inherit', opacity: pagInfo.page >= pagInfo.totalPages ? .4 : 1 }}>
                Próxima →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Modal ── */}
      {selectedId && <DetailModal id={selectedId} onClose={() => setSelectedId(null)} />}

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position:'fixed', bottom:28, right:28, zIndex:300, background: toast.type==='green' ? 'rgba(52,211,153,.15)' : 'rgba(248,113,113,.15)', border:`1px solid ${toast.type==='green' ? 'rgba(52,211,153,.4)' : 'rgba(248,113,113,.4)'}`, color: toast.type==='green' ? C.green : C.red, padding:'14px 22px', borderRadius:14, fontSize:14, fontWeight:600, backdropFilter:'blur(12px)', boxShadow:'0 10px 40px rgba(0,0,0,.3)', animation:'toastIn .3s ease' }}>
          {toast.msg}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes toastIn { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}
