import type { Sticker } from '../types/album';
import { Badge } from './Badge';

type StickerCardProps = {
  sticker: Sticker;
  teamName: string;
  groupName?: string;
  onTogglePasted?: (stickerId: string) => void;
  onIncrease?: (stickerId: string) => void;
  onDecrease?: (stickerId: string) => void;
  showDuplicateCount?: boolean;
};

export function StickerCard({
  sticker,
  teamName,
  groupName,
  onTogglePasted,
  onIncrease,
  onDecrease,
  showDuplicateCount = false,
}: StickerCardProps) {
  const duplicates = Math.max(sticker.quantity - 1, 0);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid h-36 place-items-center bg-slate-100">
        {sticker.imageUrl ? (
          <img src={sticker.imageUrl} alt={sticker.name} className="h-full w-full object-cover" />
        ) : (
          <div className="text-center">
            <strong className="block text-2xl text-slate-700">{sticker.code}</strong>
            <span className="text-sm text-slate-500">Sem imagem</span>
          </div>
        )}
      </div>

      <div className="space-y-4 p-4">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={sticker.type === 'SHINY' ? 'gold' : 'default'}>
              {sticker.type === 'SHINY' ? 'Brilhante' : 'Normal'}
            </Badge>
            <Badge variant={sticker.isPasted ? 'success' : 'danger'}>
              {sticker.isPasted ? 'Colada' : 'Faltando'}
            </Badge>
            {showDuplicateCount && duplicates > 0 ? <Badge variant="warning">{duplicates} repetida(s)</Badge> : null}
          </div>
          <h3 className="mt-3 font-bold text-slate-950">{sticker.name}</h3>
          <p className="text-sm text-slate-500">
            {sticker.code} · {teamName}{groupName ? ` · ${groupName}` : ''}
          </p>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
          <span className="text-sm text-slate-500">Quantidade</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDecrease?.(sticker.id)}
              className="grid h-8 w-8 place-items-center rounded-full bg-white font-bold text-slate-700 shadow-sm hover:bg-slate-100"
            >
              -
            </button>
            <strong className="w-8 text-center text-slate-950">{sticker.quantity}</strong>
            <button
              type="button"
              onClick={() => onIncrease?.(sticker.id)}
              className="grid h-8 w-8 place-items-center rounded-full bg-white font-bold text-slate-700 shadow-sm hover:bg-slate-100"
            >
              +
            </button>
          </div>
        </div>

        {onTogglePasted ? (
          <button
            type="button"
            onClick={() => onTogglePasted(sticker.id)}
            className={`w-full rounded-xl px-4 py-3 text-sm font-bold transition ${
              sticker.isPasted
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-blue-700 text-white hover:bg-blue-800'
            }`}
          >
            {sticker.isPasted ? 'Desmarcar como colada' : 'Marcar como colada'}
          </button>
        ) : null}
      </div>
    </article>
  );
}
