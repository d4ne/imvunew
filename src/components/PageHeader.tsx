import { Link } from 'react-router-dom';

const VERSION = import.meta.env.VITE_APP_VERSION ?? '1.0.0';

interface PageHeaderProps {
  breadcrumbs: string[];
  title: string;
  subtitle?: string;
}

export default function PageHeader({ breadcrumbs, title, subtitle }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header-main">
        {breadcrumbs.length > 0 && (
          <nav className="page-header-breadcrumb" aria-label="Breadcrumb">
            {breadcrumbs.map((b, i) => (
              <span key={b} className="page-header-breadcrumb-item">
                {i > 0 && <span className="page-header-breadcrumb-sep" aria-hidden>/</span>}
                <Link to="/dashboard" className="page-header-breadcrumb-link">{b}</Link>
              </span>
            ))}
          </nav>
        )}
        <h1 className="page-header-title">{title}</h1>
        {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
      </div>
      <span className="page-header-version" title="App version">
        <span className="page-header-version-label">v{VERSION}</span>
      </span>
    </header>
  );
}
