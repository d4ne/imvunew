import PageHeader from '../components/PageHeader';

export default function ImageLogger() {
  return (
    <div style={{ padding: 'var(--page-padding)' }} className="w-full">
      <PageHeader
        breadcrumbs={['Features']}
        title="Image Logger"
        subtitle="Log and manage images"
      />
      <div className="content-card">
        <p>Image logger tools will appear here.</p>
      </div>
    </div>
  );
}
