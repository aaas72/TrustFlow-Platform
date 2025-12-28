import axios from 'axios';
import { api, authHeaders } from './api';

// --- Bids API ---
export type SubmitBidPayload = {
  project_id: number;
  amount: number;
  proposal: string;
  // Sunucuda JWT'den okunur, front-end'den gönderilmez
  // freelancer_id yükten çıkarıldı
  // Veritabanında metin olarak saklanır
  delivery_time?: string;
};

export type SubmitBidResponse = {
  success: boolean;
  message: string;
  bid_id?: number;
};

export async function submitBid(payload: SubmitBidPayload): Promise<SubmitBidResponse> {
  try {
    const res = await api.post('/bids', payload, { headers: authHeaders() });
    return res.data as SubmitBidResponse;
  } catch (error) {
    console.error('Teklif gönderme hatası:', error);
    if (axios.isAxiosError(error)) {
      if (error.response) {
        return { success: false, message: error.response.data?.message || 'Teklif gönderilemedi' };
      } else if (error.request) {
        return { success: false, message: 'Sunucuya bağlanılamadı' };
      }
    }
    return { success: false, message: 'Beklenmeyen bir hata oluştu' };
  }
}

// --- List Bids for a Project ---
export type BidItem = {
  id: number;
  project_id: number;
  freelancer_id: number;
  freelancer_name?: string;
  project_title?: string;
  amount: number;
  proposal: string;
  delivery_time?: string | null;
  status?: string | null;
  created_at?: string;
};

export type GetProjectBidsResponse = {
  success: boolean;
  bids: BidItem[];
};

export async function getProjectBids(projectId: number): Promise<GetProjectBidsResponse> {
  const res = await api.get(`/bids/project/${projectId}`, { headers: authHeaders() });
  return res.data as GetProjectBidsResponse;
}

// --- Accept Bid ---
export type AcceptBidResponse = {
  success: boolean;
  message: string;
};

export async function acceptBid(bidId: number): Promise<AcceptBidResponse> {
  try {
    const res = await api.put(`/bids/${bidId}/accept`, {}, { headers: authHeaders() });
    return res.data as AcceptBidResponse;
  } catch (error) {
    console.error('Teklif kabul hatası:', error);
    if (axios.isAxiosError(error)) {
      if (error.response) {
        return { success: false, message: error.response.data?.message || 'Teklif kabul edilemedi' };
      }
    }
    return { success: false, message: 'Beklenmeyen bir hata oluştu' };
  }
}

// --- List Bids by a Freelancer ---
export type GetFreelancerBidsResponse = {
  success: boolean;
  bids: BidItem[];
};

export async function getFreelancerBids(freelancerId: number): Promise<GetFreelancerBidsResponse> {
  const res = await api.get(`/bids/freelancer/${freelancerId}`, { headers: authHeaders() });
  return res.data as GetFreelancerBidsResponse;
}

// --- List Bids (role-aware) ---
export type GetBidsResponse = {
  success: boolean;
  bids: BidItem[];
};

export async function getBids(): Promise<GetBidsResponse> {
  const res = await api.get(`/bids`, { headers: authHeaders() });
  return res.data as GetBidsResponse;
}

// --- Accepted Projects Count (distinct projects with accepted bids)
export type GetAcceptedProjectsCountResponse = {
  success: boolean;
  count: number;
};

export async function getAcceptedProjectsCount(freelancerId: number): Promise<GetAcceptedProjectsCountResponse> {
  const res = await api.get(`/bids/freelancer/${freelancerId}/accepted_count`, { headers: authHeaders() });
  return res.data as GetAcceptedProjectsCountResponse;
}
