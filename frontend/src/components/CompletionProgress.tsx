import { ProgressBar } from './ProgressBar';

type CompletionProgressProps = {
  title: string;
  total: number;
  pasted: number;
  missing: number;
  percentage: number;
  label?: string;
};

export function CompletionProgress({ title, total, pasted, missing, percentage, label = 'Progresso' }: CompletionProgressProps) {
  const safePercentage = Math.min(Math.max(percentage, 0), 100);
  const missingPercentage = total > 0 ? Math.max(100 - safePercentage, 0) : 0;

  return (
    <div className="rounded-3xl border border-blue-100 bg-white p-4 shadow-sm md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-blue-700">{label}</p>
          <h3 className="mt-1 text-xl font-black text-slate-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">
            Faltam <strong className="text-red-700">{missingPercentage}%</strong> para completar.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs md:min-w-80">
          <div className="rounded-2xl bg-slate-50 p-3">
            <strong className="block text-base text-slate-950">{total}</strong>
            <span className="text-slate-500">Total</span>
          </div>
          <div className="rounded-2xl bg-green-50 p-3">
            <strong className="block text-base text-green-700">{pasted}</strong>
            <span className="text-slate-500">Coladas</span>
          </div>
          <div className="rounded-2xl bg-red-50 p-3">
            <strong className="block text-base text-red-700">{missing}</strong>
            <span className="text-slate-500">Faltam</span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <ProgressBar value={safePercentage} label={`${safePercentage}% completo`} />
      </div>
    </div>
  );
}
