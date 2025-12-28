import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import type { ClientProjectDetailOutletContext } from "./ProjectDetailRoute";
import { useState } from "react";

export default function ClientRequestRevisionPage() {
  const { onRequestRevision } =
    useOutletContext<ClientProjectDetailOutletContext>();
  const { id, mid } = useParams();
  const navigate = useNavigate();
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = () => {
    navigate(`/client/projects/${id}/milestones`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mid || !id) return;
    if (!notes.trim()) {
      setError("Lütfen revizyon notlarını yazın.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onRequestRevision(mid, notes.trim());
      navigate(`/client/projects/${id}/milestones`);
    } catch (err) {
      setError("Revizyon talebi gönderilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-xl font-semibold mb-4">
          Aşama İçin Revizyon Talebi
        </h1>
        <p className="text-sm text-gray-600 mb-4">
          Serbest çalışanın gerekli değişiklikleri yapabilmesi için notlarınızı açık ve net yazın.
        </p>

        {error && <div className="mb-3 text-red-600 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Revizyon Notları</label>
            <textarea
              className="w-full h-40 border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Gerekli ayrıntıları ve talep edilen değişiklikleri yazın"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-60"
            >
              {submitting ? "Gönderiliyor..." : "Revizyon Talebini Gönder"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
