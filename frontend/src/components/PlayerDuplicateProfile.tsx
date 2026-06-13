import { CheckCircle2, Minus, Plus, Repeat2, Shield } from 'lucide-react';
import type { Sticker } from '../types/album';
import { Badge } from './Badge';

type PlayerDuplicateProfileProps = {
  sticker: Sticker;
  teamName: string;
  groupName: string;
  onIncrease: (stickerId: string) => void;
  onDecrease: (stickerId: string) => void;
  onTogglePasted?: (stickerId: string) => void;
  onBack: () => void;
};

export function PlayerDuplicateProfile({
  sticker,
  teamName,
  groupName,
  onIncrease,
  onDecrease,
  onTogglePasted,
  onBack,
}: PlayerDuplicateProfileProps) {
  const duplicates = Math.max(sticker.quantity - 1, 0);

  return (
    <article className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-green-600 via-blue-700 to-red-600 p-1">
        <div className="rounded-[1.35rem] bg-white p-4 md:p-6">
          <button type="button" onClick={onBack} className="mb-5 text-sm font-bold text-blue-700 hover:text-blue-900">
            ← Voltar para a busca
          </button>

          <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
              <div className="grid h-64 place-items-center bg-slate-100">
                {sticker.imageUrl ? (
                  <img src={sticker.imageUrl} alt={sticker.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="text-center">
                    <strong className="block text-4xl text-slate-700">{sticker.code}</strong>
                    <span className="text-sm text-slate-500">Sem imagem</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={sticker.type === 'SHINY' ? 'gold' : 'default'}>
                    {sticker.type === 'SHINY' ? 'Brilhante' : 'Normal'}
                  </Badge>
                  <Badge variant={sticker.isPasted ? 'success' : 'danger'}>
                    {sticker.isPasted ? 'Colada' : 'Faltando'}
                  </Badge>
                  <Badge variant="warning">{duplicates} repetida(s)</Badge>
                </div>

                <h2 className="mt-4 text-3xl font-black text-slate-950">{sticker.name}</h2>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Shield className="h-4 w-4 text-blue-700" /> {teamName}
                  </span>
                  <span>·</span>
                  <span>{groupName}</span>
                  <span>·</span>
                  <span>{sticker.code}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <span className="text-sm text-slate-500">Quantidade total</span>
                  <strong className="mt-1 block text-3xl font-black text-slate-950">{sticker.quantity}</strong>
                </div>
                <div className="rounded-2xl bg-blue-50 p-4">
                  <span className="text-sm text-slate-500">Repetidas</span>
                  <strong className="mt-1 block text-3xl font-black text-blue-700">{duplicates}</strong>
                </div>
                <div className="rounded-2xl bg-green-50 p-4">
                  <span className="text-sm text-slate-500">Status</span>
                  <strong className="mt-1 flex items-center gap-2 text-base font-black text-green-700">
                    <CheckCircle2 className="h-5 w-5" /> {sticker.isPasted ? 'Colada' : 'Pendente'}
                  </strong>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-700">Ajustar repetidas</p>
                <p className="mt-1 text-sm text-slate-500">Use + e - para aumentar ou diminuir a quantidade dessa figurinha.</p>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onDecrease(sticker.id)}
                    className="grid h-12 w-12 place-items-center rounded-full bg-white text-slate-700 shadow-sm hover:bg-slate-100"
                    aria-label={`Diminuir repetidas de ${sticker.name}`}
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <strong className="min-w-16 text-center text-3xl font-black text-slate-950">{sticker.quantity}</strong>
                  <button
                    type="button"
                    onClick={() => onIncrease(sticker.id)}
                    className="grid h-12 w-12 place-items-center rounded-full bg-blue-700 text-white shadow-sm hover:bg-blue-800"
                    aria-label={`Aumentar repetidas de ${sticker.name}`}
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {onTogglePasted ? (
                <button
                  type="button"
                  onClick={() => onTogglePasted(sticker.id)}
                  className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white transition ${
                    sticker.isPasted ? 'bg-green-700 hover:bg-green-800' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  <Repeat2 className="h-4 w-4" />
                  {sticker.isPasted ? 'Figurinha já colada' : 'Marcar como colada'}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
