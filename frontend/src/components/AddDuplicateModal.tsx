import { useMemo, useState } from 'react';
import type { Sticker, Team } from '../types/album';
import { SearchInput } from './SearchInput';

const normalize = (value: string) => value.toLowerCase().trim();

type AddDuplicateModalProps = {
  stickers: Sticker[];
  teams: Team[];
  onClose: () => void;
  onAddDuplicate: (stickerId: string, quantity: number) => void;
};

export function AddDuplicateModal({ stickers, teams, onClose, onAddDuplicate }: AddDuplicateModalProps) {
  const [query, setQuery] = useState('');
  const [selectedStickerId, setSelectedStickerId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  const filteredStickers = useMemo(() => {
    const term = normalize(query);

    if (!term) return stickers.slice(0, 8);

    return stickers.filter((sticker) => {
      const teamName = teams.find((team) => team.id === sticker.teamId)?.name ?? '';
      return [sticker.name, sticker.code, String(sticker.number), teamName].some((field) =>
        normalize(field).includes(term),
      );
    });
  }, [query, stickers, teams]);

  function handleSubmit() {
    if (!selectedStickerId) return;

    onAddDuplicate(selectedStickerId, quantity);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">Adicionar repetida</h2>
            <p className="mt-1 text-sm text-slate-500">Pesquise por nome, código, número ou seleção.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600">
            Fechar
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <SearchInput value={query} onChange={setQuery} placeholder="Ex.: BRA 01, escudo, Brasil..." />

          <div className="max-h-72 space-y-2 overflow-auto pr-1">
            {filteredStickers.map((sticker) => {
              const teamName = teams.find((team) => team.id === sticker.teamId)?.name ?? 'Seleção';
              const selected = selectedStickerId === sticker.id;

              return (
                <button
                  key={sticker.id}
                  type="button"
                  onClick={() => setSelectedStickerId(sticker.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selected ? 'border-blue-700 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <strong className="block text-slate-950">{sticker.code} - {sticker.name}</strong>
                  <span className="text-sm text-slate-500">{teamName} · quantidade atual: {sticker.quantity}</span>
                </button>
              );
            })}
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Quantidade a adicionar</span>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(event) => setQuantity(Math.max(Number(event.target.value), 1))}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedStickerId}
            className="w-full rounded-2xl bg-blue-700 px-5 py-3 font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Adicionar repetida
          </button>
        </div>
      </div>
    </div>
  );
}
