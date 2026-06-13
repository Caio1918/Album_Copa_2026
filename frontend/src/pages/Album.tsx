import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AlbumData } from '../types/album';
import {
  getAlbumData,
  getGroupProgress,
  getTeamName,
  getTeamProgress,
  updateStickerPasted,
  updateStickerQuantity,
} from '../services/albumService';
import { EmptyState } from '../components/EmptyState';
import { GroupCard } from '../components/GroupCard';
import { PageHeader } from '../components/PageHeader';
import { SearchInput } from '../components/SearchInput';
import { SectionHeader } from '../components/SectionHeader';
import { StickerCard } from '../components/StickerCard';
import { TeamCard } from '../components/TeamCard';

type ViewMode = 'groups' | 'teams' | 'stickers';

export function Album() {
  const [albumData, setAlbumData] = useState<AlbumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('groups');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

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

  const visibleTeams = useMemo(() => {
    if (!selectedGroupId) return [];
    return teams.filter((team) => team.groupId === selectedGroupId);
  }, [selectedGroupId, teams]);

  const visibleStickers = useMemo(() => {
    if (!selectedTeamId) return [];

    const term = query.toLowerCase().trim();
    const teamStickers = stickers.filter((sticker) => sticker.teamId === selectedTeamId);

    if (!term) return teamStickers;

    return teamStickers.filter((sticker) =>
      [sticker.name, sticker.code, String(sticker.number), sticker.type].some((field) =>
        field.toLowerCase().includes(term),
      ),
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

      {viewMode === 'groups' ? (
        <div className="space-y-4">
          <SectionHeader title="Grupos" description="Escolha um grupo para ver as seleções cadastradas." />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

      {viewMode === 'teams' && selectedGroup ? (
        <div className="space-y-4">
          <button type="button" onClick={backToGroups} className="text-sm font-bold text-blue-700 hover:text-blue-900">
            ← Voltar para grupos
          </button>
          <SectionHeader title={selectedGroup.name} description="Escolha uma seleção para ver as figurinhas." />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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

      {viewMode === 'stickers' && selectedTeam ? (
        <div className="space-y-4">
          <button type="button" onClick={backToTeams} className="text-sm font-bold text-blue-700 hover:text-blue-900">
            ← Voltar para seleções
          </button>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <SectionHeader title={selectedTeam.name} description="Figurinhas da seleção escolhida." />
            <div className="w-full md:max-w-md">
              <SearchInput value={query} onChange={setQuery} placeholder="Pesquisar por nome, número ou código..." />
            </div>
          </div>

          {visibleStickers.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
