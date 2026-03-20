import React, { useState, useEffect, useCallback } from 'react';

const BASE = process.env.REACT_APP_API_URL || 'https://amiable-dedication-production.up.railway.app/api';
const C = {
  emerald:'#10b981', emeraldLight:'#34d399', teal:'#0d9488', tealLight:'#2dd4bf',
  amber:'#f59e0b', amberLight:'#fcd34d', deepForest:'#030d0a',
  card:'rgba(16,185,129,0.05)', border:'rgba(16,185,129,0.18)',
  dim:'rgba(255,255,255,0.45)', green:'#34d399', red:'#f87171', blue:'#60a5fa',
};

const apiFetch = async (path) => {
  const r = await fetch(BASE + path);
  if (!r.ok) throw new Error((await r.json()).error || 'Erro');
  return r.json();
};
const apiDelete = async (id) => {
  const r = await fetch(`${BASE}/analysis/${id}`, { method:'DELETE' });
  if (!r.ok) throw new Error((await r.json()).error || 'Erro ao deletar');
  return r.json();
};

const ImpactBadge = ({ level }) => {
  const map = {
    baixo:{ bg:'rgba(16,185,129,.15)', color:'#34d399', dot:'#10b981' },
    moderado:{ bg:'rgba(245,158,11,.15)', color:'#fcd34d', dot:'#f59e0b' },
    alto:{ bg:'rgba(248,113,113,.15)', color:'#fca5a5', dot:'#ef4444' },
    crítico:{ bg:'rgba(167,139,250,.15)', color:'#c4b5fd', dot:'#8b5cf6' },
    critico:{ bg:'rgba(167,139,250,.15)', color:'#c4b5fd', dot:'#8b5cf6' },
  };
  const s = map[(level||'').toLowerCase()] || map.moderado;
  return (
    <span style={{ background:s.bg, color:s.color, padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700, display:'inline-flex', alignItems:'center', gap:4 }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:s.dot }}/>
      {level||'N/A'}
    </span>
  );
};

const StatCard = ({ icon, label, value, color, sub }) => (
  <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:'22px 26px', transition:'transform .2s' }}
    onMouseEnter={e=>e.currentTarget.style.transform='translateY(-3px)'}
    onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
    <div style={{ fontSize:28, marginBottom:8 }}>{icon}</div>
    <div style={{ fontSize:11, color:C.dim, textTransform:'uppercase', letterSpacing:1.5, marginBottom:4 }}>{label}</div>
    <div style={{ fontSize:26, fontWeight:900, color:color||'#fff' }}>{value}</div>
    {sub && <div style={{ fontSize:12, color:C.dim, marginTop:4 }}>{sub}</div>}
  </div>
);

const MiniBar = ({ data }) => {
  if (!data || data.length === 0) return <p style={{ color:C.dim, fontSize:13 }}>Sem dados.</p>;
  const max = Math.max(...data.map(d => d.count));
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:60 }}>
      {data.map((d,i) => (
        <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', flex:1, gap:4 }}>
          <div style={{ width:'100%', background:C.emerald, borderRadius:'4px 4px 0 0', height: max > 0 ? `${Math.round((d.count/max)*52)}px` : '4px', minHeight:4, opacity:.8 }}/>
          <span style={{ fontSize:9, color:C.dim, whiteSpace:'nowrap' }}>
            {(d.day||'').split('T')[0].split('-').slice(1).join('/')}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ─── Modal de Detalhes ───────────────────────────────────── */
const DetailModal = ({ id, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('materiais');

  useEffect(() => {
    apiFetch(`/analysis/${id}`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const ai = data?.ai_response || {};
  const materials = ai.raw_materials || ai.substances || [];

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.8)', backdropFilter:'blur(10px)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#060f0b', border:`1px solid ${C.border}`, borderRadius:28, width:'100%', maxWidth:900, maxHeight:'90vh', overflowY:'auto' }}>

        <div style={{ padding:'28px 32px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'flex-start', justifyContent:'space-between', position:'sticky', top:0, background:'#060f0b', zIndex:10, borderRadius:'28px 28px 0 0' }}>
          <div>
            <p style={{ fontSize:11, color:C.emeraldLight, textTransform:'uppercase', letterSpacing:2, marginBottom:6, fontWeight:700 }}>📋 Análise #{id}</p>
            {loading ? <p style={{ color:C.dim }}>Carregando...</p> : <h2 style={{ color:'#fff', fontSize:20, fontWeight:800, margin:0 }}>{data?.title}</h2>}
            {data && <p style={{ color:C.dim, fontSize:13, marginTop:4 }}>{new Date(data.created_at).toLocaleString('pt-BR')} • {data.substances_count} matéria(s)</p>}
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,.08)', border:'none', color:'#fff', width:38, height:38, borderRadius:'50%', cursor:'pointer', fontSize:20, flexShrink:0 }}>×</button>
        </div>

        {loading && <div style={{ padding:60, textAlign:'center', color:C.dim }}>⏳ Carregando...</div>}

        {data && !loading && (
          <div style={{ padding:'28px 32px' }}>
            {ai.greeting && (
              <div style={{ background:`linear-gradient(135deg,rgba(16,185,129,.1),rgba(13,148,136,.08))`, border:`1px solid rgba(16,185,129,.22)`, borderRadius:18, padding:'20px 24px', marginBottom:24, display:'flex', gap:14 }}>
                <div style={{ fontSize:26 }}>🤖</div>
                <div>
                  <p style={{ fontSize:11, color:C.emeraldLight, textTransform:'uppercase', letterSpacing:2, marginBottom:6, fontWeight:700 }}>Resposta da IA</p>
                  <p style={{ color:'rgba(255,255,255,.82)', fontSize:14, lineHeight:1.8, margin:0 }}>{ai.greeting}</p>
                </div>
              </div>
            )}

            <div style={{ background:'rgba(16,185,129,.03)', border:`1px solid rgba(16,185,129,.1)`, borderRadius:14, padding:'14px 18px', marginBottom:22 }}>
              <p style={{ fontSize:11, color:C.dim, textTransform:'uppercase', letterSpacing:1.5, marginBottom:6 }}>Matérias-Primas Inseridas</p>
              <p style={{ color:'rgba(255,255,255,.8)', fontSize:14, fontFamily:'monospace', lineHeight:1.7, margin:0 }}>{data.input_substances}</p>
            </div>

            {/* Tabs */}
            <div style={{ display:'flex', gap:6, marginBottom:24, borderBottom:`1px solid rgba(255,255,255,.06)` }}>
              {[
                { key:'materiais', label:`🌿 Matérias (${materials.length})` },
                { key:'processos', label:`⚗️ Processos (${data.processes?.length||0})` },
                { key:'resumo',    label:'📊 Resumo IA' },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={{ background:'none', border:'none', cursor:'pointer', padding:'10px 16px', fontSize:13, fontWeight:700, fontFamily:'inherit',
                    color: tab===t.key ? C.emeraldLight : C.dim,
                    borderBottom: tab===t.key ? `2px solid ${C.emerald}` : '2px solid transparent',
                    marginBottom:-1, transition:'all .2s' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'materiais' && (
              materials.length > 0 ? (
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  {materials.map((m,i) => (
                    <div key={i} style={{ background:'rgba(16,185,129,.04)', border:`1px solid rgba(16,185,129,.15)`, borderRadius:16, padding:'18px 22px' }}>
                      <h3 style={{ color:'#fff', fontSize:16, fontWeight:800, margin:'0 0 6px' }}>{m.name}</h3>
                      {m.description && <p style={{ color:C.dim, fontSize:13, lineHeight:1.7, margin:'0 0 12px' }}>{m.description}</p>}
                      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                        {m.estimated_cost_aoa && <span style={{ background:'rgba(245,158,11,.12)', color:C.amberLight, padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700 }}>💰 {m.estimated_cost_aoa}</span>}
                        {m.availability_angola && <span style={{ background:'rgba(16,185,129,.12)', color:C.emeraldLight, padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700 }}>🇦🇴 {m.availability_angola}</span>}
                        {m.final_products?.length > 0 && <span style={{ background:'rgba(96,165,250,.12)', color:C.blue, padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700 }}>🏭 {m.final_products.length} produtos</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p style={{ color:C.dim }}>Sem dados.</p>
            )}

            {tab === 'processos' && (
              data.processes?.length > 0 ? (
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  {data.processes.map((p,i) => (
                    <div key={i} style={{ background:'rgba(13,148,136,.05)', border:`1px solid rgba(13,148,136,.18)`, borderRadius:16, padding:'18px 22px' }}>
                      <h3 style={{ color:'#fff', fontSize:16, fontWeight:800, margin:'0 0 10px' }}>{p.process_name}</h3>
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:10 }}>
                        {p.estimated_efficiency && <span style={{ background:'rgba(16,185,129,.12)', color:C.emeraldLight, padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700 }}>⚡ {p.estimated_efficiency}</span>}
                        {p.estimated_cost && <span style={{ background:'rgba(245,158,11,.12)', color:C.amberLight, padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700 }}>💰 {p.estimated_cost}</span>}
                        <ImpactBadge level={p.environmental_impact}/>
                      </div>
                      {p.industrial_recommendation && (
                        <div style={{ background:'rgba(16,185,129,.06)', border:`1px solid rgba(16,185,129,.15)`, borderRadius:12, padding:'12px 14px' }}>
                          <p style={{ fontSize:10, color:C.emeraldLight, fontWeight:700, textTransform:'uppercase', letterSpacing:1.5, marginBottom:5 }}>💡 Recomendação para Yoleni</p>
                          <p style={{ color:'rgba(255,255,255,.75)', fontSize:13, lineHeight:1.7, margin:0 }}>{p.industrial_recommendation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : <p style={{ color:C.dim }}>Sem processos armazenados.</p>
            )}

            {tab === 'resumo' && (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {ai.summary ? (
                  Object.entries({
                    '🏆 Produto mais valioso': ai.summary.most_valuable_product,
                    '⚗️ Processo recomendado': ai.summary.recommended_process,
                    '💰 Investimento estimado': ai.summary.investment_estimate_aoa,
                    '🌍 Impacto social': ai.summary.social_impact,
                    '🌿 Sustentabilidade': ai.summary.sustainability_note,
                    '💡 Recomendação Yoleni': ai.summary.yoleni_recommendation,
                  }).filter(([,v]) => v).map(([k,v], i) => (
                    <div key={i} style={{ background:'rgba(16,185,129,.04)', border:`1px solid rgba(16,185,129,.1)`, borderRadius:14, padding:'16px 20px', display:'flex', gap:14 }}>
                      <span style={{ fontSize:20, flexShrink:0 }}>{k.split(' ')[0]}</span>
                      <div>
                        <p style={{ fontSize:10, color:C.dim, textTransform:'uppercase', letterSpacing:1.5, marginBottom:5, fontWeight:700 }}>{k.slice(3)}</p>
                        <p style={{ color:'rgba(255,255,255,.8)', fontSize:14, lineHeight:1.75, margin:0 }}>{v}</p>
                      </div>
                    </div>
                  ))
                ) : <p style={{ color:C.dim }}>Resumo não disponível.</p>}
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
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [pagInfo, setPagInfo] = useState({ total:0, page:1, totalPages:1 });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 400); return () => clearTimeout(t); }, [search]);

  useEffect(() => {
    apiFetch('/history/stats')
      .then(r => { console.log('Stats response:', r); setStats(r.data); })
      .catch(e => { console.error('Erro stats:', e); })
      .finally(() => setLoadingStats(false));
  }, []);

  const loadHistory = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page, limit:12, ...(debouncedSearch ? { search:debouncedSearch } : {}) });
      const r = await apiFetch(`/history?${qs}`);
      console.log('History response:', r);
      const data = r.data || [];
      const pagination = r.pagination || { total: data.length, page:1, limit:12, totalPages: Math.ceil(data.length/12)||1 };
      setHistory(data);
      setPagInfo(pagination);
    } catch(e) {
      console.error('Erro ao carregar histórico:', e);
      setHistory([]);
    }
    finally { setLoading(false); }
  }, [debouncedSearch]);

  useEffect(() => { loadHistory(1); }, [loadHistory]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Remover esta análise permanentemente?')) return;
    setDeleting(id);
    try { await apiDelete(id); showToast('✅ Análise removida.', 'green'); loadHistory(pagInfo.page); }
    catch (err) { showToast('⚠️ ' + err.message, 'red'); }
    finally { setDeleting(null); }
  };

  const showToast = (msg, type) => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const materialList = (input) => input.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);

  // Última pesquisa
  const lastAnalysis = history[0];

  return (
    <div style={{ minHeight:'100vh', background:C.deepForest, fontFamily:"'Outfit','Segoe UI',sans-serif", color:'#fff', overflowX:'hidden' }}>
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', top:'-15%', right:'-5%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(16,185,129,.08) 0%,transparent 70%)' }}/>
        <div style={{ position:'absolute', bottom:'-10%', left:'-8%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(13,148,136,.07) 0%,transparent 70%)' }}/>
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(16,185,129,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(16,185,129,.02) 1px,transparent 1px)', backgroundSize:'60px 60px' }}/>
      </div>

      <div style={{ position:'relative', zIndex:5, maxWidth:1280, margin:'0 auto', padding:'52px 28px 80px' }}>

        {/* Title */}
        <div style={{ marginBottom:40 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(16,185,129,.1)', border:`1px solid rgba(16,185,129,.3)`, borderRadius:30, padding:'7px 18px', marginBottom:20, fontSize:12, color:C.emeraldLight, fontWeight:700 }}>
            📋 Dashboard de Histórico
          </div>
          <h1 style={{ fontSize:'clamp(1.8rem,4vw,2.8rem)', fontWeight:900, letterSpacing:-1.5, lineHeight:1.1, margin:0 }}>
            Histórico de{' '}
            <span style={{ background:`linear-gradient(135deg,${C.emerald},${C.teal})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Análises</span>
          </h1>
          <p style={{ color:C.dim, fontSize:15, marginTop:10, lineHeight:1.8 }}>Todas as matérias-primas analisadas e respostas geradas pela IA para Yoleni.</p>
        </div>

        {/* Última pesquisa em destaque */}
        {lastAnalysis && (
          <div style={{ background:`linear-gradient(135deg,rgba(16,185,129,.1),rgba(13,148,136,.07))`, border:`1px solid rgba(16,185,129,.3)`, borderRadius:22, padding:'24px 28px', marginBottom:36, cursor:'pointer', transition:'all .2s' }}
            onClick={() => setSelectedId(lastAnalysis.id)}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(16,185,129,.6)'; e.currentTarget.style.transform='translateY(-2px)';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(16,185,129,.3)'; e.currentTarget.style.transform='translateY(0)';}}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:46, height:46, borderRadius:14, background:`linear-gradient(135deg,${C.emerald},${C.teal})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, boxShadow:`0 0 16px rgba(16,185,129,.3)` }}>🕐</div>
                <div>
                  <div style={{ fontSize:11, color:C.emeraldLight, textTransform:'uppercase', letterSpacing:2, fontWeight:700, marginBottom:4 }}>⚡ Última Pesquisa</div>
                  <h3 style={{ color:'#fff', fontSize:17, fontWeight:800, margin:0 }}>{lastAnalysis.title}</h3>
                  <p style={{ color:C.dim, fontSize:12, margin:'4px 0 0' }}>
                    📅 {new Date(lastAnalysis.created_at).toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })}
                    {' • '}
                    🕐 {new Date(lastAnalysis.created_at).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}
                    {' • '}
                    🌿 {lastAnalysis.substances_count} matéria(s)-prima(s)
                  </p>
                </div>
              </div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {materialList(lastAnalysis.input_substances).slice(0,4).map((m,i) => (
                  <span key={i} style={{ background:'rgba(16,185,129,.15)', border:`1px solid rgba(16,185,129,.25)`, color:C.emeraldLight, padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:600 }}>🌿 {m}</span>
                ))}
              </div>
              <span style={{ fontSize:12, color:C.emeraldLight, fontWeight:700 }}>Ver detalhes →</span>
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16, marginBottom:40 }}>
          {loadingStats ? Array(4).fill(0).map((_,i) => <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20, padding:'22px 26px', height:100, opacity:.4 }}/>) : stats && (
            <>
              <StatCard icon="🌿" label="Total de Análises" value={stats.totals.total_analyses} color={C.emeraldLight}/>
              <StatCard icon="🏭" label="Matérias Analisadas" value={stats.totals.total_substances} color={C.tealLight}/>
              <StatCard icon="📊" label="Máx. por Análise" value={stats.totals.max_substances} color={C.amberLight}/>
              <StatCard icon="✨" label="Média por Análise" value={stats.totals.total_analyses > 0 ? Math.round(stats.totals.total_substances/stats.totals.total_analyses) : 0} color={C.blue} sub="matérias"/>
            </>
          )}
        </div>

        {/* Charts */}
        {stats && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:18, marginBottom:40 }}>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:22, padding:'24px 28px' }}>
              <p style={{ fontSize:13, fontWeight:700, color:C.emeraldLight, textTransform:'uppercase', letterSpacing:1.5, marginBottom:18 }}>📈 Actividade — 7 dias</p>
              <MiniBar data={stats.recentActivity}/>
            </div>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:22, padding:'24px 28px' }}>
              <p style={{ fontSize:13, fontWeight:700, color:C.emeraldLight, textTransform:'uppercase', letterSpacing:1.5, marginBottom:18 }}>🏆 Mais Analisadas</p>
              {stats.topSubstances?.length > 0 ? (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {stats.topSubstances.slice(0,6).map((s,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:12, color:C.dim, width:16, textAlign:'right' }}>#{i+1}</span>
                      <span style={{ fontSize:13, color:'rgba(255,255,255,.85)', fontWeight:600, flex:1 }}>🌿 {s.name}</span>
                      <span style={{ background:'rgba(16,185,129,.15)', color:C.emeraldLight, fontSize:11, fontWeight:700, padding:'2px 9px', borderRadius:20 }}>{s.frequency}×</span>
                    </div>
                  ))}
                </div>
              ) : <p style={{ color:C.dim, fontSize:13 }}>Sem dados ainda.</p>}
            </div>
          </div>
        )}

        {/* List */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:24, overflow:'hidden' }}>
          <div style={{ padding:'22px 28px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:38, height:38, borderRadius:12, background:`linear-gradient(135deg,${C.emerald},${C.teal})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>📋</div>
              <div>
                <div style={{ fontSize:17, fontWeight:800 }}>Todas as Pesquisas</div>
                <div style={{ fontSize:12, color:C.dim, marginTop:2 }}>{pagInfo.total || history.length} análise(s) registrada(s)</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center', flex:'1 1 auto', justifyContent:'flex-end', flexWrap:'wrap' }}>
              <button onClick={() => { loadHistory(1); apiFetch('/history/stats').then(r=>setStats(r.data)).catch(()=>{}); }}
                style={{ background:'rgba(16,185,129,.07)', border:`1px solid rgba(16,185,129,.15)`, color:C.dim, padding:'9px 16px', borderRadius:12, cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit', display:'flex', alignItems:'center', gap:6, transition:'all .2s' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=C.emerald; e.currentTarget.style.color=C.emeraldLight;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(16,185,129,.15)'; e.currentTarget.style.color=C.dim;}}>
                🔄 Atualizar
              </button>
              <div style={{ position:'relative', flex:'1 1 240px', maxWidth:340 }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar análises..."
                  style={{ width:'100%', background:'rgba(16,185,129,.05)', border:`1px solid rgba(16,185,129,.15)`, borderRadius:12, padding:'10px 16px 10px 38px', color:'#fff', fontSize:14, outline:'none', fontFamily:'inherit', transition:'border-color .2s', boxSizing:'border-box' }}
                  onFocus={e=>e.target.style.borderColor=C.emerald}
                  onBlur={e=>e.target.style.borderColor='rgba(16,185,129,.15)'}/>
                <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:C.dim, fontSize:14 }}>🔍</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ padding:'60px 28px', textAlign:'center', color:C.dim }}>
              <div style={{ fontSize:40, marginBottom:14 }}>⏳</div>
              <p>Carregando análises...</p>
            </div>
          ) : history.length === 0 ? (
            <div style={{ padding:'80px 28px', textAlign:'center' }}>
              <div style={{ fontSize:52, marginBottom:16 }}>🌿</div>
              <p style={{ color:'rgba(255,255,255,.7)', fontSize:17, fontWeight:700 }}>
                {debouncedSearch ? 'Nenhuma análise encontrada.' : 'Nenhuma análise realizada ainda.'}
              </p>
              {!debouncedSearch && (
                <a href="/" style={{ display:'inline-flex', alignItems:'center', gap:8, marginTop:20, background:`linear-gradient(135deg,${C.emerald},${C.teal})`, border:'none', color:'#fff', padding:'12px 28px', borderRadius:14, cursor:'pointer', fontSize:14, fontWeight:700, textDecoration:'none' }}>
                  🏭 Fazer Primeira Análise
                </a>
              )}
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:14, padding:20 }}>
              {history.map((item, idx) => {
                const pills = materialList(item.input_substances).slice(0,4);
                const extra = materialList(item.input_substances).length - 4;
                const isLast = idx === 0;
                return (
                  <div key={item.id} onClick={() => setSelectedId(item.id)}
                    style={{ background: isLast ? 'rgba(16,185,129,.08)' : 'rgba(255,255,255,.03)', border:`1px solid ${isLast ? 'rgba(16,185,129,.35)' : 'rgba(255,255,255,.07)'}`, borderRadius:20, padding:'20px 22px 16px', cursor:'pointer', transition:'all .25s', position:'relative', overflow:'hidden' }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(16,185,129,.5)'; e.currentTarget.style.background='rgba(16,185,129,.07)'; e.currentTarget.style.transform='translateY(-3px)';}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor= isLast ? 'rgba(16,185,129,.35)' : 'rgba(255,255,255,.07)'; e.currentTarget.style.background= isLast ? 'rgba(16,185,129,.08)' : 'rgba(255,255,255,.03)'; e.currentTarget.style.transform='translateY(0)';}}>
                    <div style={{ position:'absolute', top:0, left:0, width:'100%', height:3, background:`linear-gradient(to right,${C.emerald},${C.teal})`, opacity: isLast ? 1 : .4 }}/>
                    {isLast && <div style={{ position:'absolute', top:12, right:12, background:'rgba(16,185,129,.2)', color:C.emeraldLight, fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:20, textTransform:'uppercase', letterSpacing:1 }}>⚡ Última</div>}

                    <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:12 }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:C.emerald, flexShrink:0, marginTop:5, boxShadow:`0 0 6px ${C.emerald}` }}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <span style={{ fontSize:10, color:C.dim, textTransform:'uppercase', letterSpacing:1.5 }}>#{item.id}</span>
                        <h3 style={{ color:'#fff', fontSize:14, fontWeight:800, margin:'2px 0 0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.title}</h3>
                      </div>
                      <button onClick={(e) => handleDelete(item.id, e)} disabled={deleting===item.id}
                        style={{ background:'rgba(248,113,113,.08)', border:`1px solid rgba(248,113,113,.18)`, color:C.red, width:28, height:28, borderRadius:8, cursor:'pointer', fontSize:12, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {deleting===item.id ? '⏳' : '🗑'}
                      </button>
                    </div>

                    <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:14 }}>
                      {pills.map((p,i) => <span key={i} style={{ background:'rgba(16,185,129,.1)', border:`1px solid rgba(16,185,129,.2)`, color:C.emeraldLight, padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:600 }}>🌿 {p}</span>)}
                      {extra > 0 && <span style={{ background:'rgba(255,255,255,.06)', color:C.dim, padding:'2px 10px', borderRadius:20, fontSize:11 }}>+{extra}</span>}
                    </div>

                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:`1px solid rgba(255,255,255,.05)`, paddingTop:10 }}>
                      <span style={{ fontSize:12, color:C.dim }}>🌿 {item.substances_count} matéria(s)</span>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:11, color:'rgba(255,255,255,.3)' }}>
                          {new Date(item.created_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' })}
                        </div>
                        <div style={{ fontSize:11, color:C.emeraldLight, fontWeight:600 }}>
                          🕐 {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign:'center', marginTop:8 }}>
                      <span style={{ fontSize:11, color:'rgba(16,185,129,.5)', fontWeight:600 }}>Clique para ver detalhes →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {pagInfo.totalPages > 1 && (
            <div style={{ padding:'16px 28px', borderTop:`1px solid ${C.border}`, display:'flex', justifyContent:'center', gap:8 }}>
              <button onClick={() => loadHistory(pagInfo.page-1)} disabled={pagInfo.page<=1}
                style={{ background:'rgba(16,185,129,.07)', border:`1px solid rgba(16,185,129,.15)`, color:C.dim, padding:'8px 16px', borderRadius:10, cursor:'pointer', fontSize:13, fontFamily:'inherit', opacity:pagInfo.page<=1?.4:1 }}>← Anterior</button>
              {Array.from({ length:pagInfo.totalPages },(_,i)=>i+1).map(p => (
                <button key={p} onClick={() => loadHistory(p)}
                  style={{ background: p===pagInfo.page ? `linear-gradient(135deg,${C.emerald},${C.teal})` : 'rgba(16,185,129,.07)', border:`1px solid ${p===pagInfo.page ? C.emerald : 'rgba(16,185,129,.15)'}`, color:'#fff', padding:'8px 14px', borderRadius:10, cursor:'pointer', fontSize:13, fontFamily:'inherit', fontWeight:p===pagInfo.page?700:400, minWidth:36 }}>{p}</button>
              ))}
              <button onClick={() => loadHistory(pagInfo.page+1)} disabled={pagInfo.page>=pagInfo.totalPages}
                style={{ background:'rgba(16,185,129,.07)', border:`1px solid rgba(16,185,129,.15)`, color:C.dim, padding:'8px 16px', borderRadius:10, cursor:'pointer', fontSize:13, fontFamily:'inherit', opacity:pagInfo.page>=pagInfo.totalPages?.4:1 }}>Próxima →</button>
            </div>
          )}
        </div>
      </div>

      {selectedId && <DetailModal id={selectedId} onClose={() => setSelectedId(null)}/>}

      {toast && (
        <div style={{ position:'fixed', bottom:28, right:28, zIndex:300, background: toast.type==='green' ? 'rgba(16,185,129,.15)' : 'rgba(248,113,113,.15)', border:`1px solid ${toast.type==='green' ? 'rgba(16,185,129,.4)' : 'rgba(248,113,113,.4)'}`, color: toast.type==='green' ? C.green : C.red, padding:'14px 22px', borderRadius:14, fontSize:14, fontWeight:600, backdropFilter:'blur(12px)' }}>
          {toast.msg}
        </div>
      )}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap'); * { box-sizing:border-box; }`}</style>
    </div>
  );
}
