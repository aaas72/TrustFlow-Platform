import { api, authHeaders } from './api';

// --- Payments by Milestone ---
export type PaymentItem = {
  id: number;
  milestone_id: number;
  amount: number;
  payment_method?: string | null;
  status: 'pending' | 'completed' | 'failed' | 'held' | string;
  transaction_id?: string | null;
  created_at?: string;
  paid_at?: string | null;
};

export type GetPaymentsByMilestoneResponse = {
  success: boolean;
  payments: PaymentItem[];
};

export async function getPaymentsByMilestone(milestoneId: number): Promise<GetPaymentsByMilestoneResponse> {
  try {
    const res = await api.get(`/payments/milestone/${milestoneId}`, { headers: authHeaders() });
    return res.data as GetPaymentsByMilestoneResponse;
  } catch (error) {
    console.error('Aşama ödemeleri alınamadı:', error);
    return { success: false, payments: [] };
  }
}

// --- Stripe Payment Intent ---
export async function createPaymentIntent(milestoneId: number): Promise<{ success: boolean; clientSecret?: string; message?: string }> {
  try {
    const res = await api.post('/payments/create-payment-intent', { milestone_id: milestoneId }, { headers: authHeaders() });
    return res.data;
  } catch (error: any) {
    console.error('Create Payment Intent Error:', error);
    return { success: false, message: error.response?.data?.message || 'Failed to create payment intent' };
  }
}

export async function confirmPaymentBackend(paymentIntentId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await api.post('/payments/confirm-payment', { payment_intent_id: paymentIntentId }, { headers: authHeaders() });
    return res.data;
  } catch (error: any) {
    console.error('Confirm Payment Backend Error:', error);
    return { success: false, message: error.response?.data?.message || 'Failed to confirm payment' };
  }
}

// --- Create Payment ---
export async function createPayment(milestoneId: number, amount: number, method: string = 'simulator'): Promise<{ success: boolean; payment_id?: number; message?: string; }> {
  try {
    const res = await api.post('/payments', { milestone_id: milestoneId, amount, payment_method: method }, { headers: authHeaders() });
    return res.data as { success: boolean; payment_id?: number; message?: string; };
  } catch (error) {
    console.error('Ödeme oluşturma hatası:', error);
    return { success: false, message: 'Ödeme oluşturulamadı' };
  }
}

// --- Update Payment Status ---
export async function updatePaymentStatus(paymentId: number, status: 'pending' | 'completed' | 'failed' | 'held', transactionId?: string): Promise<{ success: boolean; message?: string; }> {
  try {
    const res = await api.put(`/payments/${paymentId}/status`, { status, transaction_id: transactionId }, { headers: authHeaders() });
    return res.data as { success: boolean; message?: string; };
  } catch (error) {
    console.error('Ödeme durumu güncellenemedi:', error);
    return { success: false, message: 'Ödeme durumu güncellenemedi' };
  }
}

export async function getFreelancerStats(): Promise<{ success: boolean; stats: { total_earnings: number; completed_projects_count: number; active_projects_count: number }; }> {
  try {
    const res = await api.get('/payments/stats', { headers: authHeaders() });
    return res.data;
  } catch (error) {
    console.error('İstatistikler alınamadı:', error);
    return { success: false, stats: { total_earnings: 0, completed_projects_count: 0, active_projects_count: 0 } };
  }
}

export async function getClientStats(): Promise<{ success: boolean; stats: { total_spent: number; total_projects_count: number; active_projects_count: number }; }> {
  try {
    const res = await api.get('/payments/stats', { headers: authHeaders() });
    return res.data;
  } catch (error) {
    console.error('Müşteri istatistikleri alınamadı:', error);
    return { success: false, stats: { total_spent: 0, total_projects_count: 0, active_projects_count: 0 } };
  }
}

// --- Create Payment ---
// --- Simulator: Complete payment for a milestone ---
export async function simulateCompletePaymentForMilestone(milestoneId: number, amount: number): Promise<{ success: boolean; message?: string; }> {
  // Try to find an existing payment for the milestone
  const list = await getPaymentsByMilestone(milestoneId);
  const existing = (list.success ? list.payments : []).find(p => String(p.status).toLowerCase() !== 'completed');

  // Either update existing or create new
  if (existing) {
    const tx = `SIM-${Date.now()}`;
    return await updatePaymentStatus(existing.id, 'completed', tx);
  } else {
    const created = await createPayment(milestoneId, amount, 'simulator');
    if (!created.success || !created.payment_id) return { success: false, message: created.message || 'Ödeme oluşturulamadı' };
    const tx = `SIM-${Date.now()}`;
    return await updatePaymentStatus(created.payment_id, 'completed', tx);
  }
}

// --- Payments Ledger for current user ---
export type PaymentLedgerItem = {
  payment_id: number;
  milestone_id: number;
  amount: number;
  status: string;
  payment_method?: string | null;
  transaction_id?: string | null;
  payment_created_at?: string;
  payment_paid_at?: string | null;
  project_id: number;
  project_title?: string;
  milestone_title?: string;
  client_id: number;
  client_name?: string;
  freelancer_id: number;
  freelancer_name?: string;
};

export type GetUserPaymentsResponse = {
  success: boolean;
  payments: PaymentLedgerItem[];
};

export async function getUserPayments(): Promise<GetUserPaymentsResponse> {
  try {
    const res = await api.get('/payments/user', { headers: authHeaders() });
    return res.data as GetUserPaymentsResponse;
  } catch (error) {
    console.error('Kullanıcı ödemeleri alınamadı:', error);
    return { success: false, payments: [] };
  }
}

// --- Transactions Ledger ---
export type TransactionItem = {
  id: number;
  user_id: number;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  reference_type: string;
  reference_id: number;
  status: string;
  created_at: string;
};

export type GetTransactionsResponse = {
  success: boolean;
  transactions: TransactionItem[];
};

export async function getTransactions(): Promise<GetTransactionsResponse> {
  try {
    const res = await api.get('/payments/transactions', { headers: authHeaders() });
    return res.data as GetTransactionsResponse;
  } catch (error) {
    console.error('İşlemler alınamadı:', error);
    return { success: false, transactions: [] };
  }
}