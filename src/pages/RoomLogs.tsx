import PageHeader from '../components/PageHeader';

export default function RoomLogs() {
  return (
    <div className="page w-full">
      <PageHeader
        breadcrumbs={['Features']}
        title="Room Logs"
        subtitle="View room activity and logs"
      />
      <div className="content-card">
        <p>Room logs and activity will appear here. Select a room or time range to view logs.</p>
      </div>
    </div>
  );
}
