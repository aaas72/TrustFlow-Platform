import { AvailableProjects, Input, Button } from "../../components";
import { submitBid } from "../../services/bidService";
import { useState } from "react";

export default function Available() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [amount, setAmount] = useState<string>("");
  const [proposal, setProposal] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    amount?: string;
    proposal?: string;
    deliveryDate?: string;
  }>({});

  const handleApplyToProject = (
    projectId: string,
    bid?: { amount: number; proposal: string; delivery_time?: number; deadline?: string }
  ) => {
    setSelectedProjectId(projectId);
    setAmount(String(bid?.amount ?? ""));
    setProposal(bid?.proposal ?? "");
    
    if (bid?.deadline) {
      // Proje bitiş tarihini varsayılan olarak ayarla
      const d = new Date(bid.deadline);
      const iso = !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : "";
      setDeliveryDate(iso);
    } else {
      const baseDays = Number(bid?.delivery_time ?? 7);
      const d = new Date(Date.now() + baseDays * 24 * 60 * 60 * 1000);
      const iso = d.toISOString().split("T")[0];
      setDeliveryDate(iso);
    }
    
    setModalOpen(true);
  };

  const submitForm = async () => {
    if (!selectedProjectId) return;
    setServerError(null);
    const nextErrors: {
      amount?: string;
      proposal?: string;
      deliveryDate?: string;
    } = {};
    const amountNum = Number(amount);
    if (!amount || Number.isNaN(amountNum) || amountNum <= 0) {
      nextErrors.amount = "Lütfen geçerli bir tutar girin";
    }
    if (!proposal || proposal.trim().length === 0) {
      nextErrors.proposal = "Lütfen teklif metnini girin";
    }
    if (!deliveryDate) {
      nextErrors.deliveryDate = "Lütfen teslim tarihi seçin";
    } else {
      const d = new Date(deliveryDate);
      const today = new Date();
      // only date compare
      const dOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const tOnly = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      if (dOnly <= tOnly) {
        nextErrors.deliveryDate = "Teslim tarihi bugünden ileri olmalı";
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    try {
      setSubmitting(true);
      const rawUser = localStorage.getItem("user");
      const user = rawUser ? JSON.parse(rawUser) : null;
      if (!user?.id) return;
      const target = new Date(deliveryDate);
      const diffMs = target.getTime() - Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      const days = Math.max(1, Math.ceil(diffMs / dayMs));
      const payload = {
        project_id: Number(selectedProjectId),
        amount: amountNum,
        proposal: proposal,
        delivery_time: `${days} days`,
      };
      const start = Date.now();
      const res = await submitBid(payload);
      const elapsed = Date.now() - start;
      const remain = Math.max(0, 500 - elapsed);
      await new Promise((r) => setTimeout(r, remain));
      if (res && res.success) {
        setModalOpen(false);
        setSelectedProjectId(null);
        setAmount("");
        setProposal("");
        setDeliveryDate("");
        setErrors({});
        setServerError(null);
      } else if (res && !res.success) {
        setServerError(res.message || "Teklif gönderilemedi");
        // Eğer sunucu çakışma (409) döndürdüyse, bu projeye başvuruyu kalıcı olarak işaretle
        // buton devre dışı kalsın (Başvurulmuş)
        setSelectedProjectId(null);
        setModalOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AvailableProjects onApplyToProject={handleApplyToProject} />
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Teklif Gönder
            </h3>
            <div className="space-y-4">
              {serverError && (
                <div className="p-3 bg-yellow-50 text-yellow-800 rounded">
                  {serverError}
                </div>
              )}
              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Teklif Tutarı
                </label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  error={errors.amount}
                />
              </div>
              <div>
                <label
                  htmlFor="proposal"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Teklif Metni
                </label>
                <textarea
                  id="proposal"
                  value={proposal}
                  onChange={(e) => setProposal(e.target.value)}
                  className="w-full h-24 rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.proposal && (
                  <p className="mt-1 text-sm text-red-600">{errors.proposal}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="delivery"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Teslim Tarihi
                </label>
                <Input
                  id="delivery"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  error={errors.deliveryDate}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                İptal
              </Button>
              <Button
                variant="primary"
                onClick={submitForm}
                isLoading={submitting}
                disabled={submitting}
              >
                Gönder
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
