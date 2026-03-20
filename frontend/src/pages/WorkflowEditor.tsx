import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Settings, Save, ChevronRight, GripVertical } from 'lucide-react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

export default function WorkflowEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [workflow, setWorkflow] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingStep, setSavingStep] = useState(false);

  // Editable fields
  const [name, setName] = useState('');
  const [schema, setSchema] = useState<any[]>([]);

  // Step modal
  const [stepOpen, setStepOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<any>(null);
  const [stepForm, setStepForm] = useState({ name: '', step_type: 'task', metadata: '{}' });

  const load = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    try {
      const wf = await api.getWorkflow(id);
      setWorkflow(wf);
      setName(wf.name);
      setSteps(wf.steps || []);

      // Convert input_schema to editable array
      const schemaArr = Object.entries<any>(wf.input_schema || {}).map(([key, def]) => ({
        key,
        type: def.type || 'string',
        required: def.required ?? false,
        allowed_values: (def.allowed_values || []).join(', '),
      }));
      setSchema(schemaArr);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const schemaToObject = () =>
    Object.fromEntries(
      schema.filter(f => f.key.trim()).map(f => [
        f.key.trim(),
        {
          type: f.type,
          required: f.required,
          ...(f.allowed_values.trim() ? { allowed_values: f.allowed_values.split(',').map((v: string) => v.trim()) } : {}),
        },
      ])
    );

  const handleSave = async () => {
    if (!name.trim()) return alert('Workflow name is required');
    setSaving(true);
    try {
      const body = { name: name.trim(), input_schema: schemaToObject() };
      if (isNew) {
        const wf = await api.createWorkflow(body);
        navigate(`/workflows/${wf.id}/edit`, { replace: true });
      } else {
        await api.updateWorkflow(id!, body);
        await load();
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const openCreateStep = () => {
    setEditingStep(null);
    setStepForm({ name: '', step_type: 'task', metadata: '{}' });
    setStepOpen(true);
  };

  const openEditStep = (step: any) => {
    setEditingStep(step);
    setStepForm({ name: step.name, step_type: step.step_type, metadata: JSON.stringify(step.metadata || {}, null, 2) });
    setStepOpen(true);
  };

  const handleSaveStep = async () => {
    if (!stepForm.name.trim()) return alert('Step name is required');
    let meta: any = {};
    try { meta = JSON.parse(stepForm.metadata); } catch { alert('Invalid metadata JSON'); return; }
    
    setSavingStep(true);
    try {
      const body = { name: stepForm.name.trim(), step_type: stepForm.step_type, order: steps.length + 1, metadata: meta };
      if (editingStep) {
        await api.updateStep(editingStep.id, body);
      } else {
        await api.createStep(id!, body);
      }
      setStepOpen(false);
      await load();
    } catch (e: any) {
      alert(e.message || 'Failed to save step');
    } finally {
      setSavingStep(false);
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm('Delete this step? Associated rules will also be removed.')) return;
    await api.deleteStep(stepId);
    await load();
  };

  const handleSetStart = async (stepId: string) => {
    await api.updateWorkflow(id!, { start_step_id: stepId });
    await load();
  };

  if (loading) return (
    <><div className="page-header"><div className="spinner" /></div><div className="page-body"><div className="empty-state"><div className="spinner" /></div></div></>
  );

  return (
    <>
      <div className="page-header">
        <button className="btn btn-ghost btn-icon" onClick={() => navigate('/workflows')}><ArrowLeft size={18} /></button>
        <span className="page-title">{isNew ? 'New Workflow' : name || 'Edit Workflow'}</span>
        {workflow && <StatusBadge status={workflow.is_active ? 'active' : 'inactive'} />}
        {workflow && <span className="badge badge-purple">v{workflow.version}</span>}
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <div className="spinner" /> : <Save size={14} />}
            {isNew ? 'Create' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="page-body">
        <div className="grid-2" style={{ marginBottom: 24 }}>
          {/* Left: Basic Info */}
          <div className="glass-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-secondary)' }}>
              <Settings size={14} style={{ display: 'inline', marginRight: 6 }} />
              WORKFLOW DETAILS
            </h3>
            <div className="input-group" style={{ marginBottom: 16 }}>
              <label>Workflow Name *</label>
              <input className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Expense Approval" />
            </div>
          </div>

          {/* Right: Input Schema */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
                INPUT SCHEMA
              </h3>
              <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }}
                onClick={() => setSchema([...schema, { key: '', type: 'string', required: false, allowed_values: '' }])}>
                <Plus size={13} /> Add Field
              </button>
            </div>
            {schema.length === 0 && <p className="text-secondary" style={{ fontSize: 13 }}>No input fields defined. Click "Add Field" to add one.</p>}
            {schema.map((field, i) => (
              <div key={i} className="flex gap-2 items-center" style={{ marginBottom: 8 }}>
                <input className="input-field" style={{ flex: 1.5 }} placeholder="field_name" value={field.key}
                  onChange={e => { const s = [...schema]; s[i].key = e.target.value; setSchema(s); }} />
                <select className="input-field" style={{ flex: 1 }} value={field.type}
                  onChange={e => { const s = [...schema]; s[i].type = e.target.value; setSchema(s); }}>
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                </select>
                <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  <input type="checkbox" checked={field.required} onChange={e => { const s = [...schema]; s[i].required = e.target.checked; setSchema(s); }} />
                  Required
                </label>
                <button className="btn btn-ghost btn-icon" style={{ color: 'var(--accent-red)', flexShrink: 0 }}
                  onClick={() => setSchema(schema.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        {!isNew && (
          <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)' }}>
              <h3 style={{ fontWeight: 600 }}>Steps <span className="badge badge-neutral" style={{ marginLeft: 8 }}>{steps.length}</span></h3>
              <button className="btn btn-secondary" onClick={openCreateStep}>
                <Plus size={14} /> Add Step
              </button>
            </div>

            {steps.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Settings size={22} /></div>
                <h3>No steps yet</h3>
                <p>Add steps to define the workflow process. Each step can have conditional rules.</p>
                <button className="btn btn-primary" onClick={openCreateStep}><Plus size={14} /> Add Step</button>
              </div>
            ) : (
              <div style={{ padding: 8 }}>
                {steps.sort((a, b) => a.order - b.order).map((step, i) => (
                  <div key={step.id} className="step-card" style={{ cursor: 'default', marginBottom: 6 }}>
                    <GripVertical size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--glass-bg-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center gap-2">
                        <span style={{ fontWeight: 600 }}>{step.name}</span>
                        <StatusBadge status={step.step_type} />
                        {workflow?.start_step_id === step.id && <span className="badge badge-cyan">START</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        Order {step.order} · {step.rules?.length ?? 0} rule{step.rules?.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {workflow?.start_step_id !== step.id && (
                        <button className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => handleSetStart(step.id)}>Set Start</button>
                      )}
                      <button className="btn btn-ghost btn-icon" title="Edit Rules" onClick={() => navigate(`/steps/${step.id}/rules`)} style={{ color: 'var(--accent-cyan)' }}>
                        <ChevronRight size={15} />
                      </button>
                      <button className="btn btn-ghost btn-icon" onClick={() => openEditStep(step)}><Settings size={15} /></button>
                      <button className="btn btn-ghost btn-icon" style={{ color: 'var(--accent-red)' }} onClick={() => handleDeleteStep(step.id)}><Trash2 size={15} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step modal */}
      <Modal
        open={stepOpen}
        onClose={() => setStepOpen(false)}
        title={editingStep ? 'Edit Step' : 'Add Step'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setStepOpen(false)} disabled={savingStep}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveStep} disabled={savingStep}>
              {savingStep && <div className="spinner" style={{ width: 12, height: 12 }} />}
              Save Step
            </button>
          </>
        }
      >
        <div className="input-group" style={{ marginBottom: 12 }}>
          <label>Step Name *</label>
          <input className="input-field" placeholder="e.g. Manager Approval" value={stepForm.name}
            onChange={e => setStepForm({ ...stepForm, name: e.target.value })} />
        </div>
        <div className="input-group" style={{ marginBottom: 12 }}>
          <label>Step Type</label>
          <select className="input-field" value={stepForm.step_type}
            onChange={e => setStepForm({ ...stepForm, step_type: e.target.value })}>
            <option value="task">Task Stage (Auto)</option>
            <option value="approval">Approval Stage (Manual)</option>
            <option value="notification">Notification Stage (Alert)</option>
          </select>
        </div>
        <div className="input-group">
          <label>Metadata (JSON)</label>
          <textarea
            className="input-field"
            style={{ minHeight: 100, fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }}
            value={stepForm.metadata}
            onChange={e => setStepForm({ ...stepForm, metadata: e.target.value })}
          />
        </div>
      </Modal>
    </>
  );
}
