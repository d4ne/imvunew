import PageHeader from '../components/PageHeader';

export default function Docs() {
  return (
    <div style={{ padding: 'var(--page-padding)' }} className="w-full">
      <PageHeader breadcrumbs={['Support']} title="Docs" subtitle="Documentation and API reference" />
      <div className="content-card">
        <p>Documentation and API reference.</p>
      </div>
    </div>
  );
}
