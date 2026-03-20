import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, CheckCircle, XCircle, Clock, ChevronDown, ChevronRight, User } from 'lucide-react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';

export default function ExecuteWorkflow() {
  const { executionId } = useParams();
  const navigate = useNavigate();

  const [execution, setExecution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logsExpanded, setLogsExpanded] = useState(true);
  const [approvingStep, setApprovingStep] = useState(false);
  const [toast, setToast] = useState<{message: string; visible: boolean} | null>(null);
  const pollRef = useRef<any>(null);
  const previousLogsLength = useRef(0);
  const initialLoad = useRef(true);

  const load = useCallback(async () => {
    if (!executionId) return;
    try {
      const data = await api.getExecution(executionId);
      
      const newLogsLength = data.logs?.length || 0;
      if (!initialLoad.current) {
        if (newLogsLength > previousLogsLength.current) {
           for (let i = previousLogsLength.current; i < newLogsLength; i++) {
             const log = data.logs[i];
             if (log.step_type === 'notification') {
                setToast({ message: `Notification Sent: ${log.step_name}`, visible: true });
                setTimeout(() => setToast(null), 4000);
             }
           }
        }
      } else {
        initialLoad.current = false;
      }
      previousLogsLength.current = newLogsLength;

      setExecution(data);
      // Stop polling when terminal state
      if (['completed', 'failed', 'canceled'].includes(data.status)) {
        clearInterval(pollRef.current);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [executionId]);

  useEffect(() => {
    load();
    // Poll every 1.5s while active
    pollRef.current = setInterval(load, 1500);
    return () => clearInterval(pollRef.current);
  }, [load]);

  const handleApprove = async (approve: boolean) => {
    if (!execution?.current_step_id) return;
    setApprovingStep(true);
    try {
      await api.approveStep(executionId!, execution.current_step_id, { approved: approve, decision_by: 'ui-user' });
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setApprovingStep(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this execution?')) return;
    await api.cancelExecution(executionId!);
    await load();
  };

  const handleRetry = async () => {
    await api.retryExecution(executionId!);
    await load();
  };

  if (loading) return (
    <><div className="page-header"><div className="spinner" /></div><div className="page-body"><div className="empty-state"><div className="spinner" /></div></div></>
  );
  if (!execution) return <div className="page-body"><p>Execution not found.</p></div>;

  const workflow = execution.workflow;
  const logs: any[] = execution.logs || [];
  const isActive = ['pending', 'in_progress'].includes(execution.status);

  // Find current step using logs and step data
  const completedStepIds = new Set(logs.map((l: any) => l.step_id));
  const currentStepId = execution.current_step_id;
  const loggedSteps = logs.length;

  // Use the current_step object returned directly from the API
  const currentStep = execution.current_step || null;
  const wfSteps: any[] = execution.workflow?.steps || [];

  return (
    <>
      <div className="page-header">
        <button className="btn btn-ghost btn-icon" onClick={() => navigate('/audit')}><ArrowLeft size={18} /></button>
        <div style={{ flex: 1 }}>
          <div className="flex items-center gap-2">
            <span className="page-title">Execution</span>
            <StatusBadge status={execution.status} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {execution.id} · {workflow?.name || 'Unknown Workflow'} v{execution.workflow_version}
          </div>
        </div>
        <div className="flex gap-2">
          {execution.status === 'failed' && (
            <button className="btn btn-secondary" onClick={handleRetry}>Retry</button>
          )}
          {isActive && (
            <button className="btn btn-danger" onClick={handleCancel}>Cancel</button>
          )}
        </div>
      </div>

      <div className="page-body">
        <div className="grid-2" style={{ marginBottom: 20 }}>
          {/* Execution Info */}
          <div className="glass-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 14 }}>EXECUTION DETAILS</h3>
            {[
              { label: 'Triggered By', value: execution.triggered_by || 'system' },
              { label: 'Started At', value: execution.started_at ? new Date(execution.started_at).toLocaleString() : '—' },
              { label: 'Ended At', value: execution.ended_at ? new Date(execution.ended_at).toLocaleString() : isActive ? 'Running…' : '—' },
              { label: 'Retries', value: execution.retries ?? 0 },
              { label: 'Steps Completed', value: loggedSteps },
            ].map(item => (
              <div key={item.label} className="flex justify-between" style={{ marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                <span style={{ fontWeight: 500 }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Input Data */}
          <div className="glass-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 14 }}>INPUT DATA</h3>
            {Object.entries(execution.data || {}).filter(([k]) => !k.startsWith('approval_')).map(([k, v]: any) => (
              <div key={k} className="flex justify-between" style={{ marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: 12 }}>{k}</span>
                <code style={{ background: 'var(--glass-bg-active)', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                  {JSON.stringify(v)}
                </code>
              </div>
            ))}
            {Object.keys(execution.data || {}).filter(k => !k.startsWith('approval_')).length === 0 && (
              <p className="text-muted" style={{ fontSize: 13 }}>No input data</p>
            )}
          </div>
        </div>

        {/* Approval action */}
        {isActive && currentStep?.step_type === 'approval' && (
          <div className="glass-card" style={{ padding: 20, marginBottom: 20, borderColor: 'var(--accent-amber)', background: 'var(--accent-amber-soft)' }}>
            <div className="flex items-center gap-3">
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-amber-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={18} style={{ color: 'var(--accent-amber)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--accent-amber)' }}>Approval Required — {currentStep.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  This step requires manual approval before the workflow can continue.
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-danger" disabled={approvingStep} onClick={() => handleApprove(false)}>
                  <XCircle size={14} /> Reject
                </button>
                <button className="btn btn-primary" disabled={approvingStep} onClick={() => handleApprove(true)}>
                  <CheckCircle size={14} /> Approve
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Execution Log */}
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <button
            className="flex items-center justify-between w-full"
            style={{ padding: '14px 20px', borderBottom: logsExpanded ? '1px solid var(--glass-border)' : 'none', background: 'transparent', cursor: 'pointer' }}
            onClick={() => setLogsExpanded(!logsExpanded)}
          >
            <span style={{ fontWeight: 600 }}>
              Execution Log
              <span className="badge badge-neutral" style={{ marginLeft: 8 }}>{logs.length} steps</span>
              {isActive && <span style={{ fontSize: 11, marginLeft: 8, color: 'var(--accent-cyan)', animation: 'pulse 1.5s infinite' }}>● LIVE</span>}
            </span>
            {logsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {logsExpanded && (
            <div style={{ padding: 16 }}>
              {logs.length === 0 && isActive && (
                <div className="flex items-center gap-8" style={{ padding: '12px 0', color: 'var(--text-secondary)', fontSize: 13 }}>
                  <div className="spinner" style={{ width: 14, height: 14 }} />
                  Engine is processing…
                </div>
              )}
              {logs.map((log: any, i: number) => (
                <div key={i} className="log-entry">
                  <div className="flex items-center gap-2 log-step-name">
                    <StatusBadge status={log.status === 'completed' ? 'completed' : 'failed'} />
                    {log.step_name}
                    {log.step_type && <span className="badge badge-neutral" style={{ fontSize: 10 }}>{log.step_type}</span>}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      {log.started_at ? new Date(log.started_at).toLocaleTimeString() : ''}
                    </span>
                  </div>
                  {(log.evaluated_rules || []).map((r: any, j: number) => (
                    <div key={j} className="log-rule">
                      <span className={r.result ? 'log-result-pass' : 'log-result-fail'}>{r.result ? '✓' : '✗'}</span>
                      <code className="log-cond">{r.condition}</code>
                    </div>
                  ))}
                  {log.selected_next_step_id && (
                    <div style={{ fontSize: 11, color: 'var(--accent-cyan)', marginTop: 6 }}>
                      → Routing to: {wfSteps.find((s: any) => s.id === log.selected_next_step_id)?.name || log.selected_next_step_id.slice(0, 8)}
                    </div>
                  )}
                  {log.error_message && (
                    <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 6 }}>
                      Error: {log.error_message}
                    </div>
                  )}
                </div>
              ))}
              {execution.status === 'completed' && (
                <div className="log-entry" style={{ borderColor: 'var(--accent-cyan)', background: 'var(--accent-cyan-dim)', marginTop: 8 }}>
                  <div className="flex items-center gap-2" style={{ color: 'var(--accent-cyan)', fontWeight: 600, fontSize: 13 }}>
                    <CheckCircle size={15} /> Workflow completed successfully
                  </div>
                </div>
              )}
              {execution.status === 'failed' && (
                <div className="log-entry" style={{ borderColor: 'var(--accent-red)', background: 'var(--accent-red-soft)', marginTop: 8 }}>
                  <div className="flex items-center gap-2" style={{ color: 'var(--accent-red)', fontWeight: 600, fontSize: 13 }}>
                    <XCircle size={15} /> Workflow failed
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Live Toast Notification */}
      {toast && toast.visible && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: 'var(--glass-bg)', backdropFilter: 'blur(16px)',
          border: '1px solid var(--accent-blue)', padding: '16px 20px',
          borderRadius: 8, color: 'var(--text-primary)', fontWeight: 500,
          boxShadow: '0 8px 32px rgba(84, 132, 232, 0.2)',
          animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <div className="flex items-center gap-3">
             <div className="flex items-center justify-center" style={{ width: 28, height: 28, background: 'var(--accent-blue-soft)', color: 'var(--accent-blue)', borderRadius: '50%' }}>
               🔔
             </div>
             {toast.message}
          </div>
        </div>
      )}
    </>
  );
}
