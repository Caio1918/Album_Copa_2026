type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
};

export function StatCard({ title, value, description }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <strong className="mt-2 block text-3xl font-bold text-slate-950">{value}</strong>
      {description ? <p className="mt-2 text-sm text-slate-500">{description}</p> : null}
    </article>
  );
}
