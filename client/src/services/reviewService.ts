import { api, authHeaders } from './api';

export type Review = {
  id: number;
  project_id: number;
  reviewer_id: number;
  reviewee_id: number;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_name?: string;
  reviewee_name?: string;
};

export async function createReview(projectId: number, rating: number, comment: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await api.post('/reviews', { project_id: projectId, rating, comment }, { headers: authHeaders() });
    return res.data;
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || 'Değerlendirme gönderilemedi' };
  }
}

export async function getProjectReviews(projectId: number): Promise<{ success: boolean; reviews: Review[] }> {
  try {
    const res = await api.get(`/reviews/project/${projectId}`, { headers: authHeaders() });
    return res.data;
  } catch (error) {
    console.error('Proje değerlendirmeleri alınamadı:', error);
    return { success: false, reviews: [] };
  }
}

export async function getUserReviews(userId: number): Promise<{ success: boolean; reviews: Review[] }> {
  try {
    const res = await api.get(`/reviews/user/${userId}`, { headers: authHeaders() });
    return res.data;
  } catch (error) {
    console.error('Kullanıcı değerlendirmeleri alınamadı:', error);
    return { success: false, reviews: [] };
  }
}
