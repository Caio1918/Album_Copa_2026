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
  const missingPercentage = total > 0 ? Math.max(100 - percentage, 0) : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md md:p-5"
    >
      <div className="flex items-center gap-2 md:gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-50 text-xs font-black text-blue-700 md:h-12 md:w-12 md:text-sm">
          {team.code}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-slate-950 md:text-lg">{team.name}</h3>
          <p className="text-xs text-slate-500 md:text-sm">{team.code}</p>
        </div>
      </div>

      <div className="mt-4 md:mt-5">
        <ProgressBar value={percentage} label="Progresso" />
        <p className="mt-2 text-xs font-semibold text-red-700">Faltam {missingPercentage}%</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-center text-[11px] md:mt-5 md:grid-cols-4 md:text-xs">
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
        <div className="rounded-xl bg-blue-50 p-2">
          <strong className="block text-blue-700">{duplicates}</strong>
          <span className="text-slate-500">Repetidas</span>
        </div>
      </div>
    </button>
  );
}
