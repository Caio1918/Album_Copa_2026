import { useState } from 'react';
import { AppShell } from './components/AppShell';
import { Album } from './pages/Album';
import { Dashboard } from './pages/Dashboard';
import { Repetidas } from './pages/Repetidas';

type PageKey = 'dashboard' | 'album' | 'repetidas';

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>('dashboard');

  return (
    <AppShell activePage={activePage} onNavigate={setActivePage}>
      {activePage === 'dashboard' ? <Dashboard /> : null}
      {activePage === 'album' ? <Album /> : null}
      {activePage === 'repetidas' ? <Repetidas /> : null}
    </AppShell>
  );
}
