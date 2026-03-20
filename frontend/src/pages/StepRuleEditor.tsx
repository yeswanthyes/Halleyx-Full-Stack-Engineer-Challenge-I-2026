import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit2, GripVertical, CheckCircle } from 'lucide-react';
import { api } from '../api/client';
import Modal from '../components/Modal';

export default function StepRuleEditor() {
  const { stepId } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [allSteps, setAllSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ruleOpen, setRuleOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [ruleForm, setRuleForm] = useState({ condition: '', next_step_id: '', priority: 1 });
  const [conditionValid, setConditionValid] = useState(true);

  const load = useCallback(async () => {
    if (!stepId) return;
    setLoading(true);
    try {
      const [rulesData, stepsData] = await Promise.all([
        api.getRules(stepId),
        // We need all steps for the "next step" dropdown. We'll get rules first to get the workflow_id.
        api.getRules(stepId),
      ]);
      setRules(rulesData);

      // Get workflow info to load all steps
      if (rulesData.length > 0) {
        // get via step info from rule
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [stepId]);

  // We can't easily get all steps without knowing workflow_id here.
  // Workaround: store workflowId in params or fetch via an extra call
  useEffect(() => {
    const init = async () => {
      if (!stepId) return;
      setLoading(true);
      try {
        const rulesData = await api.getRules(stepId);
        setRules(rulesData);
        // Load step info and siblings by guessing from first rule's metadata
        // The cleanest way here is to fetch step directly from steps endpoint — but we don't have it exposed.
        // As a workaround, we'll set step using the available data
        setStep({ id: stepId, name: stepId });
        // Try to get workflow ID from URL param ancestry — using navigation state
        const savedWorkflowId = sessionStorage.getItem('current_workflow_id');
        if (savedWorkflowId) {
          const wf = await api.getWorkflow(savedWorkflowId);
          setAllSteps(wf.steps || []);
          const currentStep = (wf.steps || []).find((s: any) => s.id === stepId);
          if (currentStep) setStep(currentStep);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [stepId]);

  const openCreate = () => {
    setEditingRule(null);
    setRuleForm({ condition: '', next_step_id: '', priority: rules.length + 1 });
    setConditionValid(true);
    setRuleOpen(true);
  };

  const openEdit = (rule: any) => {
    setEditingRule(rule);
    setRuleForm({ condition: rule.condition, next_step_id: rule.next_step_id || '', priority: rule.priority });
    setConditionValid(true);
    setRuleOpen(true);
  };

  const validateCondition = (val: string) => {
    // Basic client-side validation — just check for obvious issues
    const keywords = ['DEFAULT', 'contains(', 'startsWith(', 'endsWith('];
    const ops = ['==', '!=', '>', '<', '>=', '<=', '&&', '||'];
    const isDefault = val.trim() === 'DEFAULT';
    const hasOp = ops.some(op => val.includes(op));
    const hasFn = keywords.some(k => val.includes(k));
    return isDefault || hasOp || hasFn;
  };

  const handleSaveRule = async () => {
    if (!validateCondition(ruleForm.condition)) {
      setConditionValid(false);
      return;
    }
    const body = {
      condition: ruleForm.condition,
      next_step_id: ruleForm.next_step_id || null,
      priority: Number(ruleForm.priority),
    };
    try {
      if (editingRule) {
        await api.updateRule(editingRule.id, body);
      } else {
        await api.createRule(stepId!, body);
      }
      setRuleOpen(false);
      const updated = await api.getRules(stepId!);
      setRules(updated);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Delete this rule?')) return;
    await api.deleteRule(ruleId);
    const updated = await api.getRules(stepId!);
    setRules(updated);
  };

  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

  return (
    <>
      <div className="page-header">
        <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
        <span className="page-title">Rules — {step?.name || 'Step'}</span>
        <span className="badge badge-neutral">{rules.length} rule{rules.length !== 1 ? 's' : ''}</span>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={14} /> Add Rule</button>
        </div>
      </div>

      <div className="page-body">
        {/* Rule Engine syntax help */}
        <div className="glass-card" style={{ padding: 16, marginBottom: 20, background: 'var(--accent-cyan-dim)', borderColor: 'var(--glass-border-accent)' }}>
          <p style={{ fontSize: 12, color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: 6 }}>📝 CONDITION SYNTAX</p>
          <div className="flex gap-4" style={{ fontSize: 11, color: 'var(--text-secondary)', flexWrap: 'wrap', fontFamily: 'monospace' }}>
            <span>amount &gt; 100</span>
            <span>country == "US"</span>
            <span>priority != "Low"</span>
            <span>amount &gt; 100 &amp;&amp; country == "US"</span>
            <span>contains(department, "Finance")</span>
            <span>DEFAULT</span>
          </div>
        </div>

        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontWeight: 600 }}>Conditional Rules</h3>
            <p className="text-secondary" style={{ fontSize: 12, marginTop: 4 }}>
              Rules are evaluated in priority order (lowest number first). The first match wins and routes to the next step.
            </p>
          </div>
          {loading ? (
            <div className="empty-state"><div className="spinner" /></div>
          ) : sortedRules.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><CheckCircle size={22} /></div>
              <h3>No rules yet</h3>
              <p>Add rules with conditions to control where the workflow goes after this step.</p>
              <button className="btn btn-primary" onClick={openCreate}><Plus size={14} /> Add Rule</button>
            </div>
          ) : (
            <table className="glass-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>Priority</th>
                  <th>Condition</th>
                  <th>Next Step</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedRules.map(rule => (
                  <tr key={rule.id}>
                    <td><GripVertical size={15} style={{ color: 'var(--text-muted)' }} /></td>
                    <td>
                      <span className="badge badge-amber">P{rule.priority}</span>
                    </td>
                    <td>
                      <code style={{ fontSize: 12, color: rule.condition === 'DEFAULT' ? 'var(--accent-cyan)' : 'var(--text-primary)', background: 'var(--glass-bg-active)', padding: '3px 8px', borderRadius: 4 }}>
                        {rule.condition}
                      </code>
                    </td>
                    <td>
                      {rule.next_step_id ? (
                        <span style={{ fontSize: 12 }}>
                          {allSteps.find((s: any) => s.id === rule.next_step_id)?.name || rule.next_step_id.slice(0, 8) + '…'}
                        </span>
                      ) : (
                        <span className="badge badge-neutral">End workflow</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost btn-icon" onClick={() => openEdit(rule)}><Edit2 size={14} /></button>
                        <button className="btn btn-ghost btn-icon" style={{ color: 'var(--accent-red)' }} onClick={() => handleDelete(rule.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        open={ruleOpen}
        onClose={() => setRuleOpen(false)}
        title={editingRule ? 'Edit Rule' : 'Add Rule'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setRuleOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveRule}>Save Rule</button>
          </>
        }
      >
        <div className="input-group" style={{ marginBottom: 12 }}>
          <label>Priority (lower = evaluated first)</label>
          <input type="number" className="input-field" min={1} value={ruleForm.priority}
            onChange={e => setRuleForm({ ...ruleForm, priority: Number(e.target.value) })} />
        </div>
        <div className="input-group" style={{ marginBottom: 12 }}>
          <label>Condition *</label>
          <input
            className="input-field"
            placeholder='amount > 100 && country == "US"'
            value={ruleForm.condition}
            style={{ borderColor: !conditionValid ? 'var(--accent-red)' : undefined }}
            onChange={e => { setRuleForm({ ...ruleForm, condition: e.target.value }); setConditionValid(true); }}
          />
          {!conditionValid && <p style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 4 }}>Invalid syntax. Use: field == "value", DEFAULT, or contains(field, "text")</p>}
        </div>
        <div className="input-group">
          <label>Next Step (leave empty to end workflow)</label>
          <select className="input-field" value={ruleForm.next_step_id}
            onChange={e => setRuleForm({ ...ruleForm, next_step_id: e.target.value })}>
            <option value="">— End workflow —</option>
            {allSteps.filter((s: any) => s.id !== stepId).map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </Modal>
    </>
  );
}
