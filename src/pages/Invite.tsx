import PageHeader from '../components/PageHeader';

export default function Invite() {
  return (
    <div className="page w-full">
      <PageHeader
        breadcrumbs={['Access']}
        title="Invite"
        subtitle="Invite and access management"
      />
      <div className="content-card">
        <p>Invite and access management will appear here.</p>
      </div>
    </div>
  );
}
