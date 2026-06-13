import { useCallback, useEffect, useState } from 'react';
import type { AlbumData } from '../types/album';
import {
  calculateAlbumStats,
  getAlbumData,
  getGroupName,
  getTeamName,
  updateStickerPasted,
  updateStickerQuantity,
} from '../services/albumService';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { ProgressBar } from '../components/ProgressBar';
import { SectionHeader } from '../components/SectionHeader';
import { StatCard } from '../components/StatCard';
import { StickerCard } from '../components/StickerCard';

export function Dashboard() {
  const [albumData, setAlbumData] = useState<AlbumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    try {
      setError('');
      const data = await getAlbumData();
      setAlbumData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function handleTogglePasted(stickerId: string) {
    if (!albumData) return;

    const sticker = albumData.stickers.find((item) => item.id === stickerId);
    if (!sticker) return;

    await updateStickerPasted({ stickerId, isPasted: !sticker.isPasted });
    await loadDashboard();
  }

  async function handleIncrease(stickerId: string) {
    if (!albumData) return;

    const sticker = albumData.stickers.find((item) => item.id === stickerId);
    if (!sticker) return;

    await updateStickerQuantity({ stickerId, quantity: sticker.quantity + 1 });
    await loadDashboard();
  }

  async function handleDecrease(stickerId: string) {
    if (!albumData) return;

    const sticker = albumData.stickers.find((item) => item.id === stickerId);
    if (!sticker) return;

    await updateStickerQuantity({ stickerId, quantity: Math.max(sticker.quantity - 1, 0) });
    await loadDashboard();
  }

  if (loading) {
    return <EmptyState title="Carregando dashboard" description="Buscando informações do álbum no banco de dados." />;
  }

  if (error || !albumData) {
    return <EmptyState title="Erro ao carregar dashboard" description={error || 'Não foi possível buscar os dados do álbum.'} />;
  }

  const { stickers, teams, groups } = albumData;
  const stats = calculateAlbumStats(stickers);
  const latestPasted = stickers
    .filter((sticker) => sticker.isPasted && sticker.pastedAt)
    .sort((a, b) => String(b.pastedAt).localeCompare(String(a.pastedAt)))
    .slice(0, 4);
  const latestDuplicates = stickers.filter((sticker) => sticker.quantity > 1).slice(0, 4);

  return (
    <section className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Resumo geral do álbum, com progresso, figurinhas faltantes, repetidas e últimas atualizações."
      />

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-green-700">Álbum completo</p>
            <strong className="mt-2 block text-5xl font-black text-slate-950">{stats.percentage}%</strong>
            <p className="mt-2 text-slate-500">
              {stats.pasted} de {stats.total} figurinhas coladas.
            </p>
          </div>
          <div className="w-full md:max-w-xl">
            <ProgressBar value={stats.percentage} label="Progresso geral" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Coladas" value={`${stats.pasted} / ${stats.total}`} description="Figurinhas já marcadas no álbum." />
        <StatCard title="Faltam" value={stats.missing} description="Figurinhas que ainda não foram coladas." />
        <StatCard title="Repetidas" value={stats.duplicates} description="Calculado por quantidade - 1." />
        <StatCard title="Normais faltando" value={stats.normalMissing} description="Figurinhas comuns pendentes." />
        <StatCard title="Brilhantes faltando" value={stats.shinyMissing} description="Figurinhas especiais pendentes." />
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <div className="space-y-4">
          <SectionHeader title="Últimas figurinhas coladas" description="Atualizações mais recentes do álbum." />
          {latestPasted.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {latestPasted.map((sticker) => (
                <StickerCard
                  key={sticker.id}
                  sticker={sticker}
                  teamName={getTeamName(sticker.teamId, teams)}
                  groupName={getGroupName(sticker.groupId, groups)}
                  onTogglePasted={handleTogglePasted}
                  onIncrease={handleIncrease}
                  onDecrease={handleDecrease}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="Nenhuma figurinha colada" description="Marque figurinhas como coladas para aparecerem aqui." />
          )}
        </div>

        <div className="space-y-4">
          <SectionHeader title="Últimas repetidas" description="Figurinhas com quantidade maior que 1." />
          {latestDuplicates.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {latestDuplicates.map((sticker) => (
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
            <EmptyState title="Nenhuma repetida" description="Quando uma figurinha tiver quantidade maior que 1, ela aparecerá aqui." />
          )}
        </div>
      </div>
    </section>
  );
}
