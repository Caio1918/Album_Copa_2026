type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
};

export function StatCard({ title, value, description }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-blue-700 md:text-sm md:normal-case md:tracking-normal md:text-slate-500">
        {title}
      </p>
      <strong className="mt-2 block text-2xl font-black text-slate-950 md:text-3xl">{value}</strong>
      {description ? <p className="mt-2 text-xs text-slate-500 md:text-sm">{description}</p> : null}
    </article>
  );
}
