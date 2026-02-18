import PageHeader from '../components/PageHeader';

export default function Booter() {
  return (
    <div style={{ padding: 'var(--page-padding)' }} className="w-full">
      <PageHeader
        breadcrumbs={['Features']}
        title="Booter"
        subtitle="Booter utilities"
      />
      <div className="content-card">
        <p>Booter tools and utilities will appear here.</p>
      </div>
    </div>
  );
}
