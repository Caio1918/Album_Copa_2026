import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AlbumData, Sticker } from '../types/album';
import {
  getAlbumData,
  getGroupName,
  getTeamName,
  updateStickerPasted,
  updateStickerQuantity,
} from '../services/albumService';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { PlayerDuplicateProfile } from '../components/PlayerDuplicateProfile';
import { SearchInput } from '../components/SearchInput';
import { SectionHeader } from '../components/SectionHeader';
import { StickerCard } from '../components/StickerCard';

type ViewMode = 'list' | 'profile';

const normalize = (value: string | number | undefined | null) => String(value ?? '').toLowerCase().trim();

export function Repetidas() {
  const [albumData, setAlbumData] = useState<AlbumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

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
  const selectedSticker = stickers.find((sticker) => sticker.id === selectedStickerId) ?? null;

  const filteredStickers = useMemo(() => {
    const term = normalize(query);

    if (!term) {
      return duplicateStickers.slice(0, 12);
    }

    return stickers
      .filter((sticker) => {
        const teamName = getTeamName(sticker.teamId, teams);
        const groupName = getGroupName(sticker.groupId, groups);

        return [sticker.name, sticker.code, String(sticker.number), teamName, groupName].some((field) =>
          normalize(field).includes(term),
        );
      })
      .slice(0, 16);
  }, [duplicateStickers, groups, query, stickers, teams]);

  function openPlayerProfile(sticker: Sticker) {
    setSelectedStickerId(sticker.id);
    setQuery(sticker.name);
    setViewMode('profile');
  }

  function backToList() {
    setSelectedStickerId(null);
    setViewMode('list');
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
        description="Pesquise um jogador, abra o perfil da figurinha e ajuste a quantidade com + e -."
      />

      <div className="rounded-3xl border border-blue-100 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Perfil do jogador</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">Pesquisar jogador</h2>
            <p className="mt-1 text-sm text-slate-500">Digite o nome do jogador ou código da figurinha para abrir o perfil.</p>
          </div>
          <div className="w-full md:max-w-xl">
            <SearchInput value={query} onChange={setQuery} placeholder="Ex.: Messi, Brasil, BRA 01..." />
          </div>
        </div>
      </div>

      {viewMode === 'profile' && selectedSticker ? (
        <PlayerDuplicateProfile
          sticker={selectedSticker}
          teamName={getTeamName(selectedSticker.teamId, teams)}
          groupName={getGroupName(selectedSticker.groupId, groups)}
          onIncrease={handleIncrease}
          onDecrease={handleDecrease}
          onTogglePasted={handleTogglePasted}
          onBack={backToList}
        />
      ) : (
        <div className="space-y-4">
          <SectionHeader
            title={query.trim() ? 'Resultado da busca' : 'Jogadores com repetidas'}
            description={query.trim() ? 'Clique em um jogador para abrir o perfil e alterar a quantidade.' : 'Figurinhas que já possuem quantidade maior que 1.'}
          />

          {filteredStickers.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
              {filteredStickers.map((sticker) => (
                <button key={sticker.id} type="button" onClick={() => openPlayerProfile(sticker)} className="text-left">
                  <StickerCard
                    sticker={sticker}
                    teamName={getTeamName(sticker.teamId, teams)}
                    groupName={getGroupName(sticker.groupId, groups)}
                    showDuplicateCount
                  />
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              title={query.trim() ? 'Nenhum jogador encontrado' : 'Nenhuma repetida cadastrada'}
              description={query.trim() ? 'Tente buscar pelo nome do jogador, seleção ou código da figurinha.' : 'Pesquise um jogador para abrir o perfil e adicionar repetidas.'}
            />
          )}
        </div>
      )}
    </section>
  );
}
