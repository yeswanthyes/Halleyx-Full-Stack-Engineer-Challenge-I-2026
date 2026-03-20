import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import WorkflowList from './pages/WorkflowList';
import WorkflowEditor from './pages/WorkflowEditor';
import StepRuleEditor from './pages/StepRuleEditor';
import ExecuteWorkflow from './pages/ExecuteWorkflow';
import AuditLog from './pages/AuditLog';
import Login from './pages/Login';

function App() {
  return (
    <>
      <div className="app-bg" />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/workflows" replace />} />
            <Route path="workflows" element={<WorkflowList />} />
            <Route path="workflows/:id/edit" element={<WorkflowEditor />} />
            <Route path="workflows/new" element={<WorkflowEditor />} />
            <Route path="steps/:stepId/rules" element={<StepRuleEditor />} />
            <Route path="executions/:executionId" element={<ExecuteWorkflow />} />
            <Route path="audit" element={<AuditLog />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
