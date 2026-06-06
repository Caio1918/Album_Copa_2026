import React, { useEffect, useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'

type View = 'dashboard' | 'album' | 'grupo' | 'selecao' | 'repetidas'

type Grupo = { id: number; nome: string }
type Selecao = { id: number; nome: string; sigla: string; grupo_id: number; escudo_url?: string | null }
type Jogador = { id: number; nome: string; posicao?: string | null; numero?: number | null; selecao_id: number }
type Figurinha = { id: number; codigo: string; tipo: string; selecao_id: number; jogador_id?: number | null; imagem_url?: string | null }
type Colada = { id: number; figurinha_id: number; data_colagem: string }
type Repetida = { id: number; figurinha_id: number; quantidade: number }
type DashboardResumo = {
  total_figurinhas: number
  total_coladas: number
  total_faltantes: number
  porcentagem_completa: number
  normais_faltantes: number
  brilhantes_faltantes: number
  total_repetidas: number
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Erro de comunicação com a API' }))
    throw new Error(error.detail || 'Erro de comunicação com a API')
  }

  if (response.status === 204) return undefined as T
  return response.json()
}

function useApi<T>(loader: () => Promise<T>, deps: React.DependencyList) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    loader()
      .then((result) => active && setData(result))
      .catch((err: Error) => active && setError(err.message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, deps)

  return { data, loading, error }
}

function StatCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </article>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>
}

function Loading() {
  return <div className="empty-state">Carregando dados...</div>
}

function ErrorBox({ text }: { text: string }) {
  return <div className="error-box">{text}</div>
}

function Dashboard() {
  const resumo = useApi<DashboardResumo>(() => api('/dashboard/resumo'), [])
  const ultimas = useApi<Colada[]>(() => api('/dashboard/ultimas-coladas'), [])

  if (resumo.loading) return <Loading />
  if (resumo.error) return <ErrorBox text={resumo.error} />

  const data = resumo.data
  if (!data) return <EmptyState text="Nenhum dado encontrado no dashboard." />

  return (
    <section className="page-section">
      <div className="page-title">
        <span>Visão geral</span>
        <h2>Dashboard do álbum</h2>
        <p>Acompanhe o progresso geral, figurinhas faltantes e últimas coladas.</p>
      </div>

      <div className="progress-panel">
        <div>
          <strong>Progresso do álbum</strong>
          <span>{data.total_coladas} de {data.total_figurinhas} figurinhas</span>
        </div>
        <div className="progress-bar">
          <div style={{ width: `${Math.min(data.porcentagem_completa, 100)}%` }} />
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Completo" value={`${data.porcentagem_completa}%`} detail="progresso total" />
        <StatCard label="Coladas" value={data.total_coladas} detail="figurinhas no álbum" />
        <StatCard label="Faltantes" value={data.total_faltantes} detail="para completar" />
        <StatCard label="Repetidas" value={data.total_repetidas} detail="disponíveis para troca" />
      </div>

      <div className="two-columns">
        <div className="flat-card accent-yellow">
          <span>Normais faltantes</span>
          <strong>{data.normais_faltantes}</strong>
        </div>
        <div className="flat-card accent-blue">
          <span>Brilhantes faltantes</span>
          <strong>{data.brilhantes_faltantes}</strong>
        </div>
      </div>

      <div className="list-panel">
        <h3>Últimas figurinhas coladas</h3>
        {ultimas.loading && <Loading />}
        {ultimas.error && <ErrorBox text={ultimas.error} />}
        {ultimas.data?.length ? (
          <div className="simple-list">
            {ultimas.data.map((item) => (
              <div key={item.id} className="list-row">
                <span>Figurinha #{item.figurinha_id}</span>
                <small>{new Date(item.data_colagem).toLocaleDateString('pt-BR')}</small>
              </div>
            ))}
          </div>
        ) : !ultimas.loading && <EmptyState text="Nenhuma figurinha colada ainda." />}
      </div>
    </section>
  )
}

function AlbumPage({ onOpenGrupo }: { onOpenGrupo: (grupo: Grupo) => void }) {
  const grupos = useApi<Grupo[]>(() => api('/grupos'), [])

  return (
    <section className="page-section">
      <div className="page-title">
        <span>Álbum</span>
        <h2>Grupos da Copa</h2>
        <p>Escolha um grupo para visualizar as seleções.</p>
      </div>
      {grupos.loading && <Loading />}
      {grupos.error && <ErrorBox text={grupos.error} />}
      <div className="card-grid">
        {grupos.data?.map((grupo) => (
          <button key={grupo.id} className="group-card" onClick={() => onOpenGrupo(grupo)}>
            <span>{grupo.nome}</span>
            <strong>Ver seleções</strong>
          </button>
        ))}
      </div>
      {!grupos.loading && !grupos.data?.length && <EmptyState text="Nenhum grupo cadastrado." />}
    </section>
  )
}

function GrupoPage({ grupo, onOpenSelecao }: { grupo: Grupo | null; onOpenSelecao: (selecao: Selecao) => void }) {
  const selecoes = useApi<Selecao[]>(() => grupo ? api(`/grupos/${grupo.id}/selecoes`) : Promise.resolve([]), [grupo?.id])

  if (!grupo) return <EmptyState text="Selecione um grupo na tela Álbum." />

  return (
    <section className="page-section">
      <div className="page-title">
        <span>{grupo.nome}</span>
        <h2>Seleções do grupo</h2>
        <p>Abra uma seleção para controlar suas figurinhas.</p>
      </div>
      {selecoes.loading && <Loading />}
      {selecoes.error && <ErrorBox text={selecoes.error} />}
      <div className="card-grid">
        {selecoes.data?.map((selecao) => (
          <button key={selecao.id} className="team-card" onClick={() => onOpenSelecao(selecao)}>
            <div className="team-badge">{selecao.sigla}</div>
            <strong>{selecao.nome}</strong>
            <span>Ver figurinhas</span>
          </button>
        ))}
      </div>
      {!selecoes.loading && !selecoes.data?.length && <EmptyState text="Nenhuma seleção cadastrada nesse grupo." />}
    </section>
  )
}

function SelecaoPage({ selecao }: { selecao: Selecao | null }) {
  const [refresh, setRefresh] = useState(0)
  const [filter, setFilter] = useState('todas')
  const figurinhas = useApi<Figurinha[]>(() => selecao ? api(`/selecoes/${selecao.id}/figurinhas`) : Promise.resolve([]), [selecao?.id, refresh])
  const coladas = useApi<Colada[]>(() => api('/figurinhas-coladas'), [refresh])
  const jogadores = useApi<Jogador[]>(() => api('/jogadores'), [])

  const coladasIds = useMemo(() => new Set((coladas.data || []).map((item) => item.figurinha_id)), [coladas.data])
  const jogadoresPorId = useMemo(() => new Map((jogadores.data || []).map((jogador) => [jogador.id, jogador])), [jogadores.data])

  const lista = useMemo(() => {
    return (figurinhas.data || []).filter((figurinha) => {
      const isColada = coladasIds.has(figurinha.id)
      if (filter === 'coladas') return isColada
      if (filter === 'faltantes') return !isColada
      if (filter === 'normais') return figurinha.tipo === 'normal'
      if (filter === 'brilhantes') return figurinha.tipo === 'brilhante'
      return true
    })
  }, [figurinhas.data, coladasIds, filter])

  async function toggleColada(figurinha: Figurinha) {
    const isColada = coladasIds.has(figurinha.id)
    if (isColada) {
      await api(`/figurinhas-coladas/${figurinha.id}`, { method: 'DELETE' })
    } else {
      await api('/figurinhas-coladas', { method: 'POST', body: JSON.stringify({ figurinha_id: figurinha.id }) })
    }
    setRefresh((value) => value + 1)
  }

  if (!selecao) return <EmptyState text="Selecione uma seleção pela tela Álbum." />

  return (
    <section className="page-section">
      <div className="page-title">
        <span>{selecao.sigla}</span>
        <h2>{selecao.nome}</h2>
        <p>Controle as figurinhas coladas e faltantes dessa seleção.</p>
      </div>

      <div className="filter-row">
        {['todas', 'normais', 'brilhantes', 'coladas', 'faltantes'].map((item) => (
          <button key={item} className={filter === item ? 'filter active' : 'filter'} onClick={() => setFilter(item)}>{item}</button>
        ))}
      </div>

      {(figurinhas.loading || coladas.loading || jogadores.loading) && <Loading />}
      {figurinhas.error && <ErrorBox text={figurinhas.error} />}
      {coladas.error && <ErrorBox text={coladas.error} />}
      {jogadores.error && <ErrorBox text={jogadores.error} />}

      <div className="stickers-grid">
        {lista.map((figurinha) => {
          const isColada = coladasIds.has(figurinha.id)
          const jogador = figurinha.jogador_id ? jogadoresPorId.get(figurinha.jogador_id) : null
          return (
            <article key={figurinha.id} className={isColada ? 'sticker-card completed' : 'sticker-card'}>
              <div className="sticker-code">{figurinha.codigo}</div>
              <strong className="player-name">{jogador?.nome || 'Figurinha da seleção'}</strong>
              <span className={`type-badge ${figurinha.tipo}`}>{figurinha.tipo}</span>
              <small>{isColada ? 'Colada' : 'Faltando'}</small>
              <button onClick={() => toggleColada(figurinha)}>{isColada ? 'Desmarcar' : 'Marcar'}</button>
            </article>
          )
        })}
      </div>
      {!figurinhas.loading && !lista.length && <EmptyState text="Nenhuma figurinha encontrada para esse filtro." />}
    </section>
  )
}

function RepetidasPage() {
  const [refresh, setRefresh] = useState(0)
  const [busca, setBusca] = useState('')
  const [quantidade, setQuantidade] = useState(1)
  const repetidas = useApi<Repetida[]>(() => api('/repetidas'), [refresh])
  const jogadores = useApi<Jogador[]>(() => busca.length > 1 ? api(`/jogadores/search?nome=${encodeURIComponent(busca)}`) : Promise.resolve([]), [busca])
  const figurinhas = useApi<Figurinha[]>(() => api('/figurinhas'), [refresh])

  async function adicionarRepetida(jogador: Jogador) {
    const figurinha = figurinhas.data?.find((item) => item.jogador_id === jogador.id)
    if (!figurinha) return alert('Nenhuma figurinha encontrada para esse jogador.')
    await api('/repetidas', { method: 'POST', body: JSON.stringify({ figurinha_id: figurinha.id, quantidade }) })
    setBusca('')
    setQuantidade(1)
    setRefresh((value) => value + 1)
  }

  async function atualizar(item: Repetida, novaQuantidade: number) {
    if (novaQuantidade <= 0) {
      await api(`/repetidas/${item.id}`, { method: 'DELETE' })
    } else {
      await api(`/repetidas/${item.id}`, { method: 'PUT', body: JSON.stringify({ quantidade: novaQuantidade }) })
    }
    setRefresh((value) => value + 1)
  }

  return (
    <section className="page-section">
      <div className="page-title">
        <span>Trocas</span>
        <h2>Figurinhas repetidas</h2>
        <p>Pesquise um jogador cadastrado para adicionar uma figurinha repetida.</p>
      </div>

      <div className="search-panel">
        <input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar jogador..." />
        <input type="number" min="1" value={quantidade} onChange={(event) => setQuantidade(Number(event.target.value))} />
      </div>

      {jogadores.data?.length ? (
        <div className="simple-list suggestions">
          {jogadores.data.map((jogador) => (
            <button key={jogador.id} className="list-row" onClick={() => adicionarRepetida(jogador)}>
              <span>{jogador.nome}</span>
              <small>Adicionar repetida</small>
            </button>
          ))}
        </div>
      ) : busca.length > 1 && !jogadores.loading && <EmptyState text="Nenhum jogador encontrado." />}

      <div className="list-panel">
        <h3>Minhas repetidas</h3>
        {repetidas.loading && <Loading />}
        {repetidas.error && <ErrorBox text={repetidas.error} />}
        <div className="simple-list">
          {repetidas.data?.map((item) => {
            const figurinha = figurinhas.data?.find((fig) => fig.id === item.figurinha_id)
            return (
              <div key={item.id} className="list-row controls-row">
                <span>{figurinha?.codigo || `Figurinha #${item.figurinha_id}`}</span>
                <div>
                  <button onClick={() => atualizar(item, item.quantidade - 1)}>-</button>
                  <strong>{item.quantidade}</strong>
                  <button onClick={() => atualizar(item, item.quantidade + 1)}>+</button>
                  <button className="danger" onClick={() => atualizar(item, 0)}>remover</button>
                </div>
              </div>
            )
          })}
        </div>
        {!repetidas.loading && !repetidas.data?.length && <EmptyState text="Nenhuma repetida cadastrada." />}
      </div>
    </section>
  )
}

function App() {
  const [view, setView] = useState<View>('dashboard')
  const [grupo, setGrupo] = useState<Grupo | null>(null)
  const [selecao, setSelecao] = useState<Selecao | null>(null)

  const menu: { id: View; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Início', icon: '🏠' },
    { id: 'album', label: 'Álbum', icon: '📘' },
    { id: 'repetidas', label: 'Repetidas', icon: '🔁' },
  ]

  return (
    <div className="app-shell">
      <main className="content">
        <header className="topbar">
          <div className="brand compact-brand">
            <div className="brand-mark">26</div>
            <div><strong>Álbum Copa</strong><span>2026</span></div>
          </div>
          <div><span className="eyebrow">Controle pessoal</span><h1>Álbum da Copa do Mundo 2026</h1></div>
        </header>
        {view === 'dashboard' && <Dashboard />}
        {view === 'album' && <AlbumPage onOpenGrupo={(item) => { setGrupo(item); setView('grupo') }} />}
        {view === 'grupo' && <GrupoPage grupo={grupo} onOpenSelecao={(item) => { setSelecao(item); setView('selecao') }} />}
        {view === 'selecao' && <SelecaoPage selecao={selecao} />}
        {view === 'repetidas' && <RepetidasPage />}
      </main>

      <nav className="bottom-bar">
        {menu.map((item) => (
          <button key={item.id} className={view === item.id ? 'bottom-item active' : 'bottom-item'} onClick={() => setView(item.id)}>
            <span>{item.icon}</span>
            <strong>{item.label}</strong>
          </button>
        ))}
      </nav>
    </div>
  )
}

const css = `
:root{--green:#009b3a;--yellow:#ffdf00;--blue:#002776;--bg:#f6f8f7;--card:#ffffff;--text:#102018;--muted:#6b7280;--line:#e5e7eb;--danger:#dc2626}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:var(--text)}
button,input{font:inherit}
button{cursor:pointer}
.app-shell{min-height:100vh}
.content{width:min(1280px,100%);margin:0 auto;padding:24px 24px 104px}
.topbar{display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:center;margin-bottom:24px}
.topbar h1{margin:4px 0 0;font-size:clamp(22px,4vw,32px)}
.brand{display:flex;gap:12px;align-items:center}
.brand-mark{width:48px;height:48px;border-radius:16px;background:linear-gradient(135deg,var(--green),var(--blue));color:#fff;display:grid;place-items:center;font-weight:900;box-shadow:0 10px 24px rgba(0,39,118,.16)}
.brand strong,.brand span{display:block}
.brand span{color:var(--muted);font-size:13px}
.bottom-bar{position:fixed;left:50%;bottom:16px;z-index:20;transform:translateX(-50%);width:min(520px,calc(100% - 28px));display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:10px;border:1px solid var(--line);border-radius:26px;background:rgba(255,255,255,.94);box-shadow:0 18px 50px rgba(16,32,24,.18);backdrop-filter:blur(12px)}
.bottom-item{border:0;background:transparent;color:var(--muted);display:grid;place-items:center;gap:4px;border-radius:18px;padding:10px 8px;min-height:62px}
.bottom-item span{font-size:20px;line-height:1}
.bottom-item strong{font-size:12px}
.bottom-item.active,.bottom-item:hover{background:#eef8f1;color:var(--green)}
.eyebrow,.page-title span{color:var(--green);font-size:13px;text-transform:uppercase;font-weight:800;letter-spacing:.08em}
.page-section{display:grid;gap:20px}
.page-title h2{font-size:clamp(26px,5vw,36px);margin:6px 0}
.page-title p{margin:0;color:var(--muted)}
.stats-grid,.card-grid,.settings-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
.stat-card,.flat-card,.list-panel,.progress-panel,.group-card,.team-card,.sticker-card,.search-panel,.empty-state,.error-box{background:var(--card);border:1px solid var(--line);border-radius:22px;padding:20px;box-shadow:0 8px 24px rgba(16,32,24,.04)}
.stat-card span,.flat-card span{display:block;color:var(--muted);font-size:14px}
.stat-card strong,.flat-card strong{display:block;font-size:30px;margin-top:8px}
.stat-card small{color:var(--muted)}
.progress-panel{display:grid;gap:14px}
.progress-panel>div:first-child{display:flex;justify-content:space-between;gap:12px;color:var(--muted)}
.progress-panel strong{color:var(--text)}
.progress-bar{height:14px;background:#edf2ef;border-radius:999px;overflow:hidden}
.progress-bar div{height:100%;background:linear-gradient(90deg,var(--green),var(--yellow));border-radius:999px}
.two-columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.accent-yellow{border-left:6px solid var(--yellow)}
.accent-blue{border-left:6px solid var(--blue)}
.simple-list{display:grid;gap:10px}
.list-row{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid var(--line);border-radius:16px;padding:14px;background:#fff;color:var(--text);text-align:left}
.list-row small{color:var(--muted)}
.group-card,.team-card{cursor:pointer;text-align:left;min-height:130px}
.group-card span{color:var(--green);font-weight:900;font-size:26px}
.group-card strong,.team-card span{display:block;margin-top:18px;color:var(--muted)}
.team-card{text-align:center;display:grid;place-items:center}
.team-badge{width:58px;height:58px;border-radius:20px;background:var(--blue);color:#fff;display:grid;place-items:center;font-weight:900}
.filter-row{display:flex;flex-wrap:wrap;gap:10px;position:sticky;top:0;z-index:5;background:var(--bg);padding:4px 0 8px}
.filter{border:1px solid var(--line);background:#fff;border-radius:999px;padding:10px 16px;text-transform:capitalize}
.filter.active{background:var(--green);color:#fff;border-color:var(--green);font-weight:800}
.stickers-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px;align-items:stretch}
.sticker-card{display:grid;gap:10px;align-content:start}
.sticker-card.completed{background:#f0faf3;border-color:#b6e3c3}
.sticker-code{height:112px;border-radius:18px;background:linear-gradient(135deg,#eef8f1,#fdf9d7);display:grid;place-items:center;font-size:24px;font-weight:900;color:var(--blue)}
.player-name{font-size:15px;line-height:1.25;min-height:38px}
.sticker-card small{color:var(--muted);font-weight:700}
.type-badge{width:max-content;border-radius:999px;padding:6px 10px;background:#eef2ff;color:var(--blue);font-size:12px;font-weight:900}
.type-badge.brilhante{background:#fff7bf;color:#8a6d00}
.sticker-card button,.search-panel button,.controls-row button{border:0;border-radius:12px;padding:10px 12px;background:var(--green);color:#fff;font-weight:800}
.search-panel{display:grid;grid-template-columns:1fr 100px;gap:12px}
.search-panel input{border:1px solid var(--line);border-radius:14px;padding:14px;min-width:0}
.controls-row>div{display:flex;align-items:center;gap:8px}
.controls-row button{padding:8px 12px}
.controls-row .danger{background:var(--danger)}
.empty-state{color:var(--muted);text-align:center}
.error-box{color:var(--danger);background:#fff1f2;border-color:#fecdd3}
@media(max-width:960px){.content{padding-inline:18px}.stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.card-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.stickers-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.topbar{grid-template-columns:1fr}.compact-brand{order:-1}.progress-panel>div:first-child{display:grid}}
@media(max-width:620px){.content{padding:18px 14px 104px}.stats-grid,.card-grid,.two-columns{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.stickers-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.stat-card,.flat-card,.list-panel,.progress-panel,.group-card,.team-card,.sticker-card,.search-panel,.empty-state,.error-box{border-radius:18px;padding:14px}.group-card,.team-card{min-height:112px}.sticker-code{height:92px;font-size:20px}.player-name{font-size:13px;min-height:34px}.sticker-card button{font-size:12px;padding:9px}.search-panel{grid-template-columns:1fr 84px}.list-row{align-items:flex-start;flex-direction:column}.controls-row>div{flex-wrap:wrap}.bottom-bar{bottom:10px}.bottom-item{min-height:58px;padding:8px 6px}.bottom-item strong{font-size:11px}}
`

const style = document.createElement('style')
style.innerHTML = css
document.head.appendChild(style)

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
