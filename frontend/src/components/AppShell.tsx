import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { BookOpen, LayoutDashboard, Repeat2 } from 'lucide-react';

type PageKey = 'dashboard' | 'album' | 'repetidas';

type AppShellProps = {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  children: ReactNode;
};

const menuItems: Array<{ key: PageKey; label: string; icon: LucideIcon }> = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'album', label: 'Álbum', icon: BookOpen },
  { key: 'repetidas', label: 'Repetidas', icon: Repeat2 },
];

export function AppShell({ activePage, onNavigate, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:inset-x-auto lg:top-0 lg:bottom-0 lg:w-72 lg:border-t-0 lg:border-r lg:shadow-none">
        <div className="lg:flex lg:min-h-screen lg:flex-col lg:gap-8 lg:p-6">
          <div className="hidden lg:block">
            <strong className="block text-xl text-slate-950">Meu Álbum 2026</strong>
            <span className="text-sm text-slate-500">Controle de figurinhas</span>
          </div>

          <nav className="grid grid-cols-3 gap-2 p-2 lg:flex lg:w-full lg:flex-col lg:p-0">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const selected = activePage === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onNavigate(item.key)}
                  className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-xs font-bold transition lg:min-h-0 lg:w-full lg:flex-row lg:justify-start lg:gap-3 lg:px-4 lg:py-3 lg:text-left lg:text-sm ${
                    selected
                      ? 'bg-blue-700 text-white shadow-sm shadow-blue-700/25'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950'
                  }`}
                  aria-current={selected ? 'page' : undefined}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.4} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      <main className="px-4 pb-28 pt-6 md:px-8 lg:ml-72 lg:px-10 lg:pb-10 lg:pt-10">
        <div className="mx-auto max-w-7xl space-y-8">{children}</div>
      </main>
    </div>
  );
}
