import PageHeader from '../components/PageHeader';

export default function RoomHistory() {
  return (
    <div style={{ padding: 'var(--page-padding)' }} className="w-full">
      <PageHeader breadcrumbs={['Features']} title="Room History" subtitle="View all sessions in a specific room" />
      <div className="content-card">
        <p>Select a room to view its history.</p>
      </div>
    </div>
  );
}
