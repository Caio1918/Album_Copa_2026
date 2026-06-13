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
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-700">Grupo</p>
          <h3 className="mt-1 text-xl font-bold text-slate-950">{group.name}</h3>
        </div>
        <strong className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">{percentage}%</strong>
      </div>

      <div className="mt-5">
        <ProgressBar value={percentage} />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm">
        <div className="rounded-xl bg-slate-50 p-3">
          <strong className="block text-slate-950">{total}</strong>
          <span className="text-slate-500">Total</span>
        </div>
        <div className="rounded-xl bg-green-50 p-3">
          <strong className="block text-green-700">{pasted}</strong>
          <span className="text-slate-500">Coladas</span>
        </div>
        <div className="rounded-xl bg-red-50 p-3">
          <strong className="block text-red-700">{missing}</strong>
          <span className="text-slate-500">Faltam</span>
        </div>
      </div>
    </button>
  );
}
