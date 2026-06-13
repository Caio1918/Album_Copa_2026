import type { Group } from '../types/album';
import { ProgressBar } from './ProgressBar';

type GroupCardProps = {
  group: Group;
  total: number;
  pasted: number;
  missing: number;
  percentage: number;
  onClick: () => void;
};

export function GroupCard({ group, total, pasted, missing, percentage, onClick }: GroupCardProps) {
  const missingPercentage = total > 0 ? Math.max(100 - percentage, 0) : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md md:p-5"
    >
      <div className="flex items-start justify-between gap-2 md:gap-4">
        <div>
          <p className="text-xs font-semibold text-blue-700 md:text-sm">Grupo</p>
          <h3 className="mt-1 text-lg font-bold text-slate-950 md:text-xl">{group.name}</h3>
        </div>
        <strong className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700 md:px-3 md:text-sm">{percentage}%</strong>
      </div>

      <div className="mt-4 md:mt-5">
        <ProgressBar value={percentage} />
        <p className="mt-2 text-xs font-semibold text-red-700">Faltam {missingPercentage}%</p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] md:mt-5 md:gap-3 md:text-sm">
        <div className="rounded-xl bg-slate-50 p-2 md:p-3">
          <strong className="block text-slate-950">{total}</strong>
          <span className="text-slate-500">Total</span>
        </div>
        <div className="rounded-xl bg-green-50 p-2 md:p-3">
          <strong className="block text-green-700">{pasted}</strong>
          <span className="text-slate-500">Coladas</span>
        </div>
        <div className="rounded-xl bg-red-50 p-2 md:p-3">
          <strong className="block text-red-700">{missing}</strong>
          <span className="text-slate-500">Faltam</span>
        </div>
      </div>
    </button>
  );
}
