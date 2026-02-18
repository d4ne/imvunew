import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      <Sidebar />
      <main className="flex-1 min-h-0 min-w-[280px] overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
