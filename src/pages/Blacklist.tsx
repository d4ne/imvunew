import PageHeader from '../components/PageHeader';

export default function Blacklist() {
  return (
    <div style={{ padding: 'var(--page-padding)' }} className="w-full">
      <PageHeader
        breadcrumbs={['Overview']}
        title="Blacklist"
        subtitle="People who cannot be looked up"
      />
      <div className="content-card">
        <p>Add users to the blacklist to prevent lookups. Blacklisted users will not appear in profile or room searches.</p>
      </div>
    </div>
  );
}
