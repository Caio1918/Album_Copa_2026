import type { ReactNode } from 'react';
type PageHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Meu Álbum 2026</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">{title}</h1>
        <p className="mt-2 max-w-3xl text-slate-600">{description}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </header>
  );
}
