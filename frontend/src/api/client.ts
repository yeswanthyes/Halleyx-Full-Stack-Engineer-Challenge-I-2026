const BASE_URL = 'http://localhost:3001/api';

async function request<T>(method: string, path: string, body?: any): Promise<T> {
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed with status ${res.status}`);
  return data;
}

export const api = {
  get:    <T>(path: string) => request<T>('GET', path),
  post:   <T>(path: string, body: any) => request<T>('POST', path, body),
  put:    <T>(path: string, body: any) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),

  // Workflows
  getWorkflows:    (page = 1, search = '') => api.get<any>(`/workflows?page=${page}&search=${encodeURIComponent(search)}`),
  getWorkflow:     (id: string) => api.get<any>(`/workflows/${id}`),
  createWorkflow:  (body: any) => api.post<any>('/workflows', body),
  updateWorkflow:  (id: string, body: any) => api.put<any>(`/workflows/${id}`, body),
  deleteWorkflow:  (id: string) => api.delete<any>(`/workflows/${id}`),

  // Steps
  getSteps:  (workflowId: string) => api.get<any>(`/workflows/${workflowId}/steps`),
  createStep:(workflowId: string, body: any) => api.post<any>(`/workflows/${workflowId}/steps`, body),
  updateStep:(stepId: string, body: any) => api.put<any>(`/steps/${stepId}`, body),
  deleteStep:(stepId: string) => api.delete<any>(`/steps/${stepId}`),

  // Rules
  getRules:  (stepId: string) => api.get<any>(`/steps/${stepId}/rules`),
  createRule:(stepId: string, body: any) => api.post<any>(`/steps/${stepId}/rules`, body),
  updateRule:(ruleId: string, body: any) => api.put<any>(`/rules/${ruleId}`, body),
  deleteRule:(ruleId: string) => api.delete<any>(`/rules/${ruleId}`),

  // Executions
  getExecutions: (page = 1) => api.get<any>(`/executions?page=${page}`),
  getExecution:  (id: string) => api.get<any>(`/executions/${id}`),
  startExecution:(workflowId: string, body: any) => api.post<any>(`/executions/workflow/${workflowId}`, body),
  cancelExecution:(id: string) => api.post<any>(`/executions/${id}/cancel`, {}),
  retryExecution: (id: string) => api.post<any>(`/executions/${id}/retry`, {}),
  approveStep:   (execId: string, stepId: string, decisionData: any) =>
    api.post<any>(`/executions/${execId}/approve/${stepId}`, { decisionData }),
};
