import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AlbumData } from '../types/album';
import {
  addRepeatedSticker,
  getAlbumData,
  getGroupName,
  getGroupProgress,
  getTeamName,
  getTeamProgress,
  updateStickerPasted,
  updateStickerQuantity,
} from '../services/albumService';
import { AddDuplicateModal } from '../components/AddDuplicateModal';
import { EmptyState } from '../components/EmptyState';
import { GroupCard } from '../components/GroupCard';
import { PageHeader } from '../components/PageHeader';
import { SearchInput } from '../components/SearchInput';
import { SectionHeader } from '../components/SectionHeader';
import { StickerCard } from '../components/StickerCard';
import { TeamCard } from '../components/TeamCard';

type ViewMode = 'groups' | 'teams' | 'stickers';

export function Repetidas() {
  const [albumData, setAlbumData] = useState<AlbumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('groups');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const loadRepeated = useCallback(async () => {
    try {
      setError('');
      const data = await getAlbumData();
      setAlbumData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar repetidas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRepeated();
  }, [loadRepeated]);

  const groups = albumData?.groups ?? [];
  const teams = albumData?.teams ?? [];
  const stickers = albumData?.stickers ?? [];

  const duplicateStickers = useMemo(() => stickers.filter((sticker) => sticker.quantity > 1), [stickers]);
  const selectedGroup = groups.find((group) => group.id === selectedGroupId);
  const selectedTeam = teams.find((team) => team.id === selectedTeamId);

  const groupsWithDuplicates = useMemo(() => {
    const groupIds = new Set(duplicateStickers.map((sticker) => sticker.groupId));
    return groups.filter((group) => groupIds.has(group.id));
  }, [duplicateStickers, groups]);

  const teamsWithDuplicates = useMemo(() => {
    if (!selectedGroupId) return [];

    const teamIds = new Set(
      duplicateStickers
        .filter((sticker) => sticker.groupId === selectedGroupId)
        .map((sticker) => sticker.teamId),
    );

    return teams.filter((team) => team.groupId === selectedGroupId && teamIds.has(team.id));
  }, [duplicateStickers, selectedGroupId, teams]);

  const visibleDuplicateStickers = useMemo(() => {
    if (!selectedTeamId) return [];

    const term = query.toLowerCase().trim();
    const teamDuplicates = duplicateStickers.filter((sticker) => sticker.teamId === selectedTeamId);

    if (!term) return teamDuplicates;

    return teamDuplicates.filter((sticker) => {
      const teamName = getTeamName(sticker.teamId, teams);
      const groupName = getGroupName(sticker.groupId, groups);

      return [sticker.name, sticker.code, String(sticker.number), teamName, groupName].some((field) =>
        field.toLowerCase().includes(term),
      );
    });
  }, [duplicateStickers, groups, query, selectedTeamId, teams]);

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

  async function handleAddDuplicate(stickerId: string, quantity: number) {
    await addRepeatedSticker({ stickerId, quantity });
    setModalOpen(false);
    await loadRepeated();
  }

  async function handleTogglePasted(stickerId: string) {
    const sticker = stickers.find((item) => item.id === stickerId);
    if (!sticker) return;

    await updateStickerPasted({ stickerId, isPasted: !sticker.isPasted });
    await loadRepeated();
  }

  async function handleIncrease(stickerId: string) {
    const sticker = stickers.find((item) => item.id === stickerId);
    if (!sticker) return;

    await updateStickerQuantity({ stickerId, quantity: sticker.quantity + 1 });
    await loadRepeated();
  }

  async function handleDecrease(stickerId: string) {
    const sticker = stickers.find((item) => item.id === stickerId);
    if (!sticker) return;

    await updateStickerQuantity({ stickerId, quantity: Math.max(sticker.quantity - 1, 0) });
    await loadRepeated();
  }

  if (loading) {
    return <EmptyState title="Carregando repetidas" description="Buscando figurinhas repetidas no banco de dados." />;
  }

  if (error || !albumData) {
    return <EmptyState title="Erro ao carregar repetidas" description={error || 'Não foi possível buscar as figurinhas repetidas.'} />;
  }

  return (
    <section className="space-y-8">
      <PageHeader
        title="Repetidas"
        description="Visualize figurinhas com quantidade maior que 1 e adicione repetidas rapidamente."
        action={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800"
          >
            + Adicionar repetida
          </button>
        }
      />

      {viewMode === 'groups' ? (
        <div className="space-y-4">
          <SectionHeader title="Grupos com repetidas" description="Apenas grupos que possuem figurinhas repetidas aparecem aqui." />
          {groupsWithDuplicates.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {groupsWithDuplicates.map((group) => {
                const progress = getGroupProgress(group, duplicateStickers);
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
          ) : (
            <EmptyState title="Nenhuma repetida cadastrada" description="Use o botão de adicionar repetida para começar." />
          )}
        </div>
      ) : null}

      {viewMode === 'teams' && selectedGroup ? (
        <div className="space-y-4">
          <button type="button" onClick={backToGroups} className="text-sm font-bold text-blue-700 hover:text-blue-900">
            ← Voltar para grupos
          </button>
          <SectionHeader title={selectedGroup.name} description="Seleções deste grupo que possuem repetidas." />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {teamsWithDuplicates.map((team) => {
              const progress = getTeamProgress(team, duplicateStickers);
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
            <SectionHeader title={`Repetidas - ${selectedTeam.name}`} description="Quantidade repetida = quantidade total - 1." />
            <div className="w-full md:max-w-md">
              <SearchInput value={query} onChange={setQuery} placeholder="Pesquisar repetida..." />
            </div>
          </div>

          {visibleDuplicateStickers.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {visibleDuplicateStickers.map((sticker) => (
                <StickerCard
                  key={sticker.id}
                  sticker={sticker}
                  teamName={getTeamName(sticker.teamId, teams)}
                  groupName={getGroupName(sticker.groupId, groups)}
                  onTogglePasted={handleTogglePasted}
                  onIncrease={handleIncrease}
                  onDecrease={handleDecrease}
                  showDuplicateCount
                />
              ))}
            </div>
          ) : (
            <EmptyState title="Nenhuma repetida encontrada" description="Ajuste a busca ou adicione uma nova repetida." />
          )}
        </div>
      ) : null}

      {modalOpen ? (
        <AddDuplicateModal
          stickers={stickers}
          teams={teams}
          onClose={() => setModalOpen(false)}
          onAddDuplicate={handleAddDuplicate}
        />
      ) : null}
    </section>
  );
}
