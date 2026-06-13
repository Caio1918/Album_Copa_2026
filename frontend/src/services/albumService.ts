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

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8002';

const ENDPOINTS = {
  album: '/album',
  pasted: (stickerId: string) => `/album/figurinhas/${stickerId}/colada`,
  quantity: (stickerId: string) => `/album/figurinhas/${stickerId}/quantidade`,
  repeated: '/album/repetidas',
};

type ApiRecord = Record<string, unknown>;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || `Erro na requisição: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function readString(record: ApiRecord, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null) return String(value);
  }

  return fallback;
}

function readNumber(record: ApiRecord, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value);
  }

  return fallback;
}

function readBoolean(record: ApiRecord, keys: string[], fallback = false): boolean {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0;
    if (typeof value === 'string') return ['true', '1', 'sim', 'colada'].includes(value.toLowerCase());
  }

  return fallback;
}

function normalizeStickerType(value: unknown): StickerType {
  const normalized = String(value ?? 'NORMAL').toUpperCase();
  return normalized === 'SHINY' || normalized === 'BRILHANTE' ? 'SHINY' : 'NORMAL';
}

function normalizeGroup(group: ApiRecord): Group {
  return {
    id: readString(group, ['id', 'grupo_id', 'groupId']),
    name: readString(group, ['name', 'nome', 'titulo'], 'Grupo'),
    order: readNumber(group, ['order', 'ordem', 'position', 'posicao'], 0),
  };
}

function normalizeTeam(team: ApiRecord): Team {
  return {
    id: readString(team, ['id', 'selecao_id', 'teamId']),
    name: readString(team, ['name', 'nome'], 'Seleção'),
    code: readString(team, ['code', 'codigo', 'sigla'], ''),
    flagUrl: readString(team, ['flagUrl', 'flag_url', 'bandeira_url'], ''),
    groupId: readString(team, ['groupId', 'group_id', 'grupo_id']),
  };
}

function normalizeSticker(sticker: ApiRecord): Sticker {
  const quantity = readNumber(sticker, ['quantity', 'quantidade', 'qtd'], 0);
  const isPasted = readBoolean(sticker, ['isPasted', 'is_pasted', 'colada'], quantity > 0);

  return {
    id: readString(sticker, ['id', 'figurinha_id', 'stickerId']),
    number: readNumber(sticker, ['number', 'numero', 'número'], 0),
    code: readString(sticker, ['code', 'codigo', 'código'], ''),
    name: readString(sticker, ['name', 'nome', 'jogador'], 'Figurinha'),
    type: normalizeStickerType(sticker.type ?? sticker.tipo),
    imageUrl: readString(sticker, ['imageUrl', 'image_url', 'imagem_url'], ''),
    quantity,
    isPasted,
    pastedAt: readString(sticker, ['pastedAt', 'pasted_at', 'colada_em'], ''),
    teamId: readString(sticker, ['teamId', 'team_id', 'selecao_id']),
    groupId: readString(sticker, ['groupId', 'group_id', 'grupo_id']),
  };
}

function normalizeAlbumData(payload: unknown): AlbumData {
  const data = payload as ApiRecord;
  const rawGroups = (data.groups ?? data.grupos ?? []) as ApiRecord[];
  const rawTeams = (data.teams ?? data.selecoes ?? data.seleções ?? []) as ApiRecord[];
  const rawStickers = (data.stickers ?? data.figurinhas ?? []) as ApiRecord[];

  return {
    groups: rawGroups.map(normalizeGroup),
    teams: rawTeams.map(normalizeTeam),
    stickers: rawStickers.map(normalizeSticker),
  };
}

export async function getAlbumData(): Promise<AlbumData> {
  const payload = await request<unknown>(ENDPOINTS.album);
  return normalizeAlbumData(payload);
}

export async function updateStickerPasted({ stickerId, isPasted }: UpdateStickerPastedPayload): Promise<void> {
  await request<void>(ENDPOINTS.pasted(stickerId), {
    method: 'PATCH',
    body: JSON.stringify({ isPasted, colada: isPasted }),
  });
}

export async function updateStickerQuantity({ stickerId, quantity }: UpdateStickerQuantityPayload): Promise<void> {
  await request<void>(ENDPOINTS.quantity(stickerId), {
    method: 'PATCH',
    body: JSON.stringify({ quantity, quantidade: quantity }),
  });
}

export async function addRepeatedSticker({ stickerId, quantity }: AddRepeatedStickerPayload): Promise<void> {
  await request<void>(ENDPOINTS.repeated, {
    method: 'POST',
    body: JSON.stringify({ stickerId, figurinha_id: stickerId, quantity, quantidade: quantity }),
  });
}

export function getTeamName(teamId: string, teams: Team[]): string {
  return teams.find((team) => team.id === teamId)?.name ?? 'Seleção não encontrada';
}

export function getGroupName(groupId: string, groups: Group[]): string {
  return groups.find((group) => group.id === groupId)?.name ?? 'Grupo não encontrado';
}

export function calculateAlbumStats(stickers: Sticker[]): AlbumStats {
  const total = stickers.length;
  const pasted = stickers.filter((sticker) => sticker.isPasted).length;
  const missing = total - pasted;
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
  return getProgressSummary(groupStickers);
}

export function getTeamProgress(team: Team, stickers: Sticker[]): ProgressSummary {
  const teamStickers = stickers.filter((sticker) => sticker.teamId === team.id);
  return getProgressSummary(teamStickers);
}

function getProgressSummary(stickers: Sticker[]): ProgressSummary {
  const total = stickers.length;
  const pasted = stickers.filter((sticker) => sticker.isPasted).length;
  const duplicates = stickers.reduce((sum, sticker) => sum + Math.max(sticker.quantity - 1, 0), 0);
  const percentage = total > 0 ? Math.round((pasted / total) * 100) : 0;

  return {
    total,
    pasted,
    missing: total - pasted,
    duplicates,
    percentage,
  };
}
