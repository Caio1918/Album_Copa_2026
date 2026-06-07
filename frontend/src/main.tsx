import React, { useEffect, useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Album, BarChart3, CheckCircle2, Repeat2 } from 'lucide-react'
import './style.css'

type View = 'dashboard' | 'album' | 'grupo' | 'selecao' | 'repetidas'

type Grupo = { id: number; nome: string }
type Selecao = { id: number; nome: string; sigla: string; grupo_id: number; escudo_url?: string | null }
type Jogador = { id: number; nome: string; posicao?: string | null; numero?: number | null; selecao_id: number }
type Figurinha = {
  id: number
  codigo: string
  tipo: string
  selecao_id: number
  jogador_id?: number | null
  imagem_url?: string | null
  numero_global?: number | null
  numero_na_selecao?: number | null
  nome?: string | null
  categoria?: string | null
  secao?: string | null
  observacoes?: string | null
  fonte_url?: string | null
  status_cadastro?: string | null
}
type Colada = { id: number; figurinha_id: number; data_colagem: string }
type Repetida = { id: number; figurinha_id: number; quantidade: number; figurinha?: Figurinha | null }
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

function normalizeText(value: string | number | null | undefined) {
  return String(value || '').toLowerCase().trim()
}

function matchesSearch(values: Array<string | number | null | undefined>, search: string) {
  const term = normalizeText(search)
  if (!term) return true
  return values.some((value) => normalizeText(value).includes(term))
}

function getStickerName(fig: Figurinha, jogadoresPorId?: Map<number, Jogador>) {
  if (fig.nome) return fig.nome
  if (fig.jogador_id && jogadoresPorId?.has(fig.jogador_id)) return jogadoresPorId.get(fig.jogador_id)?.nome || 'Figurinha'
  if (fig.categoria === 'escudo') return 'Escudo da seleção'
  if (fig.categoria === 'foto_selecao') return 'Foto oficial da seleção'
  return 'Figurinha da seleção'
}

function getTypeLabel(tipo: string) {
  return tipo === 'brilhante' ? 'Brilhante' : 'Normal'
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
  const figurinhas = useApi<Figurinha[]>(() => api('/figurinhas'), [])

  const figurinhasPorId = useMemo(() => new Map((figurinhas.data || []).map((item) => [item.id, item])), [figurinhas.data])

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
        <div className="flat-card accent-green">
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
        {(ultimas.loading || figurinhas.loading) && <Loading />}
        {ultimas.error && <ErrorBox text={ultimas.error} />}
        {ultimas.data?.length ? (
          <div className="simple-list">
            {ultimas.data.map((item) => {
              const figurinha = figurinhasPorId.get(item.figurinha_id)
              return (
                <div key={item.id} className="list-row">
                  <span>{figurinha ? `${figurinha.codigo} - ${getStickerName(figurinha)}` : `Figurinha #${item.figurinha_id}`}</span>
                  <small>{new Date(item.data_colagem).toLocaleDateString('pt-BR')}</small>
                </div>
              )
            })}
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
      <div className="card-grid album-grid">
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

function GrupoPage({ grupo, onOpenSelecao, onBack }: { grupo: Grupo | null; onOpenSelecao: (selecao: Selecao) => void; onBack: () => void }) {
  const selecoes = useApi<Selecao[]>(() => grupo ? api(`/grupos/${grupo.id}/selecoes`) : Promise.resolve([]), [grupo?.id])

  if (!grupo) return <EmptyState text="Selecione um grupo na tela Álbum." />

  return (
    <section className="page-section">
      <div className="page-title">
        <span>{grupo.nome}</span>
        <h2>Seleções do grupo</h2>
        <p>Abra uma seleção para controlar suas figurinhas.</p>
      </div>
      <button className="back-button" onClick={onBack}>Voltar para grupos</button>
      {selecoes.loading && <Loading />}
      {selecoes.error && <ErrorBox text={selecoes.error} />}
      <div className="card-grid team-grid">
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

function SelecaoPage({ selecao, onBack }: { selecao: Selecao | null; onBack: () => void }) {
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
      <button className="back-button" onClick={onBack}>Voltar para seleções</button>

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
          return (
            <article key={figurinha.id} className={isColada ? 'sticker-card completed' : 'sticker-card'}>
              {isColada && (
                <div className="completed-icon" aria-label="Figurinha colada">
                  <CheckCircle2 aria-hidden="true" />
                </div>
              )}
              <div className="sticker-code">{figurinha.codigo}</div>
              <strong className="player-name">{getStickerName(figurinha, jogadoresPorId)}</strong>
              <span className={`type-badge ${figurinha.tipo}`}>{getTypeLabel(figurinha.tipo)}</span>
              <small>{figurinha.categoria || 'figurinha'} {figurinha.numero_global ? `#${figurinha.numero_global}` : ''}</small>
              <small>{isColada ? 'Colada' : 'Faltando'}</small>
              <button className={isColada ? 'card-action unmark' : 'card-action mark'} onClick={() => toggleColada(figurinha)}>
                {isColada ? 'Desmarcar' : 'Marcar'}
              </button>
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
  const [grupoSelecionado, setGrupoSelecionado] = useState<Grupo | null>(null)
  const [selecaoSelecionada, setSelecaoSelecionada] = useState<Selecao | null>(null)
  const [busca, setBusca] = useState('')
  const grupos = useApi<Grupo[]>(() => api('/grupos'), [])
  const selecoes = useApi<Selecao[]>(() => grupoSelecionado ? api(`/grupos/${grupoSelecionado.id}/selecoes`) : Promise.resolve([]), [grupoSelecionado?.id])
  const figurinhas = useApi<Figurinha[]>(() => selecaoSelecionada ? api(`/selecoes/${selecaoSelecionada.id}/figurinhas`) : Promise.resolve([]), [selecaoSelecionada?.id, refresh])
  const repetidas = useApi<Repetida[]>(() => api('/repetidas'), [refresh])
  const coladas = useApi<Colada[]>(() => api('/figurinhas-coladas'), [refresh])
  const jogadores = useApi<Jogador[]>(() => api('/jogadores'), [])

  const jogadoresPorId = useMemo(() => new Map((jogadores.data || []).map((jogador) => [jogador.id, jogador])), [jogadores.data])
  const coladasIds = useMemo(() => new Set((coladas.data || []).map((item) => item.figurinha_id)), [coladas.data])
  const repetidasPorFigurinhaId = useMemo(() => new Map((repetidas.data || []).map((item) => [item.figurinha_id, item])), [repetidas.data])
  const gruposFiltrados = useMemo(() => (grupos.data || []).filter((grupo) => matchesSearch([grupo.nome], busca)), [grupos.data, busca])
  const selecoesFiltradas = useMemo(() => (selecoes.data || []).filter((selecao) => matchesSearch([selecao.nome, selecao.sigla], busca)), [selecoes.data, busca])
  const figurinhasFiltradas = useMemo(() => (figurinhas.data || []).filter((figurinha) => {
    const jogador = figurinha.jogador_id ? jogadoresPorId.get(figurinha.jogador_id) : null
    return matchesSearch([
      figurinha.codigo,
      figurinha.tipo,
      figurinha.nome,
      figurinha.categoria,
      figurinha.numero_global,
      figurinha.numero_na_selecao,
      jogador?.nome,
      jogador?.posicao,
      jogador?.numero,
    ], busca)
  }), [figurinhas.data, jogadoresPorId, busca])

  function abrirGrupo(grupo: Grupo) {
    setGrupoSelecionado(grupo)
    setSelecaoSelecionada(null)
    setBusca('')
  }

  function abrirSelecao(selecao: Selecao) {
    setSelecaoSelecionada(selecao)
    setBusca('')
  }

  function voltarParaGrupos() {
    setGrupoSelecionado(null)
    setSelecaoSelecionada(null)
    setBusca('')
  }

  function voltarParaSelecoes() {
    setSelecaoSelecionada(null)
    setBusca('')
  }

  async function atualizarRepetida(figurinha: Figurinha, novaQuantidade: number) {
    const repetida = repetidasPorFigurinhaId.get(figurinha.id)
    if (repetida && novaQuantidade <= 0) {
      await api(`/repetidas/${repetida.id}`, { method: 'DELETE' })
    } else if (repetida) {
      await api(`/repetidas/${repetida.id}`, { method: 'PUT', body: JSON.stringify({ quantidade: novaQuantidade }) })
    } else {
      await api('/repetidas', { method: 'POST', body: JSON.stringify({ figurinha_id: figurinha.id, quantidade: 1 }) })
    }
    setRefresh((value) => value + 1)
  }

  if (!grupoSelecionado) {
    return (
      <section className="page-section">
        <div className="page-title">
          <span>Trocas</span>
          <h2>Grupos das repetidas</h2>
          <p>Escolha um grupo para cadastrar e controlar suas figurinhas repetidas.</p>
        </div>
        <input className="album-search" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Pesquisar grupo..." />
        {grupos.loading && <Loading />}
        {grupos.error && <ErrorBox text={grupos.error} />}
        <div className="card-grid album-grid">
          {gruposFiltrados.map((grupo) => (
            <button key={grupo.id} className="group-card" onClick={() => abrirGrupo(grupo)}>
              <span>{grupo.nome}</span>
              <strong>Ver seleções</strong>
            </button>
          ))}
        </div>
        {!grupos.loading && !gruposFiltrados.length && <EmptyState text="Nenhum grupo encontrado." />}
      </section>
    )
  }

  if (!selecaoSelecionada) {
    return (
      <section className="page-section">
        <div className="page-title">
          <span>{grupoSelecionado.nome}</span>
          <h2>Seleções das repetidas</h2>
          <p>Escolha uma seleção para adicionar ou remover repetidas.</p>
        </div>
        <button className="back-button" onClick={voltarParaGrupos}>Voltar para grupos</button>
        <input className="album-search" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Pesquisar seleção..." />
        {selecoes.loading && <Loading />}
        {selecoes.error && <ErrorBox text={selecoes.error} />}
        <div className="card-grid team-grid">
          {selecoesFiltradas.map((selecao) => (
            <button key={selecao.id} className="team-card" onClick={() => abrirSelecao(selecao)}>
              <div className="team-badge">{selecao.sigla}</div>
              <strong>{selecao.nome}</strong>
              <span>Ver figurinhas</span>
            </button>
          ))}
        </div>
        {!selecoes.loading && !selecoesFiltradas.length && <EmptyState text="Nenhuma seleção encontrada nesse grupo." />}
      </section>
    )
  }

  return (
    <section className="page-section">
      <div className="page-title">
        <span>{selecaoSelecionada.sigla}</span>
        <h2>Repetidas - {selecaoSelecionada.nome}</h2>
        <p>Use os botões para adicionar, aumentar, diminuir ou remover repetidas.</p>
      </div>
      <button className="back-button" onClick={voltarParaSelecoes}>Voltar para seleções</button>
      <input className="album-search" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Pesquisar jogador, código, tipo ou categoria..." />

      {(figurinhas.loading || repetidas.loading || coladas.loading || jogadores.loading) && <Loading />}
      {figurinhas.error && <ErrorBox text={figurinhas.error} />}
      {repetidas.error && <ErrorBox text={repetidas.error} />}
      {coladas.error && <ErrorBox text={coladas.error} />}
      {jogadores.error && <ErrorBox text={jogadores.error} />}

      <div className="stickers-grid">
        {figurinhasFiltradas.map((figurinha) => {
          const repetida = repetidasPorFigurinhaId.get(figurinha.id)
          const quantidade = repetida?.quantidade || 0
          const isColada = coladasIds.has(figurinha.id)
          return (
            <article key={figurinha.id} className={isColada ? 'sticker-card repeated-card completed' : 'sticker-card repeated-card'}>
              {isColada && (
                <div className="completed-icon" aria-label="Figurinha colada">
                  <CheckCircle2 aria-hidden="true" />
                </div>
              )}
              <div className="sticker-code">{figurinha.codigo}</div>
              <strong className="player-name">{getStickerName(figurinha, jogadoresPorId)}</strong>
              <span className={`type-badge ${figurinha.tipo}`}>{getTypeLabel(figurinha.tipo)}</span>
              <small>{figurinha.categoria || 'figurinha'} {figurinha.numero_global ? `#${figurinha.numero_global}` : ''}</small>
              <small>{isColada ? 'Já colada no álbum' : 'Ainda faltando no álbum'}</small>
              <div className="repeated-status">
                <span>Repetidas</span>
                <strong>{quantidade}</strong>
              </div>
              <div className="quantity-actions card-quantity-actions">
                <button onClick={() => atualizarRepetida(figurinha, quantidade - 1)} disabled={quantidade === 0}>-</button>
                <button onClick={() => atualizarRepetida(figurinha, quantidade + 1)}>+</button>
              </div>
            </article>
          )
        })}
      </div>
      {!figurinhas.loading && !figurinhasFiltradas.length && <EmptyState text="Nenhuma figurinha encontrada para essa busca." />}
    </section>
  )
}

function App() {
  const [view, setView] = useState<View>('dashboard')
  const [grupoSelecionado, setGrupoSelecionado] = useState<Grupo | null>(null)
  const [selecaoSelecionada, setSelecaoSelecionada] = useState<Selecao | null>(null)

  function openGrupo(grupo: Grupo) {
    setGrupoSelecionado(grupo)
    setSelecaoSelecionada(null)
    setView('grupo')
  }

  function openSelecao(selecao: Selecao) {
    setSelecaoSelecionada(selecao)
    setView('selecao')
  }

  function voltarAlbumParaGrupos() {
    setGrupoSelecionado(null)
    setSelecaoSelecionada(null)
    setView('album')
  }

  function voltarAlbumParaSelecoes() {
    setSelecaoSelecionada(null)
    setView('grupo')
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span>FIFA 2026</span>
          <strong>Álbum da Copa</strong>
        </div>
        <nav className="app-nav" aria-label="Navegação principal">
          <button className={view === 'dashboard' ? 'active nav-dashboard' : 'nav-dashboard'} onClick={() => setView('dashboard')} aria-label="Abrir dashboard">
            <BarChart3 aria-hidden="true" />
            <span>Dashboard</span>
          </button>
          <button className={['album', 'grupo', 'selecao'].includes(view) ? 'active nav-album' : 'nav-album'} onClick={() => setView('album')} aria-label="Abrir álbum">
            <Album aria-hidden="true" />
            <span>Álbum</span>
          </button>
          <button className={view === 'repetidas' ? 'active nav-repetidas' : 'nav-repetidas'} onClick={() => setView('repetidas')} aria-label="Abrir repetidas">
            <Repeat2 aria-hidden="true" />
            <span>Repetidas</span>
          </button>
        </nav>
      </aside>
      <section className="content">
        {view === 'dashboard' && <Dashboard />}
        {view === 'album' && <AlbumPage onOpenGrupo={openGrupo} />}
        {view === 'grupo' && <GrupoPage grupo={grupoSelecionado} onOpenSelecao={openSelecao} onBack={voltarAlbumParaGrupos} />}
        {view === 'selecao' && <SelecaoPage selecao={selecaoSelecionada} onBack={voltarAlbumParaSelecoes} />}
        {view === 'repetidas' && <RepetidasPage />}
      </section>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
