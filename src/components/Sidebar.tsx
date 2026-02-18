import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navIcons = {
  layout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  folder: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  message: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  link: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  zap: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  image: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  userPlus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
};

const nav = [
  {
    section: 'Overview',
    links: [
      { to: '/dashboard', label: 'Dashboard', icon: 'layout' as const },
    ],
  },
  {
    section: 'Features',
    links: [
      { to: '/image-logger', label: 'Image Logger', icon: 'image' as const },
      { to: '/booter', label: 'Booter', icon: 'zap' as const },
      { to: '/user-lookup', label: 'User lookup', icon: 'userPlus' as const },
    ],
  },
  {
    section: 'Support',
    links: [
      { to: '/faq', label: 'FAQ', icon: 'book' as const },
    ],
  },
];

const adminNav = [
  { to: '/admin/blacklist', label: 'Blacklist', icon: 'list' as const },
  { to: '/admin/features', label: 'Features', icon: 'shield' as const },
  { to: '/admin/room-scanner', label: 'Room Scanner', icon: 'search' as const },
  { to: '/admin/imvu-accounts', label: 'IMVU Accounts', icon: 'link' as const },
  { to: '/admin/faq', label: 'FAQ', icon: 'book' as const },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar w-[var(--sidebar-width)] shrink-0 flex flex-col h-screen overflow-hidden">
      <div className="sidebar-brand">
        <Link to="/dashboard" className="sidebar-logo">
          <span className="sidebar-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
            </svg>
          </span>
          <span className="sidebar-logo-text">Xanoty</span>
        </Link>
      </div>

      <nav className="sidebar-nav flex-1 min-h-0 overflow-hidden">
        {nav.map(({ section, links }) => (
          <div key={section} className="sidebar-nav-block">
            <p className="sidebar-nav-section">{section}</p>
            <ul className="sidebar-nav-list">
              {links.map(({ to, label, icon }) => (
                <li key={label}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      `sidebar-nav-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <span className="sidebar-nav-icon">{navIcons[icon]}</span>
                    <span className="sidebar-nav-label">{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {Boolean(user?.isAdmin) && (
          <div className="sidebar-nav-block sidebar-nav-block-admin">
            <p className="sidebar-nav-section">Admin</p>
            <ul className="sidebar-nav-list">
              {adminNav.map(({ to, label, icon }) => (
                <li key={label}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      `sidebar-nav-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <span className="sidebar-nav-icon">{navIcons[icon]}</span>
                    <span className="sidebar-nav-label">{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-avatar" aria-hidden>
          {(user?.username ?? 'G').slice(0, 2).toUpperCase()}
        </div>
        <div className="sidebar-footer-user">
          <span className="sidebar-footer-name" title={user?.username ?? undefined}>
            {user?.username ?? 'Guest'}
          </span>
          <span className={`sidebar-footer-badge ${user?.isAdmin ? 'sidebar-footer-badge-admin' : ''}`}>
            {user?.isAdmin ? 'Admin' : 'User'}
          </span>
        </div>
        <button
          type="button"
          onClick={logout}
          className="sidebar-footer-logout"
          title="Log out"
          aria-label="Log out"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
