import PageHeader from '../components/PageHeader';

export default function ChatLogs() {
  return (
    <div style={{ padding: 'var(--page-padding)' }} className="w-full">
      <PageHeader
        breadcrumbs={['Features']}
        title="Chat Logs"
        subtitle="View chat history and logs"
      />
      <div className="content-card">
        <p>Chat logs will appear here. Select a room or user to view chat history.</p>
      </div>
    </div>
  );
}
