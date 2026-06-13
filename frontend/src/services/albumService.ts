import type {
  AddRepeatedStickerPayload,
  AlbumData,
  AlbumStats,
  Group,
  ProgressSummary,
  Sticker,
  StickerType,
  Team,
  UpdateStickerPastedPayload,
  UpdateStickerQuantityPayload,
} from '../types/album';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '/album/api').replace(/\/$/, '');

type QueryParams = Record<string, string | number | boolean | null | undefined>;

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  params?: QueryParams;
};

type ApiGrupo = {
  id: number;
  nome: string;
};

type ApiSelecao = {
  id: number;
  nome: string;
  sigla: string;
  grupo_id: number;
  escudo_url?: string | null;
};

type ApiJogador = {
  id: number;
  nome: string;
  selecao_id: number;
  posicao?: string | null;
  numero?: number | null;
};

type ApiFigurinha = {
  id: number;
  codigo: string;
  tipo: string;
  selecao_id: number;
  jogador_id?: number | null;
  imagem_url?: string | null;
  numero_global?: number | null;
  numero_na_selecao?: number | null;
  nome?: string | null;
  categoria?: string | null;
  secao?: string | null;
  observacoes?: string | null;
  fonte_url?: string | null;
  status_cadastro?: string | null;
};

type ApiFigurinhaColada = {
  id: number;
  figurinha_id: number;
  data_colagem: string;
};

type ApiFigurinhaRepetida = {
  id: number;
  figurinha_id: number;
  quantidade: number;
  figurinha?: ApiFigurinha | null;
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

async function safeApiRequest<T>(path: string, options: RequestOptions = {}) {
  try {
    return await apiRequest<T>(path, options);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const ignored = ['404', '409', 'Figurinha já está colada', 'Figurinha colada não encontrada'];

    if (ignored.some((text) => message.includes(text))) {
      return null;
    }

    throw error;
  }
}

function toId(value: number | string) {
  return String(value);
}

function normalizeStickerType(tipo?: string | null, categoria?: string | null): StickerType {
  const normalizedTipo = String(tipo ?? '').toLowerCase();
  const normalizedCategoria = String(categoria ?? '').toLowerCase();

  if (normalizedTipo.includes('brilhante') || normalizedCategoria.includes('especial')) {
    return 'SHINY';
  }

  return 'NORMAL';
}

function orderGroupName(name: string) {
  const match = name.match(/[A-Z]/i);
  return match ? match[0].toUpperCase().charCodeAt(0) : 999;
}

function normalizeGroups(grupos: ApiGrupo[]): Group[] {
  return grupos
    .map((grupo) => ({
      id: toId(grupo.id),
      name: grupo.nome,
      order: orderGroupName(grupo.nome),
    }))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

function normalizeTeams(selecoes: ApiSelecao[]): Team[] {
  return selecoes
    .map((selecao) => ({
      id: toId(selecao.id),
      name: selecao.nome,
      code: selecao.sigla,
      flagUrl: selecao.escudo_url ?? undefined,
      groupId: toId(selecao.grupo_id),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function normalizeStickers({
  figurinhas,
  selecoes,
  jogadores,
  coladas,
  repetidas,
}: {
  figurinhas: ApiFigurinha[];
  selecoes: ApiSelecao[];
  jogadores: ApiJogador[];
  coladas: ApiFigurinhaColada[];
  repetidas: ApiFigurinhaRepetida[];
}): Sticker[] {
  const selecaoById = new Map(selecoes.map((selecao) => [selecao.id, selecao]));
  const jogadorById = new Map(jogadores.map((jogador) => [jogador.id, jogador]));
  const coladaByFigurinhaId = new Map(coladas.map((colada) => [colada.figurinha_id, colada]));
  const repetidaByFigurinhaId = new Map(repetidas.map((repetida) => [repetida.figurinha_id, repetida]));

  return figurinhas
    .map((figurinha) => {
      const selecao = selecaoById.get(figurinha.selecao_id);
      const jogador = figurinha.jogador_id ? jogadorById.get(figurinha.jogador_id) : undefined;
      const colada = coladaByFigurinhaId.get(figurinha.id);
      const repetida = repetidaByFigurinhaId.get(figurinha.id);
      const duplicates = repetida?.quantidade ?? 0;
      const isPasted = Boolean(colada);

      return {
        id: toId(figurinha.id),
        number: figurinha.numero_global ?? figurinha.numero_na_selecao ?? figurinha.id,
        code: figurinha.codigo,
        name: figurinha.nome ?? jogador?.nome ?? figurinha.codigo,
        type: normalizeStickerType(figurinha.tipo, figurinha.categoria),
        imageUrl: figurinha.imagem_url ?? undefined,
        quantity: (isPasted ? 1 : 0) + duplicates,
        isPasted,
        pastedAt: colada?.data_colagem,
        teamId: toId(figurinha.selecao_id),
        groupId: toId(selecao?.grupo_id ?? ''),
      } satisfies Sticker;
    })
    .sort((a, b) => a.number - b.number || a.code.localeCompare(b.code));
}

export const albumService = {
  getHealth: () => apiRequest<{ status: string }>('/health'),

  getDashboardResumo: () => apiRequest<unknown>('/dashboard/resumo'),
  getDashboardProgresso: () => apiRequest<unknown>('/dashboard/progresso'),
  getDashboardFaltantes: () => apiRequest<unknown>('/dashboard/faltantes'),
  getDashboardUltimasColadas: () => apiRequest<ApiFigurinhaColada[]>('/dashboard/ultimas-coladas'),

  getGrupos: () => apiRequest<ApiGrupo[]>('/grupos'),
  getGrupo: (grupoId: number | string) => apiRequest<ApiGrupo>(`/grupos/${grupoId}`),
  getSelecoesDoGrupo: (grupoId: number | string) => apiRequest<ApiSelecao[]>(`/grupos/${grupoId}/selecoes`),

  getSelecoes: () => apiRequest<ApiSelecao[]>('/selecoes'),
  getSelecao: (selecaoId: number | string) => apiRequest<ApiSelecao>(`/selecoes/${selecaoId}`),
  getJogadoresDaSelecao: (selecaoId: number | string) => apiRequest<ApiJogador[]>(`/selecoes/${selecaoId}/jogadores`),
  getFigurinhasDaSelecao: (selecaoId: number | string) => apiRequest<ApiFigurinha[]>(`/selecoes/${selecaoId}/figurinhas`),

  getJogadores: () => apiRequest<ApiJogador[]>('/jogadores'),
  searchJogadores: (nome: string) => apiRequest<ApiJogador[]>('/jogadores/search', { params: { nome } }),
  getJogador: (jogadorId: number | string) => apiRequest<ApiJogador>(`/jogadores/${jogadorId}`),

  getFigurinhas: () => apiRequest<ApiFigurinha[]>('/figurinhas'),
  searchFigurinhas: (termo: string) => apiRequest<ApiFigurinha[]>('/figurinhas/search', { params: { termo } }),
  getFigurinha: (figurinhaId: number | string) => apiRequest<ApiFigurinha>(`/figurinhas/${figurinhaId}`),

  getFigurinhasColadas: () => apiRequest<ApiFigurinhaColada[]>('/figurinhas-coladas'),
  getUltimasFigurinhasColadas: () => apiRequest<ApiFigurinhaColada[]>('/figurinhas-coladas/ultimas'),
  addFigurinhaColada: (figurinhaId: number | string) =>
    apiRequest<ApiFigurinhaColada>('/figurinhas-coladas', {
      method: 'POST',
      body: { figurinha_id: Number(figurinhaId) },
    }),
  removeFigurinhaColada: (figurinhaId: number | string) =>
    apiRequest<void>(`/figurinhas-coladas/${figurinhaId}`, {
      method: 'DELETE',
    }),

  getRepetidas: () => apiRequest<ApiFigurinhaRepetida[]>('/repetidas'),
  searchRepetidas: (termo: string) => apiRequest<ApiFigurinhaRepetida[]>('/repetidas/search', { params: { termo } }),
  getRepetida: (repetidaId: number | string) => apiRequest<ApiFigurinhaRepetida>(`/repetidas/${repetidaId}`),
  addRepetida: (figurinhaId: number | string, quantidade = 1) =>
    apiRequest<ApiFigurinhaRepetida>('/repetidas', {
      method: 'POST',
      body: {
        figurinha_id: Number(figurinhaId),
        quantidade,
      },
    }),
  updateRepetida: (repetidaId: number | string, quantidade: number) =>
    apiRequest<ApiFigurinhaRepetida>(`/repetidas/${repetidaId}`, {
      method: 'PUT',
      body: { quantidade },
    }),
  removeRepetida: (repetidaId: number | string) =>
    apiRequest<void>(`/repetidas/${repetidaId}`, {
      method: 'DELETE',
    }),

  getFaltantes: () => apiRequest<ApiFigurinha[]>('/faltantes'),
  getFaltantesNormais: () => apiRequest<ApiFigurinha[]>('/faltantes/normais'),
  getFaltantesBrilhantes: () => apiRequest<ApiFigurinha[]>('/faltantes/brilhantes'),
  getFaltantesPorSelecao: (selecaoId: number | string) => apiRequest<ApiFigurinha[]>(`/faltantes/selecao/${selecaoId}`),
};

export async function getAlbumData(): Promise<AlbumData> {
  const [grupos, selecoes, jogadores, figurinhas, coladas, repetidas] = await Promise.all([
    albumService.getGrupos(),
    albumService.getSelecoes(),
    albumService.getJogadores(),
    albumService.getFigurinhas(),
    albumService.getFigurinhasColadas(),
    albumService.getRepetidas(),
  ]);

  return {
    groups: normalizeGroups(grupos),
    teams: normalizeTeams(selecoes),
    stickers: normalizeStickers({ figurinhas, selecoes, jogadores, coladas, repetidas }),
  };
}

export async function getDashboardData(): Promise<AlbumData> {
  return getAlbumData();
}

export function calculateAlbumStats(stickers: Sticker[]): AlbumStats {
  const total = stickers.length;
  const pasted = stickers.filter((sticker) => sticker.isPasted).length;
  const missing = Math.max(total - pasted, 0);
  const duplicates = stickers.reduce((sum, sticker) => sum + Math.max(sticker.quantity - 1, 0), 0);
  const normalMissing = stickers.filter((sticker) => sticker.type === 'NORMAL' && !sticker.isPasted).length;
  const shinyMissing = stickers.filter((sticker) => sticker.type === 'SHINY' && !sticker.isPasted).length;
  const percentage = total > 0 ? Math.round((pasted / total) * 100) : 0;

  return {
    total,
    pasted,
    missing,
    duplicates,
    normalMissing,
    shinyMissing,
    percentage,
  };
}

export function getGroupProgress(group: Group, stickers: Sticker[]): ProgressSummary {
  const groupStickers = stickers.filter((sticker) => sticker.groupId === group.id);
  return calculateProgress(groupStickers);
}

export function getTeamProgress(team: Team, stickers: Sticker[]): ProgressSummary {
  const teamStickers = stickers.filter((sticker) => sticker.teamId === team.id);
  return calculateProgress(teamStickers);
}

function calculateProgress(stickers: Sticker[]): ProgressSummary {
  const total = stickers.length;
  const pasted = stickers.filter((sticker) => sticker.isPasted).length;
  const missing = Math.max(total - pasted, 0);
  const duplicates = stickers.reduce((sum, sticker) => sum + Math.max(sticker.quantity - 1, 0), 0);
  const percentage = total > 0 ? Math.round((pasted / total) * 100) : 0;

  return {
    total,
    pasted,
    missing,
    duplicates,
    percentage,
  };
}

export function getTeamName(teamId: string, teams: Team[]) {
  return teams.find((team) => team.id === teamId)?.name ?? 'Seleção não encontrada';
}

export function getGroupName(groupId: string, groups: Group[]) {
  return groups.find((group) => group.id === groupId)?.name ?? 'Grupo não encontrado';
}

export async function updateStickerPasted({ stickerId, isPasted }: UpdateStickerPastedPayload) {
  if (isPasted) {
    await safeApiRequest('/figurinhas-coladas', {
      method: 'POST',
      body: { figurinha_id: Number(stickerId) },
    });
    return;
  }

  await safeApiRequest(`/figurinhas-coladas/${stickerId}`, {
    method: 'DELETE',
  });
}

async function getRepeatedRecordByStickerId(stickerId: string) {
  const repetidas = await albumService.getRepetidas();
  return repetidas.find((repetida) => String(repetida.figurinha_id) === String(stickerId));
}

export async function updateStickerQuantity({ stickerId, quantity }: UpdateStickerQuantityPayload) {
  const targetQuantity = Math.max(Number(quantity), 0);
  const repeatedRecord = await getRepeatedRecordByStickerId(stickerId);
  const duplicateQuantity = Math.max(targetQuantity - 1, 0);

  if (targetQuantity <= 0) {
    await safeApiRequest(`/figurinhas-coladas/${stickerId}`, { method: 'DELETE' });

    if (repeatedRecord) {
      await safeApiRequest(`/repetidas/${repeatedRecord.id}`, { method: 'DELETE' });
    }

    return;
  }

  await safeApiRequest('/figurinhas-coladas', {
    method: 'POST',
    body: { figurinha_id: Number(stickerId) },
  });

  if (duplicateQuantity <= 0) {
    if (repeatedRecord) {
      await safeApiRequest(`/repetidas/${repeatedRecord.id}`, { method: 'DELETE' });
    }

    return;
  }

  if (repeatedRecord) {
    await albumService.updateRepetida(repeatedRecord.id, duplicateQuantity);
  } else {
    await albumService.addRepetida(stickerId, duplicateQuantity);
  }
}

export async function addRepeatedSticker({ stickerId, quantity }: AddRepeatedStickerPayload) {
  const currentData = await getAlbumData();
  const currentSticker = currentData.stickers.find((sticker) => sticker.id === stickerId);
  const currentQuantity = currentSticker?.quantity ?? 0;
  const nextQuantity = currentQuantity + Math.max(quantity, 1);

  await updateStickerQuantity({ stickerId, quantity: nextQuantity });
}

export function getRepeatedStickers() {
  return albumService.getRepetidas();
}

export function searchRepeatedStickers(termo: string) {
  return albumService.searchRepetidas(termo);
}

export default albumService;
