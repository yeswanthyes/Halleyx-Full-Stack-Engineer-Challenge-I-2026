import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Eye, RefreshCw, XCircle, RotateCcw } from 'lucide-react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

export default function AuditLog() {
  const navigate = useNavigate();
  const [executions, setExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({});
  const [selected, setSelected] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getExecutions(page);
      setExecutions(data.data || []);
      setPagination(data.pagination || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this execution?')) return;
    await api.cancelExecution(id);
    load();
  };

  const handleRetry = async (id: string) => {
    await api.retryExecution(id);
    load();
    navigate(`/executions/${id}`);
  };

  const openDetail = async (exec: any) => {
    const detail = await api.getExecution(exec.id);
    setSelected(detail);
    setDetailOpen(true);
  };

  const statusCounts = {
    all: executions.length,
    completed: executions.filter(e => e.status === 'completed').length,
    in_progress: executions.filter(e => e.status === 'in_progress').length,
    failed: executions.filter(e => e.status === 'failed').length,
  };

  return (
    <>
      <div className="page-header">
        <ClipboardList size={18} />
        <span className="page-title">Audit Log</span>
        <button className="btn btn-ghost btn-icon" onClick={load}><RefreshCw size={16} /></button>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="grid-3" style={{ marginBottom: 20 }}>
          {[
            { label: 'Total Executions', value: pagination.total || executions.length, color: 'var(--accent-cyan)' },
            { label: 'In Progress', value: statusCounts.in_progress, color: 'var(--accent-blue)' },
            { label: 'Failed', value: statusCounts.failed, color: 'var(--accent-red)' },
          ].map(s => (
            <div className="glass-card stat-card" key={s.label}>
              <span className="stat-label">{s.label}</span>
              <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>

        <div className="glass-card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div className="empty-state"><div className="spinner" /></div>
          ) : executions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><ClipboardList size={24} /></div>
              <h3>No executions yet</h3>
              <p>Workflow executions will appear here for auditing and review.</p>
            </div>
          ) : (
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Execution ID</th>
                  <th>Workflow</th>
                  <th>Version</th>
                  <th>Status</th>
                  <th>Triggered By</th>
                  <th>Started</th>
                  <th>Duration</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {executions.map(exec => {
                  const start = exec.started_at ? new Date(exec.started_at) : null;
                  const end = exec.ended_at ? new Date(exec.ended_at) : null;
                  const duration = start && end
                    ? `${((end.getTime() - start.getTime()) / 1000).toFixed(1)}s`
                    : exec.status === 'in_progress' ? 'Running…' : '—';

                  return (
                    <tr key={exec.id}>
                      <td>
                        <code style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          {exec.id.slice(0, 8)}…
                        </code>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500 }}>
                          {exec.workflow?.name || 'Unknown'}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-purple">v{exec.workflow_version}</span>
                      </td>
                      <td><StatusBadge status={exec.status} /></td>
                      <td>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{exec.triggered_by || '—'}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: 12 }}>
                          {start ? start.toLocaleString() : '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {duration}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-ghost btn-icon" title="View Live" onClick={() => navigate(`/executions/${exec.id}`)}>
                            <Eye size={14} />
                          </button>
                          <button className="btn btn-ghost btn-icon" title="View Logs" onClick={() => openDetail(exec)} style={{ color: 'var(--accent-cyan)' }}>
                            <ClipboardList size={14} />
                          </button>
                          {exec.status === 'failed' && (
                            <button className="btn btn-ghost btn-icon" title="Retry" style={{ color: 'var(--accent-amber)' }} onClick={() => handleRetry(exec.id)}>
                              <RotateCcw size={14} />
                            </button>
                          )}
                          {['pending', 'in_progress'].includes(exec.status) && (
                            <button className="btn btn-ghost btn-icon" title="Cancel" style={{ color: 'var(--accent-red)' }} onClick={() => handleCancel(exec.id)}>
                              <XCircle size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between" style={{ padding: '12px 16px', borderTop: '1px solid var(--glass-border)' }}>
              <span className="text-sm text-secondary">Page {page} of {pagination.totalPages}</span>
              <div className="flex gap-2">
                <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                <button className="btn btn-secondary" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Log Detail Modal */}
      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title="Execution Logs" maxWidth={640}
        footer={<button className="btn btn-secondary" onClick={() => setDetailOpen(false)}>Close</button>}>
        {selected && (
          <div>
            <div className="flex gap-2 flex-wrap" style={{ marginBottom: 16 }}>
              <StatusBadge status={selected.status} />
              <span className="badge badge-purple">v{selected.workflow_version}</span>
              <span className="badge badge-neutral">{(selected.logs || []).length} steps logged</span>
            </div>
            {(selected.logs || []).length === 0 ? (
              <p className="text-secondary" style={{ fontSize: 13 }}>No log entries yet.</p>
            ) : (
              (selected.logs || []).map((log: any, i: number) => (
                <div key={i} className="log-entry">
                  <div className="log-step-name flex items-center gap-2">
                    <StatusBadge status={log.status === 'completed' ? 'completed' : 'failed'} />
                    <strong>{log.step_name}</strong>
                  </div>
                  {(log.evaluated_rules || []).map((r: any, j: number) => (
                    <div key={j} className="log-rule">
                      <span className={r.result ? 'log-result-pass' : 'log-result-fail'}>{r.result ? '✓' : '✗'}</span>
                      <code className="log-cond">{r.condition}</code>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
