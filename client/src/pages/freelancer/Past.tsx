import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFreelancerBids, type BidItem } from "../../services/bidService";
import { getProjectById } from "../../services/projectService";

type PastProject = { project_id: number; title?: string };

export default function Past() {
  const [projects, setProjects] = useState<PastProject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const rawUser = localStorage.getItem("user");
        const user = rawUser ? JSON.parse(rawUser) : null;
        const freelancerId = user?.id;
        if (!freelancerId) {
          setError("Oturum gerekli: freelancer kimliği bulunamadı");
          setLoading(false);
          return;
        }
        const res = await getFreelancerBids(Number(freelancerId));
        const accepted = (res.bids || []).filter(
          (b: BidItem) => String(b.status) === "accepted"
        );
        const uniqueProjectIds = Array.from(
          new Set(accepted.map((b) => b.project_id))
        );
        // Fetch project titles and statuses; keep only completed/cancelled
        const completed = await Promise.all(
          uniqueProjectIds.map(async (id) => {
            const pr = await getProjectById(id);
            const title = pr.success && pr.project ? pr.project.title : undefined;
            const status = pr.success && pr.project ? String(pr.project.status || "") : "";
            const isPast = status === "completed" || status === "cancelled";
            return isPast ? ({ project_id: id, title } as PastProject) : null;
          })
        );
        setProjects(completed.filter(Boolean) as PastProject[]);
        setError(null);
      } catch (e: any) {
        setError(e?.message || "Projeler yüklenemedi");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Geçmiş Projeler</h3>
        <p className="text-gray-600">Yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Geçmiş Projeler</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Geçmiş Projeler</h3>
      {projects.length > 0 ? (
        <div className="space-y-3">
          {projects.map((p) => (
            <div
              key={p.project_id}
              className="flex items-center justify-between p-4 border border-gray-200 bg-gray-50 rounded-lg"
            >
              <div>
                <h4 className="font-medium text-gray-800">
                  {p.title || `Proje #${p.project_id}`}
                </h4>
                <p className="text-sm text-gray-600">Tamamlandı. Ödeme özetini görüntüleyin.</p>
              </div>
              <Link
                to={`/freelancer/projects/${p.project_id}`}
                className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-800"
                title="Projeyi Görüntüle"
              >
                Görüntüle
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">Geçmiş proje yok.</p>
      )}
    </div>
  );
}
