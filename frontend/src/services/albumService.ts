const API_BASE_URL = (import.meta.env.VITE_API_URL || '/album/api').replace(/\/$/, '');

type QueryParams = Record<string, string | number | boolean | null | undefined>;

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  params?: QueryParams;
};

function buildUrl(path: string, params?: QueryParams) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${normalizedPath}`, window.location.origin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, params, headers, ...rest } = options;

  const response = await fetch(buildUrl(path, params), {
    ...rest,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Erro ${response.status} ao acessar ${path}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

export type Grupo = {
  id: number;
  nome: string;
  codigo?: string;
};

export type Selecao = {
  id: number;
  nome: string;
  grupo_id?: number;
  grupoId?: number;
  escudo_url?: string | null;
  escudoUrl?: string | null;
};

export type Jogador = {
  id: number;
  nome: string;
  selecao_id?: number;
  selecaoId?: number;
  posicao?: string | null;
};

export type Figurinha = {
  id: number;
  codigo?: string;
  numero?: number;
  tipo?: string;
  brilhante?: boolean;
  colada?: boolean;
  quantidade?: number;
  jogador_id?: number | null;
  jogadorId?: number | null;
  selecao_id?: number | null;
  selecaoId?: number | null;
  jogador?: Jogador;
  selecao?: Selecao;
};

export type FigurinhaColada = {
  id: number;
  figurinha_id?: number;
  figurinhaId?: number;
  figurinha?: Figurinha;
  created_at?: string;
  createdAt?: string;
  data_colagem?: string;
  dataColagem?: string;
};

export type FigurinhaRepetida = {
  id: number;
  figurinha_id?: number;
  figurinhaId?: number;
  figurinha?: Figurinha;
  quantidade: number;
};

export type DashboardResumo = {
  total_figurinhas?: number;
  totalFigurinhas?: number;
  total_coladas?: number;
  totalColadas?: number;
  total_faltantes?: number;
  totalFaltantes?: number;
  total_repetidas?: number;
  totalRepetidas?: number;
  porcentagem_coladas?: number;
  porcentagemColadas?: number;
  faltantes_normais?: number;
  faltantesNormais?: number;
  faltantes_brilhantes?: number;
  faltantesBrilhantes?: number;
};

export type AlbumData = {
  dashboard: {
    resumo: DashboardResumo;
    progresso: unknown;
    faltantes: unknown;
    ultimasColadas: FigurinhaColada[];
  };
  grupos: Grupo[];
  selecoes: Selecao[];
  figurinhas: Figurinha[];
  repetidas: FigurinhaRepetida[];
  faltantes: Figurinha[];
};

export const albumService = {
  getHealth: () => apiRequest<{ status: string }>('/health'),

  getDashboardResumo: () => apiRequest<DashboardResumo>('/dashboard/resumo'),
  getDashboardProgresso: () => apiRequest<unknown>('/dashboard/progresso'),
  getDashboardFaltantes: () => apiRequest<unknown>('/dashboard/faltantes'),
  getDashboardUltimasColadas: () => apiRequest<FigurinhaColada[]>('/dashboard/ultimas-coladas'),

  getGrupos: () => apiRequest<Grupo[]>('/grupos'),
  getGrupo: (grupoId: number | string) => apiRequest<Grupo>(`/grupos/${grupoId}`),
  getSelecoesDoGrupo: (grupoId: number | string) => apiRequest<Selecao[]>(`/grupos/${grupoId}/selecoes`),

  getSelecoes: () => apiRequest<Selecao[]>('/selecoes'),
  getSelecao: (selecaoId: number | string) => apiRequest<Selecao>(`/selecoes/${selecaoId}`),
  getJogadoresDaSelecao: (selecaoId: number | string) => apiRequest<Jogador[]>(`/selecoes/${selecaoId}/jogadores`),
  getFigurinhasDaSelecao: (selecaoId: number | string) => apiRequest<Figurinha[]>(`/selecoes/${selecaoId}/figurinhas`),

  getJogadores: () => apiRequest<Jogador[]>('/jogadores'),
  searchJogadores: (q: string) => apiRequest<Jogador[]>('/jogadores/search', { params: { q } }),
  getJogador: (jogadorId: number | string) => apiRequest<Jogador>(`/jogadores/${jogadorId}`),

  getFigurinhas: () => apiRequest<Figurinha[]>('/figurinhas'),
  searchFigurinhas: (q: string) => apiRequest<Figurinha[]>('/figurinhas/search', { params: { q } }),
  getFigurinha: (figurinhaId: number | string) => apiRequest<Figurinha>(`/figurinhas/${figurinhaId}`),

  getFigurinhasColadas: () => apiRequest<FigurinhaColada[]>('/figurinhas-coladas'),
  getUltimasFigurinhasColadas: () => apiRequest<FigurinhaColada[]>('/figurinhas-coladas/ultimas'),
  addFigurinhaColada: (figurinhaId: number | string) =>
    apiRequest<FigurinhaColada>('/figurinhas-coladas', {
      method: 'POST',
      body: { figurinha_id: Number(figurinhaId) },
    }),

  getRepetidas: () => apiRequest<FigurinhaRepetida[]>('/repetidas'),
  searchRepetidas: (q: string) => apiRequest<FigurinhaRepetida[]>('/repetidas/search', { params: { q } }),
  getRepetida: (repetidaId: number | string) => apiRequest<FigurinhaRepetida>(`/repetidas/${repetidaId}`),
  addRepetida: (figurinhaId: number | string, quantidade = 1) =>
    apiRequest<FigurinhaRepetida>('/repetidas', {
      method: 'POST',
      body: {
        figurinha_id: Number(figurinhaId),
        quantidade,
      },
    }),

  getFaltantes: () => apiRequest<Figurinha[]>('/faltantes'),
  getFaltantesNormais: () => apiRequest<Figurinha[]>('/faltantes/normais'),
  getFaltantesBrilhantes: () => apiRequest<Figurinha[]>('/faltantes/brilhantes'),
  getFaltantesPorSelecao: (selecaoId: number | string) => apiRequest<Figurinha[]>(`/faltantes/selecao/${selecaoId}`),
};

export async function getDashboardData() {
  const [resumo, progresso, faltantes, ultimasColadas] = await Promise.all([
    albumService.getDashboardResumo(),
    albumService.getDashboardProgresso(),
    albumService.getDashboardFaltantes(),
    albumService.getDashboardUltimasColadas(),
  ]);

  return {
    resumo,
    progresso,
    faltantes,
    ultimasColadas,
  };
}

export async function getAlbumData(): Promise<AlbumData> {
  const [dashboard, grupos, selecoes, figurinhas, repetidas, faltantes] = await Promise.all([
    getDashboardData(),
    albumService.getGrupos(),
    albumService.getSelecoes(),
    albumService.getFigurinhas(),
    albumService.getRepetidas(),
    albumService.getFaltantes(),
  ]);

  return {
    dashboard,
    grupos,
    selecoes,
    figurinhas,
    repetidas,
    faltantes,
  };
}

export function getRepeatedStickers() {
  return albumService.getRepetidas();
}

export function searchRepeatedStickers(q: string) {
  return albumService.searchRepetidas(q);
}

export function addRepeatedSticker(data: { figurinhaId?: number | string; figurinha_id?: number | string; quantidade?: number }) {
  const figurinhaId = data.figurinhaId ?? data.figurinha_id;

  if (!figurinhaId) {
    throw new Error('figurinhaId é obrigatório para adicionar repetida');
  }

  return albumService.addRepetida(figurinhaId, data.quantidade ?? 1);
}

export default albumService;
