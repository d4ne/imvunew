import { Link } from 'react-router-dom';

interface PageHeaderProps {
  breadcrumbs: string[];
  title: string;
  subtitle?: string;
}

export default function PageHeader({ breadcrumbs, title, subtitle }: PageHeaderProps) {
  return (
    <header className="page-header">
      {breadcrumbs.length > 0 && (
        <p className="page-header-breadcrumb">
          {breadcrumbs.map((b, i) => (
            <span key={b}>
              {i > 0 && ' / '}
              <Link to="#" className="hover:text-[var(--text-secondary)] transition-colors">{b}</Link>
            </span>
          ))}
        </p>
      )}
      <h1 className="page-header-title">{title}</h1>
      {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
    </header>
  );
}
