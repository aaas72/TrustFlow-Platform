import { api, authHeaders } from './api';

// --- Notifications API ---
export type NotificationItem = {
  id: number;
  user_id: number;
  actor_id?: number | null;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  action_required: boolean;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  project_id?: number | null;
  milestone_id?: number | null;
  payment_id?: number | null;
  bid_id?: number | null;
  review_id?: number | null;
};

export type GetNotificationsResponse = { success: boolean; notifications: NotificationItem[] };

export async function getNotifications(opts?: { unreadOnly?: boolean; limit?: number; offset?: number }): Promise<GetNotificationsResponse> {
  try {
    const params: Record<string, unknown> = {};
    if (opts?.unreadOnly) params.unread = 1;
    if (opts?.limit) params.limit = opts.limit;
    if (opts?.offset) params.offset = opts.offset;
    const response = await api.get('/notifications', { params, headers: authHeaders() });
    return response.data as GetNotificationsResponse;
  } catch (error) {
    console.error('Bildirimler alınamadı:', error);
    return { success: false, notifications: [] };
  }
}

export async function markNotificationRead(id: number): Promise<{ success: boolean }> {
  try {
    const res = await api.patch(`/notifications/${id}/read`, {}, { headers: authHeaders() });
    return res.data as { success: boolean };
  } catch (error) {
    console.error('Bildirim okunamadı:', error);
    return { success: false };
  }
}

export async function markAllNotificationsRead(): Promise<{ success: boolean; updated?: number }> {
  try {
    const res = await api.put('/notifications/read-all', {}, { headers: authHeaders() });
    return res.data as { success: boolean; updated?: number };
  } catch (error) {
    console.error('Tüm bildirimler okunamadı:', error);
    return { success: false };
  }
}

export async function getUnreadCount(): Promise<{ success: boolean; count: number }> {
  try {
    const res = await api.get('/notifications/unread-count', { headers: authHeaders() });
    const data = res.data as { success: boolean; count: number };
    return { success: !!data.success, count: Number(data.count || 0) };
  } catch (error) {
    console.error('Okunmamış bildirim sayısı alınamadı:', error);
    return { success: false, count: 0 };
  }
}

export async function deleteNotification(id: number): Promise<{ success: boolean }> {
  try {
    const res = await api.delete(`/notifications/${id}`, { headers: authHeaders() });
    return res.data as { success: boolean };
  } catch (error) {
    console.error('Bildirim silinemedi:', error);
    return { success: false };
  }
}
