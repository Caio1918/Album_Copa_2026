import React, { useEffect, useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { Album, BarChart3, Repeat2 } from 'lucide-react'
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

function getSelectionName(fig: Figurinha, selecoesPorId: Map<number, Selecao>) {
  const selecao = selecoesPorId.get(fig.selecao_id)
  return selecao ? `${selecao.nome} (${selecao.sigla})` : 'Seleção não identificada'
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
          return (
            <article key={figurinha.id} className={isColada ? 'sticker-card completed' : 'sticker-card'}>
              <div className="sticker-code">{figurinha.codigo}</div>
              <strong className="player-name">{getStickerName(figurinha, jogadoresPorId)}</strong>
              <span className={`type-badge ${figurinha.tipo}`}>{getTypeLabel(figurinha.tipo)}</span>
              <small>{figurinha.categoria || 'figurinha'} {figurinha.numero_global ? `#${figurinha.numero_global}` : ''}</small>
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
  const sugestoes = useApi<Figurinha[]>(() => busca.trim().length > 1 ? api(`/figurinhas/search?termo=${encodeURIComponent(busca.trim())}`) : Promise.resolve([]), [busca, refresh])
  const figurinhas = useApi<Figurinha[]>(() => api('/figurinhas'), [refresh])
  const jogadores = useApi<Jogador[]>(() => api('/jogadores'), [])
  const selecoes = useApi<Selecao[]>(() => api('/selecoes'), [])

  const figurinhasPorId = useMemo(() => new Map((figurinhas.data || []).map((item) => [item.id, item])), [figurinhas.data])
  const jogadoresPorId = useMemo(() => new Map((jogadores.data || []).map((jogador) => [jogador.id, jogador])), [jogadores.data])
  const selecoesPorId = useMemo(() => new Map((selecoes.data || []).map((selecao) => [selecao.id, selecao])), [selecoes.data])

  function updateQuantidade(value: string) {
    setQuantidade(Math.max(1, Number(value) || 1))
  }

  async function adicionarRepetida(figurinha: Figurinha) {
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

  function getFigurinhaRepetida(item: Repetida) {
    return item.figurinha || figurinhasPorId.get(item.figurinha_id)
  }

  return (
    <section className="page-section">
      <div className="page-title">
        <span>Trocas</span>
        <h2>Figurinhas repetidas</h2>
        <p>Pesquise por jogador, código, seleção, grupo, escudo ou foto da seleção.</p>
      </div>

      <div className="search-panel">
        <input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar figurinha..." />
        <input type="number" min="1" value={quantidade} onChange={(event) => updateQuantidade(event.target.value)} aria-label="Quantidade" />
      </div>

      {sugestoes.loading && busca.trim().length > 1 && <Loading />}
      {sugestoes.error && <ErrorBox text={sugestoes.error} />}
      {sugestoes.data?.length ? (
        <div className="simple-list suggestions">
          {sugestoes.data.slice(0, 10).map((figurinha) => (
            <button key={figurinha.id} className="list-row suggestion-row" onClick={() => adicionarRepetida(figurinha)}>
              <span>
                <strong>{figurinha.codigo} - {getStickerName(figurinha, jogadoresPorId)}</strong>
                <small>{getSelectionName(figurinha, selecoesPorId)} · {getTypeLabel(figurinha.tipo)} · {figurinha.categoria || 'figurinha'}</small>
              </span>
              <small>Adicionar como repetida</small>
            </button>
          ))}
        </div>
      ) : busca.trim().length > 1 && !sugestoes.loading && <EmptyState text="Nenhuma figurinha encontrada." />}

      <div className="list-panel">
        <h3>Minhas repetidas</h3>
        {(repetidas.loading || figurinhas.loading || jogadores.loading || selecoes.loading) && <Loading />}
        {repetidas.error && <ErrorBox text={repetidas.error} />}
        {figurinhas.error && <ErrorBox text={figurinhas.error} />}
        {jogadores.error && <ErrorBox text={jogadores.error} />}
        {selecoes.error && <ErrorBox text={selecoes.error} />}
        <div className="simple-list">
          {repetidas.data?.map((item) => {
            const figurinha = getFigurinhaRepetida(item)
            return (
              <div key={item.id} className="list-row">
                <span>
                  <strong>{figurinha ? `${figurinha.codigo} - ${getStickerName(figurinha, jogadoresPorId)}` : `Figurinha #${item.figurinha_id}`}</strong>
                  {figurinha && <small>{getSelectionName(figurinha, selecoesPorId)} · {getTypeLabel(figurinha.tipo)} · {figurinha.categoria || 'figurinha'}</small>}
                </span>
                <div className="quantity-actions">
                  <button onClick={() => atualizar(item, item.quantidade - 1)}>-</button>
                  <strong>{item.quantidade}</strong>
                  <button onClick={() => atualizar(item, item.quantidade + 1)}>+</button>
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
        {view === 'grupo' && <GrupoPage grupo={grupoSelecionado} onOpenSelecao={openSelecao} />}
        {view === 'selecao' && <SelecaoPage selecao={selecaoSelecionada} />}
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
