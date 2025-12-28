import axios from 'axios';
import { api, authHeaders } from './api';

// --- Projects API ---
export type CreateProjectPayload = {
  title: string;
  description: string;
  budget?: number;
  deadline?: string;
  skills?: string[] | string;
  client_id?: number;
};

export type CreateProjectResponse = {
  success: boolean;
  message: string;
  project_id?: number;
  skills?: { id: number; name: string }[];
  skill_errors?: any[];
};

export async function createProject(payload: CreateProjectPayload): Promise<CreateProjectResponse> {
  try {
    const response = await api.post('/projects', payload, { headers: authHeaders() });
    return response.data as CreateProjectResponse;
  } catch (error) {
    console.error('Proje oluşturma hatası:', error);
    if (axios.isAxiosError(error)) {
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Proje oluşturma başarısız',
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'Sunucuya bağlanılamadı, bağlantıyı kontrol edin veya sunucuyu başlatın',
        };
      }
    }
    return { success: false, message: 'Beklenmeyen bir hata oluştu' };
  }
}

// --- Fetch Open Projects ---
export type ProjectListItem = {
  id: number;
  title: string;
  description: string;
  budget?: number | string | null;
  deadline?: string | null;
  client_id: number;
  status: string;
  created_at: string;
  updated_at?: string;
  client_name?: string;
  skills?: SkillItem[];
};

export type GetOpenProjectsResponse = {
  success: boolean;
  projects: ProjectListItem[];
  message?: string;
};

export async function getOpenProjects(): Promise<GetOpenProjectsResponse> {
  try {
    const response = await api.get('/projects');
    return response.data as GetOpenProjectsResponse;
  } catch (error) {
    console.error('Mevcut projeler alınamadı:', error);
    if (axios.isAxiosError(error) && error.response) {
      return {
        success: false,
        projects: [],
        message: error.response.data?.message || 'Sunucu hatası',
      };
    }
    return { success: false, projects: [], message: 'Beklenmeyen bir hata oluştu' };
  }
}

// --- Project Skills API ---
export type SkillItem = { id: number; name: string };
export type GetProjectSkillsResponse = { success: boolean; skills: SkillItem[], message?: string };

export async function getProjectSkills(projectId: number): Promise<GetProjectSkillsResponse> {
  try {
    const response = await api.get(`/projects/${projectId}/skills`);
    return response.data as GetProjectSkillsResponse;
  } catch (error) {
    console.error('Proje becerileri alınamadı:', error);
    if (axios.isAxiosError(error) && error.response) {
      return { success: false, skills: [], message: error.response.data?.message || 'Sunucu hatası' };
    }
    return { success: false, skills: [], message: 'Beklenmeyen bir hata oluştu' };
  }
}

// --- Client Projects ---
export type ClientProject = {
  id: number;
  title: string;
  description: string;
  budget?: number | string | null;
  deadline?: string | null;
  client_id: number;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type GetClientProjectsResponse = {
  success: boolean;
  projects: ClientProject[];
  message?: string;
};

export async function getClientProjects(clientId: number): Promise<GetClientProjectsResponse> {
  try {
    const res = await api.get(`/projects/client/${clientId}`, { headers: authHeaders() });
    return res.data as GetClientProjectsResponse;
  } catch (error) {
    console.error('Müşteri projeleri alınamadı:', error);
    if (axios.isAxiosError(error) && error.response) {
      return { success: false, projects: [], message: error.response.data?.message || 'Sunucu hatası' };
    }
    return { success: false, projects: [], message: 'Beklenmeyen bir hata oluştu' };
  }
}

export type ProjectDetail = {
  id: number;
  title: string;
  description: string;
  budget?: number | string | null;
  deadline?: string | null;
  client_id: number;
  created_at: string;
  updated_at?: string;
  status?: string | null;
  skills?: string[];
};

export type GetProjectByIdResponse = {
  success: boolean;
  project?: ProjectDetail;
  message?: string;
};

export async function getProjectById(id: number): Promise<GetProjectByIdResponse> {
  try {
    const res = await api.get(`/projects/${id}`);
    return res.data as GetProjectByIdResponse;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return { success: false, message: error.response.data?.message || 'Sunucu hatası' };
    }
    return { success: false, message: 'Beklenmeyen bir hata oluştu' };
  }
}

export type UpdateProjectPayload = {
  title?: string;
  description?: string;
  budget?: number;
  deadline?: string;
  status?: string;
  skills?: (string | number)[] | string;
};

export type UpdateProjectResponse = {
  success: boolean;
  message: string;
};

export async function updateProject(id: number, payload: UpdateProjectPayload): Promise<UpdateProjectResponse> {
  try {
    const res = await api.put(`/projects/${id}`, payload, { headers: authHeaders() });
    return res.data as UpdateProjectResponse;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return { success: false, message: error.response.data?.message || 'Sunucu hatası' };
    }
    return { success: false, message: 'Beklenmeyen bir hata oluştu' };
  }
}

export type DeleteProjectResponse = {
  success: boolean;
  message: string;
};

export async function deleteProject(id: number): Promise<DeleteProjectResponse> {
  try {
    const res = await api.delete(`/projects/${id}`, { headers: authHeaders() });
    return res.data as DeleteProjectResponse;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return { success: false, message: error.response.data?.message || 'Sunucu hatası' };
    }
    return { success: false, message: 'Beklenmeyen bir hata oluştu' };
  }
}

export async function getFreelancerActiveProjects(): Promise<{ success: boolean; projects: any[]; message?: string }> {
  try {
    const res = await api.get('/projects/freelancer/active', { headers: authHeaders() });
    return res.data;
  } catch (error) {
    console.error('Freelancer active projects fetch error:', error);
    return { success: false, projects: [] };
  }
}

export async function getClientActiveProjects(): Promise<{ success: boolean; projects: any[]; message?: string }> {
  try {
    const res = await api.get('/projects/client/active', { headers: authHeaders() });
    return res.data;
  } catch (error) {
    console.error('Client active projects fetch error:', error);
    return { success: false, projects: [] };
  }
}
export async function getProjects(): Promise<{ success: boolean; projects: ProjectListItem[] }> {
  try {
    const response = await api.get('/projects');
    return response.data as { success: boolean; projects: ProjectListItem[] };
  } catch (error) {
    console.error('Proje listesi hatası:', error);
    return { success: false, projects: [] };
  }
}