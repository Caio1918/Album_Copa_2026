import type { ReactNode } from 'react';
type PageKey = 'dashboard' | 'album' | 'repetidas';

type AppShellProps = {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  children: ReactNode;
};

const menuItems: Array<{ key: PageKey; label: string }> = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'album', label: 'Álbum' },
  { key: 'repetidas', label: 'Repetidas' },
];

export function AppShell({ activePage, onNavigate, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-x-0 top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur lg:inset-x-auto lg:bottom-0 lg:w-72 lg:border-b-0 lg:border-r">
        <div className="flex h-20 items-center justify-between px-5 lg:h-auto lg:flex-col lg:items-start lg:gap-8 lg:p-6">
          <div>
            <strong className="block text-xl text-slate-950">Meu Álbum 2026</strong>
            <span className="text-sm text-slate-500">Controle de figurinhas</span>
          </div>

          <nav className="flex gap-2 lg:w-full lg:flex-col">
            {menuItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onNavigate(item.key)}
                className={`rounded-xl px-4 py-3 text-sm font-bold transition lg:w-full lg:text-left ${
                  activePage === item.key
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <main className="px-4 pb-10 pt-28 md:px-8 lg:ml-72 lg:px-10 lg:pt-10">
        <div className="mx-auto max-w-7xl space-y-8">{children}</div>
      </main>
    </div>
  );
}
