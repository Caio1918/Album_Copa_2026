import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AlbumData, Sticker, Team } from '../types/album';
import {
  getAlbumData,
  getGroupName,
  getGroupProgress,
  getTeamName,
  getTeamProgress,
  updateStickerPasted,
  updateStickerQuantity,
} from '../services/albumService';
import { CompletionProgress } from '../components/CompletionProgress';
import { EmptyState } from '../components/EmptyState';
import { GroupCard } from '../components/GroupCard';
import { PageHeader } from '../components/PageHeader';
import { SearchInput } from '../components/SearchInput';
import { SectionHeader } from '../components/SectionHeader';
import { StickerCard } from '../components/StickerCard';
import { TeamCard } from '../components/TeamCard';

type ViewMode = 'groups' | 'teams' | 'stickers';
type SearchResultType = 'team' | 'sticker';

type AlbumSearchResult = {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  groupId: string;
  teamId: string;
  searchTerm: string;
};

const normalize = (value: string | number | undefined | null) => String(value ?? '').toLowerCase().trim();

function teamMatches(team: Team, term: string) {
  return [team.name, team.code].some((field) => normalize(field).includes(term));
}

function stickerMatches(sticker: Sticker, teamName: string, groupName: string, term: string) {
  return [sticker.name, sticker.code, sticker.number, sticker.type, teamName, groupName].some((field) =>
    normalize(field).includes(term),
  );
}

export function Album() {
  const [albumData, setAlbumData] = useState<AlbumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('groups');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [albumSearchQuery, setAlbumSearchQuery] = useState('');

  const loadAlbum = useCallback(async () => {
    try {
      setError('');
      const data = await getAlbumData();
      setAlbumData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar álbum.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlbum();
  }, [loadAlbum]);

  const groups = albumData?.groups ?? [];
  const teams = albumData?.teams ?? [];
  const stickers = albumData?.stickers ?? [];

  const selectedGroup = groups.find((group) => group.id === selectedGroupId);
  const selectedTeam = teams.find((team) => team.id === selectedTeamId);
  const selectedGroupProgress = selectedGroup ? getGroupProgress(selectedGroup, stickers) : null;
  const selectedTeamProgress = selectedTeam ? getTeamProgress(selectedTeam, stickers) : null;

  const albumSearchResults = useMemo<AlbumSearchResult[]>(() => {
    const term = normalize(albumSearchQuery);
    if (!term) return [];

    const teamResults = teams
      .filter((team) => teamMatches(team, term))
      .map((team) => ({
        id: `team-${team.id}`,
        type: 'team' as const,
        title: team.name,
        subtitle: `${team.code} · ${getGroupName(team.groupId, groups)}`,
        groupId: team.groupId,
        teamId: team.id,
        searchTerm: '',
      }));

    const stickerResults = stickers
      .filter((sticker) => {
        const teamName = getTeamName(sticker.teamId, teams);
        const groupName = getGroupName(sticker.groupId, groups);
        return stickerMatches(sticker, teamName, groupName, term);
      })
      .map((sticker) => ({
        id: `sticker-${sticker.id}`,
        type: 'sticker' as const,
        title: sticker.name,
        subtitle: `${sticker.code} · ${getTeamName(sticker.teamId, teams)} · ${getGroupName(sticker.groupId, groups)}`,
        groupId: sticker.groupId,
        teamId: sticker.teamId,
        searchTerm: sticker.name,
      }));

    return [...teamResults, ...stickerResults].slice(0, 8);
  }, [albumSearchQuery, groups, stickers, teams]);

  const visibleTeams = useMemo(() => {
    if (!selectedGroupId) return [];
    return teams.filter((team) => team.groupId === selectedGroupId);
  }, [selectedGroupId, teams]);

  const visibleStickers = useMemo(() => {
    if (!selectedTeamId) return [];

    const term = normalize(query);
    const teamStickers = stickers.filter((sticker) => sticker.teamId === selectedTeamId);

    if (!term) return teamStickers;

    return teamStickers.filter((sticker) =>
      [sticker.name, sticker.code, String(sticker.number), sticker.type].some((field) => normalize(field).includes(term)),
    );
  }, [query, selectedTeamId, stickers]);

  function openGroup(groupId: string) {
    setSelectedGroupId(groupId);
    setSelectedTeamId(null);
    setViewMode('teams');
  }

  function openTeam(teamId: string) {
    setSelectedTeamId(teamId);
    setViewMode('stickers');
  }

  function openSearchResult(result: AlbumSearchResult) {
    setSelectedGroupId(result.groupId);
    setSelectedTeamId(result.teamId);
    setViewMode('stickers');
    setQuery(result.searchTerm);
    setAlbumSearchQuery(result.title);
  }

  function backToGroups() {
    setSelectedGroupId(null);
    setSelectedTeamId(null);
    setViewMode('groups');
    setQuery('');
  }

  function backToTeams() {
    setSelectedTeamId(null);
    setViewMode('teams');
    setQuery('');
  }

  async function handleTogglePasted(stickerId: string) {
    const sticker = stickers.find((item) => item.id === stickerId);
    if (!sticker) return;

    await updateStickerPasted({ stickerId, isPasted: !sticker.isPasted });
    await loadAlbum();
  }

  async function handleIncrease(stickerId: string) {
    const sticker = stickers.find((item) => item.id === stickerId);
    if (!sticker) return;

    await updateStickerQuantity({ stickerId, quantity: sticker.quantity + 1 });
    await loadAlbum();
  }

  async function handleDecrease(stickerId: string) {
    const sticker = stickers.find((item) => item.id === stickerId);
    if (!sticker) return;

    await updateStickerQuantity({ stickerId, quantity: Math.max(sticker.quantity - 1, 0) });
    await loadAlbum();
  }

  if (loading) {
    return <EmptyState title="Carregando álbum" description="Buscando grupos, seleções e figurinhas no banco de dados." />;
  }

  if (error || !albumData) {
    return <EmptyState title="Erro ao carregar álbum" description={error || 'Não foi possível buscar os dados do álbum.'} />;
  }

  return (
    <section className="space-y-8">
      <PageHeader
        title="Álbum"
        description="Navegue por grupos, seleções e figurinhas. Marque como colada e controle a quantidade de cada figurinha."
      />

      <div className="rounded-3xl border border-blue-100 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Busca rápida</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">Pesquisar seleção ou jogador</h2>
            <p className="mt-1 text-sm text-slate-500">Clique no resultado para ir direto ao local da figurinha.</p>
          </div>
          <div className="w-full md:max-w-xl">
            <SearchInput value={albumSearchQuery} onChange={setAlbumSearchQuery} placeholder="Digite o nome da seleção ou do jogador..." />
          </div>
        </div>

        {albumSearchResults.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {albumSearchResults.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => openSearchResult(result)}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-blue-300 hover:bg-blue-50"
              >
                <span className={`text-xs font-black ${result.type === 'team' ? 'text-blue-700' : 'text-green-700'}`}>
                  {result.type === 'team' ? 'Seleção' : 'Jogador'}
                </span>
                <strong className="mt-1 block truncate text-sm text-slate-950 md:text-base">{result.title}</strong>
                <span className="mt-1 block truncate text-xs text-slate-500">{result.subtitle}</span>
              </button>
            ))}
          </div>
        ) : albumSearchQuery.trim() ? (
          <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">Nenhum resultado encontrado.</p>
        ) : null}
      </div>

      {viewMode === 'groups' ? (
        <div className="space-y-4">
          <SectionHeader title="Grupos" description="Escolha um grupo para ver as seleções cadastradas." />
          <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
            {groups.map((group) => {
              const progress = getGroupProgress(group, stickers);
              return (
                <GroupCard
                  key={group.id}
                  group={group}
                  total={progress.total}
                  pasted={progress.pasted}
                  missing={progress.missing}
                  percentage={progress.percentage}
                  onClick={() => openGroup(group.id)}
                />
              );
            })}
          </div>
        </div>
      ) : null}

      {viewMode === 'teams' && selectedGroup && selectedGroupProgress ? (
        <div className="space-y-4">
          <button type="button" onClick={backToGroups} className="text-sm font-bold text-blue-700 hover:text-blue-900">
            ← Voltar para grupos
          </button>

          <CompletionProgress
            title={selectedGroup.name}
            label="Grupo selecionado"
            total={selectedGroupProgress.total}
            pasted={selectedGroupProgress.pasted}
            missing={selectedGroupProgress.missing}
            percentage={selectedGroupProgress.percentage}
          />

          <SectionHeader title={selectedGroup.name} description="Escolha uma seleção para ver as figurinhas." />
          <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-3">
            {visibleTeams.map((team) => {
              const progress = getTeamProgress(team, stickers);
              return (
                <TeamCard
                  key={team.id}
                  team={team}
                  total={progress.total}
                  pasted={progress.pasted}
                  missing={progress.missing}
                  duplicates={progress.duplicates}
                  percentage={progress.percentage}
                  onClick={() => openTeam(team.id)}
                />
              );
            })}
          </div>
        </div>
      ) : null}

      {viewMode === 'stickers' && selectedTeam && selectedTeamProgress ? (
        <div className="space-y-4">
          <button type="button" onClick={backToTeams} className="text-sm font-bold text-blue-700 hover:text-blue-900">
            ← Voltar para seleções
          </button>

          <CompletionProgress
            title={selectedTeam.name}
            label="Seleção selecionada"
            total={selectedTeamProgress.total}
            pasted={selectedTeamProgress.pasted}
            missing={selectedTeamProgress.missing}
            percentage={selectedTeamProgress.percentage}
          />

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <SectionHeader title={selectedTeam.name} description="Figurinhas da seleção escolhida." />
            <div className="w-full md:max-w-md">
              <SearchInput value={query} onChange={setQuery} placeholder="Pesquisar por nome, número ou código..." />
            </div>
          </div>

          {visibleStickers.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
              {visibleStickers.map((sticker) => (
                <StickerCard
                  key={sticker.id}
                  sticker={sticker}
                  teamName={getTeamName(sticker.teamId, teams)}
                  onTogglePasted={handleTogglePasted}
                  onIncrease={handleIncrease}
                  onDecrease={handleDecrease}
                  showDuplicateCount
                />
              ))}
            </div>
          ) : (
            <EmptyState title="Nenhuma figurinha encontrada" description="Ajuste a busca ou volte para outra seleção." />
          )}
        </div>
      ) : null}
    </section>
  );
}
