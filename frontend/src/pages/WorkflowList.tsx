import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Play, Network, RefreshCw, Layers } from 'lucide-react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

export default function WorkflowList() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [executing, setExecuting] = useState<string | null>(null);

  // Create Workflow Form
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getWorkflows(page, search);
      setWorkflows(data.data || []);
      setPagination(data.pagination || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const wf = await api.createWorkflow({ name: newName.trim(), input_schema: {} });
      setCreateOpen(false);
      setNewName('');
      navigate(`/workflows/${wf.id}/edit`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete workflow "${name}"? This will deactivate it.`)) return;
    await api.deleteWorkflow(id);
    load();
  };

  const handleExecute = async (wf: any) => {
    setExecuting(wf.id);
    try {
      // Build a minimal input from the schema
      const inputData: any = {};
      for (const [key, def] of Object.entries<any>(wf.input_schema || {})) {
        inputData[key] = def.type === 'number' ? 0 : '';
      }
      const exec = await api.startExecution(wf.id, { data: inputData, triggered_by: 'ui-user' });
      navigate(`/executions/${exec.id}`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setExecuting(null);
    }
  };

  const stats = {
    total: pagination.total || workflows.length,
    active: workflows.filter(w => w.is_active).length,
  };

  return (
    <>
      <div className="page-header">
        <Network size={18} />
        <span className="page-title">Workflows</span>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={15} />
          New Workflow
        </button>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="grid-3" style={{ marginBottom: 24 }}>
          {[
            { label: 'Total Workflows', value: stats.total, icon: <Network size={18} />, color: 'var(--accent-cyan)' },
            { label: 'Active', value: stats.active, icon: <Layers size={18} />, color: 'var(--accent-amber)' },
            { label: 'This Page', value: workflows.length, icon: <Layers size={18} />, color: 'var(--accent-purple)' },
          ].map(s => (
            <div className="glass-card stat-card" key={s.label}>
              <div className="flex items-center justify-between">
                <span className="stat-label">{s.label}</span>
                <div className="stat-icon" style={{ background: s.color + '22', color: s.color }}>{s.icon}</div>
              </div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Search + Table */}
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div className="flex items-center gap-3" style={{ padding: '16px 16px 0' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="input-field"
                style={{ paddingLeft: 36 }}
                placeholder="Search workflows…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <button className="btn btn-ghost btn-icon" onClick={load} title="Refresh">
              <RefreshCw size={16} />
            </button>
          </div>

          <div style={{ padding: '0 0 0 0', marginTop: 12 }}>
            {loading ? (
              <div className="empty-state"><div className="spinner" /></div>
            ) : workflows.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Network size={24} /></div>
                <h3>No workflows yet</h3>
                <p>Create your first workflow to get started with process automation.</p>
                <button className="btn btn-primary" onClick={() => setCreateOpen(true)}><Plus size={14} /> New Workflow</button>
              </div>
            ) : (
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Steps</th>
                    <th>Version</th>
                    <th>Status</th>
                    <th>Start Step</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workflows.map(wf => (
                    <tr key={wf.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{wf.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {Object.keys(wf.input_schema || {}).length} input fields
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-neutral">{wf.steps?.length ?? 0} steps</span>
                      </td>
                      <td>
                        <span className="badge badge-purple">v{wf.version}</span>
                      </td>
                      <td>
                        <StatusBadge status={wf.is_active ? 'active' : 'inactive'} />
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {wf.start_step_id ? wf.start_step_id.slice(0, 8) + '…' : 'Not set'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            className="btn btn-ghost btn-icon"
                            title="Edit"
                            onClick={() => navigate(`/workflows/${wf.id}/edit`)}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon"
                            title="Execute"
                            onClick={() => handleExecute(wf)}
                            disabled={!wf.start_step_id || executing === wf.id}
                            style={{ color: 'var(--accent-cyan)' }}
                          >
                            {executing === wf.id ? <div className="spinner" style={{ width: 15, height: 15 }} /> : <Play size={15} />}
                          </button>
                          <button
                            className="btn btn-ghost btn-icon"
                            title="Delete"
                            style={{ color: 'var(--accent-red)' }}
                            onClick={() => handleDelete(wf.id, wf.name)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

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

      {/* Create Workflow Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create New Workflow"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating ? <div className="spinner" /> : null} Create
            </button>
          </>
        }
      >
        <div className="input-group">
          <label>Workflow Name</label>
          <input
            className="input-field"
            placeholder="e.g. Expense Approval"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
        </div>
        <p className="text-secondary" style={{ marginTop: 12, fontSize: 13 }}>
          You'll be able to add steps, rules, and an input schema in the editor.
        </p>
      </Modal>
    </>
  );
}
