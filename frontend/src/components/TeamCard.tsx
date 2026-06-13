import type { Team } from '../types/album';
import { ProgressBar } from './ProgressBar';

type TeamCardProps = {
  team: Team;
  total: number;
  pasted: number;
  missing: number;
  duplicates?: number;
  percentage: number;
  onClick: () => void;
};

export function TeamCard({ team, total, pasted, missing, duplicates = 0, percentage, onClick }: TeamCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-700">
          {team.code}
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-950">{team.name}</h3>
          <p className="text-sm text-slate-500">{team.code}</p>
        </div>
      </div>

      <div className="mt-5">
        <ProgressBar value={percentage} label="Progresso" />
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2 text-center text-xs">
        <div className="rounded-xl bg-slate-50 p-2">
          <strong className="block text-slate-950">{total}</strong>
          <span className="text-slate-500">Total</span>
        </div>
        <div className="rounded-xl bg-green-50 p-2">
          <strong className="block text-green-700">{pasted}</strong>
          <span className="text-slate-500">Coladas</span>
        </div>
        <div className="rounded-xl bg-red-50 p-2">
          <strong className="block text-red-700">{missing}</strong>
          <span className="text-slate-500">Faltam</span>
        </div>
        <div className="rounded-xl bg-yellow-50 p-2">
          <strong className="block text-yellow-700">{duplicates}</strong>
          <span className="text-slate-500">Repetidas</span>
        </div>
      </div>
    </button>
  );
}
