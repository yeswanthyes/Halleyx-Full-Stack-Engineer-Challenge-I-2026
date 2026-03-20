type StatusType = 'pending' | 'in_progress' | 'completed' | 'failed' | 'canceled' | 'active' | 'inactive' | 'task' | 'approval' | 'notification';

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  pending:      { label: 'Pending', className: 'badge badge-amber' },
  in_progress:  { label: 'Running', className: 'badge badge-blue' },
  completed:    { label: 'Completed', className: 'badge badge-cyan' },
  failed:       { label: 'Failed', className: 'badge badge-red' },
  canceled:     { label: 'Canceled', className: 'badge badge-neutral' },
  active:       { label: 'Active', className: 'badge badge-cyan' },
  inactive:     { label: 'Inactive', className: 'badge badge-neutral' },
  task:         { label: 'Task', className: 'badge badge-blue' },
  approval:     { label: 'Approval', className: 'badge badge-amber' },
  notification: { label: 'Notification', className: 'badge badge-purple' },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as StatusType] ?? { label: status, className: 'badge badge-neutral' };
  return <span className={config.className}>{config.label}</span>;
}
