import { CheckCircle2, CircleDashed } from 'lucide-react';
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
  const statusClasses = sticker.isPasted
    ? 'border-green-300 bg-green-50/80 ring-2 ring-green-100'
    : 'border-red-200 bg-white';
  const StatusIcon = sticker.isPasted ? CheckCircle2 : CircleDashed;
  const showQuantityControls = Boolean(onIncrease || onDecrease);

  return (
    <article className={`overflow-hidden rounded-2xl border shadow-sm transition ${statusClasses}`}>
      <div className={`relative grid h-28 place-items-center md:h-36 ${sticker.isPasted ? 'bg-green-100' : 'bg-slate-100'}`}>
        <div
          className={`absolute right-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide md:text-xs ${
            sticker.isPasted ? 'bg-green-700 text-white' : 'bg-red-600 text-white'
          }`}
        >
          <StatusIcon className="h-3 w-3" strokeWidth={2.6} />
          {sticker.isPasted ? 'Colada' : 'Falta'}
        </div>

        {sticker.imageUrl ? (
          <img src={sticker.imageUrl} alt={sticker.name} className="h-full w-full object-cover" />
        ) : (
          <div className="text-center">
            <strong className="block text-xl text-slate-700 md:text-2xl">{sticker.code}</strong>
            <span className="text-xs text-slate-500 md:text-sm">Sem imagem</span>
          </div>
        )}
      </div>

      <div className="space-y-3 p-3 md:space-y-4 md:p-4">
        <div>
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            <Badge variant={sticker.type === 'SHINY' ? 'gold' : 'default'}>
              {sticker.type === 'SHINY' ? 'Brilhante' : 'Normal'}
            </Badge>
            <Badge variant={sticker.isPasted ? 'success' : 'danger'}>
              {sticker.isPasted ? 'Colada' : 'Faltando'}
            </Badge>
            {showDuplicateCount && duplicates > 0 ? <Badge variant="warning">{duplicates} repetida(s)</Badge> : null}
          </div>
          <h3 className="mt-3 line-clamp-2 text-sm font-bold text-slate-950 md:text-base">{sticker.name}</h3>
          <p className="text-xs text-slate-500 md:text-sm">
            {sticker.code} · {teamName}{groupName ? ` · ${groupName}` : ''}
          </p>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-white/80 p-2 shadow-sm md:p-3">
          <span className="text-xs text-slate-500 md:text-sm">Qtd.</span>
          {showQuantityControls ? (
            <div className="flex items-center gap-1.5 md:gap-2">
              <button
                type="button"
                onClick={() => onDecrease?.(sticker.id)}
                className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 font-bold text-slate-700 shadow-sm hover:bg-slate-200"
                aria-label={`Diminuir quantidade de ${sticker.name}`}
              >
                -
              </button>
              <strong className="w-7 text-center text-slate-950 md:w-8">{sticker.quantity}</strong>
              <button
                type="button"
                onClick={() => onIncrease?.(sticker.id)}
                className="grid h-8 w-8 place-items-center rounded-full bg-blue-700 font-bold text-white shadow-sm hover:bg-blue-800"
                aria-label={`Aumentar quantidade de ${sticker.name}`}
              >
                +
              </button>
            </div>
          ) : (
            <strong className="text-slate-950">{sticker.quantity}</strong>
          )}
        </div>

        {onTogglePasted ? (
          <button
            type="button"
            onClick={() => onTogglePasted(sticker.id)}
            className={`w-full rounded-xl px-3 py-3 text-xs font-black transition md:px-4 md:text-sm ${
              sticker.isPasted
                ? 'bg-green-700 text-white hover:bg-green-800'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {sticker.isPasted ? 'Figurinha colada' : 'Marcar como colada'}
          </button>
        ) : null}
      </div>
    </article>
  );
}
