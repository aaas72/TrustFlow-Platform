import { api, authHeaders } from './api';

export type PlanStep = {
  title: string;
  description?: string;
  amount?: number;
  estimatedDays?: number;
  deliverables?: string[];
};

export type ProjectPlan = {
  status: 'submitted' | 'approved' | 'revision_requested';
  plan_json: { summary?: string; steps: (PlanStep | string)[] };
  review_note?: string | null;
};

export async function submitPlan(projectId: number, plan: { summary?: string; steps: (PlanStep | string)[] }) {
  const res = await api.post(`/plans/projects/${projectId}/plan`, { plan }, { headers: authHeaders() });
  return res.data as { success: boolean; message: string };
}

export async function getPlan(projectId: number) {
  const res = await api.get(`/plans/projects/${projectId}/plan`, { headers: authHeaders() });
  return res.data as { success: boolean; plan?: ProjectPlan };
}

export async function requestPlanRevision(projectId: number, note: string) {
  const res = await api.post(`/plans/projects/${projectId}/plan/request_revision`, { note }, { headers: authHeaders() });
  return res.data as { success: boolean; message: string };
}
