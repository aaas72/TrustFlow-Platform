import { api, authHeaders, extractApiErrorMessage } from './api';
import type {
  GetProjectMilestonesResponse,
  CreateMilestonePayload,
  CreateMilestoneResponse,
  UpdateMilestoneStatusResponse,
  ApprovePlanResponse,
} from '../types/milestone';

// --- Milestones by Project ---
export async function getProjectMilestones(projectId: number): Promise<GetProjectMilestonesResponse> {
  try {
    const res = await api.get(`/milestones/project/${projectId}`, { headers: authHeaders() });
    
    // Ensure attachments are properly initialized
    if (res.data && res.data.success && Array.isArray(res.data.milestones)) {
      console.log('Raw milestones from API:', res.data.milestones);
      res.data.milestones = res.data.milestones.map((m: any) => {
        const atts = Array.isArray(m.attachments) ? m.attachments : [];
        if (atts.length > 0) console.log(`Milestone ${m.id} has ${atts.length} attachments in service`);
        return {
          ...m,
          attachments: atts
        };
      });
    }

    return res.data as GetProjectMilestonesResponse;
  } catch (error) {
    console.error('Proje aşamaları alınamadı:', error);
    return { success: false, milestones: [], message: extractApiErrorMessage(error) };
  }
}

// --- Create Milestone ---
export async function createMilestone(payload: CreateMilestonePayload): Promise<CreateMilestoneResponse> {
  try {
    const res = await api.post('/milestones', payload, { headers: authHeaders() });
    return res.data as CreateMilestoneResponse;
  } catch (error) {
    console.error('Aşama oluşturma hatası:', error);
    return { success: false, message: extractApiErrorMessage(error, 'Aşama oluşturulamadı') };
  }
}

// --- Update Milestone Status ---
export async function updateMilestoneStatus(
  milestoneId: number,
  status: 'submitted' | 'approved' | 'revision_requested' | 'funded' | 'completed' | 'in_progress',
  review_notes?: string
): Promise<UpdateMilestoneStatusResponse> {
  try {
    const token = localStorage.getItem('token');
    const response = await api.put(`/milestones/${milestoneId}/status`, { status, review_notes }, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data as UpdateMilestoneStatusResponse;
  } catch (error) {
    console.error('Milestone status update failed:', error);
    return { success: false, message: extractApiErrorMessage(error, 'Sunucu hatası veya bağlantı sorunu') };
  }
}

// --- Approve Plan & Start First Milestone (Client) ---
export async function approvePlan(projectId: number): Promise<ApprovePlanResponse> {
  try {
    const res = await api.post(`/milestones/projects/${projectId}/plan/approve`, {}, { headers: authHeaders() });
    return res.data as ApprovePlanResponse;
  } catch (error) {
    console.error('Plan onayı başarısız:', error);
    return { success: false, message: extractApiErrorMessage(error, 'Plan onayı yapılamadı') };
  }
}

// --- Add Milestone Attachments ---
export async function addMilestoneAttachments(milestoneId: number, formData: FormData): Promise<{ success: boolean; message?: string; attachments?: any[] }> {
  try {
    const res = await api.post(`/milestones/${milestoneId}/attachments`, formData, {
      headers: {
        ...authHeaders(),
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  } catch (error) {
    console.error('Dosya yükleme hatası:', error);
    return { success: false, message: extractApiErrorMessage(error, 'Dosya yüklenemedi') };
  }
}

// --- Helper Functions for Status Updates ---

export async function approveMilestone(milestoneId: number) {
  return updateMilestoneStatus(milestoneId, 'approved');
}

export async function requestRevision(milestoneId: number, notes?: string) {
  return updateMilestoneStatus(milestoneId, 'revision_requested', notes);
}

export async function fundMilestone(milestoneId: number) {
  try {
    const res = await api.post('/payments/fund-milestone', { milestone_id: milestoneId }, { headers: authHeaders() });
    return res.data;
  } catch (error) {
    console.error('Funding failed:', error);
    return { success: false, message: extractApiErrorMessage(error, 'Ödeme işlemi başarısız') };
  }
}